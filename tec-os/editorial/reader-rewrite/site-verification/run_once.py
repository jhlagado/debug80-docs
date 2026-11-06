"""One allocated invocation. An absolute deadline includes preflight and cleanup."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import shutil
import signal
import subprocess
import sys
import tarfile
import threading
import time
import importlib.util
import secrets

ENTRY_WALL = time.time()
ENTRY_MONO = time.monotonic()
sys.dont_write_bytecode = True


# Bootstrap uses only the standard library. No packet helper is imported until
# its complete private copy has been checked against the supplied seal digest.
def canonical(value):
    return (json.dumps(value, sort_keys=True, separators=(',', ':'),
                       ensure_ascii=False) + '\n').encode()


def digest(path):
    value = hashlib.sha256()
    with open(path, 'rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            value.update(chunk)
    return value.hexdigest()


def durable_json(path, value, exclusive=False):
    path = Path(path)
    temporary = path.with_name('.' + path.name + '.' + secrets.token_hex(12) + '.tmp')
    fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    try:
        data = canonical(value)
        while data:
            data = data[os.write(fd, data):]
        os.fsync(fd)
    finally:
        os.close(fd)
    try:
        if exclusive:
            # Publish the complete receipt atomically without replacing a winner.
            os.link(temporary, path)
        else:
            os.replace(temporary, path)
    finally:
        if temporary.exists():
            temporary.unlink()
    directory = os.open(path.parent, os.O_RDONLY)
    try:
        os.fsync(directory)
    finally:
        os.close(directory)


def first_failure(output, stage, detail, code):
    try:
        durable_json(Path(output) / 'first-failure.json', {
            'status': 'FAILED', 'stage': stage, 'detail': detail, 'exit_code': code,
            'retry': False, 'utc': datetime.now(timezone.utc).isoformat()}, exclusive=True)
    except FileExistsError:
        pass


class Failed(Exception):
    def __init__(self, detail, code=1):
        super().__init__(detail)
        self.code = code


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--packet', required=True)
    parser.add_argument('--seal-sha256', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--allocation', required=True)
    parser.add_argument('--deadline-utc', required=True)
    args = parser.parse_args()
    packet = Path(args.packet).resolve(strict=True)
    output = Path(args.output).absolute()
    deadline_date = datetime.fromisoformat(args.deadline_utc.replace('Z', '+00:00'))
    if deadline_date.utcoffset() is None or deadline_date.utcoffset().total_seconds() != 0:
        parser.error('deadline must include an explicit UTC offset or Z')
    deadline_wall = deadline_date.timestamp()
    remaining = deadline_wall - ENTRY_WALL
    if not 5 < remaining <= 180:
        parser.error('absolute deadline must be 5 to 180 seconds after invocation entry')
    deadline = ENTRY_MONO + remaining
    # A fresh output and a persistent seal claim prevent an implicit retry.
    output.mkdir(mode=0o700, parents=False, exist_ok=False)
    durable_json(output / 'invocation.json', {
        'entry_utc': datetime.fromtimestamp(ENTRY_WALL, timezone.utc).isoformat(),
        'absolute_deadline_utc': args.deadline_utc, 'maximum_seconds': 180,
        'entry_monotonic': ENTRY_MONO, 'deadline_monotonic': deadline,
        'allocation': args.allocation, 'seal_sha256': args.seal_sha256,
        'retry': False, 'deadline_includes': 'preflight, copy, guard, build, checker and cleanup'
    }, exclusive=True)
    stage = ['preflight']
    roots = {}
    observed = {}
    children = {}
    done = threading.Event()
    stopping = threading.Event()
    terminal_lock = threading.Lock()
    audit_lock = threading.RLock()
    final_code = [None]
    job_groups = {}
    context_identity = [None]
    events = os.open(output / 'events.jsonl', os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    stream = os.open(output / 'stream.log', os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)

    def write_all(fd, data):
        while data:
            data = data[os.write(fd, data):]

    def event(kind, **fields):
        write_all(events, canonical({'event': kind, 'utc': datetime.now(timezone.utc).isoformat(),
                                     'stage': stage[0], **fields}))
        os.fsync(events)

    def interrupted(signum, frame):
        raise Failed('invocation interrupted by signal ' + str(signum), 128 + signum)

    for signum in (signal.SIGTERM, signal.SIGINT, signal.SIGHUP):
        signal.signal(signum, interrupted)

    def fail(where, detail, code):
        with terminal_lock:
            if final_code[0] is not None:
                return False
            stopping.set()
            try:
                first_failure(output, where, detail, code)
            except OSError:
                # Receipt storage failure cannot permit a live job to continue.
                signal_bound(signal.SIGTERM)
                signal_bound(signal.SIGKILL)
                raise
            return True

    def finalize(status, detail=''):
        with terminal_lock:
            if final_code[0] is not None:
                return final_code[0]
            failure_path = output / 'first-failure.json'
            if status == 'PASS' and time.monotonic() >= deadline - 3:
                first_failure(output, 'absolute-deadline', 'terminal receipt deadline reached', 124)
            if failure_path.exists():
                failure = json.loads(failure_path.read_text())
                status, code = 'FAILED', failure['exit_code']
            else:
                code = 0 if status == 'PASS' else 1
            durable_json(output / 'terminal.json', {
                'status': status, 'exit_code': code, 'detail': detail, 'retry': False,
                'seal_sha256': args.seal_sha256,
                'elapsed_seconds': time.monotonic() - ENTRY_MONO}, exclusive=True)
            final_code[0] = code
            done.set()
            return code

    def process_rows():
        result = subprocess.run(['/bin/ps', '-axo', 'pid=,ppid=,pgid=,lstart='],
                                text=True, capture_output=True, timeout=0.5)
        if result.returncode:
            raise Failed('cannot audit owned processes')
        rows = []
        for line in result.stdout.splitlines():
            if line.strip():
                pid, parent, group, birth = line.split(None, 3)
                rows.append((int(pid), int(parent), int(group), birth.strip()))
        return rows

    def owned_unlocked():
        rows = process_rows()
        ownership_path = output / 'job-ownership.json'
        if context_identity[0] is not None and ownership_path.exists():
            ownership = json.loads(ownership_path.read_text())
            if ownership['nonce'] != context_identity[0]['nonce']:
                raise Failed('job ownership nonce mismatch')
            if ownership['context_sha256'] != context_identity[0]['sha256']:
                raise Failed('job ownership context mismatch')
            pid = ownership['pid']
            matching = next((row for row in rows if row[0] == pid and
                             row[2] == ownership['pgid'] and row[3] == ownership['birth']), None)
            guard = children.get(ownership['guard_pid'])
            ack_path = output / 'job-ack.json'
            if not ack_path.exists() and matching and guard is not None and guard.poll() is None:
                if ownership['pgid'] != pid or ownership['parent_pid'] != ownership['guard_pid']:
                    raise Failed('job ownership parent/group mismatch')
                with terminal_lock:
                    job_groups[pid] = ownership['birth']
                    roots[pid] = ownership['birth']
                    if not stopping.is_set() and not (output / 'first-failure.json').exists():
                        durable_json(ack_path, {'nonce': ownership['nonce'],
                                     'ownership_sha256': digest(ownership_path)}, exclusive=True)
        root_snapshot = roots.copy()
        known = {**observed.copy(), **root_snapshot}
        # A PID alone is not an owned process identity after it has exited.
        kept = {pid for pid, _, _, birth in rows if known.get(pid) == birth}
        groups = {pid for pid, _, _, birth in rows if root_snapshot.get(pid) == birth}
        for group, birth in tuple(job_groups.items()):
            leader = next((row for row in rows if row[0] == group), None)
            members = [row for row in rows if row[2] == group]
            if not members or (leader is not None and leader[3] != birth):
                job_groups.pop(group, None)
                roots.pop(group, None)
            else:
                groups.add(group)
        changed = True
        while changed:
            changed = False
            for pid, parent, group, _ in rows:
                if pid not in kept and (parent in kept or group in groups):
                    kept.add(pid)
                    changed = True
        found = [row for row in rows if row[0] in kept]
        observed.update({row[0]: row[3] for row in found})
        return found

    def owned():
        with audit_lock:
            return owned_unlocked()

    def signal_bound(sig):
        # The acknowledged job group remains owned even if the guard has died
        # or a fresh process-table read is unavailable.
        for group in tuple(job_groups.copy()):
            try:
                os.killpg(group, sig)
            except ProcessLookupError:
                pass
        for child in children.copy().values():
            if child.poll() is None:
                child.send_signal(sig)

    def terminate(sig):
        try:
            rows = owned()
        except BaseException:
            signal_bound(sig)
            raise
        # Signal leaders first. The guard's TERM handler kills its detached job.
        live = {row[0]: row[3] for row in rows}
        for group in tuple(job_groups):
            if any(row[2] == group for row in rows):
                try:
                    os.killpg(group, sig)
                except ProcessLookupError:
                    pass
        for pid, birth in sorted(roots.copy().items()):
            if birth is None:
                child = children.get(pid)
                if child is not None and child.poll() is None:
                    child.send_signal(sig)
                continue
            if live.get(pid) != birth:
                continue
            try:
                os.kill(pid, sig)
            except ProcessLookupError:
                pass
        for pid, _, _, _ in reversed(rows):
            try:
                os.kill(pid, sig)
            except ProcessLookupError:
                pass
        return rows

    def watchdog():
        while not done.wait(0.1):
            try:
                owned()
                if time.monotonic() < deadline - 3:
                    continue
                if not fail('absolute-deadline',
                            'stopping before the fixed deadline to include cleanup', 124):
                    return
                event('deadline-stop')
                terminate(signal.SIGTERM)
                time.sleep(0.4)
                terminate(signal.SIGKILL)
                audit = owned()
                durable_json(output / 'deadline-audit.json', {'remaining': audit}, exclusive=True)
            except BaseException as error:
                if not fail('watchdog', str(error), 124):
                    return
                # Give the guard its TERM cleanup even when ps is unavailable.
                signal_bound(signal.SIGTERM)
                time.sleep(0.4)
                signal_bound(signal.SIGKILL)
                durable_json(output / 'deadline-audit.json',
                             {'clear': False, 'error': str(error)})
            os._exit(finalize('FAILED', 'watchdog stopped the invocation'))

    watcher = threading.Thread(target=watchdog, daemon=True)
    watcher.start()

    def hard_deadline():
        # Never cancelled by receipt finalisation: final flush/close is still
        # part of the invocation. Normal completion uses os._exit after it.
        threading.Event().wait(max(0, deadline - time.monotonic()))
        # No blocking audit, receipt writes or waits extend this final deadline.
        # The soft stop normally has already retained first-failure/audit data.
        try:
            for group in tuple(job_groups.copy()):
                try:
                    os.killpg(group, signal.SIGKILL)
                except BaseException:
                    pass
            for pid in tuple(children.copy()):
                try:
                    os.kill(pid, signal.SIGKILL)
                except BaseException:
                    pass
        finally:
            os._exit(124)

    deadline_thread = threading.Thread(target=hard_deadline, daemon=True)
    deadline_thread.start()

    def command(argv, cwd=None, env=None):
        with terminal_lock:
            if stopping.is_set() or (output / 'first-failure.json').exists():
                raise Failed('failure latch prevents another command launch')
            event('command-start', argv=argv)
            child = subprocess.Popen(argv, cwd=cwd, env=env, stdin=subprocess.DEVNULL,
                                     stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                     start_new_session=True)
            children[child.pid] = child
            roots[child.pid] = None
        birth = next((row[3] for row in process_rows() if row[0] == child.pid), None)
        if birth is not None:
            roots[child.pid] = birth
        while True:
            chunk = os.read(child.stdout.fileno(), 65536)
            if not chunk:
                break
            write_all(stream, chunk)
            os.fsync(stream)
            try:
                os.write(sys.stdout.fileno(), chunk)
            except BrokenPipeError:
                pass
        code = child.wait()
        roots.pop(child.pid, None)
        observed.pop(child.pid, None)
        children.pop(child.pid, None)
        event('command-end', code=code)
        if code:
            code = code if code > 0 else 128 - code
            fail(stage[0], 'command exited ' + str(code), code)
            raise Failed('command exited ' + str(code), code)

    code = 1
    try:
        seal_path = packet / 'seal.json'
        seal_bytes = seal_path.read_bytes()
        if hashlib.sha256(seal_bytes).hexdigest() != args.seal_sha256:
            raise Failed('seal identity mismatch')
        seal = json.loads(seal_bytes)
        if os.environ.get('ORIGO_GUARD'):
            raise Failed('invocation is already inside a memory guard')
        if seal['policy'] != {'guard_limit_mb': 850, 'node_heap_mb': 450,
                              'guard_wait_seconds': 0, 'whole_invocation_max_seconds': 180,
                              'cleanup_reserved_seconds': 3, 'build_workers': 2,
                              'minify': False, 'retry': False}:
            raise Failed('sealed policy differs from the reviewed invocation')
        if Path(sys.executable).resolve() != Path(seal['runtime']['python']['path']):
            raise Failed('invocation Python differs from the sealed runtime')
        claim_dir = Path(seal['claim_directory'])
        claim_dir.mkdir(mode=0o700, parents=True, exist_ok=True)
        durable_json(claim_dir / (args.seal_sha256 + '.json'),
                     {'output': str(output), 'allocation': args.allocation,
                      'deadline': args.deadline_utc}, exclusive=True)
        for name, expected in seal['payload'].items():
            if Path(name).name != name:
                raise Failed('packet payload name is not a direct file')
            if digest(packet / name) != expected:
                raise Failed('sealed packet input mismatch: ' + name)
        if digest(Path(__file__)) != seal['payload']['run_once.py']:
            raise Failed('invoked runner identity mismatch')
        original_packet = packet
        private_packet = output / 'packet'
        private_packet.mkdir()
        for name, expected in seal['payload'].items():
            shutil.copyfile(packet / name, private_packet / name)
            if digest(private_packet / name) != expected:
                raise Failed('private packet copy mismatch: ' + name)
        (private_packet / 'seal.json').write_bytes(seal_bytes)
        packet = private_packet
        specification = importlib.util.spec_from_file_location(
            'verified_packet_inputs', packet / 'packet_inputs.py')
        helper = importlib.util.module_from_spec(specification)
        specification.loader.exec_module(helper)
        tree_identity, source_identity = helper.tree_identity, helper.source_identity
        for runtime in seal['runtime'].values():
            if digest(runtime['path']) != runtime['sha256']:
                raise Failed('runtime identity mismatch: ' + runtime['path'])
        if digest(seal['guard']['path']) != seal['guard']['sha256']:
            raise Failed('memory guard identity mismatch')
        expected_dependencies = json.loads((packet / 'installed-inputs.json').read_text())
        dependencies = Path(seal['installed_root'])
        if tree_identity(dependencies) != expected_dependencies:
            raise Failed('actual installed dependency identity mismatch')
        source = output / 'source'
        source.mkdir()
        archive = output / 'source.tar'
        command([seal['git'], '-C', seal['repository'], 'archive', '--output', str(archive),
                 seal['source_revision']])
        if digest(archive) != seal['source_archive_sha256']:
            raise Failed('source export archive mismatch')
        with tarfile.open(archive) as tar:
            for member in tar.getmembers():
                target = (source / member.name).resolve()
                if source.resolve() not in target.parents and target != source.resolve():
                    raise Failed('source export path escapes snapshot')
                if member.issym() or member.islnk():
                    raise Failed('source export has an unreviewed link')
            tar.extractall(source)
        config = source / '.vitepress/config.ts'
        if config.read_bytes() != (packet / 'config.before.ts').read_bytes():
            raise Failed('source config differs from sealed before image')
        config.write_bytes((packet / 'config.after.ts').read_bytes())
        expected_source = json.loads((packet / 'source-inputs.json').read_text())['files']
        if source_identity(source)['files'] != expected_source:
            raise Failed('complete exported source input mismatch')
        shutil.copytree(dependencies, source / 'node_modules', symlinks=True)
        if tree_identity(source / 'node_modules') != expected_dependencies:
            raise Failed('copied dependency input mismatch')
        guard = output / 'mem-guard.mjs'
        shutil.copyfile(seal['guard']['path'], guard)
        if digest(guard) != seal['guard']['sha256']:
            raise Failed('copied memory guard identity mismatch')
        context = {'packet': str(packet), 'output': str(output), 'source': str(source),
                   'node': seal['runtime']['node']['path'],
                   'python': seal['runtime']['python']['path'], 'nonce': secrets.token_hex(32)}
        durable_json(output / 'context.json', context, exclusive=True)
        context_identity[0] = {'nonce': context['nonce'],
                               'sha256': digest(output / 'context.json')}
        env = {'HOME': seal['home'], 'PATH': seal['path'], 'LANG': 'C', 'LC_ALL': 'C',
               'TZ': 'UTC', 'PYTHONDONTWRITEBYTECODE': '1', 'TMPDIR': str(output / 'tmp')}
        (output / 'tmp').mkdir()
        stage[0] = 'guarded-build-and-check'
        argv = [context['node'], str(guard), '--limit', '850', '--heap', '450',
                '--name', 'tec-os-reader-site', '--wait', '0', '--log',
                str(output / 'memory.jsonl'), '--', context['python'], '-S', '-B',
                str(packet / 'build_and_check.py'), '--context', str(output / 'context.json')]
        event('guard-start-authorized', argv=argv, context_sha256=digest(output / 'context.json'),
              absolute_deadline_utc=args.deadline_utc)
        command(argv, cwd=source, env=env)
        stage[0] = 'postflight'
        checker = json.loads((output / 'checker.json').read_text())
        if checker.get('status') != 'passed':
            raise Failed('checker acceptance missing')
        expectations = json.loads((packet / 'expectations.json').read_text())
        for page in expectations['pages']:
            if digest(source / page['path']) != page['source_sha256']:
                raise Failed('source reader changed during invocation: ' + page['path'])
        if digest(config) != digest(packet / 'config.after.ts'):
            raise Failed('temporary config changed during invocation')
        source_after = source_identity(source)
        durable_json(output / 'source-after.json', source_after, exclusive=True)
        if source_after['files'] != expected_source:
            raise Failed('exported build input changed outside writable output exclusions')
        if digest(output / 'context.json') != context_identity[0]['sha256']:
            raise Failed('execution context changed during invocation')
        if tree_identity(dependencies) != expected_dependencies:
            raise Failed('original installed inputs changed during invocation')
        if tree_identity(source / 'node_modules') != expected_dependencies:
            raise Failed('copied installed inputs changed during invocation')
        for runtime in seal['runtime'].values():
            if digest(runtime['path']) != runtime['sha256']:
                raise Failed('runtime changed during invocation: ' + runtime['path'])
        for name, expected in seal['payload'].items():
            if digest(packet / name) != expected or digest(original_packet / name) != expected:
                raise Failed('packet input changed during invocation: ' + name)
        audit = owned()
        durable_json(output / 'owned-process-audit.json', {'remaining': audit}, exclusive=True)
        if audit:
            raise Failed('owned processes remain after guard completion')
        if time.monotonic() >= deadline - 3:
            raise Failed('insufficient time remains for a terminal receipt before the deadline')
        code = finalize('PASS')
    except BaseException as error:
        code = error.code if isinstance(error, Failed) else 1
        fail(stage[0], str(error), code)
        for sig in (signal.SIGTERM, signal.SIGKILL):
            try:
                terminate(sig)
            except BaseException as cleanup_error:
                event('cleanup-error', detail=str(cleanup_error))
            if sig == signal.SIGTERM:
                time.sleep(0.4)
        try:
            durable_json(output / 'owned-process-audit.json', {'remaining': owned()})
        except BaseException as cleanup_error:
            durable_json(output / 'owned-process-audit.json',
                         {'clear': False, 'error': str(cleanup_error)})
        code = finalize('FAILED', str(error))
    finally:
        done.set()
        watcher.join(timeout=0.6)
        os.fsync(stream)
        os.close(stream)
        os.close(events)
    return code


if __name__ == '__main__':
    os._exit(main())

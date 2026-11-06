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
from packet_inputs import canonical, digest, durable_json, first_failure, tree_identity

ENTRY_WALL = time.time()
ENTRY_MONO = time.monotonic()


class Failed(Exception):
    pass


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
    deadline_wall = datetime.fromisoformat(args.deadline_utc.replace('Z', '+00:00')).timestamp()
    remaining = deadline_wall - ENTRY_WALL
    if not 5 < remaining <= 180:
        parser.error('absolute deadline must be 5 to 180 seconds after invocation entry')
    deadline = ENTRY_MONO + remaining
    # A fresh output and a persistent seal claim prevent an implicit retry.
    output.mkdir(mode=0o700, parents=False, exist_ok=False)
    durable_json(output / 'invocation.json', {
        'entry_utc': datetime.fromtimestamp(ENTRY_WALL, timezone.utc).isoformat(),
        'absolute_deadline_utc': args.deadline_utc, 'maximum_seconds': 180,
        'allocation': args.allocation, 'seal_sha256': args.seal_sha256,
        'retry': False, 'deadline_includes': 'preflight, copy, guard, build, checker and cleanup'
    }, exclusive=True)
    stage = ['preflight']
    roots = set()
    observed = set()
    done = threading.Event()
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
        raise Failed('invocation interrupted by signal ' + str(signum))

    for signum in (signal.SIGTERM, signal.SIGINT, signal.SIGHUP):
        signal.signal(signum, interrupted)

    def process_rows():
        result = subprocess.run(['/bin/ps', '-axo', 'pid=,ppid=,pgid='],
                                text=True, capture_output=True, timeout=0.5)
        if result.returncode:
            raise Failed('cannot audit owned processes')
        return [tuple(map(int, line.split())) for line in result.stdout.splitlines() if line.strip()]

    def owned():
        rows = process_rows()
        kept = set(roots) | set(observed)
        changed = True
        while changed:
            changed = False
            for pid, parent, group in rows:
                if pid not in kept and (parent in kept or group in roots):
                    kept.add(pid)
                    changed = True
        found = [row for row in rows if row[0] in kept]
        observed.update(row[0] for row in found)
        return found

    def terminate(sig):
        rows = owned()
        # Signal leaders first. The guard's TERM handler kills its detached job.
        for pid in sorted(roots):
            try:
                os.kill(pid, sig)
            except ProcessLookupError:
                pass
        for pid, _, _ in reversed(rows):
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
                first_failure(output, 'absolute-deadline',
                              'stopping before the fixed deadline to include cleanup', 124)
                event('deadline-stop')
                terminate(signal.SIGTERM)
                time.sleep(0.4)
                terminate(signal.SIGKILL)
                audit = owned()
                durable_json(output / 'deadline-audit.json', {'remaining': audit}, exclusive=True)
            except BaseException as error:
                first_failure(output, 'watchdog', str(error), 124)
                # An audit failure cannot permit the invocation to continue.
                for pid in tuple(roots | observed):
                    try:
                        os.kill(pid, signal.SIGKILL)
                    except ProcessLookupError:
                        pass
            durable_json(output / 'terminal.json', {'status': 'FAILED', 'exit_code': 124,
                         'retry': False, 'elapsed_seconds': time.monotonic() - ENTRY_MONO})
            os._exit(124)

    watcher = threading.Thread(target=watchdog, daemon=True)
    watcher.start()

    def command(argv, cwd=None, env=None):
        event('command-start', argv=argv)
        child = subprocess.Popen(argv, cwd=cwd, env=env, stdin=subprocess.DEVNULL,
                                 stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                 start_new_session=True)
        roots.add(child.pid)
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
        roots.discard(child.pid)
        observed.discard(child.pid)
        event('command-end', code=code)
        if code:
            first_failure(output, stage[0], 'command exited ' + str(code), code)
            raise Failed('command exited ' + str(code))

    code = 1
    try:
        seal_path = packet / 'seal.json'
        if digest(seal_path) != args.seal_sha256:
            raise Failed('seal identity mismatch')
        seal = json.loads(seal_path.read_text())
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
            if digest(packet / name) != expected:
                raise Failed('sealed packet input mismatch: ' + name)
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
        shutil.copytree(dependencies, source / 'node_modules', symlinks=True)
        if tree_identity(source / 'node_modules') != expected_dependencies:
            raise Failed('copied dependency input mismatch')
        guard = output / 'mem-guard.mjs'
        shutil.copyfile(seal['guard']['path'], guard)
        if digest(guard) != seal['guard']['sha256']:
            raise Failed('copied memory guard identity mismatch')
        context = {'packet': str(packet), 'output': str(output), 'source': str(source),
                   'node': seal['runtime']['node']['path'],
                   'python': seal['runtime']['python']['path']}
        durable_json(output / 'context.json', context, exclusive=True)
        env = {'HOME': seal['home'], 'PATH': seal['path'], 'LANG': 'C', 'LC_ALL': 'C',
               'TZ': 'UTC', 'PYTHONDONTWRITEBYTECODE': '1', 'TMPDIR': str(output / 'tmp')}
        (output / 'tmp').mkdir()
        stage[0] = 'guarded-build-and-check'
        argv = [context['node'], str(guard), '--limit', '850', '--heap', '450',
                '--name', 'tec-os-reader-site', '--wait', '0', '--log',
                str(output / 'memory.jsonl'), '--', context['python'], '-B',
                str(packet / 'build_and_check.py'), '--context', str(output / 'context.json')]
        event('guard-start-authorized', argv=argv, context_sha256=digest(output / 'context.json'),
              absolute_deadline_utc=args.deadline_utc)
        command(argv, cwd=source, env=env)
        stage[0] = 'postflight'
        checker = json.loads((output / 'checker.json').read_text())
        if checker.get('status') != 'PASS':
            raise Failed('checker acceptance missing')
        expectations = json.loads((packet / 'expectations.json').read_text())
        for page in expectations['pages']:
            if digest(source / page['path']) != page['source_sha256']:
                raise Failed('source reader changed during invocation: ' + page['path'])
        if digest(config) != digest(packet / 'config.after.ts'):
            raise Failed('temporary config changed during invocation')
        if tree_identity(dependencies) != expected_dependencies:
            raise Failed('original installed inputs changed during invocation')
        if tree_identity(source / 'node_modules') != expected_dependencies:
            raise Failed('copied installed inputs changed during invocation')
        for runtime in seal['runtime'].values():
            if digest(runtime['path']) != runtime['sha256']:
                raise Failed('runtime changed during invocation: ' + runtime['path'])
        for name, expected in seal['payload'].items():
            if digest(packet / name) != expected:
                raise Failed('packet input changed during invocation: ' + name)
        audit = owned()
        durable_json(output / 'owned-process-audit.json', {'remaining': audit}, exclusive=True)
        if audit:
            raise Failed('owned processes remain after guard completion')
        if time.monotonic() >= deadline - 3:
            raise Failed('insufficient time remains for a terminal receipt before the deadline')
        durable_json(output / 'terminal.json', {'status': 'PASS', 'retry': False,
                     'candidate': seal['source_revision'], 'seal_sha256': args.seal_sha256,
                     'checker_sha256': digest(output / 'checker.json'),
                     'elapsed_seconds': time.monotonic() - ENTRY_MONO}, exclusive=True)
        code = 0
    except BaseException as error:
        first_failure(output, stage[0], str(error), 1)
        try:
            terminate(signal.SIGTERM)
            time.sleep(0.2)
            terminate(signal.SIGKILL)
            durable_json(output / 'owned-process-audit.json', {'remaining': owned()})
        except BaseException as cleanup_error:
            event('cleanup-error', detail=str(cleanup_error))
        durable_json(output / 'terminal.json', {'status': 'FAILED', 'retry': False,
                     'detail': str(error), 'elapsed_seconds': time.monotonic() - ENTRY_MONO})
    finally:
        done.set()
        watcher.join(timeout=0.6)
        os.fsync(stream)
        os.close(stream)
        os.close(events)
    return code


if __name__ == '__main__':
    sys.exit(main())

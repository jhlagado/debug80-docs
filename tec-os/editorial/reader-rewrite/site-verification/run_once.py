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
PS_IDENTITY_ENV = {'TZ': 'UTC', 'LC_ALL': 'C', 'LANG': 'C'}


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


def prepare_receipt(path, value):
    """Durable preparation only. Publication is a separate atomic link."""
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
    return temporary


def sync_directory(path):
    fd = os.open(path, os.O_RDONLY)
    try:
        os.fsync(fd)
    finally:
        os.close(fd)


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


def query_budget(now, soft_deadline, hard_deadline, cleanup_phase=False):
    boundary = hard_deadline if cleanup_phase else soft_deadline
    return min(0.5 if cleanup_phase else 2.0, max(0.0, boundary - now))


def validate_ownership(ownership, context, rows, guard_alive):
    worker = next((row for row in rows if row[0] == ownership['pid']), None)
    errors = []
    for key, expected in (('nonce', context['nonce']),
                          ('context_sha256', context['sha256']),
                          ('birth_environment', PS_IDENTITY_ENV)):
        if ownership.get(key) != expected:
            errors.append(key + '_mismatch')
    if ownership['pgid'] != ownership['pid'] or ownership['parent_pid'] != ownership['guard_pid']:
        errors.append('declared_parent_or_group_mismatch')
    if worker is None:
        errors.append('worker_pid_not_observed')
    else:
        for actual, expected, name in ((worker[1], ownership['guard_pid'], 'parent'),
                                       (worker[2], ownership['pgid'], 'group'),
                                       (worker[3], ownership['birth'], 'birth')):
            if actual != expected:
                errors.append('observed_' + name + '_mismatch')
    if not guard_alive:
        errors.append('guard_not_live')
    return errors


def discover_owned(rows, roots, observed, job_groups):
    known = {**observed, **roots}
    reused = {pid for pid, _, _, birth in rows
              if known.get(pid) is not None and known[pid] != birth}
    kept = {pid for pid, _, _, birth in rows if known.get(pid) == birth}
    groups = {pid for pid, _, _, birth in rows if roots.get(pid) == birth}
    retained_groups = dict(job_groups)
    for group, birth in job_groups.items():
        leader = next((row for row in rows if row[0] == group), None)
        if not any(row[2] == group for row in rows) or (leader and leader[3] != birth):
            retained_groups.pop(group, None)
        else:
            groups.add(group)
    changed = True
    while changed:
        changed = False
        for pid, parent, group, _ in rows:
            if pid not in kept and pid not in reused and (parent in kept or group in groups):
                kept.add(pid)
                changed = True
    return [row for row in rows if row[0] in kept], retained_groups


class InvocationState:
    """Source-only candidate seams. Record callbacks do I/O outside the latch.

    Snapshots cover observed identities, not every historical descendant.
    A worker can cross a phase checkpoint before main publishes its marker.
    """
    def __init__(self, deadline, clock=time.monotonic):
        self.deadline, self.soft_deadline, self.clock = deadline, deadline - 3, clock
        self.lock = threading.RLock()
        self.failure_lock = threading.RLock()
        self.pending_failures = []
        self.stopping = threading.Event()
        self.signal_requested = threading.Event()
        self.failure = None
        self.final_code = None
        self.roots, self.observed, self.children, self.job_groups = {}, {}, {}, {}
        self.history = []
        self.last_rows = None
        self.last_success_id = None
        self.query_id = 0
        self.acknowledged = False
        self.accepted_ownership_sha256 = None

    def _adopt_pending(self):
        # Caller holds both state and failure locks. The first queued identity
        # already exists even if its requesting thread is waiting for state.lock.
        if self.failure is None and self.pending_failures:
            self.failure = self.pending_failures[0]

    def _queue_stop(self, failure):
        # No receipt/audit/ownership lock is required to retain the first cause.
        # Final publication uses this same short latch lock.
        with self.failure_lock:
            if self.final_code is not None:
                return False
            if failure not in self.pending_failures:
                self.pending_failures.append(failure)
            self.stopping.set()
            self.signal_requested.set()
        with self.lock, self.failure_lock:
            self._adopt_pending()
        return True

    def request_stop(self, stage, detail, code=124):
        return self._queue_stop({
            'status': 'FAILED', 'stage': stage, 'detail': detail,
            'exit_code': code if 0 < code < 256 else 1, 'retry': False,
            'utc': datetime.now(timezone.utc).isoformat()})

    def import_failure(self, failure):
        code = failure.get('exit_code')
        if not isinstance(code, int) or not 0 < code < 256:
            raise Failed('malformed worker first-failure receipt')
        # Import before a generic guard failure, never overwrite an earlier
        # pending or latched parent cause. Preserve structured detail verbatim.
        self._queue_stop(dict(failure))
        with self.lock, self.failure_lock:
            if self.final_code is None and self.failure != failure:
                conflict = {'kind': 'failure-receipt-conflict',
                            'latched': self.failure, 'receipt': dict(failure)}
                if conflict not in self.history:
                    self.history.append(conflict)

    def query(self, query_once, record, cleanup_phase=False):
        planned = query_budget(self.clock(), self.soft_deadline, self.deadline, cleanup_phase)
        with self.lock:
            self.query_id += 1
            query_id = self.query_id
        intent = {'query_id': query_id, 'planned_budget': planned,
                  'cleanup_phase': cleanup_phase, 'last_success_id': self.last_success_id}
        launch_data = {}
        launch_checked_budget = planned if planned <= 0 else None
        try:
            if planned <= 0:
                self.request_stop('absolute-deadline', 'no identity query budget', 124)
                raise Failed('no identity query budget', 124)
            record('query-intent', **intent)

            def launch(spawn):
                nonlocal launch_checked_budget
                # Serialize the stop check/launch intent, not native Popen.
                # While Popen is blocked there may be no returned handle yet.
                with self.lock:
                    with self.failure_lock:
                        self._adopt_pending()
                        if launch_data:
                            raise Failed('identity adapter attempted a second launch', 124)
                        start = self.clock()
                        budget = query_budget(start, self.soft_deadline,
                                              self.deadline, cleanup_phase)
                        launch_checked_budget = budget
                        if budget <= 0:
                            self.request_stop('absolute-deadline', 'query intent consumed remaining budget', 124)
                        if budget <= 0 or (self.stopping.is_set() and not cleanup_phase):
                            raise Failed('identity query stopped before launch', 124)
                        launch_data.update(start=start, effective_budget=budget)
                    # The actual adapter registers the returned handle before
                    # any I/O and repeats bound cleanup if stop crossed spawn.
                    return spawn(budget)

            rows = query_once(launch)
            if not launch_data:
                raise Failed('identity adapter did not register launch', 124)
            finished = self.clock()
            self.last_success_id = query_id
            record('query-finished', **intent, **launch_data, end=finished, outcome='ok',
                   elapsed=finished - launch_data['start'],
                   exceeded_old_half_second=finished - launch_data['start'] > 0.5)
            return rows
        except BaseException as error:
            finished = self.clock()
            self.request_stop('identity-observation', {
                'message': str(error), 'query_error': type(error).__name__,
                'query_id': query_id, 'finished': finished,
                'elapsed_seconds': finished - launch_data.get('start', finished),
                **launch_data}, 124)
            # Failure is latched and signalling awake before completion-log I/O.
            # No launch means no effective execution budget or start timestamp.
            # Preserve the separately recomputed budget even when stop refused it.
            completion = {**launch_data,
                          'effective_budget': launch_data.get('effective_budget', 0.0),
                          'launch_checked_budget': launch_checked_budget}
            record('query-failed' if launch_data else 'query-not-launched',
                   **intent, end=finished, outcome=type(error).__name__, **completion)
            raise Failed('identity observation unavailable', 124) from error

    def register_child(self, child, argv):
        with self.lock:
            self.children[child.pid] = child
            self.roots[child.pid] = None
            self.history.append({'kind': 'direct-child', 'pid': child.pid,
                                 'birth': None, 'argv': argv})

    def stop_new_child(self, child, cleanup_phase=False):
        expired = self.clock() >= (self.deadline if cleanup_phase else self.soft_deadline)
        if expired or (not cleanup_phase and
                       (self.stopping.is_set() or self.signal_requested.is_set())):
            # The independent one-shot signaller may already have completed.
            # A handle returned after it still receives immediate cleanup.
            for signum in (signal.SIGTERM, signal.SIGKILL):
                try:
                    child.send_signal(signum)
                except BaseException:
                    pass
            return True
        return False

    def bind_group(self, ownership):
        with self.lock:
            pid, birth = ownership['pid'], ownership['birth']
            self.job_groups[pid] = birth
            self.roots[pid] = birth
            self.history.append({'kind': 'ack-group', **ownership})

    def publish_ack(self, prepare, publish, ownership_sha256=None):
        prepared = prepare()  # Durable file preparation outside the failure lock.
        with self.lock, self.failure_lock:
            self._adopt_pending()
            if self.stopping.is_set() or self.clock() >= self.soft_deadline:
                raise Failed('stop prevents ownership ACK', 124)
            publish(prepared)  # Atomic link only, no fsync/record operations here.
            self.accepted_ownership_sha256 = ownership_sha256
            self.acknowledged = True

    def observe(self, rows):
        with self.lock:
            found, groups = discover_owned(rows, self.roots, self.observed, self.job_groups)
            current = {row[0]: row[3] for row in rows}
            for pid, birth in self.observed.items():
                if current.get(pid) != birth:
                    self.history.append({'kind': 'exit-or-reuse', 'pid': pid,
                                         'birth': birth, 'observed_birth': current.get(pid)})
            for row in found:
                if self.observed.get(row[0]) != row[3]:
                    self.history.append({'kind': 'discovered', 'identity': row})
            self.observed.update({row[0]: row[3] for row in found})
            # Keep cumulative PID/birth history even after live registrations end.
            for group in tuple(self.job_groups):
                if group not in groups:
                    self.job_groups.pop(group, None)
            self.job_groups.update(groups)
            self.last_rows = list(rows)
            return found

    def snapshot(self):
        with self.lock:
            return {'history': list(self.history), 'roots': dict(self.roots),
                    'groups': dict(self.job_groups), 'observed': dict(self.observed),
                    'last_success_id': self.last_success_id, 'last_rows': self.last_rows,
                    'first_failure': self.failure,
                    'accepted_ownership_sha256': self.accepted_ownership_sha256}

    def signal_bound(self, sig, group_signal, handle_signal):
        # Never acquire failure/audit/receipt locks or wait for query completion.
        for group in tuple(self.job_groups.copy()):
            try:
                group_signal(group, sig)
            except BaseException:
                pass
        for child in self.children.copy().values():
            try:
                handle_signal(child, sig)
            except BaseException:
                pass

    def soft_stop(self):
        if self.clock() >= self.soft_deadline:
            # Wake bound signalling without an ownership or receipt lock.
            self.signal_requested.set()
            self.request_stop('absolute-deadline', 'cleanup reserve reached', 124)

    def signal_escalation(self, group_signal, handle_signal, wait):
        self.signal_bound(signal.SIGTERM, group_signal, handle_signal)
        wait(min(0.4, max(0.0, self.deadline - self.clock())))
        self.signal_bound(signal.SIGKILL, group_signal, handle_signal)

    def commit_decision(self, audit, observer_quiet, expected_code,
                        expected_failure, publish):
        with self.lock, self.failure_lock:
            code = self.decision(audit, observer_quiet)
            if code != expected_code or canonical(self.failure) != expected_failure:
                return False
            publish()  # Atomic link only, prepared and fsynced outside the latch.
            self.final_code = code
            return True

    def decision(self, audit, observer_quiet):
        with self.lock, self.failure_lock:
            self._adopt_pending()
            if self.failure is None and self.stopping.is_set():
                # A bare externally set stop is never acceptance evidence.
                self.request_stop('pending-stop', 'stop set without a retained cause', 124)
            if self.failure is None:
                if (not observer_quiet or audit is None or audit.get('status') != 'CLEAR'
                        or audit.get('remaining') != []):
                    self.request_stop('final-audit', 'fresh audit/quiescence missing', 124)
                elif not self.acknowledged:
                    self.request_stop('ownership', 'validated ownership ACK missing', 124)
                elif self.clock() >= self.soft_deadline:
                    self.request_stop('absolute-deadline', 'terminal soft deadline reached', 124)
            return self.failure['exit_code'] if self.failure else 0


def hard_stop(groups, children, killpg=os.killpg, kill=os.kill, exit_now=os._exit):
    # Direct signals only. This is independent of normal cleanup/receipt locks.
    try:
        for group in tuple(groups.copy()):
            try:
                killpg(group, signal.SIGKILL)
            except BaseException:
                pass
        for pid in tuple(children.copy()):
            try:
                kill(pid, signal.SIGKILL)
            except BaseException:
                pass
    finally:
        exit_now(124)


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
    state = InvocationState(deadline)
    roots, observed, children = state.roots, state.observed, state.children
    job_groups = state.job_groups
    done = threading.Event()
    terminal_complete = threading.Event()
    stopping = state.stopping
    terminal_lock = state.lock
    audit_lock = threading.RLock()
    event_lock = threading.Lock()
    registry_io_lock = threading.Lock()
    query_launch = [None]
    context_identity = [None]
    events = os.open(output / 'events.jsonl', os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    stream = os.open(output / 'stream.log', os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)

    def write_all(fd, data):
        while data:
            data = data[os.write(fd, data):]

    def event(kind, **fields):
        with event_lock:
            write_all(events, canonical({'event': kind, 'utc': datetime.now(timezone.utc).isoformat(),
                                         'stage': stage[0], **fields}))
            os.fsync(events)

    def interrupted(signum, frame):
        raise Failed('invocation interrupted by signal ' + str(signum), 128 + signum)

    for signum in (signal.SIGTERM, signal.SIGINT, signal.SIGHUP):
        signal.signal(signum, interrupted)

    def persist_registry():
        with registry_io_lock:
            durable_json(output / 'ownership-history.json', state.snapshot())

    def fail(where, detail, code):
        # Worker may have exclusively published its earlier specific failure.
        try:
            import_worker_failure()
        except BaseException as error:
            state.request_stop('failure-receipt', str(error), 124)
        return state.request_stop(where, detail, code)

    def import_worker_failure():
        path = output / 'first-failure.json'
        if path.exists():
            state.import_failure(json.loads(path.read_text()))

    def flush_failure():
        import_worker_failure()
        with state.lock:
            failure = state.failure
        if failure is None:
            return
        try:
            durable_json(output / 'first-failure.json', failure, exclusive=True)
        except FileExistsError:
            import_worker_failure()
        # Publication is visibility-based, not instantaneous worker preemption.
        durable_json(output / 'stop-requested.json', state.failure)
        conflicts = [item for item in state.snapshot()['history']
                     if item['kind'] == 'failure-receipt-conflict']
        if conflicts:
            durable_json(output / 'failure-receipt-conflicts.json', conflicts)

    def finalize(status, detail='', audit=None, observer_quiet=False):
        # Main alone calls this. Prepare/flush outside the latch, then commit
        # only the still-current decision with one atomic link under the latch.
        while True:
            import_worker_failure()
            if status != 'PASS' and state.failure is None:
                state.request_stop(stage[0], detail, 1)
            code = state.decision(audit, observer_quiet)
            flush_failure()
            with state.lock:
                failure_identity = canonical(state.failure)
            value = {'status': 'FAILED' if code else 'PASS', 'exit_code': code,
                     'detail': detail, 'retry': False, 'seal_sha256': args.seal_sha256,
                     'elapsed_seconds': time.monotonic() - ENTRY_MONO,
                     'first_failure': state.failure}
            prepared = prepare_receipt(output / 'terminal.json', value)
            try:
                import_worker_failure()
                if not state.commit_decision(
                        audit, observer_quiet, code, failure_identity,
                        lambda: os.link(prepared, output / 'terminal.json')):
                    continue
                sync_directory(output)
                terminal_complete.set()
                return code
            finally:
                prepared.unlink(missing_ok=True)

    def ps_once(launch, cleanup_phase=False):
        argv = ['/bin/ps', '-axo', 'pid=,ppid=,pgid=,lstart=']
        def spawn_query(budget):
            child = subprocess.Popen(argv, text=True, stdout=subprocess.PIPE,
                                     stderr=subprocess.PIPE,
                                     env={**os.environ, **PS_IDENTITY_ENV})
            state.register_child(child, argv)  # Memory only, before any wait/I/O.
            state.stop_new_child(child, cleanup_phase)
            return child
        child = launch(spawn_query)
        rows = []
        try:
            # Launch overhead consumes the same query budget, not a fresh one.
            try:
                stdout, stderr = child.communicate(timeout=max(
                    0.0, query_launch[0]['start'] + query_launch[0]['effective_budget']
                    - time.monotonic()))
            except BaseException as error:
                state.request_stop('identity-observation', {
                    'message': str(error), 'query_error': type(error).__name__,
                    'effective_budget_seconds': query_launch[0]['effective_budget'],
                    'elapsed_seconds': time.monotonic() - query_launch[0]['start']}, 124)
                try:
                    child.kill()
                except ProcessLookupError:
                    pass
                # One query only. Reap is bounded by the original hard deadline;
                # the registered live helper remains reachable by hard_stop.
                child.communicate(timeout=max(0.0, deadline - time.monotonic()))
                raise
            if child.returncode:
                raise Failed('cannot audit owned processes: ' + stderr, 124)
            for line in stdout.splitlines():
                if line.strip():
                    pid, parent, group, birth = line.split(None, 3)
                    if not birth.strip():
                        raise Failed('empty process birth identity', 124)
                    rows.append((int(pid), int(parent), int(group), birth.strip()))
            if not rows or not any(row[0] == os.getpid() for row in rows):
                raise Failed('global process observation is empty or omits the runner', 124)
            if len({row[0] for row in rows}) != len(rows):
                raise Failed('duplicate process identities in global observation', 124)
            return rows
        finally:
            if child.returncode is not None:
                birth = next((row[3] for row in rows if row[0] == child.pid), None)
                with state.lock:
                    state.history.append({'kind': 'identity-query-exit', 'pid': child.pid,
                                          'birth': birth, 'exit_code': child.returncode})
                    roots.pop(child.pid, None)
                    children.pop(child.pid, None)

    def process_rows(cleanup_phase=False):
        # Queries are serialized by audit_lock. The launch callback captures the
        # exact effective launch budget for the production adapter, not a retry.
        def query_once(launch):
            def tracked_launch(spawn):
                def tracked_spawn(budget):
                    query_launch[0] = {'start': time.monotonic(), 'effective_budget': budget}
                    return spawn(budget)
                return launch(tracked_spawn)
            return ps_once(tracked_launch, cleanup_phase)
        with audit_lock:
            return state.query(query_once, event, cleanup_phase)

    def owned_unlocked(cleanup_phase=False):
        rows = process_rows(cleanup_phase)
        import_worker_failure()
        ownership_path = output / 'job-ownership.json'
        ownership = None
        ack_ready = False
        errors = []
        if context_identity[0] is not None and (state.acknowledged or ownership_path.exists()):
            ownership_bytes = ownership_path.read_bytes()
            ownership_sha256 = hashlib.sha256(ownership_bytes).hexdigest()
            # Check the accepted write-once bytes before interpreting any later
            # PID/group/birth fields. Never replace already bound authority.
            if state.acknowledged and ownership_sha256 != state.accepted_ownership_sha256:
                state.request_stop('identity-observation', {
                    'message': 'job ownership receipt hash mismatch',
                    'expected_sha256': state.accepted_ownership_sha256,
                    'observed_sha256': ownership_sha256}, 124)
                raise Failed('job ownership receipt hash mismatch', 124)
            ownership = json.loads(ownership_bytes)
            guard = children.get(ownership['guard_pid'])
            guard_alive = guard is not None and guard.poll() is None
            errors = validate_ownership(ownership, context_identity[0], rows, guard_alive)
            # Declaration corruption stays fatal even after ACK. Transient
            # absence after a valid ACK is dispositioned by observed closure.
            fatal = {'nonce_mismatch', 'context_sha256_mismatch',
                     'birth_environment_mismatch', 'declared_parent_or_group_mismatch'}
            if fatal.intersection(errors):
                state.observe(rows)
                state.request_stop('identity-observation', {'mismatches': errors}, 124)
                raise Failed('job ownership declaration mismatch: ' + ', '.join(errors), 124)
            if not (output / 'job-ack.json').exists():
                invalid_identity = {'observed_parent_mismatch', 'observed_group_mismatch',
                                    'observed_birth_mismatch'}
                if invalid_identity.intersection(errors):
                    state.request_stop('identity-observation', {'mismatches': errors}, 124)
                    raise Failed('job ownership identity mismatch: ' + ', '.join(errors), 124)
                # A successful global snapshot can precede receipt publication.
                # Missing worker/guard stays pending, without ACK, until another
                # successful observation or the unchanged worker ACK deadline.
                if not errors:
                    state.bind_group(ownership)  # Memory before all ACK I/O.
                    ack_ready = True
        found = state.observe(rows)
        persist_registry()
        if ack_ready:
            value = {'nonce': ownership['nonce'], 'ownership_sha256': ownership_sha256}
            prepared = []
            def prepare_ack():
                temp = prepare_receipt(output / 'job-ack.json', value)
                prepared.append(temp)
                return temp
            try:
                state.publish_ack(prepare_ack,
                                  lambda temp: os.link(temp, output / 'job-ack.json'),
                                  ownership_sha256=ownership_sha256)
                sync_directory(output)
                event('ownership-acknowledged', worker_pid=ownership['pid'],
                      worker_group=ownership['pgid'], birth=ownership['birth'],
                      birth_environment=PS_IDENTITY_ENV)
            finally:
                for temp in prepared:
                    temp.unlink(missing_ok=True)
        return found

    def owned(cleanup_phase=False):
        with audit_lock:
            try:
                return owned_unlocked(cleanup_phase)
            except BaseException as error:
                state.request_stop('identity-observation', str(error), 124)
                raise

    def signal_bound(sig):
        def handle_signal(child, signum):
            if child.poll() is None:
                child.send_signal(signum)
        state.signal_bound(sig, os.killpg, handle_signal)

    def terminate(sig):
        # Independent signalling never calls this observation-dependent helper.
        signal_bound(sig)
        rows = owned(cleanup_phase=True)
        for pid, _, _, _ in reversed(rows):
            try:
                os.kill(pid, sig)
            except ProcessLookupError:
                pass
        return rows

    def watchdog():
        while not done.wait(0.1):
            if stopping.is_set():
                return
            try:
                owned()
            except BaseException as error:
                state.request_stop('identity-observation', str(error), 124)
                return  # No audit, terminal receipt or process exit here.

    def soft_deadline():
        if not terminal_complete.wait(max(0.0, deadline - 3 - time.monotonic())):
            state.soft_stop()

    def signalling_path():
        state.signal_requested.wait()
        def handle_signal(child, signum):
            if child.poll() is None:
                child.send_signal(signum)
        state.signal_escalation(os.killpg, handle_signal, threading.Event().wait)

    watcher = threading.Thread(target=watchdog, daemon=True)
    soft_thread = threading.Thread(target=soft_deadline, daemon=True)
    signal_thread = threading.Thread(target=signalling_path, daemon=True)

    def hard_deadline():
        # Never cancelled by receipt finalisation: final flush/close is still
        # part of the invocation. Normal completion uses os._exit after it.
        threading.Event().wait(max(0, deadline - time.monotonic()))
        # No blocking audit, receipt writes or waits extend this final deadline.
        # The soft stop normally has already retained first-failure/audit data.
        hard_stop(job_groups, children)

    deadline_thread = threading.Thread(target=hard_deadline, daemon=True)
    deadline_thread.start()
    soft_thread.start()
    signal_thread.start()
    watcher.start()

    def quiesce_observer():
        done.set()
        watcher.join(timeout=max(0.0, deadline - 3 - time.monotonic()))
        quiet = not watcher.is_alive()
        if not quiet:
            state.request_stop('observer-quiescence', 'observer did not quiesce before soft stop', 124)
        return quiet

    def final_audit(observer_quiet):
        try:
            if not observer_quiet:
                raise Failed('observer still active; final observation unavailable', 124)
            rows = owned(cleanup_phase=True)
            audit = {'status': 'HELD' if rows else 'CLEAR', 'remaining': rows,
                     'registry': state.snapshot()}
            if rows:
                state.request_stop('final-audit', 'owned processes remain', 124)
        except BaseException as error:
            state.request_stop('final-audit', str(error), 124)
            audit = {'status': 'UNKNOWN_HELD', 'clear': False, 'error': str(error),
                     'registry': state.snapshot()}
        durable_json(output / 'owned-process-audit.json', audit)
        return audit

    def command(argv, cwd=None, env=None):
        import_worker_failure()
        flush_failure()
        event('command-start', argv=argv)
        with terminal_lock:
            with state.failure_lock:
                state._adopt_pending()
                if stopping.is_set() or time.monotonic() >= deadline - 3:
                    raise Failed('failure latch prevents another command launch', 124)
            # Launch intent is serialized, Popen is not under the failure latch.
            child = subprocess.Popen(argv, cwd=cwd, env=env, stdin=subprocess.DEVNULL,
                                     stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                     start_new_session=True)
            state.register_child(child, argv)
            crossed_stop = state.stop_new_child(child)
        if crossed_stop:
            raise Failed('stop crossed child launch; returned handle signalled', 124)
        event('direct-child-registered', pid=child.pid, birth=None, argv=argv)
        persist_registry()
        with audit_lock:
            birth = next((row[3] for row in process_rows() if row[0] == child.pid), None)
        if birth is not None:
            with state.lock:
                roots[child.pid] = birth
                state.history.append({'kind': 'direct-birth', 'pid': child.pid, 'birth': birth})
        while True:
            chunk = os.read(child.stdout.fileno(), 65536)
            if not chunk:
                break
            flush_failure()
            write_all(stream, chunk)
            os.fsync(stream)
            try:
                os.write(sys.stdout.fileno(), chunk)
            except BrokenPipeError:
                pass
        code = child.wait()
        with state.lock:
            state.history.append({'kind': 'direct-exit', 'pid': child.pid, 'birth': birth,
                                  'exit_code': code})
            roots.pop(child.pid, None)
            children.pop(child.pid, None)
        import_worker_failure()
        if code:
            code = code if code > 0 else 128 - code
            fail(stage[0], 'command exited ' + str(code), code)
        event('command-end', code=code)
        if code:
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
                   'python': seal['runtime']['python']['path'], 'nonce': secrets.token_hex(32),
                   'absolute_deadline_utc': args.deadline_utc}
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
        observer_quiet = quiesce_observer()
        audit = final_audit(observer_quiet)
        code = finalize('PASS', audit=audit, observer_quiet=observer_quiet)
    except BaseException as error:
        # An exclusively published worker failure is imported before generic
        # command/cleanup failures, including structured JSON detail.
        code = error.code if isinstance(error, Failed) else 1
        fail(stage[0], str(error), code)
        try:
            flush_failure()
        except BaseException as receipt_error:
            state.request_stop('failure-receipt', str(receipt_error), 124)
        observer_quiet = quiesce_observer()
        for sig in (signal.SIGTERM, signal.SIGKILL):
            try:
                if observer_quiet:
                    terminate(sig)
                else:
                    signal_bound(sig)
            except BaseException as cleanup_error:
                state.request_stop('cleanup', str(cleanup_error), 124)
            if sig == signal.SIGTERM:
                threading.Event().wait(min(0.4, max(0.0, deadline - time.monotonic())))
        audit = final_audit(observer_quiet)
        flush_failure()
        code = finalize('FAILED', str(error), audit, observer_quiet)
    finally:
        done.set()
        os.fsync(stream)
        os.close(stream)
        os.close(events)
    return code


if __name__ == '__main__':
    os._exit(main())

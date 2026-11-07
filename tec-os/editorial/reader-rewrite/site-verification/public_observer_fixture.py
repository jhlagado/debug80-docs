#!/usr/bin/env python3
"""Allocated Q15/Q16 public-runner fixtures, never book validation.

Source preparation only until fixture-inputs.json has exact reviewed candidate
hashes and a separate allocation. This module imports no packet/product code.
The public runner starts the one actual memory guard; do not wrap this command
in another guard. Preparation and postflight share the controller's 60 seconds.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import threading
import time


ENTRY_WALL = time.time()
ENTRY_MONO = time.monotonic()
IDENTITY_ENV = {'TZ': 'UTC', 'LC_ALL': 'C', 'LANG': 'C'}
SCOPE = 'UNQUALIFIED_PUBLIC_RUNNER_FIXTURE_NOT_BOOK_ACCEPTANCE'

# Node built-ins only. The production worker launches this at the normal build
# command path after ACK. It never imports VitePress or writes source inputs.
STUB_JS = r'''const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const output = path.dirname(process.cwd());
const context = JSON.parse(fs.readFileSync(path.join(output, 'context.json')));
const marker = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'node_modules/fixture-case.json')));
const ownershipPath = path.join(output, 'job-ownership.json');
const bytes = fs.readFileSync(ownershipPath);
const ownership = JSON.parse(bytes);
const ack = JSON.parse(fs.readFileSync(path.join(output, 'job-ack.json')));
const digest = crypto.createHash('sha256').update(bytes).digest('hex');
if (marker.scope !== 'UNQUALIFIED_PUBLIC_RUNNER_FIXTURE_NOT_BOOK_ACCEPTANCE' ||
    context.output !== output || context.source !== process.cwd() ||
    ownership.nonce !== context.nonce || ack.nonce !== context.nonce ||
    ack.ownership_sha256 !== digest || process.argv[2] !== 'build') {
  throw new Error('fixture requires the actual public-worker ACK');
}
function write(name, value) {
  const fd = fs.openSync(path.join(output, name), 'wx', 0o600);
  try { fs.writeFileSync(fd, JSON.stringify(value) + '\n'); fs.fsyncSync(fd); }
  finally { fs.closeSync(fd); }
}
write('fixture-started.json', {scope: marker.scope, case: marker.case,
  pid: process.pid, parent_pid: process.ppid, original_ownership: ownership,
  original_ownership_sha256: digest, ack: ack});
if (marker.case === 'Q15') {
  console.log('UNQUALIFIED Q15 node stub completed; no VitePress/render');
} else if (marker.case === 'Q16') {
  const replacement = {...ownership, nonce: ownership.nonce + '-fixture-corruption'};
  const temporary = ownershipPath + '.fixture-temporary';
  const fd = fs.openSync(temporary, 'wx', 0o600);
  try { fs.writeFileSync(fd, JSON.stringify(replacement) + '\n'); fs.fsyncSync(fd); }
  finally { fs.closeSync(fd); }
  fs.renameSync(temporary, ownershipPath);
  write('fixture-injection.json', {scope: marker.scope, case: marker.case,
    changed_field: 'nonce', old: ownership.nonce, new: replacement.nonce,
    after_ack: true, original_ownership_sha256: digest});
  console.log('UNQUALIFIED Q16 private nonce corrupted after ACK; blocking');
  setInterval(() => {}, 1000);
} else { throw new Error('unknown fixture case'); }
'''

# Only a test double at the fixture packet path. It deliberately does not inspect
# HTML or manufacture the real checker's document/link/fence count fields.
CHECKER_DOUBLE = r'''"""UNQUALIFIED fixture receipt writer; no HTML validation."""
import argparse
import json
import os
from pathlib import Path
p = argparse.ArgumentParser()
for name in ('expect', 'dist', 'receipt'):
    p.add_argument('--' + name, required=True)
a = p.parse_args()
value = {'status': 'passed', 'fixture_only': True,
         'scope': 'UNQUALIFIED_PUBLIC_RUNNER_FIXTURE_NOT_BOOK_ACCEPTANCE',
         'checked': {}, 'real_html_validation': False}
with Path(a.receipt).open('x') as f:
    f.write(json.dumps(value) + '\n')
    f.flush()
    os.fsync(f.fileno())
print('UNQUALIFIED fixture receipt only; no book validation')
'''
FIXTURE_README = (SCOPE + '\nPublic runner integration only. Actual Node and guard; '
                  'synthetic installed dependencies and checker.\n'
                  'The carried 39 expectations and 48 checker controls are unchanged '
                  'reference inputs, not results of this fixture.\n')
FIXTURE_INVOKE = '#!/bin/sh\necho "Use the allocated public_observer_fixture.py CLI" >&2\nexit 2\n'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def digest(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1048576), b''):
            h.update(block)
    return h.hexdigest()


def canonical(value):
    return (json.dumps(value, sort_keys=True, separators=(',', ':'),
                       ensure_ascii=False) + '\n').encode()


def write_json(path, value, exclusive=False):
    path = Path(path)
    if exclusive:
        with path.open('xb') as stream:
            stream.write(canonical(value))
            stream.flush()
            os.fsync(stream.fileno())
    else:
        temporary = path.with_name(path.name + '.pending')
        with temporary.open('xb') as stream:
            stream.write(canonical(value))
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)


def require(condition, detail):
    if not condition:
        raise ValueError(detail)


def dependency_identity(root):
    rows = []
    for path in sorted(root.rglob('*')):
        require(not path.is_symlink(), 'synthetic dependencies cannot have symlinks')
        if path.is_file():
            rows.append({'path': path.relative_to(root).as_posix(), 'kind': 'file',
                         'bytes': path.stat().st_size, 'sha256': digest(path),
                         'executable': bool(path.stat().st_mode & 0o111)})
    return {'entries': rows, 'sha256': sha(canonical(rows))}


def snapshot(handles, queries, hard_end):
    """One real query, never a retry. Keep its Popen handle through postflight."""
    budget = min(0.5, max(0.0, hard_end - time.monotonic()))
    require(budget > 0, 'no independent identity-query budget')
    argv = ['/bin/ps', '-axo', 'pid=,ppid=,pgid=,lstart=']
    started = time.monotonic()
    query_end = min(hard_end, started + budget)
    query = {'argv': argv, 'budget_seconds': budget, 'start_monotonic': started,
             'outcome': 'NOT_COMPLETED', 'retry': False, 'environment': IDENTITY_ENV}
    queries.append(query)
    child = subprocess.Popen(argv, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                             text=True, env={**os.environ, **IDENTITY_ENV})
    handles.append((argv, child))
    query['pid'] = child.pid
    try:
        stdout, stderr = child.communicate(timeout=max(0.0, query_end - time.monotonic()))
    except subprocess.TimeoutExpired as error:
        # This is our direct query handle, not authority over any numeric PID.
        child.kill()
        try:
            child.wait(timeout=max(0.0, query_end - time.monotonic()))
            query['reap'] = 'REAPED'
        except subprocess.TimeoutExpired:
            query['reap'] = 'PENDING_UNKNOWN_HELD'
        def decoded(value):
            return value.decode(errors='replace') if isinstance(value, bytes) else value
        query.update(outcome='TIMEOUT_UNKNOWN_HELD', end_monotonic=time.monotonic(),
                     partial_stdout=decoded(error.output), partial_stderr=decoded(error.stderr),
                     returncode=child.returncode)
        raise ValueError('independent identity snapshot unavailable; no retry')
    query.update(outcome='RETURNED', end_monotonic=time.monotonic(), stdout=stdout,
                 stderr=stderr, returncode=child.returncode, reap='REAPED')
    require(child.returncode == 0 and not stderr, 'identity query failed')
    rows = []
    for line in stdout.splitlines():
        if line.strip():
            pid, parent, group, birth = line.split(None, 3)
            rows.append({'pid': int(pid), 'parent_pid': int(parent),
                         'pgid': int(group), 'birth': birth.strip()})
    query.update(outcome='OK', rows=rows, stdout_sha256=sha(stdout.encode()))
    return query


def read_json(path):
    return json.loads(Path(path).read_text())


def copy_approved(source, destination, expected):
    """Authenticate one read, copy those bytes, then authenticate the copy."""
    data = Path(source).read_bytes()
    require(sha(data) == expected, 'source changed before copy: ' + str(source))
    Path(destination).write_bytes(data)
    require(digest(destination) == expected, 'approved copy changed: ' + str(destination))


def prepare(binding, work, case):
    """Materialise an isolated fixture seal; never call the book preparer."""
    book = Path(binding['book_packet'])
    candidate = Path(binding['candidate_packet'])
    seal_bytes = (book / 'seal.json').read_bytes()
    require(sha(seal_bytes) == binding['book_seal_sha256'], 'book baseline changed')
    original_seal = json.loads(seal_bytes)
    require(digest(__file__) == binding['harness_sha256'], 'fixture harness changed')
    require(set(binding['candidate_payloads']) == {'run_once.py', 'build_and_check.py'},
            'unexpected candidate payload set')
    require(original_seal['source_revision'] == binding['source_revision'], 'source pin changed')
    require(original_seal['source_archive_sha256'] == binding['source_archive_sha256']
            and original_seal['source_archive_bytes'] == binding['source_archive_bytes'],
            'frozen export identity changed')
    require(original_seal['runtime'] == binding['runtime']
            and original_seal['guard'] == binding['guard'], 'runtime/guard binding changed')
    require(original_seal['policy'] == binding['guard_policy'], 'fixture policy changed')
    require(sha(STUB_JS.encode()) == binding['generated_sources']['node_stub_sha256']
            and sha(CHECKER_DOUBLE.encode()) == binding['generated_sources']['checker_test_double_sha256'],
            'fixture test-double source binding changed')
    for name, expected in binding['candidate_payloads'].items():
        require(isinstance(expected, str) and len(expected) == 64,
                'candidate hash pending review: ' + name)
        require(digest(candidate / name) == expected, 'candidate payload changed: ' + name)
    for name, expected in original_seal['payload'].items():
        require(digest(book / name) == expected, 'baseline payload changed: ' + name)
    for runtime in original_seal['runtime'].values():
        require(digest(runtime['path']) == runtime['sha256'], 'runtime identity changed')
    require(Path(sys.executable).resolve() == Path(original_seal['runtime']['python']['path']),
            'use the pinned Python executable')
    require(not os.environ.get('ORIGO_GUARD'), 'no outer or nested memory guard')
    require(digest(original_seal['guard']['path']) == original_seal['guard']['sha256'],
            'actual pinned guard changed')
    packet = work / 'fixture-packet'
    packet.mkdir()
    for name, expected in original_seal['payload'].items():
        copy_approved(book / name, packet / name, expected)
    for name, expected in binding['candidate_payloads'].items():
        copy_approved(candidate / name, packet / name, expected)
    approved_payload = {**original_seal['payload'], **binding['candidate_payloads']}
    (packet / 'check_html.py').write_text(CHECKER_DOUBLE)
    (packet / 'README.md').write_text(FIXTURE_README)
    (packet / 'invoke.sh').write_text(FIXTURE_INVOKE)
    approved_payload.update({'check_html.py': sha(CHECKER_DOUBLE.encode()),
                             'README.md': sha(FIXTURE_README.encode()),
                             'invoke.sh': sha(FIXTURE_INVOKE.encode())})
    dependencies = work / 'synthetic-node_modules'
    (dependencies / 'vitepress/bin').mkdir(parents=True)
    (dependencies / 'vitepress/bin/vitepress.js').write_text(STUB_JS)
    write_json(dependencies / 'vitepress/package.json', {
        'name': 'unqualified-public-observer-fixture', 'private': True,
        'type': 'commonjs'}, True)
    write_json(dependencies / 'fixture-case.json', {'scope': SCOPE, 'case': case}, True)
    installed = dependency_identity(dependencies)
    write_json(packet / 'installed-inputs.json', installed)
    dependency_manifest = {
        'scope': SCOPE, 'no_vitepress_or_renderer': True,
        'synthetic_tree_sha256': installed['sha256']}
    write_json(packet / 'dependency-manifests.json', dependency_manifest)
    approved_payload.update({'installed-inputs.json': sha(canonical(installed)),
                             'dependency-manifests.json': sha(canonical(dependency_manifest))})
    seal = json.loads(json.dumps(original_seal))
    seal.update(status='UNQUALIFIED_FIXTURE_UNRUN', fixture_scope=SCOPE, fixture_case=case,
                installed_root=str(dependencies), installed_entries=len(installed['entries']),
                installed_identity=installed['sha256'],
                claim_directory=binding['fixture_claim_directory'])
    seal['payload'] = {name: digest(packet / name) for name in original_seal['payload']}
    require(seal['payload'] == approved_payload,
            'fixture payload changed outside the explicit approved overrides; refuse seal')
    differences = {name: {'book': old, 'fixture': seal['payload'][name]}
                   for name, old in original_seal['payload'].items()
                   if seal['payload'][name] != old}
    require(set(differences) == set(binding['differing_payloads']),
            'unexpected or missing fixture payload difference')
    write_json(packet / 'seal.json', seal, True)
    write_json(work / 'fixture-differences.json', {
        'scope': SCOPE, 'case': case, 'payloads': differences,
        'seal_fields_changed': ['status', 'fixture_scope', 'fixture_case', 'installed_root',
                                'installed_entries', 'installed_identity', 'claim_directory', 'payload'],
        'book_expectations_and_48_control_report_unchanged': True}, True)
    return packet, seal


def independent_audit(output, child, first_snapshot, final_snapshot):
    """Resolve only the retained fixture scope. Never signal from these rows."""
    started = read_json(output / 'fixture-started.json')
    original = started['original_ownership']
    context = read_json(output / 'context.json')
    ack = read_json(output / 'job-ack.json')
    require(started['scope'] == SCOPE and original['nonce'] == context['nonce'],
            'fixture original declaration is not bound to context')
    require(original['context_sha256'] == digest(output / 'context.json'), 'context hash mismatch')
    require(ack == started['ack'] and ack == {'nonce': original['nonce'],
            'ownership_sha256': started['original_ownership_sha256']}, 'original ACK mismatch')
    require(original['pid'] == original['pgid'] == started['parent_pid'], 'worker/stub binding mismatch')
    require(original['parent_pid'] == original['guard_pid'], 'guard/worker binding mismatch')
    # Retained direct root, actual ACK group and exact fixture stub identifiers.
    # A reused PID is conservatively unresolved here; it is never kill authority.
    known_pids = {child.pid, original['guard_pid'], original['pid'], started['pid']}
    groups = {child.pid, original['pgid']}
    registry = read_json(output / 'owned-process-audit.json')['registry']
    require(isinstance(registry['history'], list), 'candidate ownership history absent')
    require(registry['accepted_ownership_sha256'] == started['original_ownership_sha256'],
            'candidate registry does not bind the original ACK receipt')
    for item in registry['history']:
        if item['kind'] in ('direct-child', 'direct-birth', 'ack-group', 'exit-or-reuse'):
            known_pids.add(int(item['pid']))
            if item['kind'] in ('direct-child', 'ack-group'):
                groups.add(int(item['pid']))
        elif item['kind'] == 'discovered':
            known_pids.add(int(item['identity'][0]))
    known_pids.update(int(pid) for pid in registry['roots'])
    known_pids.update(int(pid) for pid in registry['observed'])
    groups.update(int(group) for group in registry['groups'])
    known_rows = [r for r in first_snapshot['rows'] if r['pid'] in known_pids]
    changed = True
    while changed:
        changed = False
        for row in first_snapshot['rows']:
            if row['pid'] not in known_pids and (row['parent_pid'] in known_pids or row['pgid'] in groups):
                known_pids.add(row['pid'])
                known_rows.append(row)
                changed = True
    final_pids = set(known_pids)
    changed = True
    while changed:
        changed = False
        for row in final_snapshot['rows']:
            if row['pid'] not in final_pids and (row['parent_pid'] in final_pids or row['pgid'] in groups):
                final_pids.add(row['pid'])
                changed = True
    remaining = [r for r in final_snapshot['rows'] if r['pid'] in final_pids]
    return {'scope': SCOPE, 'status': 'RESOLVED_RETAINED_SCOPE' if not remaining else 'UNKNOWN_HELD',
            'direct_runner_pid': child.pid, 'direct_runner_returncode': child.returncode,
            'acknowledged_group': original['pgid'], 'original_worker_birth': original['birth'],
            'known_pids': sorted(known_pids), 'early_known_identities': known_rows,
            'runner_audit_sha256': digest(output / 'owned-process-audit.json'),
            'remaining': remaining, 'signals_sent_from_numeric_pid_observations': False,
            'limits': 'Known direct-root/ACK-group/stub scope, candidate observed history and snapshot closure only; '
                      'not a complete historical descendant census or universal cleanup guarantee.'}


def main():
    hard_end = ENTRY_MONO + 60
    runner_end = hard_end - 5
    def controller_cutoff():
        # The inner public runner has its own earlier hard cutoff. Do not turn
        # a stalled controller receipt write into extra allocation time. A forced
        # exit leaves incomplete evidence/UNKNOWN_HELD, never fixture acceptance.
        threading.Event().wait(max(0.0, hard_end - time.monotonic()))
        os._exit(124)
    threading.Thread(target=controller_cutoff, daemon=True).start()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--case', choices=('Q15', 'Q16'), required=True)
    parser.add_argument('--binding', type=Path, required=True)
    parser.add_argument('--binding-sha256', required=True)
    parser.add_argument('--work', type=Path, required=True)
    parser.add_argument('--result', type=Path, required=True)
    parser.add_argument('--allocation', required=True)
    args = parser.parse_args()
    binding_bytes = args.binding.read_bytes()
    require(len(args.binding_sha256) == 64
            and all(c in '0123456789abcdef' for c in args.binding_sha256)
            and sha(binding_bytes) == args.binding_sha256,
            'external reviewed binding SHA-256 mismatch; no JSON or payload adapter used')
    binding = json.loads(binding_bytes)
    require(args.allocation.strip() and not any(s in args.allocation for s in ('<', '>', 'UNALLOCATED'))
            and binding['scope'] == SCOPE, 'explicit nonplaceholder fixture allocation required')
    for name, value in binding['candidate_payloads'].items():
        require(isinstance(value, str) and len(value) == 64
                and all(c in '0123456789abcdef' for c in value),
                'candidate identity still pending: ' + name)
    require(binding['controller_seconds'] == 60 and binding['postflight_reserved_seconds'] == 5,
            'fixture deadline policy changed')
    # This UTC cutoff already includes controller preparation, not 55 new seconds
    # after setup. Five further seconds are reserved inside the same 60 for audit.
    deadline = datetime.fromtimestamp(ENTRY_WALL + 55, timezone.utc).isoformat()
    work = args.work.absolute()
    result = args.result.absolute()
    require(not work.exists() and not result.exists(), 'fresh work and result paths required')
    require(result.parent.is_dir(), 'result parent must already exist')
    work.mkdir(mode=0o700, parents=False)
    record = {'scope': SCOPE, 'case': args.case, 'status': 'RUNNING_UNQUALIFIED',
              'allocation': args.allocation, 'binding_sha256': args.binding_sha256,
              'controller_seconds': 60, 'runner_deadline_utc': deadline,
              'real_book_acceptance': False, 'retry': False}
    write_json(result, record, True)
    handles = []
    queries = []
    runner = None
    output = work / 'actual-public-output'
    try:
        packet, seal = prepare(binding, work, args.case)
        require(digest(args.binding) == args.binding_sha256, 'binding changed during preparation')
        require(time.monotonic() < runner_end - 5, 'preparation consumed runner launch budget')
        argv = [seal['runtime']['python']['path'], '-S', '-B', str(packet / 'run_once.py'),
                '--packet', str(packet), '--seal-sha256', digest(packet / 'seal.json'),
                '--output', str(output), '--allocation', args.allocation, '--deadline-utc', deadline]
        record.update(argv=argv, fixture_seal_sha256=digest(packet / 'seal.json'))
        write_json(result, record)
        with (work / 'public-command.log').open('xb') as log:
            runner = subprocess.Popen(argv, stdin=subprocess.DEVNULL, stdout=log,
                                      stderr=subprocess.STDOUT, start_new_session=True,
                                      env={**os.environ, **IDENTITY_ENV, 'PYTHONDONTWRITEBYTECODE': '1'})
            handles.append((argv, runner))
            early = snapshot(handles, queries, hard_end)
            write_json(work / 'independent-initial-snapshot.json', early, True)
            runner.wait(timeout=max(0.001, runner_end - time.monotonic() + 0.5))
            log.flush()
            os.fsync(log.fileno())
        final = snapshot(handles, queries, hard_end)
        write_json(work / 'independent-final-snapshot.json', final, True)
        audit = independent_audit(output, runner, early, final)
        write_json(work / 'independent-owned-scope-audit.json', audit, True)
        require(audit['status'] == 'RESOLVED_RETAINED_SCOPE', 'independent fixture scope unresolved')
        terminal = read_json(output / 'terminal.json')
        owned = read_json(output / 'owned-process-audit.json')
        if args.case == 'Q15':
            require(runner.returncode == terminal['exit_code'] == 0 and terminal['status'] == 'PASS',
                    'Q15 needs actual public command zero and PASS terminal')
            require(owned.get('remaining') == [] and owned.get('status') == 'CLEAR',
                    'Q15 needs fresh successful empty runner audit')
            require((output / 'source-after.json').is_file(), 'Q15 input postflight missing')
            require(not (output / 'first-failure.json').exists(), 'Q15 first failure exists')
            checker = read_json(output / 'checker.json')
            require(checker.get('fixture_only') is True and checker.get('status') == 'passed',
                    'Q15 fixture checker receipt missing')
        else:
            failure = read_json(output / 'first-failure.json')
            injection = read_json(output / 'fixture-injection.json')
            started = read_json(output / 'fixture-started.json')
            original = started['original_ownership']
            tampered_bytes = (output / 'job-ownership.json').read_bytes()
            tampered = json.loads(tampered_bytes)
            expected_tamper = {**original, 'nonce': original['nonce'] + '-fixture-corruption'}
            require(injection == {'scope': SCOPE, 'case': 'Q16', 'changed_field': 'nonce',
                                  'old': original['nonce'], 'new': expected_tamper['nonce'],
                                  'after_ack': True,
                                  'original_ownership_sha256': started['original_ownership_sha256']}
                    and started['case'] == 'Q16' and tampered == expected_tamper,
                    'Q16 must retain the exact nonce-only injection after its actual ACK')
            require(runner.returncode == terminal['exit_code'] == failure['exit_code'] == 124,
                    'Q16 must preserve actual first observer failure 124')
            # The corrected observer rejects changed receipt bytes before
            # interpreting nonce/PID/group fields. Bind that exact typed cause
            # and both real receipt hashes, not an arbitrary error substring.
            expected_detail = {'message': 'job ownership receipt hash mismatch',
                               'expected_sha256': started['original_ownership_sha256'],
                               'observed_sha256': sha(tampered_bytes)}
            require(terminal['status'] == 'FAILED' and failure['stage'] == 'identity-observation'
                    and failure['detail'] == expected_detail
                    and expected_detail['expected_sha256'] != expected_detail['observed_sha256'],
                    'Q16 needs the specific post-ACK receipt-integrity failure, not a query/deadline error')
            require(owned.get('status') == 'UNKNOWN_HELD',
                    'Q16 corrupted declaration requires UNKNOWN_HELD runner audit')
            require(not (output / 'checker.json').exists(), 'Q16 later fixture validation ran')
        record.update(status='EXPECTED_FIXTURE_OUTCOME', actual_exit_status=runner.returncode,
                      terminal=terminal, runner_audit=owned, independent_audit=audit)
    except Exception as error:
        # No arbitrary PID/group rescue. Retain unresolved scope for independent
        # disposition if even the public runner's own hard deadline fails.
        record.update(status='FAILED_OR_UNKNOWN_HELD', error=str(error),
                      actual_exit_status=runner.returncode if runner else None)
        if runner is not None:
            cleanup = {'scope': 'direct_runner_Popen_handle_only',
                       'term_requested': False, 'reap': 'PENDING_UNKNOWN_HELD'}
            record['exception_runner_cleanup'] = cleanup
            try:
                if runner.poll() is None:
                    runner.terminate()
                    cleanup['term_requested'] = True
            except OSError as signal_error:
                cleanup['termination_error'] = {
                    'type': type(signal_error).__name__, 'message': str(signal_error)}
            # Leave receipt time inside the original60; do not grant a fresh
            # interval or wait beyond the controller's independent hard cutoff.
            remaining = max(0.0, hard_end - time.monotonic())
            budget = max(0.0, remaining - 0.5)
            cleanup.update(wait_budget_seconds=budget,
                           controller_seconds_remaining=remaining)
            try:
                runner.wait(timeout=budget)
                cleanup['reap'] = 'REAPED'
            except subprocess.TimeoutExpired:
                cleanup['timeout'] = True
            except OSError as reap_error:
                cleanup['reap_error'] = {
                    'type': type(reap_error).__name__, 'message': str(reap_error)}
            cleanup['returncode'] = runner.returncode
            record['actual_exit_status'] = runner.returncode
    finally:
        record['identity_queries'] = queries
        record['child_handles'] = [{'argv': argv, 'pid': child.pid,
                                    'returncode': child.poll()} for argv, child in handles]
        record['elapsed_seconds'] = time.monotonic() - ENTRY_MONO
        record['controller_deadline_exceeded'] = time.monotonic() > hard_end
        if record['controller_deadline_exceeded'] or any(x['returncode'] is None for x in record['child_handles']):
            record['status'] = 'FAILED_OR_UNKNOWN_HELD'
        write_json(result, record)
    return 0 if record['status'] == 'EXPECTED_FIXTURE_OUTCOME' else 1


if __name__ == '__main__':
    sys.exit(main())

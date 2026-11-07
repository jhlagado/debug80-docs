"""Exactly one build followed by one checker, inside the memory guard."""
import argparse
from datetime import datetime
import json
from pathlib import Path
import subprocess
import sys
import os
import time
from packet_inputs import digest
from packet_inputs import durable_json, first_failure
PS_IDENTITY_ENV = {'TZ': 'UTC', 'LC_ALL': 'C', 'LANG': 'C'}


def phase_stop_code(output):
    """A visible stop is nonzero; an unpublished parent latch is not visible."""
    for name in ('stop-requested.json', 'first-failure.json'):
        path = output / name
        if path.exists():
            try:
                code = int(json.loads(path.read_text()).get('exit_code', 1))
                return code if 1 <= code <= 255 else 1
            except (OSError, ValueError, TypeError, AttributeError, OverflowError):
                return 1
    return None


def worker_identity_budget(context, wall_now):
    """Use the bound UTC deadline, not another process's monotonic origin."""
    deadline = datetime.fromisoformat(context['absolute_deadline_utc'].replace('Z', '+00:00'))
    if deadline.utcoffset() is None or deadline.utcoffset().total_seconds() != 0:
        raise ValueError('worker deadline must be UTC')
    return min(2.0, max(0.0, deadline.timestamp() - wall_now - 3.0))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--context', required=True)
    args = parser.parse_args()
    context = json.loads(Path(args.context).read_text())
    output = Path(context['output'])
    # No build child starts until the outer invocation has durably bound this
    # detached group. The guard may die before an ancestry poll sees it.
    stop_code = phase_stop_code(output)
    if stop_code is not None:
        return stop_code
    budget = worker_identity_budget(context, time.time())
    if budget <= 0:
        first_failure(output, 'absolute-deadline', 'no worker identity-query budget remains', 124)
        return 124
    query_started = time.monotonic()
    try:
        birth = subprocess.check_output(['/bin/ps', '-o', 'lstart=', '-p', str(os.getpid())],
                                        text=True, timeout=budget,
                                        env={**os.environ, **PS_IDENTITY_ENV}).strip()
    except (subprocess.SubprocessError, OSError, ValueError) as error:
        detail = {'message': str(error), 'query_error': type(error).__name__,
                  'effective_budget_seconds': budget,
                  'elapsed_seconds': time.monotonic() - query_started}
        first_failure(output, 'ownership-observation', detail, 124)
        return 124
    query_elapsed = time.monotonic() - query_started
    ownership = {'nonce': context['nonce'], 'context_sha256': digest(args.context),
                 'pid': os.getpid(), 'pgid': os.getpgrp(), 'birth': birth,
                 'parent_pid': os.getppid(), 'guard_pid': int(os.environ['ORIGO_GUARD'])}
    ownership['birth_environment'] = PS_IDENTITY_ENV
    ownership['identity_query_budget_seconds'] = budget
    ownership['identity_query_elapsed_seconds'] = query_elapsed
    if ownership['pid'] != ownership['pgid'] or not birth:
        first_failure(output, 'ownership', 'guard did not create a dedicated job group', 1)
        return 1
    ownership_path = output / 'job-ownership.json'
    durable_json(ownership_path, ownership, exclusive=True)
    until = time.monotonic() + worker_identity_budget(context, time.time())
    ack_path = output / 'job-ack.json'
    while not ack_path.exists() and time.monotonic() < until:
        stop_code = phase_stop_code(output)
        if stop_code is not None:
            return stop_code
        time.sleep(0.02)
    stop_code = phase_stop_code(output)
    if stop_code is not None:
        return stop_code
    if not ack_path.exists():
        first_failure(output, 'ownership', 'outer ownership acknowledgement missing', 1)
        return 1
    ack = json.loads(ack_path.read_text())
    if ack != {'nonce': context['nonce'], 'ownership_sha256': digest(ownership_path)}:
        first_failure(output, 'ownership', 'outer ownership acknowledgement differs', 1)
        return 1
    commands = [
        ('build', [context['node'], str(Path(context['source']) /
                    'node_modules/vitepress/bin/vitepress.js'), 'build']),
        ('validate', [context['python'], '-S', '-B', str(Path(context['packet']) /
                     'check_html.py'), '--expect', str(Path(context['packet']) /
                     'expectations.json'), '--dist', str(Path(context['source']) /
                     '.vitepress/dist'), '--receipt', str(output / 'checker.json')])]
    for phase, command in commands:
        stop_code = phase_stop_code(output)
        if stop_code is not None:
            return stop_code
        durable_json(output / (phase + '-started.json'), {'argv': command}, exclusive=True)
        print('SITE_PHASE ' + phase + ' START', flush=True)
        result = subprocess.run(command, cwd=context['source'], stdin=subprocess.DEVNULL)
        code = result.returncode if result.returncode >= 0 else 128 - result.returncode
        durable_json(output / (phase + '-ended.json'), {'exit_code': code}, exclusive=True)
        print('SITE_PHASE ' + phase + ' END ' + str(code), flush=True)
        if code:
            first_failure(output, phase, 'first nonzero command result', code)
            return code
    receipt = json.loads((output / 'checker.json').read_text())
    if receipt.get('status') != 'passed':
        first_failure(output, 'validate', 'checker has no passed receipt', 1)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())

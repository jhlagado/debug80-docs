"""Exactly one build followed by one checker, inside the memory guard."""
import argparse
import json
from pathlib import Path
import subprocess
import sys
import os
import time
from packet_inputs import digest
from packet_inputs import durable_json, first_failure


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--context', required=True)
    args = parser.parse_args()
    context = json.loads(Path(args.context).read_text())
    output = Path(context['output'])
    # No build child starts until the outer invocation has durably bound this
    # detached group. The guard may die before an ancestry poll sees it.
    birth = subprocess.check_output(['/bin/ps', '-o', 'lstart=', '-p', str(os.getpid())],
                                    text=True, timeout=0.5).strip()
    ownership = {'nonce': context['nonce'], 'context_sha256': digest(args.context),
                 'pid': os.getpid(), 'pgid': os.getpgrp(), 'birth': birth,
                 'parent_pid': os.getppid(), 'guard_pid': int(os.environ['ORIGO_GUARD'])}
    if ownership['pid'] != ownership['pgid'] or not birth:
        first_failure(output, 'ownership', 'guard did not create a dedicated job group', 1)
        return 1
    ownership_path = output / 'job-ownership.json'
    durable_json(ownership_path, ownership, exclusive=True)
    until = time.monotonic() + 2
    ack_path = output / 'job-ack.json'
    while not ack_path.exists() and time.monotonic() < until:
        time.sleep(0.02)
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
        if (output / 'first-failure.json').exists():
            return json.loads((output / 'first-failure.json').read_text())['exit_code']
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

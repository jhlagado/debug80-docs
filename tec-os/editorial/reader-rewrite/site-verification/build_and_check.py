"""Exactly one build followed by one checker, inside the memory guard."""
import argparse
import json
from pathlib import Path
import subprocess
import sys
from packet_inputs import durable_json, first_failure


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--context', required=True)
    args = parser.parse_args()
    context = json.loads(Path(args.context).read_text())
    output = Path(context['output'])
    commands = [
        ('build', [context['node'], str(Path(context['source']) /
                    'node_modules/vitepress/bin/vitepress.js'), 'build']),
        ('validate', [context['python'], '-B', str(Path(context['packet']) /
                     'check_html.py'), '--expect', str(Path(context['packet']) /
                     'expectations.json'), '--dist', str(Path(context['source']) /
                     '.vitepress/dist'), '--receipt', str(output / 'checker.json')])]
    for phase, command in commands:
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
    if receipt.get('status') != 'PASS':
        first_failure(output, 'validate', 'checker has no PASS receipt', 1)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())

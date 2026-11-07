#!/usr/bin/env python3
"""Allocated Q01-Q14 controls of actual runner routines; never a site invocation.

Source preparation does not import the candidate. Runtime imports require an
allocation-bound input digest and verified private copies of every module.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import math
import os
from pathlib import Path
import re
import signal
import subprocess
import sys
import threading
import time
from types import ModuleType, SimpleNamespace

ENTRY = time.monotonic()
HERE = Path(__file__).resolve().parent
CASE_IDS = tuple('Q%02d' % i for i in range(1, 15))


class Unavailable(Exception):
    pass


def check(value, message):
    if not value:
        raise AssertionError(message)


def close(actual, expected):
    check(math.isclose(actual, expected, rel_tol=0, abs_tol=1e-8),
          'numeric mismatch: %r != %r' % (actual, expected))


def sha(data):
    return hashlib.sha256(data).hexdigest()


def require_sha(value, label):
    check(isinstance(value,str) and re.fullmatch(r'[0-9a-f]{64}',value) is not None,
          'expected exact 64-character SHA-256: '+label)


def save_new(path, value):
    with path.open('x', encoding='utf-8') as stream:
        stream.write(json.dumps(value, indent=2, ensure_ascii=False)+'\n')
        stream.flush()
        os.fsync(stream.fileno())


class Clock:
    def __init__(self, now=167.0):
        self.now = now

    def __call__(self):
        return self.now

    def advance(self, elapsed):
        self.now += elapsed


class Record:
    def __init__(self, hook=None):
        self.rows = []
        self.hook = hook

    def __call__(self, kind, **fields):
        self.rows.append(dict(kind=kind, **fields))
        if self.hook:
            self.hook(kind, fields)


class Query:
    """Only an injected query adapter: launch callback owns all budget decisions."""
    def __init__(self, clock, rows, elapsed=0.6, fail=False):
        self.clock, self.rows, self.elapsed, self.fail = clock, rows, elapsed, fail
        self.budgets = []

    def __call__(self, launch):
        def spawn(budget):
            self.budgets.append(budget)
            return object()  # No process is created.
        launch(spawn)
        self.clock.advance(self.elapsed)
        if self.fail:
            raise subprocess.TimeoutExpired('synthetic-query', self.budgets[-1])
        return self.rows


def expect_failed(module, action):
    try:
        action()
    except module.Failed as error:
        check(error.code == 124, 'expected typed failure124')
        return
    raise AssertionError('candidate did not raise Failed124')


def identities():
    context = dict(nonce='synthetic-nonce', sha256='a'*64)
    owner = dict(nonce=context['nonce'], context_sha256=context['sha256'],
                 birth_environment=dict(TZ='UTC', LC_ALL='C', LANG='C'),
                 pid=4102, pgid=4102, parent_pid=4101, guard_pid=4101,
                 birth='Mon Jan  5 00:00:02 2026')
    rows = [(4101, 1, 4101, 'Mon Jan  5 00:00:01 2026'),
            (4102, 4101, 4102, owner['birth']),
            (4103, 4102, 4102, 'Mon Jan  5 00:00:03 2026')]
    return context, owner, rows


def state_at(module, now=167.0):
    clock = Clock(now)
    return module.InvocationState(180.0, clock=clock), clock


def acknowledge(state):
    published = []
    state.publish_ack(lambda: 'prepared', published.append)
    check(published == ['prepared'] and state.acknowledged, 'actual ACK publication failed')


def signals(state):
    calls = []
    for sig in (signal.SIGTERM, signal.SIGKILL):
        state.signal_bound(sig, lambda group, s:calls.append(['group', group, int(s)]),
                           lambda child, s:calls.append(['handle', child.pid, int(s)]))
    return calls


def q01(m, worker, work, inputs):
    state, clock = state_at(m)
    context, owner, rows = identities()
    query, record = Query(clock, rows), Record()
    close(m.query_budget(clock(), 177, 180), 2)
    check(state.query(query, record) == rows, 'actual query rows differ')
    check(query.budgets == [2.0], 'query was retried or budget differs')
    finished = record.rows[-1]
    close(finished['elapsed'], 0.6)
    check(finished['exceeded_old_half_second'] is True, 'old-bound overrun not recorded')
    check(m.validate_ownership(owner, context, rows, True) == [], 'valid ownership rejected')
    state.bind_group(owner)
    check(state.observe(rows) == rows[1:], 'actual ownership closure differs')
    return dict(routines=['query_budget','InvocationState.query','validate_ownership',
                          'InvocationState.bind_group','InvocationState.observe'], events=record.rows)


def q02(m, worker, work, inputs):
    state, clock = state_at(m)
    _, owner, rows = identities()
    state.bind_group(owner)
    query, record = Query(clock, rows, elapsed=2.01, fail=True), Record()
    expect_failed(m, lambda:state.query(query, record))
    check(query.budgets == [2.0], 'timeout query launch/retry differs')
    check(state.failure['stage']=='identity-observation' and state.failure['exit_code']==124,
          'typed observation failure not preserved')
    check(state.failure['detail']['query_error']=='TimeoutExpired', 'query class lost')
    check(state.decision({'status':'CLEAR'}, True)==124, 'failure allowed PASS')
    calls = signals(state)
    check([c[2] for c in calls]==[int(signal.SIGTERM),int(signal.SIGKILL)],
          'bound signal calls missing')
    return dict(events=record.rows, signal_calls=calls, first_failure=state.failure,
                limit='Signal routing is exercised; independent timer scheduling requires its own seam.')


def q03(m, worker, work, inputs):
    evidence = []
    for variant in ('timeout','intent-exhausts-budget','stop-during-intent'):
        state, clock = state_at(m, 176.8)
        def hook(kind, fields):
            if kind=='query-intent':
                if variant=='intent-exhausts-budget':clock.advance(0.2)
                if variant=='stop-during-intent':state.request_stop('synthetic-stop','during intent',124)
        record = Record(hook)
        query = Query(clock, [], elapsed=0.2, fail=True)
        expect_failed(m, lambda:state.query(query, record))
        if variant=='timeout':
            check(len(query.budgets)==1, 'expected one near-stop launch')
            close(query.budgets[0], 0.2)
        else:
            check(query.budgets==[], 'ordinary query launched after intent exhausted/stopped')
            stopped = record.rows[-1]
            check(stopped['kind']=='query-not-launched', 'missing typed not-launched outcome')
            close(stopped['planned_budget'],0.2)
            check('effective_budget' in stopped, 'not-launched effective budget missing')
            close(stopped['effective_budget'],0.0)
        check(state.decision({'status':'CLEAR'}, True)!=0, 'near-stop failure allowed PASS')
        evidence.append(dict(variant=variant, events=record.rows, launches=query.budgets))
    return dict(variants=evidence)


def q04(m, worker, work, inputs):
    evidence=[]
    for now in (177.0,180.0,181.0):
        state, clock=state_at(m,now)
        query, record=Query(clock,[]),Record()
        expect_failed(m,lambda:state.query(query,record))
        check(query.budgets==[], 'nonpositive ordinary budget launched a query')
        check(state.stopping.is_set() and state.failure['stage']=='absolute-deadline',
              'original deadline stop not retained')
        evidence.append(dict(now=now,events=record.rows,first_failure=state.failure))
    return dict(variants=evidence)


def q05(m, worker, work, inputs):
    evidence=[]
    for now,budget in ((178.0,0.5),(179.8,0.2)):
        state,clock=state_at(m,now)
        _,owner,rows=identities()
        state.bind_group(owner)
        state.observe(rows)
        record,query=Record(),Query(clock,[],elapsed=budget+0.01,fail=True)
        expect_failed(m,lambda:state.query(query,record,cleanup_phase=True))
        check(len(query.budgets)==1,'cleanup retry or no launch')
        close(query.budgets[0],budget)
        snap=state.snapshot()
        check(snap['last_rows']==rows and snap['groups'].get(4102)==owner['birth'],
              'unavailable cleanup erased last observation/registry')
        check(state.decision({'status':'UNKNOWN_HELD'},True)!=0,'unknown audit allowed PASS')
        evidence.append(dict(events=record.rows,snapshot=snap))
    return dict(variants=evidence,
                limit='Durable final UNKNOWN_HELD audit writer still requires the main integration seam.')


def q06(m, worker, work, inputs):
    raise Unavailable('Actual independent soft-signalling and blocked-I/O timer seams are pending; no duplicate timer model.')


def q07(m, worker, work, inputs):
    context,owner,rows=identities()
    results=[]
    for field,value,error in [('nonce','wrong','nonce_mismatch'),
                              ('context_sha256','b'*64,'context_sha256_mismatch'),
                              ('birth_environment',{},'birth_environment_mismatch'),
                              ('parent_pid',1,'declared_parent_or_group_mismatch'),
                              ('pgid',999,'declared_parent_or_group_mismatch')]:
        bad=dict(owner);bad[field]=value
        check(error in m.validate_ownership(bad,context,rows,True),'ACK validation failed: '+field)
        results.append(field)
    for column,error in ((1,'observed_parent_mismatch'),(2,'observed_group_mismatch'),
                          (3,'observed_birth_mismatch')):
        bad=list(rows[1]);bad[column]='wrong birth' if column==3 else 999
        check(error in m.validate_ownership(owner,context,[tuple(bad)],True),error)
        results.append(error)
    check('guard_not_live' in m.validate_ownership(owner,context,rows,False),'dead guard accepted')
    check('worker_pid_not_observed' in m.validate_ownership(owner,context,[],True),'missing worker accepted')
    state,_=state_at(m)
    child=SimpleNamespace(pid=4101)
    state.register_child(child,['synthetic-child'])
    check(state.children[4101] is child and state.roots[4101] is None,'child not remembered immediately')
    state.bind_group(owner)
    published=[]
    def prepare():
        check(state.job_groups.get(4102)==owner['birth'],'group authority absent before ACK preparation')
        state.request_stop('synthetic-stop','during durable ACK preparation',124)
        return 'prepared'
    expect_failed(m,lambda:state.publish_ack(prepare,published.append))
    check(not published and not state.acknowledged,'ACK published after stop')
    check(state.job_groups.get(4102)==owner['birth'],'memory group authority lost')
    return dict(validation_variants=results,ack_published=published,snapshot=state.snapshot())


def q08(m, worker, work, inputs):
    state,_=state_at(m)
    context,owner,rows=identities()
    check(m.validate_ownership(owner,context,rows,True)==[],'valid prior ACK rejected')
    state.bind_group(owner);acknowledge(state)
    state.observe(rows)
    remaining=[(4103,1,4102,rows[2][3])]
    check(state.observe(remaining)==remaining,'retained group lost after guard/leader exit')
    check(state.job_groups.get(4102)==owner['birth'],'group authority depended on guard lifetime')
    calls=signals(state)
    check([c[1] for c in calls]==[4102,4102],'cleanup did not reach retained group')
    check(state.observe([])==[] and state.job_groups=={},'empty scoped observation did not retire group')
    state.request_stop('guard','premature exit',1)
    check(state.decision({'status':'CLEAR'},True)==1,'premature guard exit became site acceptance')
    return dict(signal_calls=calls,snapshot=state.snapshot(),scope='Positive ownership-state outcome only.')


def q09(m, worker, work, inputs):
    state,_=state_at(m);_,owner,rows=identities()
    state.bind_group(owner);state.observe(rows)
    reused=[(4102,1,4102,'different leader birth'),(4103,1,4102,'different child birth')]
    check(state.observe(reused)==[],'PID reuse inherited old authority')
    check(state.job_groups=={},'reused group leader retained old group authority')
    check(signals(state)==[],'reused identity was signalled')
    check(any(h['kind']=='exit-or-reuse' for h in state.history),'reuse history missing')
    check(state.observed[4103]==rows[2][3],'old birth history overwritten by reuse')
    return dict(snapshot=state.snapshot())


def q10(m, worker, work, inputs):
    state,_=state_at(m);_,owner,rows=identities()
    state.bind_group(owner);state.observe(rows)
    escaped=(4103,1,9999,rows[2][3]);unseen=(4104,1,9999,'unseen birth')
    found=state.observe([escaped,unseen])
    check(found==[escaped],'observed detached identity lost or unseen identity invented')
    check(state.observed[4103]==escaped[3],'observed birth history lost')
    return dict(found=found,snapshot=state.snapshot(),limit='No unseen-transient discovery is claimed.')


def q11(m, worker, work, inputs):
    state,_=state_at(m)
    state.request_stop('identity-observation',{'cause':'original'},124)
    original=dict(state.failure)
    state.request_stop('guard','later guard exit',1)
    state.request_stop('cleanup','later cleanup error',2)
    check(state.failure==original and state.decision({'status':'CLEAR'},True)==124,
          'later error replaced earliest cause')
    # Force the real request_stop event-before-lock interval. Only this bounded
    # allocated synthetic race needs a real thread; no child process is started.
    race,_=state_at(m);acknowledge(race)
    errors=[]
    def pending_request():
        try:race.request_stop('identity-observation',{'cause':'pending original'},124)
        except BaseException as error:errors.append(repr(error))
    thread=threading.Thread(target=pending_request,name='Q11-pending-stop',daemon=True)
    try:
        with race.lock:
            thread.start()
            check(race.stopping.wait(0.25),'pending stop event was not reached')
            code=race.decision({'status':'CLEAR'},True)
            check(code!=0 and race.final_code!=0,'pending stop allowed return/commit PASS')
    finally:
        # Join after releasing the real latch, including when the predicate fails.
        if thread.ident is not None:
            thread.join(0.25)
    check(not thread.is_alive() and not errors,'pending requester did not quiesce')
    race.request_stop('guard','later generic guard exit',1)
    check(race.failure['stage']=='identity-observation'
          and race.failure['detail']=={'cause':'pending original'}
          and race.failure['exit_code']==124,'pending original cause was lost')
    check(race.decision({'status':'CLEAR'},True)==124,'pending stop became PASS')
    return dict(first_failure=original,pending_first_failure=race.failure,
                limit='Actual main terminal publication/quiescence integration seam remains pending.')


def q12(m, worker, work, inputs):
    evidence=[]
    for label,audit,quiet in [('absent',None,True),('nonempty',{'status':'RESIDUAL','remaining':[4103]},True),
                             ('timeout',{'status':'UNKNOWN_HELD'},True),
                             ('not-quiescent',{'status':'CLEAR'},False)]:
        state,_=state_at(m);acknowledge(state)
        code=state.decision(audit,quiet)
        check(code!=0 and state.failure is not None,'incomplete final audit allowed PASS: '+label)
        evidence.append(dict(variant=label,code=code,first_failure=state.failure))
    return dict(variants=evidence)


def q13(m, worker, work, inputs):
    evidence=[]
    output=work/'worker-output';output.mkdir()
    check(worker.phase_stop_code(output) is None,'unpublished stop was falsely visible')
    for variant in inputs['worker_api']['phase_stop_variants']:
        for name in variant['record_names']:
            path=output/name;path.write_text(variant['record_text'])
            actual=worker.phase_stop_code(output)
            check(actual==variant['expected_code'],'visible stop conversion differs: '+variant['id'])
            evidence.append(dict(variant=variant['id'],file=name,actual=actual))
            path.unlink()
    precedence=inputs['worker_api']['phase_stop_precedence']
    for name,text in precedence['files'].items():(output/name).write_text(text)
    check(worker.phase_stop_code(output)==precedence['expected_code'],'stop precedence differs')
    for name in precedence['files']:(output/name).unlink()
    state,_=state_at(m);state.request_stop('identity-observation','publication pending',124)
    check(worker.phase_stop_code(output) is None,'unpublished latch was visible across processes')
    check(state.decision({'status':'CLEAR'},True)!=0,'unpublished failure allowed acceptance')
    (output/'stop-requested.json').write_text('{"exit_code":124}')
    check(worker.phase_stop_code(output)==124,'visible marker did not refuse phase')
    epoch=datetime(2026,1,5,tzinfo=timezone.utc).timestamp()
    context={'absolute_deadline_utc':'2026-01-05T00:00:00Z'}
    for remaining,expected in ((13,2),(3.2,0.2),(3,0),(1,0)):
        close(worker.worker_identity_budget(context,epoch-remaining),expected)
    return dict(variants=evidence,publication_gap='Before visibility a checkpoint may cross; no instantaneous preemption.',
                limit='Actual worker main query-error and ACK-wait injection plus runner publication I/O seam still pending.')


def q14(m, worker, work, inputs):
    raise Unavailable('Actual direct hard-deadline signal/finally-exit callable seam pending; normal cleanup is not a substitute.')


CASES={name:globals()['q'+name[1:]] for name in CASE_IDS}


def import_private(name, path, verified_bytes, expected_sha256):
    require_sha(expected_sha256,name)
    check(sha(verified_bytes)==expected_sha256,'verified import bytes differ: '+name)
    check(name!='__main__' and name not in sys.modules,'import name is not fresh: '+name)
    module=ModuleType(name)
    module.__file__=str(path)
    module.__package__=''
    sys.modules[name]=module
    # Compile the exact immutable bytes already verified, not a path reread.
    exec(compile(verified_bytes,str(path),'exec',dont_inherit=True),module.__dict__)
    return module


def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    selection=parser.add_mutually_exclusive_group(required=True)
    selection.add_argument('--case',choices=CASE_IDS)
    selection.add_argument('--suite',choices=['Q01-Q14'])
    parser.add_argument('--allocation',required=True)
    parser.add_argument('--inputs',required=True,type=Path)
    parser.add_argument('--inputs-sha256',required=True)
    parser.add_argument('--result',required=True,type=Path)
    parser.add_argument('--work',required=True,type=Path)
    args=parser.parse_args(argv)
    # The hard real-wall bound never depends on fake time, candidate locks or I/O.
    signal.signal(signal.SIGALRM,lambda signum,frame:os._exit(124))
    signal.setitimer(signal.ITIMER_REAL,max(0.001,60.0-(time.monotonic()-ENTRY)))
    check(sys.flags.isolated and sys.flags.no_site and sys.dont_write_bytecode,
          'invoke pinned Python with -I -S -B')
    require_sha(args.inputs_sha256,'--inputs-sha256')
    raw=args.inputs.read_bytes()
    check(sha(raw)==args.inputs_sha256,'input binding digest differs')
    binding=json.loads(raw)
    check(binding['schema']==1 and binding['allocation']==args.allocation,'allocation binding differs')
    python=binding['python']
    require_sha(python['sha256'],'python')
    require_sha(binding['driver_sha256'],'driver')
    check(Path(sys.executable).resolve()==Path(python['path']).resolve(),'Python path differs')
    check(sha(Path(python['path']).read_bytes())==python['sha256'],'Python bytes differ')
    check(sha(Path(__file__).read_bytes())==binding['driver_sha256'],'driver bytes differ')
    limit=binding['suite_wall_seconds'];case_limit=binding['case_wall_seconds']
    check(isinstance(limit,(int,float)) and 0<limit<=60 and math.isfinite(limit),'invalid suite wall bound')
    check(isinstance(case_limit,(int,float)) and 0<case_limit<=limit and math.isfinite(case_limit),
          'invalid case wall bound')
    cutoff=ENTRY+limit
    signal.setitimer(signal.ITIMER_REAL,max(0.001,cutoff-time.monotonic()))
    check(time.monotonic()<cutoff,'allocation wall budget already exhausted')
    args.work.mkdir(mode=0o700,parents=False,exist_ok=False)
    with args.result.open('x') as stream:
        stream.write(json.dumps(dict(status='INCOMPLETE',allocation=args.allocation,retry=False))+'\n')
        stream.flush();os.fsync(stream.fileno())
    report=dict(schema=1,status='INCOMPLETE',allocation=args.allocation,inputs_sha256=sha(raw),
                executed_cases=[],retry=False,site_acceptance=False)
    try:
        require_sha(binding['control_spec']['sha256'],'control_spec')
        spec_path=Path(binding['control_spec']['path'])
        spec_bytes=spec_path.read_bytes()
        check(sha(spec_bytes)==binding['control_spec']['sha256'],'control spec differs')
        inputs=json.loads(spec_bytes)
        private=args.work/'verified-modules';private.mkdir(mode=0o700)
        expected={'run_once','packet_inputs','build_and_check'}
        check(set(binding['modules'])==expected,'complete declared module closure is required')
        for name in sorted(expected):
            require_sha(binding['modules'][name]['sha256'],name)
        verified={}
        report['private_sources']=[]
        report['imports_attempted']=[]
        for name in sorted(expected):
            item=binding['modules'][name]
            source=Path(item['path']);check(not source.is_symlink(),'module symlink refused')
            data=source.read_bytes();check(sha(data)==item['sha256'],'module source differs: '+name)
            target=private/(name+'.py')
            with target.open('xb') as stream:
                stream.write(data);stream.flush();os.fsync(stream.fileno())
            copied=target.read_bytes()
            check(sha(copied)==item['sha256'],'private module differs: '+name)
            verified[name]=copied
            report['private_sources'].append(dict(
                module=name,source_path=str(source),expected_sha256=item['sha256'],
                source_read_sha256=sha(data),private_path=str(target),private_sha256=sha(copied),
                bytes=len(copied),execution_bytes_sha256=sha(verified[name])))
        save_new(args.work/'private-source-identities.json',dict(
            inputs_sha256=sha(raw),sources=report['private_sources']))
        # Verify all copied dependencies before the first candidate/helper import.
        def load(role,name):
            report['imports_attempted'].append(dict(module=role,execution_name=name))
            return import_private(name,private/(role+'.py'),verified[role],
                                  binding['modules'][role]['sha256'])
        helper=load('packet_inputs','packet_inputs')
        candidate=load('run_once','observer_candidate')
        worker=load('build_and_check','observer_worker')
        del helper
        chosen=(args.case,) if args.case else CASE_IDS
        for case in chosen:
            signal.setitimer(signal.ITIMER_REAL,max(0.001,min(cutoff,time.monotonic()+case_limit)-time.monotonic()))
            case_work=args.work/case;case_work.mkdir(mode=0o700)
            record=dict(case=case,status='INCOMPLETE',candidate_sha256=binding['modules']['run_once']['sha256'])
            try:
                record['observations']=CASES[case](candidate,worker,case_work,inputs)
                record['status']='PASS'
            except Unavailable as error:
                record.update(status='UNAVAILABLE',detail=str(error))
            except Exception as error:
                record.update(status='FAILED',error_class=type(error).__name__,detail=str(error))
            save_new(case_work/'result.json',record)
            report['executed_cases'].append(record)
            if record['status']!='PASS':break
        report['status']='PASS' if len(report['executed_cases'])==len(chosen) and all(
            r['status']=='PASS' for r in report['executed_cases']) else 'FAILED'
    except Exception as error:
        report.update(status='FAILED',error_class=type(error).__name__,detail=str(error))
    # The exclusive initial receipt remains incomplete if the real-wall alarm exits.
    with args.result.open('w') as stream:
        stream.write(json.dumps(report,indent=2,ensure_ascii=False)+'\n')
        stream.flush();os.fsync(stream.fileno())
    signal.setitimer(signal.ITIMER_REAL,0)
    return 0 if report['status']=='PASS' else 1


if __name__=='__main__':
    sys.exit(main())

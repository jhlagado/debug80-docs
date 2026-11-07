#!/usr/bin/env python3
"""Allocated Q01-Q14 controls of actual runner routines; never a site invocation.

Source preparation does not import the candidate. Runtime imports require an
allocation-bound input digest and verified private copies of every module.
"""
import argparse
from contextlib import redirect_stdout
from datetime import datetime, timezone
import hashlib
import io
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
THREAD_WAIT = 2.0  # Allocated control barrier/join bound, not a production query limit.


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
    state.publish_ack(lambda: 'prepared', published.append,ownership_sha256='c'*64)
    check(published == ['prepared'] and state.acknowledged, 'actual ACK publication failed')
    check(state.accepted_ownership_sha256=='c'*64,'ACK did not retain the exact accepted receipt hash')


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
    check(state.decision({'status':'CLEAR','remaining':[]}, True)==124, 'failure allowed PASS')
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
            close(stopped['launch_checked_budget'],0.0 if variant=='intent-exhausts-budget' else 0.2)
        check(state.decision({'status':'CLEAR','remaining':[]}, True)!=0, 'near-stop failure allowed PASS')
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
        audit=state.final_audit_disposition(None)
        check(audit['status']=='UNKNOWN_HELD' and audit['remaining'] is None,
              'unavailable cleanup was converted into an empty audit')
        check(state.decision(audit,True)!=0,'unknown audit allowed PASS')
        evidence.append(dict(events=record.rows,snapshot=snap,audit=audit))
    return dict(variants=evidence)


def q06(m, worker, work, inputs):
    evidence=[]
    for now,grace in ((177.0,0.4),(179.8,0.2)):
        state,clock=state_at(m,now);_,owner,_=identities();state.bind_group(owner)
        errors=[];calls=[]
        def stop():
            try:state.soft_stop()
            except BaseException as error:errors.append(repr(error))
        thread=threading.Thread(target=stop,name='Q06-soft-stop',daemon=True)
        def group_signal(group,sig):calls.append([group,int(sig),clock()])
        def wait(delay):
            close(delay,grace);clock.advance(delay)
        try:
            with state.lock:
                thread.start()
                check(state.signal_requested.wait(THREAD_WAIT),'soft stop did not wake independent signalling')
                state.signal_escalation(group_signal,lambda child,sig:None,wait)
                check(len(calls)==2,'held state/audit lock blocked escalation')
        finally:
            if thread.ident is not None:thread.join(THREAD_WAIT)
        check(not thread.is_alive() and not errors,'soft stopper did not quiesce')
        check([c[1] for c in calls]==[int(signal.SIGTERM),int(signal.SIGKILL)],'soft escalation order differs')
        close(calls[0][2],now);close(calls[1][2],now+grace)
        check(state.failure['stage']=='absolute-deadline','soft deadline cause not retained')
        evidence.append(dict(variant='soft-stop-under-lock',calls=calls,first_failure=state.failure))
    for variant in ('blocked-failure-log','raised-failure-log'):
        state,clock=state_at(m);_,owner,rows=identities();state.bind_group(owner)
        entered=threading.Event();release=threading.Event();errors=[]
        def hook(kind,fields):
            if kind=='query-failed':
                check(state.failure['stage']=='identity-observation' and state.signal_requested.is_set(),
                      'completion logging preceded latch/signal wake')
                entered.set()
                if variant=='raised-failure-log':raise OSError('synthetic log failure')
                check(release.wait(THREAD_WAIT),'synthetic log gate was not released')
        record=Record(hook);query=Query(clock,rows,elapsed=2.01,fail=True)
        def observe():
            try:state.query(query,record)
            except BaseException as error:errors.append(type(error).__name__)
        thread=threading.Thread(target=observe,name='Q06-failure-log',daemon=True)
        calls=[]
        try:
            thread.start();check(entered.wait(THREAD_WAIT),'query did not reach failure-log gate')
            state.signal_escalation(lambda g,s:calls.append([g,int(s),clock()]),
                                    lambda child,s:None,clock.advance)
            check(len(calls)==2 and state.decision({'status':'CLEAR','remaining':[]},False)==124,
                  'blocked/failed log permitted acceptance or prevented escalation')
        finally:
            release.set()
            if thread.ident is not None:thread.join(THREAD_WAIT)
        check(not thread.is_alive(),'query logger did not quiesce')
        check(errors==(['OSError'] if variant=='raised-failure-log' else ['Failed']),
              'unexpected query-log exception disposition')
        check(state.failure['detail']['query_error']=='TimeoutExpired','log failure replaced query cause')
        check(query.budgets==[2.0],'failure-log variant retried query')
        evidence.append(dict(variant=variant,calls=calls,events=record.rows,first_failure=state.failure))
    # A Popen-like return after the independent one-shot cleanup still needs cleanup.
    state,clock=state_at(m);state.request_stop('identity-observation','late child',124)
    state.signal_escalation(lambda g,s:None,lambda c,s:None,clock.advance)
    late_calls=[]
    child=SimpleNamespace(pid=4199,send_signal=lambda sig:late_calls.append(int(sig)))
    state.register_child(child,['synthetic-late-return'])
    check(state.stop_new_child(child) is True,'late returned child escaped cleanup')
    check(late_calls==[int(signal.SIGTERM),int(signal.SIGKILL)],'late child escalation differs')
    evidence.append(dict(variant='late-return-after-one-shot',signals=late_calls,snapshot=state.snapshot()))
    return dict(variants=evidence,scope='Actual soft-stop/escalation/late-child routines with fake signals and waits; no OS scheduling sufficiency claim.')


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
    check(state.decision({'status':'CLEAR','remaining':[]},True)==1,'premature guard exit became site acceptance')
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
    check(state.failure==original and state.decision({'status':'CLEAR','remaining':[]},True)==124,
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
            check(race.stopping.wait(THREAD_WAIT),'pending stop event was not reached')
            code=race.decision({'status':'CLEAR','remaining':[]},True)
            check(code!=0 and race.final_code!=0,'pending stop allowed return/commit PASS')
            published=[]
            check(race.commit_decision({'status':'CLEAR','remaining':[]},True,0,m.canonical(None),
                                       lambda:published.append('PASS')) is False,
                  'stale PASS preparation committed over pending original failure')
            check(published==[] and race.final_code!=0,'pending failure published PASS')
    finally:
        # Join after releasing the real latch, including when the predicate fails.
        if thread.ident is not None:
            thread.join(THREAD_WAIT)
    check(not thread.is_alive() and not errors,'pending requester did not quiesce')
    race.request_stop('guard','later generic guard exit',1)
    check(race.failure['stage']=='identity-observation'
          and race.failure['detail']=={'cause':'pending original'}
          and race.failure['exit_code']==124,'pending original cause was lost')
    check(race.decision({'status':'CLEAR','remaining':[]},True)==124,'pending stop became PASS')
    terminal=work/'synthetic-terminal.json'
    value={'status':'FAILED','exit_code':124,'first_failure':race.failure}
    prepared=m.prepare_receipt(terminal,value)
    publications=[]
    def publish():
        os.link(prepared,terminal);publications.append(str(terminal))
    check(race.commit_decision({'status':'CLEAR','remaining':[]},True,124,
                              m.canonical(race.failure),publish) is True,
          'actual failure terminal commit refused stable first failure')
    check(race.final_code==124 and len(publications)==1 and json.loads(terminal.read_text())==value,
          'failure terminal publication differed or was duplicated')
    # Failed atomic publication cannot set a terminal code or replace the cause.
    failed,_=state_at(m);failed.request_stop('identity-observation','publication failed',124)
    cause=dict(failed.failure)
    def publish_error():raise OSError('synthetic terminal publication error')
    try:failed.commit_decision({'status':'CLEAR','remaining':[]},True,124,m.canonical(cause),publish_error)
    except OSError:pass
    else:raise AssertionError('publication error was ignored')
    check(failed.final_code is None and failed.failure==cause,'publication error accepted terminal or replaced cause')
    imported,_=state_at(m)
    receipt={'stage':'ownership-observation','detail':{'query_error':'TimeoutExpired',
             'effective_budget_seconds':0.2,'elapsed_seconds':0.21},'exit_code':124,
             'status':'FAILED','retry':False,'utc':'2026-01-05T00:00:00+00:00'}
    imported.import_failure(receipt);imported.request_stop('guard','later exit1',1)
    check(imported.failure==receipt,'structured worker receipt lost precedence/detail')
    return dict(first_failure=original,pending_first_failure=race.failure,
                terminal=value,terminal_publications=publications,imported_failure=imported.failure,
                publication_failure_cause=failed.failure)


def q12(m, worker, work, inputs):
    evidence=[]
    for label,audit,quiet in [('absent',None,True),('nonempty',{'status':'RESIDUAL','remaining':[4103]},True),
                             ('timeout',{'status':'UNKNOWN_HELD'},True),
                             ('clear-missing-remaining',{'status':'CLEAR'},True),
                             ('clear-with-residual',{'status':'CLEAR','remaining':[4103]},True),
                             ('not-quiescent',{'status':'CLEAR','remaining':[]},False)]:
        state,_=state_at(m);acknowledge(state)
        code=state.decision(audit,quiet)
        check(code!=0 and state.failure is not None,'incomplete final audit allowed PASS: '+label)
        evidence.append(dict(variant=label,code=code,first_failure=state.failure))
    for label,poll_value,expected in [('unbound-live',None,'HELD'),
                                     ('unbound-poll-error','raise','UNKNOWN_HELD'),
                                     ('unbound-reaped',0,'CLEAR')]:
        state,_=state_at(m);acknowledge(state);polls=[]
        def poll():
            polls.append('poll')
            if poll_value=='raise':raise OSError('synthetic handle poll error')
            return poll_value
        child=SimpleNamespace(pid=4101,poll=poll)
        state.register_child(child,['synthetic-unbound-direct'])
        check(state.roots[4101] is None,'fixture must start with unknown direct-child birth')
        audit=state.final_audit_disposition([])
        check(audit['status']==expected and audit['remaining']==[] and polls==['poll'],
              'actual handle disposition differs: '+label)
        if expected=='CLEAR':
            check(4101 not in state.children and 4101 not in state.roots,'reaped handle was not retired')
            check(any(h['kind']=='direct-audit-exit' and h['pid']==4101 and h['exit_code']==0
                      for h in state.history),'confirmed direct reap history missing')
            check(state.decision(audit,True)==0,'confirmed reaped empty fixture audit rejected')
        else:
            check(state.children.get(4101) is child and state.roots[4101] is None,
                  'unresolved/live unbound handle was discarded')
            check(state.decision(audit,True)!=0,'unbound direct handle permitted PASS')
        evidence.append(dict(variant=label,audit=audit,history=state.history))
    state,_=state_at(m)
    check(state.final_audit_disposition(None)['status']=='UNKNOWN_HELD','absent rows became CLEAR')
    return dict(variants=evidence)


def worker_main_fixture(m, worker, work, mode):
    """Actual worker main with local fake query/phase/clock adapters; no child."""
    base=work/mode;base.mkdir();output=base/'output';output.mkdir()
    clock=Clock(177.0 if mode=='zero-budget' else 167.0)
    epoch=0.0  # Exact small synthetic UTC values, not a contemporary epoch ULP.
    context=dict(output=str(output),nonce='synthetic-worker-nonce',
                 absolute_deadline_utc=datetime.fromtimestamp(epoch+180,timezone.utc).isoformat(),
                 source=str(base/'NO_NATIVE_SOURCE'),packet=str(base/'NO_NATIVE_PACKET'),
                 node='NO_NATIVE_NODE',python='NO_NATIVE_PYTHON')
    context_path=base/'context.json';context_path.write_text(json.dumps(context))
    parent=m.InvocationState(180.0,clock=clock)
    query_calls=[];phase_calls=[];sleeps=[]
    original={name:getattr(worker,name) for name in ('argparse','os','time','subprocess','durable_json')}
    class Parser:
        def add_argument(self,*args,**kwargs):pass
        def parse_args(self):return SimpleNamespace(context=str(context_path))
    def query(argv,**kwargs):
        check(argv==['/bin/ps','-o','lstart=','-p','4102'],'worker query argv differs')
        check(all(kwargs['env'].get(k)==v for k,v in
                  {'TZ':'UTC','LC_ALL':'C','LANG':'C'}.items()),'worker identity environment differs')
        query_calls.append(dict(argv=argv,budget=kwargs['timeout'],environment=kwargs['env']))
        if mode=='query-timeout':
            clock.advance(kwargs['timeout']+0.01)
            raise subprocess.TimeoutExpired('synthetic-worker-query',kwargs['timeout'])
        clock.advance(0.05)
        return 'Mon Jan  5 00:00:02 2026\n'
    def durable(path,value,exclusive=False):
        original['durable_json'](path,value,exclusive=exclusive)
        if Path(path).name=='job-ownership.json' and mode in ('delayed-publication','failed-publication'):
            original['durable_json'](output/'job-ack.json',dict(
                nonce=context['nonce'],ownership_sha256=worker.digest(path)),exclusive=True)
    def sleep(delay):
        sleeps.append(delay);clock.advance(delay)
        check(mode=='ack-stop','unexpected ACK wait in worker fixture')
        original['durable_json'](output/'stop-requested.json',{'exit_code':124},exclusive=True)
    def phase(argv,**kwargs):
        phase_calls.append(list(argv))
        check(mode in ('delayed-publication','failed-publication'),'unexpected worker phase request')
        if len(phase_calls)==1:
            check(worker.phase_stop_code(output) is None,'phase started after a visible stop')
            parent.request_stop('identity-observation','publication gap original',124)
            if mode=='delayed-publication':
                original['durable_json'](output/'stop-requested.json',{'exit_code':124},exclusive=True)
        else:
            check(mode=='failed-publication' and len(phase_calls)==2,'phase ran after publication')
            # Synthetic input only: the fake run callback never invokes a checker.
            original['durable_json'](output/'checker.json',{'status':'passed'},exclusive=True)
        return SimpleNamespace(returncode=0)
    worker.argparse=SimpleNamespace(ArgumentParser=Parser)
    worker.os=SimpleNamespace(getpid=lambda:4102,getpgrp=lambda:4102,getppid=lambda:4101,
                              environ={'ORIGO_GUARD':'4101'})
    worker.time=SimpleNamespace(time=lambda:epoch+clock(),monotonic=clock,sleep=sleep)
    worker.subprocess=SimpleNamespace(check_output=query,run=phase,DEVNULL=subprocess.DEVNULL,
                                     SubprocessError=subprocess.SubprocessError)
    worker.durable_json=durable
    captured=io.StringIO()
    try:
        with redirect_stdout(captured):code=worker.main()
    finally:
        for name,value in original.items():setattr(worker,name,value)
    failure_path=output/'first-failure.json'
    failure=json.loads(failure_path.read_text()) if failure_path.exists() else None
    if mode=='zero-budget':
        check(code==124 and query_calls==[] and phase_calls==[],'zero worker budget launched work')
        check(failure['stage']=='absolute-deadline','zero worker budget cause differs')
    elif mode=='query-timeout':
        check(code==124 and len(query_calls)==1 and not phase_calls,'worker query retried/launched phase')
        detail=failure['detail']
        check(failure['stage']=='ownership-observation' and isinstance(detail,dict)
              and detail['query_error']=='TimeoutExpired','worker structured query class lost')
        close(detail['effective_budget_seconds'],2.0);close(detail['elapsed_seconds'],2.01)
    elif mode=='ack-stop':
        check(code==124 and len(sleeps)==1 and not phase_calls,'ACK stop did not refuse next phase')
    elif mode=='delayed-publication':
        check(code==124 and len(phase_calls)==1,'visible delayed marker did not stop second phase')
        check(parent.decision({'status':'CLEAR','remaining':[]},True)==124,'publication gap allowed acceptance')
    else:
        check(code==0 and len(phase_calls)==2,'invisible failed publication falsely claimed preemption')
        check(parent.decision({'status':'CLEAR','remaining':[]},True)==124,'failed publication allowed acceptance')
    return dict(variant=mode,worker_exit=code,query_calls=query_calls,sleep_calls=sleeps,
                fake_phase_requests=phase_calls,native_commands_executed=False,
                first_failure=failure,parent_first_failure=parent.failure,stdout=captured.getvalue())


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
    check(state.decision({'status':'CLEAR','remaining':[]},True)!=0,'unpublished failure allowed acceptance')
    (output/'stop-requested.json').write_text('{"exit_code":124}')
    check(worker.phase_stop_code(output)==124,'visible marker did not refuse phase')
    epoch=0.0
    context={'absolute_deadline_utc':'1970-01-01T00:00:00Z'}
    for remaining,expected in ((13,2),(3.2,0.2),(3,0),(1,0)):
        close(worker.worker_identity_budget(context,epoch-remaining),expected)
    main_variants=[worker_main_fixture(m,worker,work,mode) for mode in
                   ('zero-budget','query-timeout','ack-stop','delayed-publication','failed-publication')]
    return dict(variants=evidence,worker_main_variants=main_variants,
                publication_gap='Before visibility a checkpoint may cross; no instantaneous preemption.')


def q14(m, worker, work, inputs):
    class Exit124(BaseException):pass
    class BadIteration:
        def copy(self):return self
        def __iter__(self):raise RuntimeError('synthetic snapshot iteration failure')
    class BadCopy:
        def copy(self):raise RuntimeError('synthetic snapshot copy failure')
    evidence=[]
    for variant in ('normal','target-raises','group-iteration-raises','child-copy-raises'):
        calls=[];exits=[];handle_operations=[]
        def forbidden():
            handle_operations.append('normal-cleanup');raise AssertionError('normal cleanup in hard path')
        handle=SimpleNamespace(poll=forbidden,kill=forbidden,send_signal=forbidden)
        groups={4102:'birth',4105:'other birth'}
        children={4101:handle,4106:handle}
        if variant=='group-iteration-raises':groups=BadIteration()
        if variant=='child-copy-raises':children=BadCopy()
        def direct(kind,pid,sig):
            calls.append([kind,pid,int(sig)])
            if variant=='target-raises' and pid in (4102,4101):raise OSError('synthetic direct-signal failure')
        def exit_now(code):
            exits.append(code);raise Exit124()
        try:
            m.hard_stop(groups,children,killpg=lambda p,s:direct('group',p,s),
                        kill=lambda p,s:direct('pid',p,s),exit_now=exit_now)
        except Exit124:pass
        check(exits==[124] and handle_operations==[],'hard path missed finally exit or called a normal helper')
        if variant in ('normal','target-raises'):
            check([c[:2] for c in calls]==[['group',4102],['group',4105],['pid',4101],['pid',4106]],
                  'target exception prevented subsequent hard signals')
        check(all(c[2]==int(signal.SIGKILL) for c in calls),'hard path sent a non-KILL signal')
        evidence.append(dict(variant=variant,signals=calls,exit_codes=exits,normal_helper_calls=handle_operations))
    return dict(variants=evidence,scope='Actual hard_stop direct-signal/finally-exit routine; callbacks never signal or exit a native process.')


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
    if args.suite or args.case in ('Q06','Q11'):
        check(case_limit>2*THREAD_WAIT,'threaded controls require more than two bounded barrier/join intervals')
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
        check(inputs['status']=='SOURCE_READY_FOR_INDEPENDENT_REVIEW_UNRUN',
              'control specification still contains pending source coverage')
        check(inputs['control_settings']['thread_barrier_seconds']==THREAD_WAIT
              and inputs['control_settings']['thread_join_seconds']==THREAD_WAIT,
              'control thread limits differ from reviewed source settings')
        report['control_settings']=inputs['control_settings']
        report['routine_coverage']=inputs['driver']['coverage']
        report['candidate_profile']=inputs['candidate_profile']
        private=args.work/'verified-modules';private.mkdir(mode=0o700)
        expected={'run_once','packet_inputs','build_and_check'}
        check(set(binding['modules'])==expected,'complete declared module closure is required')
        for name in sorted(expected):
            require_sha(binding['modules'][name]['sha256'],name)
            require_sha(inputs['module_pins'][name]['sha256'],'control specification '+name)
            check(binding['modules'][name]['sha256']==inputs['module_pins'][name]['sha256'],
                  'module differs from final reviewed control specification: '+name)
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

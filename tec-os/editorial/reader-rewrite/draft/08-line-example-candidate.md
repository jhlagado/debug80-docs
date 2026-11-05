# Held LINE example candidate

Status: new example, not qualified for reader-facing explanation. No positive
completion run proving GOT has been located. The existing chain tests execute
LINE only to abort/reset its input. Source inspection and source equality
do not establish the complete proposed workflow.

The source below is copied unchanged from78127ec:test/programs/line.asm and
is identical at ea3ef3d. The following interpretation is a proposed teaching
passage, not evidence of execution. Retain it here until an explicitly
allocated positive assembly/read-line/print/return run is proved. No current
new default, physical board or runtime result follows from this candidate.

## Preserved candidate and proposed interpretation

The existing LINE source shows the complete sequence of reading a line then
making another BDOS call. It is retained unchanged from `78127ec`. Its
behaviour is explained from the source, with no new captured run:

```asm
; LINE: reads a line from the console by BDOS function 10, then prints GOT
; and returns.

BDOS    EQU     $0005

        ORG     $0100
        LD      DE,BUF
        LD      C,10
        CALL    BDOS
        LD      DE,GOT
        LD      C,9
        CALL    BDOS
        RET
GOT:    DB      13,10,"GOT",13,10,"$"
BUF:    DB      20,0
        DS      20
```

`BUF` begins with `20,0`, followed by 20 reserved bytes. `LINE` passes its
address to function 10. The next call loads `DE` and `C` again before
function 9 uses `GOT`. It does not depend on either register retaining its
value from input. The final `RET` uses the inherited return word. `GOT` is a
fixed acknowledgement, not a copy of the text in `BUF`.

## Superseded positive hold

The status above records the original hold. Its missing positive proof is
superseded by the separately allocated serial attempt retained at private
Origo71696f2e, evidence/book-reader-rewrite/line-ea3-attempt01. That attempt
assembled the original and separate compact source with ATOM, compared the
actual on-card TAS build and observed HELLO input, fixed GOT output and the
ordinary return through0000h. Chapter8 now uses that measured compact source
and the actual bounded captures. The original candidate and interpretation
above remain unchanged as an audit record. This closes only the specific
serial LINE hold at ea3ef3d. Independent review of the insertion remains open.
No KS48, browser, font or physical-board qualification follows.


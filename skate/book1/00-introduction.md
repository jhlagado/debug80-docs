---
title: Introduction
parent: Programming Skate
nav_order: 0
nav_group: First programs
prev: false
next:
  text: A first program
  link: /skate/book1/01-first-program
---

[Skate](../) · [Book overview](./)

# Introduction

With Skate you write Scheme source in a text file, compile it under CP/M and
run the resulting Z80 program. A calculation can print a total at the terminal.
A larger program can process a list of purchases or respond to choices in an
adventure. We begin with the calculation so you can complete the whole process
before learning the language in detail.

Scheme expressions describe calculations and procedure calls. You can give a
procedure a name, pass it to another procedure or return it as a result. Lists
provide a way to collect related values and recursive procedures provide a way
to process them. Later examples combine these ideas so you can change a
calculation without rewriting the traversal of its data.

## The small machine

Skate targets an eight-bit Z80 computer with a 64 KiB address space. CP/M
occupies part of that space. We must fit the executable, runtime support,
working storage and program data into the remainder. Skate implements a
selected set of Scheme features within those limits.

Automatic memory management lets you allocate list elements and retain
variables through closures without explicitly freeing each allocation. You
still need enough memory for the data your program retains. We examine that
cost after writing programs that create and process lists.

For this course you need a browser, a keyboard and a writable CP/M work disk
with Skate and the text editor. Triptych runs the emulated computer in the
browser. CP/M supplies the command prompt and file operations inside that
computer. [CP/M essentials](../../triptych/cpm/) introduces the commands used
in the first lesson.

## The language in this edition

The planned course uses Skate 0.5.5 as its starting baseline. It supports
integer calculations, lists, procedures, closures and console character input.
Floating-point arithmetic and several standard Scheme facilities remain
outside that release. When you consult another Scheme book, check its examples
against the version of Skate on your disk.

The first lesson uses facilities available in the older 0.5.1 browser starter.
The chapters on later additions will require a matching teaching disk before
publication. A working compiler in CP/M is sufficient for the opening lesson;
knowledge of Z80 instructions is unnecessary.

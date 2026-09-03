---
# TODO(tate): placeholder project. Replace with a real one or delete.
placeholder: true
title: Recall
summary: A command-line tool that turns a folder of markdown notes into spaced-repetition flashcards.
status: planned
role: solo
stack: [TypeScript, Node]
year: 2026
---

## Problem

Notes I write while learning something are read once and never again. A
flashcard app would help, but copying notes into one is the step that never
happens.

## Intended approach

A CLI that scans a notes folder for a simple pattern (a question line followed
by an answer block), keeps a review schedule in a single JSON file next to the
notes, and runs a short review session in the terminal. No accounts, no sync;
the folder is the database.

## What I expect to be hard

Choosing a scheduling algorithm I can explain. The well-known ones have many
tuned constants and I want to understand what each one does before using it.

## Open questions

Whether cards should be editable from inside the review session, or whether
the notes file is always the source of truth.

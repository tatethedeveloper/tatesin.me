---
# TODO(tate): placeholder project. Replace with a real one or delete.
placeholder: true
title: Commit lattice
summary: The build-log structure from this site's hero, packaged so any repository can draw its own history.
status: planned
role: solo
stack: [TypeScript, Three.js]
year: 2026
repo: https://github.com/tatethedeveloper/tatesin.me
---

## Problem

The structure at the top of this site is generated from this repository's
commits. The growth rule and the renderer are tied to the site. Extracting
them would make the idea reusable and would force the rule to be well
defined.

## Intended approach

A package with two parts: a pure function that turns an ordered list of
commits into strut positions, and a renderer that draws them. The function is
deterministic so the same history always produces the same drawing, and it
runs at build time as well as in the browser.

## What I expect to be hard

A rule that looks like a structure at twenty commits and still looks like one
at two thousand. The current rule has only been tested on this repository.

## Open questions

Whether branches should be drawn as branches. It would be truer to the
history but it makes the rule much harder.

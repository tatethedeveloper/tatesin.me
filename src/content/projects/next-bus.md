---
# TODO(tate): placeholder project. Replace with a real one or delete.
title: Next bus
summary: A small e-ink display by the front door showing the next three buses from the stop at the end of the street.
status: planned
role: solo
stack: [Python, Raspberry Pi, e-ink]
year: 2026
---

## Problem

Checking a phone app for a bus that comes every twelve minutes takes longer
than the walk to the stop. A glance at a display on the way out would do.

## Intended approach

A Raspberry Pi Zero polling an open transit API every minute and drawing three
lines of text to a small e-ink panel. Nothing else on the screen. Battery is
not a concern because it sits next to a socket.

## What I expect to be hard

Real-time data for the stop is only reliable when the bus has a working
tracker, so the display needs an honest "scheduled" state when live data is
missing, rather than showing a stale time.

## Open questions

Whether the display should stay blank overnight to save the panel from
ghosting.

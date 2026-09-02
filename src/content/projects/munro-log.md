---
# TODO(tate): placeholder project. Replace with a real one or delete.
title: Munro log
summary: A logbook for Munro climbs that records the route, the weather at the time and who I went with.
status: building
role: solo
stack: [TypeScript, SvelteKit, SQLite, Leaflet]
year: 2026
featured: true
---

## Problem

I keep a list of Munros in a notes app. It has no map, no dates and no way to
see which ones I could reach on a day trip. I want a log that answers "which
one next" and remembers the conditions on the day.

## Approach

A small server-rendered app with one table per climb. The map is Leaflet with
the 282 summits as a static GeoJSON layer, coloured by done or not done.
Weather at the time of the climb is fetched once from an open forecast archive
when the entry is saved, then stored, so the page never depends on a third
party after that.

## What's hard so far

Summit coordinates from public lists disagree with each other by tens of
metres, which matters when two summits are close together. Reconciling them
against Ordnance Survey data is the current task.

## Open questions

Whether to make this multi-user. The answer is probably no, because the
interesting part is the map, not accounts.

# Graph Report - .  (2026-07-30)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 169 nodes · 234 edges · 11 communities (9 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `95a67944`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- knockout.js
- edit.js
- spin.js
- SpinWheel
- backend/package.json
- package.json
- background.js
- server.js
- supabaseClient.js
- vercel.json

## God Nodes (most connected - your core abstractions)
1. `SpinWheel` - 22 edges
2. `onSpinEnd()` - 7 edges
3. `updateWheel()` - 6 edges
4. `rand()` - 5 edges
5. `setActive()` - 5 edges
6. `init()` - 5 edges
7. `renderEditorItems()` - 5 edges
8. `loadWheel()` - 5 edges
9. `onSpinEnd()` - 5 edges
10. `createGridLights()` - 4 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (11 total, 2 thin omitted)

### Community 0 - "knockout.js"
Cohesion: 0.07
Nodes (37): addCoins(), addGems(), allItems, bumpCounter(), coinCountEl, confettiCanvas, DEFAULT_KNOCKOUT_CONFIG, eliminated (+29 more)

### Community 1 - "edit.js"
Cohesion: 0.08
Nodes (27): activeName, addItemBtn, bulkAddBtn, bulkTextarea, clearAllBtn, CONFIG_TABLE, data, DEFAULTS (+19 more)

### Community 2 - "spin.js"
Cohesion: 0.10
Nodes (22): addCoins(), addGems(), bumpCounter(), coinCountEl, confettiCanvas, DEFAULT_SPIN_CONFIG, fetchSpinConfig(), gemCountEl (+14 more)

### Community 4 - "backend/package.json"
Cohesion: 0.17
Nodes (11): dependencies, cors, express, description, main, name, scripts, start (+3 more)

### Community 5 - "package.json"
Cohesion: 0.25
Nodes (7): description, name, private, scripts, dev, start, version

### Community 6 - "background.js"
Cohesion: 0.57
Nodes (7): createGridLights(), createMarqueeBulbs(), createSideLights(), init(), makeBokeh(), makeSparkle(), rand()

### Community 7 - "server.js"
Cohesion: 0.29
Nodes (6): app, cors, express, fs, path, PUBLIC_DIR

### Community 8 - "supabaseClient.js"
Cohesion: 0.70
Nodes (4): getSupabase(), insertResult(), loadConfigRow(), saveConfigRow()

## Knowledge Gaps
- **78 isolated node(s):** `name`, `version`, `description`, `main`, `start` (+73 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `name`, `version`, `description` to the rest of the system?**
  _78 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `knockout.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07073170731707316 - nodes in this community are weakly interconnected._
- **Should `edit.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07563025210084033 - nodes in this community are weakly interconnected._
- **Should `spin.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10461538461538461 - nodes in this community are weakly interconnected._
# PathQuest — Lakeview City BFS and A* Explorer

Lakeview City and its roads are unchanged. The map and algorithm now live in separate files so future algorithms can reuse the same city. **BFS and A* are implemented.** DFS can be added later. A* is selected by default; switch algorithms above the playback controls.

## Run

Extract `pathquest-source.zip`, then open `index.html` in a modern browser. In this repository, open `dist/index.html`. Keep `styles.css` and the `js` folder beside the HTML file. No installation, API key, build or internet connection is required. Classic deferred scripts support opening directly from disk.

## File responsibilities

| File | Responsibility |
| --- | --- |
| `index.html` | Page layout, controls and BFS pseudocode |
| `styles.css` | Page, map and queue visual states |
| `js/city-data.js` | Lakeview places, coordinates, roads and adjacency lists |
| `js/map.js` | Map drawing, highlights, pan, zoom and tooltips |
| `js/algorithms/registry.js` | Register and retrieve implemented algorithms |
| `js/algorithms/bfs.js` | Pure BFS traversal and visualization events |
| `js/algorithms/astar.js` | Pure A* traversal, heuristic, scores and priority events |
| `js/queue-view.js` | Persistent queue history, crosses and FRONT marker |
| `js/app.js` | Place selection, playback, speed, rewind, reset and explanations |

The map never calls a search algorithm. Neither algorithm draws a map or modifies the DOM. The controller passes snapshots from the algorithm to the map and queue views.

## BFS and the visible queue

1. Highlight the start, enqueue it and mark it discovered.
2. Take the first waiting entry using `queueHistory[head++]`.
3. Mark it visited. Its entry stays visible with a cross and strikethrough.
4. Show the current node in red on both the map and queue history.
5. Check each neighbour. Undiscovered neighbours are discovered and appended to the back once only. The parent stays red during this work.
6. Skip neighbours already discovered, whether waiting or visited.
7. FRONT identifies the next uncrossed entry. Continue until the destination is dequeued, then reconstruct its route using parent links.

Crossed entries are history, not pending queue items. The counter counts only waiting entries. Some pending nodes can remain when the destination is found. Identical start/end returns a zero-road route.

Existing queue elements stay mounted during forward playback. There are no queue entry animations and no clearing/reinserting of the entire queue. Back and Reset deliberately remove entries that do not exist in the selected snapshot.

## A* on the same city

Every road costs 1. Each node has logical `row` and `col` coordinates in addition to its unchanged drawing coordinates.

- `g`: known best cost from the start (number of roads).
- `h`: Manhattan grid distance to the goal: absolute row difference + absolute column difference.
- `f = g + h`: estimated total cost through that node.

Every Lakeview edge moves exactly one logical cell horizontally or vertically. The heuristic therefore never overestimates actual road count and is consistent. The engine validates this assumption; on a different graph that fails the grid check, it falls back to `h = 0` instead of using an unsafe heuristic.

A* selects the waiting node with lowest f, breaking ties by lower h and then node ID. This is a documented tie-breaking choice, not a mandatory A* rule. Better g values update parent links and priorities; closed nodes can reopen if improved. Search stops when the destination is selected from the frontier, not merely when discovered.

The UI shows g/h/f on each discovered entry, selection ranks, and the full pending priority order. Cards remain in discovery order to avoid jumping and blinking. NEXT identifies the next choice. Visited cards stay crossed, and the current expansion node is red. Node tooltips also include known scores. Switching algorithms resets playback and updates pseudocode and explanations.

Examples with the current tie rule:

| Route | Shortest cost | BFS visited | A* visited |
| --- | --- | --- | --- |
| Home → Fire Station | 4 roads | 14 | 5 |
| Home → City Hospital | 7 roads | 20 | 8 |

These counts are specific to this graph, goal and tie rule. A* is not guaranteed to explore fewer nodes than BFS in every problem.

## Adding an algorithm later

The controller obtains an algorithm using `PathQuest.algorithms.get(id)` and calls `buildTrace({graph, start, end})`. Snapshots use `frontier`, `visited`, `discovered`, `current`, `checking`, `activeEdge`, `path`, `kind`, `title`, `message`, `distance` and `complete`. The map consumes these generic fields and can be reused.

BFS supplies FIFO `queue`, `queueHistory` and `head`. A* supplies priority-sorted `queue`, discovery-order `queueHistory`, `scores` and `heuristic`. The queue renderer preserves entry identity and shows algorithm-specific priorities. A future DFS should supply an appropriate stack display and its own pseudocode/metrics.

Add an algorithm file, register `{id, label, buildTrace}`, load its script before `app.js`, and extend the selector and controller explanations. There is no DFS implementation yet.

## Scope and verification

This is a fictional schematic city, not Google Maps or a real navigation tool. Only roads between labeled nodes are graph edges. Both algorithms minimize unit road count here, not kilometres or travel time. Coordinates on screen are not geographic distances.

All 400 start/end pairs were checked: A* matches BFS shortest costs. Checks include heuristic admissibility/consistency, sorted priorities, score arithmetic, identical endpoints, unreachable endpoints and invalid inputs. DOM-state tests cover script loading, switching algorithms, crossed/current/ranked entries, stable queue identity, reset and rewind. These are programmatic tests; browser visual QA was unavailable.

This teaching app stores snapshots for replay. A production implementation would avoid copying full history and use an efficient priority queue for large A* searches.

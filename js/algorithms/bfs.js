/* Pure BFS: no DOM, map drawing, timers or UI code.
 * queueHistory retains every enqueue. head advances on dequeue so previously
 * visited entries can stay crossed out in the UI without being revisited.
 * The actual pending queue/frontier is always queueHistory.slice(head).
 * Discovery happens on enqueue; 'visited' in this teaching UI means dequeued.
 */
(() => {
  const PQ = globalThis.PathQuest;

  function buildTrace({graph, start, end}) {
    const adj = graph.adjacency;
    if (!Object.hasOwn(adj, start) || !Object.hasOwn(adj, end)) {
      throw new Error('Please choose two places from this city.');
    }
    const queueHistory = [];
    let head = 0;
    const discovered = new Set(), visited = new Set();
    const parent = {}, distance = {[start]: 0}, steps = [];
    let current = null, checking = null, activeEdge = null;
    let path = [], lastAdded = null;
    const label = id => graph.byId?.[id]?.name || id;

    // Every event owns its arrays/objects: rewinding never mutates the search.
    function emit(kind, title, message, extra = {}) {
      steps.push({
        kind, title, message,
        queue: queueHistory.slice(head),
        frontier: queueHistory.slice(head),
        queueHistory: [...queueHistory], head,
        discovered: [...discovered], visited: [...visited],
        parent: {...parent}, distance: {...distance},
        current, checking, activeEdge, path: [...path], lastAdded,
        ...extra
      });
    }

    emit('start', `Start at ${label(start)}`,
      `Pehle starting point highlight hota hai. Destination: ${label(end)}. Queue abhi khaali hai.`);
    queueHistory.push(start);
    discovered.add(start);
    lastAdded = start;
    emit('enqueue', `${start} enters the queue`,
      `${label(start)} queue mein aaya. FRONT isi par hai. Discovered mark karne se yeh dobara enqueue nahi hoga.`);
    lastAdded = null;

    while (head < queueHistory.length) {
      // Dequeue logically; retain the entry physically for crossed-out history.
      current = queueHistory[head++];
      visited.add(current);
      checking = null;
      activeEdge = null;
      emit('dequeue', `Visit ${current} · ${label(current)}`,
        `${current} visited: queue entry par cross laga. Yeh waiting queue se nikal chuka hai, history mein dikhega. Red ${current} ab current node hai.`,
        {justRemoved: current});

      if (current === end) {
        const fullPath = [];
        for (let p = end; p !== undefined; p = parent[p]) fullPath.unshift(p);
        emit('found', 'Destination found!',
          `${label(end)} mil gaya. Search yahin stop; baaki waiting nodes ko visit karna zaroori nahi.`,
          {fullPath: [...fullPath]});
        for (let i = 0; i < fullPath.length; i++) {
          path = fullPath.slice(0, i + 1);
          const complete = i === fullPath.length - 1;
          emit('route', complete ? 'Your shortest route is ready' : 'Tracing the route',
            complete
              ? `${fullPath.length - 1} road connections. Parent links se start-to-destination route mila.`
              : 'Stored parent links shortest route ko highlight kar rahe hain.',
            {fullPath: [...fullPath], complete});
        }
        return steps;
      }

      // The shared city data supplies neighbours in deterministic ID order.
      for (const neighbour of adj[current]) {
        checking = neighbour;
        activeEdge = PQ.edgeKey(current, neighbour);
        emit('inspect', `Check neighbour ${neighbour} · ${label(neighbour)}`,
          discovered.has(neighbour)
            ? `Red ${current} ke neighbour ${neighbour} ko check kar rahe hain. Yeh pehle discover ho chuka hai.`
            : `Red ${current} ke neighbour ${neighbour} ko check kar rahe hain. Yeh abhi unvisited aur undiscovered hai.`);
        if (discovered.has(neighbour)) {
          emit('skip', `Skip ${neighbour} · already discovered`,
            `${neighbour} ${visited.has(neighbour) ? 'visited hai' : 'already waiting queue mein hai'}. Isko dobara add nahi karenge.`);
          continue;
        }
        discovered.add(neighbour);
        parent[neighbour] = current;
        distance[neighbour] = distance[current] + 1;
        queueHistory.push(neighbour);
        lastAdded = neighbour;
        emit('add', `Enqueue ${neighbour} · ${label(neighbour)}`,
          `Red ${current} ka neighbour ${neighbour} queue ke back mein add hua. Parent = ${current}; level = ${distance[neighbour]}. Purani crossed entries wahi rahengi.`);
        lastAdded = null;
      }
      checking = null;
      activeEdge = null;
      const finished = current;
      current = null;
      emit('done', `${finished}'s neighbours checked`,
        `${finished} ke neighbours check ho gaye. Ab FRONT wale uncrossed node ki baari hai.`);
    }
    emit('unreachable', 'No route found',
      'Waiting queue khaali ho gayi. Saari entries crossed hain. Destination tak connected road nahi hai.',
      {complete: true});
    return steps;
  }

  PQ.algorithms.register({id: 'bfs', label: 'BFS', buildTrace});
})();

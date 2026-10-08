/* Pure A* for this unit-road-cost graph. No DOM or map-rendering dependencies.
 * Lakeview's logical row/column coordinates support Manhattan distance:
 * every edge moves exactly one row or column, so h never overestimates and
 * satisfies h(u) <= 1 + h(v). For a different graph without this property,
 * fall back to h=0 (Dijkstra) rather than use an unsafe pixel-distance heuristic.
 */
(() => {
  const PQ = globalThis.PathQuest;

  function makeHeuristic(graph, end) {
    const nodes = Object.keys(graph.adjacency);
    const point = id => graph.byId?.[id];
    const valid = nodes.every(id => Number.isInteger(point(id)?.row) && Number.isInteger(point(id)?.col)) &&
      nodes.every(id => graph.adjacency[id].every(nb => point(nb) &&
        Math.abs(point(id).row - point(nb).row) + Math.abs(point(id).col - point(nb).col) === 1));
    const goal = point(end);
    return {name: valid ? 'Manhattan grid distance' : 'Zero heuristic',
      estimate: id => valid ? Math.abs(point(id).row - goal.row) + Math.abs(point(id).col - goal.col) : 0};
  }

  function buildTrace({graph, start, end}) {
    const adj = graph.adjacency;
    if (!Object.hasOwn(adj, start) || !Object.hasOwn(adj, end)) throw new Error('Choose two places from this city.');
    const heuristic = makeHeuristic(graph, end);
    const h = Object.fromEntries(Object.keys(adj).map(id => [id, heuristic.estimate(id)]));
    const g = {[start]: 0}, parent = {}, open = new Set(), visited = new Set();
    const discovered = new Set(), history = [], steps = [];
    let current = null, checking = null, activeEdge = null, path = [], lastAdded = null;
    const label = id => graph.byId?.[id]?.name || id;
    const f = id => g[id] + h[id];
    const ordered = () => [...open].sort((a, b) => f(a)-f(b) || h[a]-h[b] || a.localeCompare(b));
    const score = id => `g=${g[id]}, h=${h[id]}, f=${f(id)}`;
    function emit(kind, title, message, extra={}) {
      const queue=ordered();
      steps.push({algorithm:'astar',kind,title,message,queue,frontier:[...queue],
        queueHistory:[...history],discovered:[...discovered],visited:[...visited],
        parent:{...parent},distance:{...g},
        scores:Object.fromEntries([...discovered].map(id=>[id,{g:g[id],h:h[id],f:f(id)}])),
        heuristic:heuristic.name,current,checking,activeEdge,path:[...path],lastAdded,...extra});
    }
    emit('start',`A* starts at ${label(start)}`,
      `Har road ka cost 1. g = ab tak ki roads; h = destination tak estimated remaining roads; f = g + h. Start: ${score(start)}.`);
    open.add(start);discovered.add(start);history.push(start);lastAdded=start;
    emit('enqueue',`Add ${start} to the priority frontier`,
      `${label(start)}: ${score(start)}. A* har baari lowest f wala waiting node choose karega.`);
    lastAdded=null;
    while(open.size) {
      current=ordered()[0];open.delete(current);visited.add(current);checking=null;activeEdge=null;
      emit('dequeue',`Choose ${current} · ${label(current)}`,
        `${score(current)}. Waiting nodes mein lowest f; tie ho toh lower h, phir node ID. Entry crossed; red node ab expand hoga.`);
      if(current===end) {
        const route=[];for(let p=end;p!==undefined;p=parent[p])route.unshift(p);
        emit('found','Destination found!',`Destination priority frontier se select hua. Optimal cost = ${g[end]} roads. Ab parent links follow karenge.`,{fullPath:[...route]});
        for(let i=0;i<route.length;i++) {
          path=route.slice(0,i+1);const complete=i===route.length-1;
          emit('route',complete?'A* shortest route is ready':'Tracing the route',
            complete?`${g[end]} roads; ${visited.size} places visited. Baaki waiting entries process karna zaroori nahi.`:'Parent links start se destination tak route highlight kar rahe hain.',
            {fullPath:[...route],complete});
        }
        return steps;
      }
      for(const nb of adj[current]) {
        checking=nb;activeEdge=PQ.edgeKey(current,nb);
        const tentative=g[current]+1;
        emit('inspect',`Check ${nb} · ${label(nb)}`,
          `Red ${current} se ${nb}: new g = ${g[current]} + 1 = ${tentative}. h=${h[nb]}; proposed f=${tentative+h[nb]}.`);
        if(tentative < (g[nb] ?? Infinity)) {
          const first=!discovered.has(nb),reopened=visited.delete(nb);
          parent[nb]=current;g[nb]=tentative;open.add(nb);
          if(first){discovered.add(nb);history.push(nb)}
          lastAdded=first?nb:null;
          emit(first?'add':'improve',`${first?'Add':'Update'} ${nb} · ${label(nb)}`,
            `${score(nb)}. Parent=${current}. ${reopened?'Better route mila; node reopen hua.':first?'Priority frontier mein add hua.':'Better g mila; existing priority update hui.'} Entries ki rank f ke basis par hai.`);
          lastAdded=null;
        } else {
          emit('skip',`Keep the existing route to ${nb}`,
            `Existing g=${g[nb]}, new g=${tentative}. Naya route better nahi hai; parent aur priority same rahenge.`);
        }
      }
      const done=current;current=null;checking=null;activeEdge=null;
      emit('done',`${done}'s neighbours checked`,'Ab priority frontier se lowest f wala next node choose hoga. FIFO order follow nahi hota.');
    }
    emit('unreachable','No route found','Priority frontier khaali hai; destination reachable nahi hai.',{complete:true});
    return steps;
  }
  PQ.algorithms.register({id:'astar',label:'A*',buildTrace,makeHeuristic});
})();

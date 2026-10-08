/* Persistent queue-history renderer. Only newly enqueued items are appended.
 * Existing chips are never detached/reinserted during forward playback.
 * Removing elements is reserved for Back, Reset and a new search.
 * This avoids restarting animations or flashing the queue on each BFS event.
 */
(() => {
  const PQ = globalThis.PathQuest;
  PQ.createQueueView = function({container, counter, name}) {
    const chips = new Map();
    const empty = container.querySelector('.queue-empty');

    function createChip(id) {
      const element = document.createElement('div');
      element.dataset.node = id;
      const cross = document.createElement('i');
      cross.className = 'queue-cross';
      cross.textContent = '×';
      cross.setAttribute('aria-hidden', 'true');
      const letter = document.createElement('b');
      letter.textContent = id;
      const title = document.createElement('span');
      title.className = 'queue-name';
      title.textContent = name(id);
      const front = document.createElement('small');
      front.className = 'front-marker';
      front.textContent = 'FRONT';
      const scores = document.createElement('small');
      scores.className='queue-scores';scores.hidden=true;
      element.append(cross, letter, title, scores, front);
      return element;
    }

    return {
      render(snapshot) {
        const history = snapshot?.queueHistory || [];
        const pending = snapshot?.queue || [];
        const visited = new Set(snapshot?.visited || []);
        const keep = new Set(history);
        const current = ['found', 'route', 'unreachable'].includes(snapshot?.kind)
          ? null : snapshot?.current;
        counter.textContent = `${pending.length} waiting`;
        empty.hidden = history.length > 0;
        for (const [id, element] of chips) {
          if (!keep.has(id)) {
            element.remove();
            chips.delete(id);
          }
        }
        for (const id of history) {
          let element = chips.get(id);
          if (!element) {
            element = createChip(id);
            chips.set(id, element);
            container.appendChild(element);
          }
          const processed = visited.has(id);
          const active = id === current;
          const front = id === pending[0];
          const astar=snapshot?.algorithm==='astar';
          const score=snapshot?.scores?.[id];
          const scoreEl=element.querySelector('.queue-scores');
          scoreEl.hidden=!astar;
          scoreEl.textContent=score?`g ${score.g} · h ${score.h} · f ${score.f}`:'';
          element.querySelector('.front-marker').textContent=astar?(processed?'VISITED':`${front?'NEXT · ':''}#${pending.indexOf(id)+1}`):'FRONT';
          const className = 'queue-chip' + (astar?' priority':'') + (processed ? ' processed' : '') +
            (active ? ' current' : '') + (front ? ' front' : '');
          if (element.className !== className) element.className = className;
          element.setAttribute('aria-label', `${id} ${name(id)}: ${processed ? 'visited, crossed out' : 'waiting'}${active ? ', current node' : ''}${front ? ', front of queue' : ''}`);
        }
      }
    };
  };
})();

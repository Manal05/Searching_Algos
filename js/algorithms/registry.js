/* Algorithm registration is independent of the map. BFS and A* are installed.
 * Future algorithms implement buildTrace({graph, start, end}) and return the
 * same map-state fields. Add their scripts before app.js when implemented. */
(() => {
  const PQ = globalThis.PathQuest ||= {};
  const installed = new Map();
  PQ.algorithms = Object.freeze({
    register(algorithm) {
      if (!algorithm?.id || typeof algorithm.buildTrace !== 'function') {
        throw new Error('An algorithm needs an id and a buildTrace function.');
      }
      if (installed.has(algorithm.id)) throw new Error('Algorithm already registered.');
      installed.set(algorithm.id, Object.freeze(algorithm));
    },
    get(id) {
      if (!installed.has(id)) throw new Error(`Algorithm not implemented: ${id}`);
      return installed.get(id);
    },
    list() { return [...installed.values()]; }
  });
})();

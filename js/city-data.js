/* Lakeview City: shared by every future search algorithm. */
(() => {

/* The city is deliberately fictional. Edges are undirected and unweighted.
   Edit NODES and EDGES to create a different city. x/y are display coordinates,
   never costs: BFS minimizes edge count, not geometric distance. */
const NODES=[
 {id:'A',name:'Lakeview Home',x:130,y:175},{id:'B',name:'Sunrise School',x:327,y:170},{id:'C',name:'Corner Bakery',x:512,y:155},{id:'D',name:'City Library',x:690,y:186},{id:'E',name:'History Museum',x:979,y:173},
 {id:'F',name:'Park Gate',x:154,y:350},{id:'G',name:'Metro Station',x:327,y:316},{id:'H',name:'City Square',x:520,y:320},{id:'I',name:'Bookshop',x:703,y:334},{id:'J',name:'University',x:988,y:335},
 {id:'K',name:'Riverside Cafe',x:135,y:464},{id:'L',name:'Central Market',x:338,y:454},{id:'M',name:'Garden Gate',x:552,y:438},{id:'N',name:'Cinema',x:710,y:462},{id:'O',name:'City Stadium',x:975,y:457},
 {id:'P',name:'Bus Depot',x:169,y:599},{id:'Q',name:'Fire Station',x:354,y:594},{id:'R',name:'South Mall',x:557,y:589},{id:'S',name:'Police Station',x:747,y:588},{id:'T',name:'City Hospital',x:1000,y:594}
];
// Logical cells describe the unchanged road graph, not geographic distances.
NODES.forEach((node, i) => { node.row = Math.floor(i / 5); node.col = i % 5; });
const EDGES=[['A','B'],['B','C'],['C','D'],['D','E'],['F','G'],['G','H'],['H','I'],['I','J'],['K','L'],['L','M'],['M','N'],['N','O'],['P','Q'],['Q','R'],['R','S'],['S','T'],['A','F'],['B','G'],['C','H'],['D','I'],['E','J'],['F','K'],['G','L'],['I','N'],['J','O'],['K','P'],['L','Q'],['M','R'],['N','S'],['O','T']];
const BY_ID=Object.fromEntries(NODES.map(n=>[n.id,n]));
const ADJ=Object.fromEntries(NODES.map(n=>[n.id,[]]));
EDGES.forEach(([a,b])=>{ADJ[a].push(b);ADJ[b].push(a)});
Object.values(ADJ).forEach(a=>a.sort());
const edgeKey=(a,b)=>[a,b].sort().join('-');

const PQ = globalThis.PathQuest ||= {};
PQ.city = Object.freeze({name: "Lakeview City", nodes: NODES, edges: EDGES, byId: BY_ID, adjacency: ADJ});
PQ.edgeKey = edgeKey;
})();

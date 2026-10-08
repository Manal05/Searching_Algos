/* UI and playback controller. Select an installed algorithm from the registry. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const PQ=globalThis.PathQuest, graph=PQ.city;
 const {nodes:NODES,byId:BY_ID}=graph;
 let algorithm=PQ.algorithms.get('astar');
 const bfsCode=$('code-panel').innerHTML;
 const map=PQ.createMapView({container:$('map-stage'),graph});
 const queueView=PQ.createQueueView({container:$('queue'),counter:$('queue-count'),name:id=>BY_ID[id]?.name||id});
 let steps=[],index=-1,playing=false,timer=null,selectedStart='A',selectedEnd='T';
 const name=id=>BY_ID[id]?.name||id;
 const resolve=value=>NODES.find(n=>n.name.toLowerCase()===value.trim().toLowerCase()||n.id.toLowerCase()===value.trim().toLowerCase());
 NODES.forEach(n=>{const o=document.createElement('option');o.value=n.name;o.label=n.id+' · '+n.name;$('places').appendChild(o)});
 function pause(){playing=false;clearTimeout(timer);timer=null;$('play').textContent=index===steps.length-1&&index>=0?`↺ Replay ${algorithm.label}`:index>=0?'▶ Continue':`▶ Play ${algorithm.label}`}
 function clear(){pause();steps=[];index=-1;map.clearTooltip();render()}
 function validate(){const a=resolve($('start').value),b=resolve($('end').value);if(!a||!b){$('error').textContent='Choose a listed place, or type its letter A–T.';(!a?$('start'):$('end')).focus();return false}$('error').textContent='';selectedStart=a.id;selectedEnd=b.id;$('start').value=a.name;$('end').value=b.name;return true}
 function ensure(){if(!steps.length){if(!validate())return false;steps=algorithm.buildTrace({graph,start:selectedStart,end:selectedEnd})}return true}
 function advance(){if(!ensure())return false;if(index<steps.length-1){index++;render();return true}return false}
 function schedule(){clearTimeout(timer);if(!playing)return;if(index>=steps.length-1){pause();return}timer=setTimeout(()=>{advance();schedule()},Number($('speed').value))}
 function togglePlay(){if(playing){pause();return}if(index===steps.length-1&&index>=0){steps=[];index=-1}if(!ensure())return;playing=true;$('play').textContent='Ⅱ Pause';if(index<0)advance();schedule()}
 function setRouteFromInputs(){clear();const a=resolve($('start').value),b=resolve($('end').value);selectedStart=a?.id||null;selectedEnd=b?.id||null;$('error').textContent='';render()}
 function render(){
  const s=steps[index];const visited=s?.visited||[];const path=s?.path||[];
  queueView.render(s);
  $('priority-order').hidden=algorithm.id!=='astar';
  $('priority-order').textContent=s?.queue?.length?'Priority order: '+s.queue.join(' → '):'Priority frontier is empty';
  const scores=s?.scores?.[s.current];
  $('h-value').textContent=scores?.h??'—';$('f-value').textContent=scores?.f??'—';
  map.render(s,{start:selectedStart,end:selectedEnd});
  $('event-title').textContent=s?.title||'Your city. Your next discovery.';$('event-desc').textContent=s?.message||'Press Play, or use Next step to follow each action at your own pace.';
  const icons={improve:'↻',start:'◎',enqueue:'+',dequeue:'−',inspect:'⌕',add:'+',skip:'↷',done:'✓',found:'✓',route:'⚑',unreachable:'×'};$('event-icon').textContent=icons[s?.kind]||'◎';
  $('event-index').textContent=s?`Step ${index+1} of ${steps.length}`:'Ready';$('progress').style.width=s?`${(index+1)/steps.length*100}%`:'0';$('visited-count').textContent=`${visited.length} / ${NODES.length}`;$('current-node').textContent=s?.current||'—';$('level').textContent=s?.current?s.distance[s.current]:'—';
  $('back').disabled=index<0;$('next').disabled=index>=steps.length-1&&index>=0;
  $('map-status').textContent=s?.complete?(s.kind==='unreachable'?'No route found':`Route found · ${path.length-1} roads`):s?.kind==='found'||s?.kind==='route'?'Destination found':s?.current?`Exploring ${name(s.current)}`:s?'BFS in progress':'Ready to explore';
  const result=$('route-result');result.classList.toggle('show',!!s?.complete&&s.kind!=='unreachable');if(s?.complete&&s.kind!=='unreachable'){result.replaceChildren();const strong=document.createElement('strong');strong.textContent=`✓ ${path.length-1} roads · fewest connections`;result.appendChild(strong);result.appendChild(document.createTextNode(path.map(name).join(' → ')))}
  const line=s?.kind==='route'?'found':s?.kind==='improve'?'add':s?.kind;document.querySelectorAll('.code-line').forEach(el=>el.classList.toggle('on',el.dataset.line===line));
  if(!playing)pause();
 }
 function selectAlgorithm(id) {
  algorithm=PQ.algorithms.get(id);
  $('algorithm').value=id;
  const astar=id==='astar';
  $('frontier-title').textContent=astar?'Priority frontier & history':'Queue & history';
  $('frontier-rule').textContent=astar?'Lowest f → lowest h → node ID':'First in, first out';
  $('queue-note').textContent=astar?'× Crossed = visited · NEXT = lowest priority score · Red = current node. Cards stay in discovery order; ranks show selection order.':'× Crossed = visited · FRONT = next to visit · Red = current node. Crossed entries stay as history.';
  $('distance-label').textContent=astar?'g':'Level';
  $('h-metric').hidden=!astar;$('f-metric').hidden=!astar;
  $('lesson-note').textContent=astar?'A*: f = g + h. g = roads travelled so far. h = remaining row moves + column moves to the goal. Every road costs 1. Same f? Prefer lower h, then node ID.':'BFS finds the fewest road connections. All roads cost 1; neighbours enter in node-ID order. It does not minimize kilometres or travel time.';
  if(astar){
   const lines=[['start','g[start] = 0; h = grid distance to goal'],['enqueue','open.add(start); f = g + h'],['dequeue','current = open node with lowest (f, h, ID)'],['dequeue','open.remove(current); visited.add(current)'],['found','if current == goal: return parent route'],['inspect','for neighbour: new_g = g[current] + 1'],['add','  if new_g < known_g[neighbour]:'],['add','    update g, f, parent; add/reopen in open'],['skip','  else: keep existing g and parent'],['unreachable','if open empty: no route']];
   $('code-panel').replaceChildren();
   for(const [kind,text] of lines){const el=document.createElement('span');el.className='code-line';el.dataset.line=kind;el.textContent=text;$('code-panel').appendChild(el)}
  }else $('code-panel').innerHTML=bfsCode;
  clear();
 }
 $('algorithm').addEventListener('change',()=>selectAlgorithm($('algorithm').value));
 $('play').addEventListener('click',togglePlay);$('next').addEventListener('click',()=>{pause();advance()});$('back').addEventListener('click',()=>{pause();if(index>=0){index--;render()}});$('reset').addEventListener('click',clear);$('speed').addEventListener('change',()=>{if(playing)schedule()});
 $('route-form').addEventListener('submit',e=>{e.preventDefault();togglePlay()});['start','end'].forEach(id=>$(id).addEventListener('input',setRouteFromInputs));
 $('swap').addEventListener('click',()=>{const v=$('start').value;$('start').value=$('end').value;$('end').value=v;setRouteFromInputs()});
 $('code-toggle').addEventListener('click',()=>{const open=$('code-panel').classList.toggle('open');$('code-toggle').textContent=open?'Hide algorithm':'Show algorithm';$('code-toggle').setAttribute('aria-expanded',open)});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
 // Optional browser-agent controls use the same route and playback state.
 const context=document.modelContext;
 if(context?.registerTool){const lifecycle=new AbortController();const register=tool=>{try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{})}catch{}};
  register({name:'configure_search_route',description:'Select BFS or A*, set the start and destination, and reset the animation.',inputSchema:{type:'object',properties:{start:{type:'string'},end:{type:'string'},algorithm:{type:'string',enum:['bfs','astar']}},required:['start','end'],additionalProperties:false},annotations:{readOnlyHint:false},execute:input=>{const a=typeof input?.start==='string'&&resolve(input.start),b=typeof input?.end==='string'&&resolve(input.end);if(!a||!b)throw new Error('Unknown place. Use a listed city name or node A–T.');if(input.algorithm!==undefined)PQ.algorithms.get(input.algorithm);$('start').value=a.name;$('end').value=b.name;if(input.algorithm!==undefined)selectAlgorithm(input.algorithm);setRouteFromInputs();return {start:a.name,end:b.name,algorithm:algorithm.id,status:'ready'}}});
  register({name:'step_search',description:'Pause playback and advance one action of the selected search, updating the map and frontier.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false},execute:()=>{pause();advance();const s=steps[index];return {algorithm:algorithm.id,scores:s?.scores,step:index+1,action:s?.kind,queue:s?.queue,visited:s?.visited,current:s?.current,complete:!!s?.complete}}});
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
 }
 selectAlgorithm(algorithm.id);
})();

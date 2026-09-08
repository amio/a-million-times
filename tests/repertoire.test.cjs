const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const assert=require('node:assert/strict'),{test}=require('node:test');
const script=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const context=vm.createContext({Math,Date});
vm.runInContext(script.slice(0,script.indexOf('/* Canvas is a projection only.'))+';this.C=ClockCore;',context);
const C=context.C,near=(a,b,e=1e-6)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
const field=id=>C.repertoire.find(p=>p.id===id).field;
const now=new Date(2026,8,7,9,34,0).getTime();

test('eight references and seven curated studies stay selectable in separate playback loops',()=>{
  assert.deepEqual(Array.from(C.references,p=>p.id),[
    'radial','columns','scissors','tiles','diagonal','rows','multi','scissors-diagonal'
  ]);
  assert.deepEqual(Array.from(C.studies,p=>p.label),[
    'Counter-rotation','Column sweep','Checkerboard','Twin vortices',
    'Mirrored vortex','Concentric breathing','Diamond ripples'
  ]);
  assert.equal(C.repertoire.length,15);
  const p=new C.Director(now);
  for(const [start,count] of [[0,8],[8,7]]) {
    p.select(start,now);
    for(let i=0;i<count;i++) {assert.equal(p.index,start+i);p.next(now);}
    assert.equal(p.index,start);
    p.index=start+count-1;p.phase='holding';p.finish(now);assert.equal(p.index,start);
  }
});

test('Active cycles through official references and Original repeats the original radial piece',()=>{
  const seen=new Set();
  for(let i=0;i<C.references.length;i++) {
    const t=now+i*60000+6000,active=new C.Director(t,'active');
    assert.ok(active.startTimed(t));assert.equal(active.phase,'scheduled');seen.add(active.index);
    assert.ok(active.index<C.references.length);
    const original=new C.Director(t,'original');
    assert.ok(original.startTimed(t));assert.equal(C.repertoire[original.index].id,'radial');
  }
  assert.equal(seen.size,8);
});

test('Mirrored vortex keeps straight pairs and opposite velocities in reflected halves',()=>{
  const fn=field('mirrored-vortex'),epsilon=.001;
  for(let t=0;t<=24*C.MOTION.fieldTempo;t+=.21) for(const c of C.cells) {
    const mirror=C.cells[c.row*C.COLS+(C.COLS-1-c.col)];
    near(C.wrap(fn(c,t,1)-fn(c,t,0)-Math.PI),0);
    for(const j of [0,1]) {
      near(C.wrap(fn(c,t,j)+fn(mirror,t,j)-Math.PI),0);
      const velocity=(fn(c,t+epsilon,j)-fn(c,t-epsilon,j))/(2*epsilon);
      const reflected=(fn(mirror,t+epsilon,j)-fn(mirror,t-epsilon,j))/(2*epsilon);
      near(velocity,-reflected);assert.ok(Math.abs(velocity)>.1);
    }
  }
});

test('Concentric breathing changes one shared opening from tangent rings to radial folds',()=>{
  const fn=field('concentric-breathing'),cycle=2*Math.PI/.48;
  for(let t=0;t<=cycle;t+=.17) for(const c of C.cells) for(const j of [0,1]) {
    near(C.wrap(fn(c,t,j)-c.phi-(fn(C.cells[0],t,j)-C.cells[0].phi)),0);
  }
  for(const c of C.cells) {
    near(C.wrap(fn(c,0,0)-c.phi-Math.PI/2),0);
    const inward=fn(c,cycle/4,0)-c.phi,outward=fn(c,3*cycle/4,0)-c.phi;
    assert.ok(Math.cos(inward)<-.98);assert.ok(Math.cos(outward)>.98);
    for(const j of [0,1]) near(C.wrap(fn(c,cycle,j)-fn(c,0,j)),0);
  }
});

test('Diamond ripples group by Manhattan shells and carry their folds outward',()=>{
  const fn=field('diamond-ripples');
  for(const t of [0,2.7,7,13.2]) {
    const shells=new Map(),openings=[];
    for(const c of C.cells) {
      const key=[Math.sign(c.x),Math.sign(c.y),Math.abs(c.x)+Math.abs(c.y)].join(':');
      const pair=[fn(c,t,0),fn(c,t,1)];
      if(shells.has(key)) pair.forEach((a,j)=>near(a,shells.get(key)[j]));
      else shells.set(key,pair);
      openings.push(Math.abs(C.wrap(pair[0]-pair[1])));
    }
    assert.ok(Math.max(...openings)-Math.min(...openings)>1.5,'A travelling wave needs simultaneously distinct inner and outer folds.');
  }
  const inner=C.cells[4*C.COLS+10],outer=C.cells[4*C.COLS+11];
  const distance=Math.abs(outer.x)+Math.abs(outer.y)-Math.abs(inner.x)-Math.abs(inner.y);
  for(const t of [0,2,8]) for(const j of [0,1]) near(fn(inner,t,j),fn(outer,t+distance*.68/.55,j));
});

test('scrubbing pauses the real score and resumes from its exact motion state',()=>{
  const p=new C.Director(now);p.select(3,now);
  for(const seconds of [-10,0,3.17,19.04,100]) {
    p.inspectFlow(seconds,now);assert.equal(p.paused,true);
    const score=p.score,start=score.marks.find(m=>m.label==='Flow').at;
    near(p.elapsed,start+C.clamp(seconds,0,24));
    p.states.forEach((s,h)=>s.forEach((v,j)=>near(v,score.sample(p.elapsed)[h][j])));
    const before=p.states.map(s=>s.slice());p.tick(60,now+60000);
    p.states.forEach((s,h)=>s.forEach((v,j)=>near(v,before[h][j])));
    p.paused=false;p.resume(now);assert.equal(p.score,score);
    if(seconds>=0&&seconds<24) {
      const expected=score.sample(p.elapsed+.01);p.tick(.01,now+10);
      p.states.forEach((s,h)=>s.forEach((v,j)=>near(v,expected[h][j])));
    }
  }
  p.showTime(now);p.inspectFlow(5,now);
  assert.equal(p.phase,'performance');assert.equal(p.mode,'exhibition');assert.equal(p.paused,true);
});

test('explicit Play leaves static patterns, text and time displays without losing the selected sequence',()=>{
  for(const target of ['weave','text','time']) for(const paused of [false,true]) for(const settled of [false,true]) {
    const p=new C.Director(now);p.select(3,now);p.inspectFlow(8,now);
    if(target==='weave') p.showPose(C.pattern('weave'),'Weave');
    else if(target==='text') p.showPose(C.textPose('TIME'),'TIME','text');
    else p.showTime(now);
    p.paused=false;
    if(settled) p.tick(120,now+120000);
    p.paused=paused;
    assert.equal(p.playbackStopped,true);
    if(target!=='time') {const score=p.score;p.resume(now);assert.equal(p.score,score,'Background resumption must preserve manual displays.');}
    const before=p.states.map(s=>s.slice());
    p.togglePlayback(now+120000);
    assert.equal(p.paused,false);assert.equal(p.phase,'performance');assert.equal(p.index,3);
    assert.equal(p.playbackStopped,false);assert.equal(p.mode,'exhibition');
    p.score.sample(0).forEach((s,h)=>s.forEach((v,j)=>near(v,before[h][j])));
    p.tick(.2,now+120200);assert.ok(p.elapsed>0);
  }
});

test('Play after timeline inspection keeps the same score, including at the final cue',()=>{
  for(const seconds of [0,8,24]) {
    const p=new C.Director(now);p.select(3,now);p.inspectFlow(seconds,now);
    const score=p.score,elapsed=p.elapsed;
    assert.equal(p.playbackStopped,false);
    p.togglePlayback(now);assert.equal(p.paused,false);assert.equal(p.score,score);near(p.elapsed,elapsed);
    p.tick(.2,now+200);
    if(seconds<24) {assert.equal(p.score,score);assert.ok(p.elapsed>elapsed);}
    else {assert.equal(p.phase,'return');assert.equal(p.thenNext,true);}
  }
});

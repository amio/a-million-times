const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const assert=require('node:assert/strict'),{test}=require('node:test');
const root=path.join(__dirname,'..');
const script=fs.readFileSync(path.join(root,'index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const context=vm.createContext({Math,Date});
vm.runInContext(script.slice(0,script.indexOf('/* Canvas is a projection only.'))+';this.C=ClockCore;',context);
const C=context.C,near=(a,b,e=1e-6)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
const field=id=>C.references.find(p=>p.id===id).field;

test('reference images, cue frames and source attribution remain available for every reconstruction',()=>{
  for(const p of C.references) {
    assert.ok(p.source&&p.evidence&&p.url.startsWith('https://'));
    for(const file of [p.image,...p.cues.map(c=>c[2]).filter(Boolean)]) {
      assert.ok(fs.statSync(path.join(root,'docs/reference/official',file)).size>0);
    }
  }
});

test('source-derived line fields preserve their spatial grouping and opposing hands',()=>{
  for(const id of ['columns','rows']) {
    const fn=field(id);
    for(const t of [0,1.7,5,13.2]) for(const c of C.cells) {
      near(C.wrap(fn(c,t,1)-fn(c,t,0)-Math.PI),0);
      if(id==='columns') near(fn(c,t,0),fn({...c,row:0},t,0));
      if(id==='rows') near(fn(c,t,0),fn({...c,col:0},t,0));
    }
  }
  const fn=field('columns'),left=C.cells[0],right=C.cells[17];
  near(fn(right,0,0),-Math.PI/4);near(fn(right,2,0),-Math.PI/4);
  assert.ok(fn(left,2,0)-fn(left,0,0)>.5,'The wave front moves while the far edge retains its organizing line.');
});

test('four-clock motion reaches diamonds, inward squares and both collapsed star phases',()=>{
  const fn=field('tiles'),anchor=C.cells[1],inward=Math.PI/4;
  for(const [alpha,seconds] of [[Math.PI/2,0],[Math.PI/4,Math.PI/4/(.45*C.MOTION.fieldTempo)],[0,Math.PI/2/(.45*C.MOTION.fieldTempo)],[-Math.PI,1.5*Math.PI/(.45*C.MOTION.fieldTempo)]]) {
    const t=seconds*C.MOTION.fieldTempo;
    near(C.wrap(fn(anchor,t,0)-inward-alpha),0);
    near(C.wrap(fn(anchor,t,1)-inward+alpha),0);
    for(let row=0;row<C.ROWS;row++) for(let col=0;col<C.COLS-2;col++) {
      const a=C.cells[row*C.COLS+col],b=C.cells[row*C.COLS+col+2];
      for(const j of [0,1]) near(C.wrap(fn(a,t,j)-fn(b,t,j)),0);
    }
  }
});

test('radial and scissor openings retain a common bisector as their phases propagate',()=>{
  for(const id of ['radial','scissors','diagonal']) {
    const fn=field(id);
    for(const t of [0,2,7,13.2]) for(const c of C.cells) {
      const mean=(fn(c,t,0)+fn(c,t,1))/2;
      near(C.wrap(mean-(id==='radial'?c.phi+Math.PI:id==='scissors'?0:-Math.PI/4)),0);
    }
  }
});

const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(script);
const core = script.slice(0, script.indexOf('/* Canvas is a projection only.'));
const context = vm.createContext({module:{exports:{}}, Date, Math});
vm.runInContext(core + '\nmodule.exports = ClockCore;', context);
const C = context.module.exports;
const near = (a,b,tol=1e-7) => assert.ok(Math.abs(a-b)<tol, `${a} != ${b}`);
const compare = (a,b,tol=1e-7) => a.forEach((row,i)=>row.forEach((v,j)=>near(v,b[i][j],tol)));
const date = (h=9,m=34,s=0) => new Date(2026,8,5,h,m,s).getTime();
const states = () => C.textPose('0934',true).flat().map(p=>[p,0,0]);
const advance = (p,seconds,start,hz=60) => {
  for(let n=1;n<=Math.round(seconds*hz);n++) p.tick(1/hz,start+n*1000/hz);
};

test('18 × 8 fixed cells / 288 fixed hands, all digits and alphabet are valid and distinct',()=>{
  assert.equal(C.COLS,18);assert.equal(C.ROWS,8);
  assert.equal(C.COUNT,144);assert.equal(C.cells.length,144);
  const unique = new Set();
  for(const [char,rows] of Object.entries(C.glyphs)) {
    assert.equal(rows.length,6);
    for(const row of rows) {assert.equal([...row].length,3);for(const tile of row) assert.equal(C.tiles[tile].length,2);}
    const pose=C.textPose(char);
    assert.equal(pose.length,144);assert.equal(pose.flat().length,288);
    assert.ok(pose.flat().every(Number.isFinite));
    if(/\d/.test(char)) unique.add(JSON.stringify(pose));
  }
  assert.equal(unique.size,10);
  assert.throws(()=>C.textPose('\u65f6\u949f'));
});

test('routing crosses zero without a long detour; winding and direction are explicit',()=>{
  const deg=Math.PI/180;
  near(C.destination(350*deg,10*deg),370*deg);
  near(C.destination(10*deg,350*deg),-10*deg);
  near(C.destination(10*deg,350*deg,1),350*deg);
  near(C.destination(350*deg,10*deg,-1),10*deg);
  near(C.destination(350*deg,10*deg,1,2),1090*deg);
  near(C.destination(10*deg,350*deg,-1,2),-730*deg);
});

test('time layout follows the AMT144 photo: packed groups and eight-clock square colon',()=>{
  const pose=C.textPose('0935',true), pair=(col,row)=>pose[row*C.COLS+col];
  for(const col of [2,5,10,13]) {near(pair(col,1)[0],0);near(pair(col,1)[1],Math.PI/2);}
  for(const row of [2,4]) {
    compare([pair(8,row)],[[0,Math.PI/2]]);
    compare([pair(9,row)],[[Math.PI,Math.PI/2]]);
    compare([pair(8,row+1)],[[0,-Math.PI/2]]);
    compare([pair(9,row+1)],[[Math.PI,-Math.PI/2]]);
  }
  // The AMT144 frame has two parked columns per side and one parked row per edge.
  for(let row=0;row<8;row++) for(let col=0;col<18;col++) {
    if(row===0||row===7||col<2||col>15) compare([pair(col,row)],[[C.PARK,C.PARK]]);
  }
  // 0: half-length downward terminal, two full strokes, upward terminal.
  compare([pair(3,2),pair(3,3),pair(3,4),pair(3,5)],[[Math.PI/2,Math.PI/2],[Math.PI/2,-Math.PI/2],[Math.PI/2,-Math.PI/2],[-Math.PI/2,-Math.PI/2]]);
});

test('quintic preserves position, velocity, acceleration at both ends',()=>{
  for(let n=0;n<50;n++) {
    const a=[n*.23,Math.sin(n)*.7,Math.cos(n)*.3],b=[n*.12+6,Math.cos(n)*.4,Math.sin(n)*.3];
    const s=new C.Segment(2,3.7,a,b);
    compare([s.sample(2)],[a]);compare([s.sample(5.7)],[b]);
    const c=s.c,T=s.duration;
    near(c.reduce((sum,v)=>sum+v,0),b[0]);
    near(c.reduce((sum,v,i)=>sum+i*v,0)/T,b[1]);
    near(c.reduce((sum,v,i)=>sum+i*(i-1)*v,0)/(T*T),b[2]);
  }
});

test('all catalog scores have contiguous C2 tracks and finite bounded motion',()=>{
  let largestSpeed=0;
  for(let i=0;i<C.repertoire.length;i++) {
    const score=C.buildPerformance(states(),i);
    assert.equal(score.tracks.length,288);
    for(const track of score.tracks) {
      near(track[0].start,0);
      for(let k=1;k<track.length;k++) {
        near(track[k-1].end,track[k].start);
        compare([track[k-1].to],[track[k].from],1e-7);
      }
      near(track.at(-1).end,score.duration);
    }
    for(let t=0;t<=score.duration;t+=.23) {
      for(const s of score.sample(t)) {
        assert.ok(s.every(Number.isFinite));largestSpeed=Math.max(largestSpeed,Math.abs(s[1]));
      }
    }
    assert.ok(score.states.some(s=>Math.abs(s[1])>.01), 'A performance must flow into its next transition without a mandatory stop.');
    for(const track of score.tracks) for(const segment of track) {
      const bounds=segment.bounds();
      assert.ok(bounds.speed<=C.MOTION.maxSpeed+1e-7);
      assert.ok(bounds.acceleration<=C.MOTION.maxAcceleration+1e-7);
    }
  }
  assert.ok(largestSpeed<=C.MOTION.maxSpeed+1e-7,`peak speed ${largestSpeed}`);
  console.log(`Peak authored angular speed: ${largestSpeed.toFixed(3)} rad/s`);
});

test('static Weave preserves the four-clock loops and rests indefinitely',()=>{
  const pose=C.pattern('weave'),pair=(col,row)=>pose[row*C.COLS+col];
  const same=(a,b,turn=0)=>a.forEach((angle,j)=>near(C.wrap(angle-b[j]-turn),0));
  for(let row=0;row<C.ROWS;row++) for(let col=0;col<C.COLS;col++) {
    if(col>=2) same(pair(col,row),pair(col-2,row));
    if(row>=2) same(pair(col,row),pair(col,row-2));
    near(Math.abs(C.wrap(pair(col,row)[0]-pair(col,row)[1])),3*Math.PI/4);
  }
  const anchor=pair(1,0);
  for(const [col,row,turn] of [[2,0,Math.PI/2],[2,1,Math.PI],[1,1,-Math.PI/2]]) same(pair(col,row),anchor,turn);
  const p=new C.Director(date());p.showPose(pose,'Weave');
  const duration=p.score.duration,target=p.score.sample(duration);
  p.tick(duration+120,date()+1000*(duration+120));
  assert.equal(p.phase,'manual');assert.equal(p.label,'Weave');compare(p.states,target);
  for(const s of p.states) {near(s[1],0);near(s[2],0);}
});

test('Checkerboard retains contrasting four-clock tiles as open and folded roles trade',()=>{
  const index=C.repertoire.findIndex(p=>p.label==='Checkerboard');
  const score=C.buildPerformance(states(),index),start=score.duration-C.MOTION.flowSeconds;
  const distance=(a,b)=>Math.min(
    Math.hypot(C.wrap(a[0]-b[0]),C.wrap(a[1]-b[1])),
    Math.hypot(C.wrap(a[0]-b[1]),C.wrap(a[1]-b[0]))
  )/Math.SQRT2;
  let narrowest=Infinity,widest=-Infinity;
  for(let t=0;t<=C.MOTION.flowSeconds;t+=.125) {
    const frame=score.sample(start+t);
    const pair=(col,row)=>[frame[2*(row*C.COLS+col)][0],frame[2*(row*C.COLS+col)+1][0]];
    for(let row=0;row<C.ROWS;row+=2) for(let col=0;col<C.COLS;col+=2) {
      const anchor=pair(col,row);
      for(const [dx,dy,turn] of [[1,0,Math.PI/2],[1,1,Math.PI],[0,1,-Math.PI/2]]) {
        pair(col+dx,row+dy).forEach((a,j)=>near(C.wrap(a-anchor[j]-turn),0,1e-6));
      }
      for(const [dx,dy] of [[2,0],[0,2]]) {
        if(col+dx<C.COLS&&row+dy<C.ROWS) {
          assert.ok(distance(anchor,pair(col+dx,row+dy))>Math.PI/4,`Checkerboard contrast lost at ${t}s`);
        }
      }
    }
    const opening=pair=>Math.abs(C.wrap(pair[0]-pair[1]));
    const contrast=opening(pair(0,0))-opening(pair(2,0));
    narrowest=Math.min(narrowest,contrast);widest=Math.max(widest,contrast);
  }
  assert.ok(narrowest<-Math.PI/2&&widest>Math.PI/2,'Adjacent tiles must exchange their compact and open roles.');
});

test('repeated mid-flight selection preserves all 288 position/velocity/acceleration states',()=>{
  const p=new C.Director(date());p.start(date());let now=date();
  for(let i=0;i<C.repertoire.length;i++) {
    now+=1873;p.tick(1.873,now);
    const before=p.states.map(s=>s.slice());p.select(i,now);
    compare(p.score.sample(0),before);
    const justAfter=p.score.sample(.000001);
    for(let h=0;h<C.COUNT*2;h++) near(justAfter[h][0],before[h][0],.00001);
  }
});

test('absolute sampling and smooth speed ramps are independent of frame rate',()=>{
  const start=date(),a=new C.Director(start,'exhibition',()=>.5),b=new C.Director(start,'exhibition',()=>.5);
  a.setSpeed(2.25);b.setSpeed(2.25);
  advance(a,30,start,30);advance(b,30,start,120);
  assert.equal(a.phase,b.phase);near(a.elapsed,b.elapsed,1e-6);compare(a.states,b.states,1e-5);
  const x=new C.Director(start),y=new C.Director(start);x.setSpeed(3);y.setSpeed(3);
  const total=x.scaledDelta(2);let sum=0;for(let n=0;n<240;n++)sum+=y.scaledDelta(1/120);
  near(total,sum,1e-8);near(x.rate,y.rate);
});

test('pause holds the exact state, resumption does not teleport',()=>{
  const start=date(),p=new C.Director(start);advance(p,14,start);
  const before=p.states.map(s=>s.slice()),elapsed=p.elapsed;p.paused=true;
  p.tick(300,start+314000);compare(p.states,before);near(p.elapsed,elapsed);
  p.paused=false;p.resume(start+314000);compare(p.states,before);
});

test('Active and Original land on the new minute and ignore exhibition speed',()=>{
  for(const mode of ['active','original']) {
    const start=date(23,58,0),p=new C.Director(start);p.setSpeed(.25);p.setMode(mode,start);
    for(let n=1;n<=181*30;n++) {
      const now=start+n*1000/30;p.tick(1/30,now);
      if(n===60*30||n===120*30||n===180*30) {
        assert.ok(['clock','return'].includes(p.phase),`${mode}: ${p.phase} at minute`);
        assert.equal(p.targetTime,C.timeText(new Date(now)));
        const target=C.textPose(p.targetTime,true);
        p.states.forEach((s,h)=>near(C.wrap(s[0]-target[Math.floor(h/2)][h%2]),0,Math.PI+1e-6));
        // Hands may have swapped identity; compare each unordered pair.
        for(let c=0;c<C.COUNT;c++) {
          const a=p.states[c*2][0],b=p.states[c*2+1][0],[x,y]=target[c];
          assert.ok(Math.min(Math.abs(C.wrap(a-x))+Math.abs(C.wrap(b-y)),Math.abs(C.wrap(a-y))+Math.abs(C.wrap(b-x)))<1e-5);
        }
      }
    }
    near(p.rate,1);
  }
});

test('Minimal moves only the hands needed for the minute change',()=>{
  const start=date(9,34,50),p=new C.Director(start,'minimal');advance(p,8,start);
  const before=p.states.map(s=>s.slice());p.tick(2,start+10000);
  const target=C.textPose('0935',true);
  for(let h=0;h<C.COUNT*2;h++) {
    const unchanged=Math.abs(C.wrap(before[h][0]-target[Math.floor(h/2)][h%2]))<1e-7;
    if(unchanged) for(const t of [0,.3,1,2]) near(p.score.sample(t)[h][0],before[h][0]);
  }
});

test('12/24-hour conversion handles midnight, noon, and day rollover',()=>{
  assert.equal(C.timeText(new Date(date(0,0))), '0000');
  assert.equal(C.timeText(new Date(date(0,0)),true), '1200');
  assert.equal(C.timeText(new Date(date(12,0)),true), '1200');
  assert.equal(C.timeText(new Date(date(23,59)),true), '1159');
});

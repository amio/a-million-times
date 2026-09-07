const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const assert=require('node:assert/strict'),{test}=require('node:test');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const context=vm.createContext({Math,Date});
vm.runInContext(script.slice(0,script.indexOf('/* Canvas is a projection only.'))+';this.C=ClockCore;',context);
const C=context.C,near=(a,b,e=1e-7)=>assert.ok(Math.abs(a-b)<=e,`${a} != ${b}`);
const states=text=>C.textPose(text,true).flat().map(p=>[p,0,0]);
const now=new Date(2026,8,5,9,34,0).getTime();
const authored=C.repertoire.map((_,i)=>C.buildPerformance(states('0934'),i));
function check(score) {
  for(let h=0;h<288;h++) {
    const track=score.tracks[h];let end=0,from=score.initial[h];
    for(const s of track) {
      near(s.start,end);s.from.forEach((v,j)=>near(v,from[j]));
      const b=s.bounds();
      assert.ok(b.speed<=C.MOTION.maxSpeed+1e-7,`speed ${b.speed}`);
      assert.ok(b.acceleration<=C.MOTION.maxAcceleration+1e-7,`acceleration ${b.acceleration}`);
      const c=s.c,T=s.duration;
      near(c.reduce((sum,v)=>sum+v,0),s.to[0]);
      near(c.reduce((sum,v,i)=>sum+i*v,0)/T,s.to[1]);
      near(c.reduce((sum,v,i)=>sum+i*(i-1)*v,0)/(T*T),s.to[2]);
      end=s.end;from=s.to;
    }
    near(end,score.duration);
  }
}

test('whole-polynomial bounds enclose peaks between sample times',()=>{
  for(let k=0;k<80;k++) {
    const from=[k*.71,Math.sin(k)*.4,Math.cos(k)*.2],to=[k*.23-3,Math.cos(k)*.35,Math.sin(k)*.2];
    const s=new C.Segment(0,1+k*.13,from,to),b=s.bounds();
    assert.equal(s.withinLimits(),b.speed<=C.MOTION.maxSpeed&&b.acceleration<=C.MOTION.maxAcceleration);
    for(let n=0;n<=1000;n++) {
      const state=s.sample(s.duration*n/1000);
      assert.ok(Math.abs(state[1])<=b.speed+1e-8);
      assert.ok(Math.abs(state[2])<=b.acceleration+1e-8);
    }
  }
});

test('all interrupted sequence-to-sequence entries preserve motion and obey the cap',()=>{
  for(let i=0;i<C.repertoire.length;i++) {
    const source=authored[i],current=source.sample((source.duration-C.MOTION.flowSeconds)*.62);
    for(let j=0;j<C.repertoire.length;j++) {
      const transition=new C.Score(current).field(C.repertoire[j].field,0);
      check(transition);
      assert.ok(transition.states.some(s=>Math.abs(s[1])>.01));
    }
  }
});

test('moving fields connect directly to every manual destination without overspeed',()=>{
  const targets=C.patterns.map(p=>C.pattern(p.id));
  targets.push(C.textPose('TIME'),C.textPose('0935',true));
  for(let i=0;i<C.repertoire.length;i++) for(const target of targets) {
    const score=authored[i],current=score.sample(score.duration-3.7);
    const next=new C.Score(current).pose(target);check(next);
    for(const s of next.states) {near(s[1],0);near(s[2],0);}
  }
});

test('all minute changes and midnight remain bounded and leave identical poses still',()=>{
  for(let minute=0;minute<61;minute++) {
    const t=new Date(2026,8,5,23,minute,0).getTime();
    const before=states(C.timeText(new Date(t))),target=C.textPose(C.timeText(new Date(t+60000)),true);
    const score=new C.Score(before).pose(target);check(score);
    for(let cell=0;cell<144;cell++) {
      if(before[2*cell][0]===target[cell][0]&&before[2*cell+1][0]===target[cell][1]) {
        for(const t of [.1,score.duration*.5,score.duration]) for(let j=0;j<2;j++) near(score.sample(t)[2*cell+j][0],before[2*cell+j][0]);
      }
    }
  }
});

test('minute scheduling budgets complete bounded motion rather than compressing it',()=>{
  for(let minute=0;minute<C.references.length;minute++) for(const second of [6,17.9]) {
    const t=new Date(2026,8,5,23,minute,0).getTime()+second*1000;
    const p=new C.Director(t,'active');p.states=states(p.currentText(t));
    assert.ok(p.startTimed(t),`could not schedule ${minute}:${second}`);
    near(p.score.duration,60-second,1e-6);check(p.score);
    assert.equal(p.targetTime,p.currentText((Math.floor(t/60000)+1)*60000));
  }
});

test('arrival-time prediction remains consistent near a minute boundary at every speed',()=>{
  for(const speed of [.25,1,3]) for(const second of [45,51,53,57,59]) for(const i of C.repertoire.keys()) {
    const t=now+second*1000,p=new C.Director(t);
    p.rate=speed;p.speed=speed;p.kind='pattern';p.states=authored[i].sample(authored[i].duration-2);
    p.showTime(t);check(p.score);
    assert.equal(passages(p.score).length,0,'A return to time must not add a formation.');
    const arrival=t+p.realDuration(p.score.duration)*1000;
    assert.equal(p.targetTime,p.currentText(arrival));
  }
});

test('normal playback and rapid UI interruptions never exceed 30 degrees per second',()=>{
  const p=new C.Director(now);let t=now,last=p.states.map(s=>s[0]),peak=0;
  for(let n=1;n<=12000;n++) {
    t=now+n*10;
    if(n%290===0) p.next(t-10);
    if(n%430===0) p.showTime(t-10);
    if(n%710===0) p.showPose(C.pattern('fan'),'fan');
    if(n%1100===0) p.setSpeed(n%2200?.25:1,t-10);
    p.tick(.01,t);
    p.states.forEach((s,h)=>{const speed=Math.abs(s[0]-last[h])/.01;peak=Math.max(peak,speed);assert.ok(speed<=C.MOTION.maxSpeed+1e-6,`physical speed ${speed}`);});
    last=p.states.map(s=>s[0]);
  }
  console.log(`Peak normal playback speed: ${(peak*180/Math.PI).toFixed(2)} deg/s`);
});

test('3x debugging remains available and scales an already bounded timeline',()=>{
  const p=new C.Director(now);p.setSpeed(3,now);
  for(let n=1;n<=2500;n++) p.tick(.01,now+n*10);
  near(p.rate,3);assert.equal(p.speed,3);
  check(p.score);
  p.setMode('active',now+25000);
  for(let n=1;n<=2500;n++) p.tick(.01,now+25000+n*10);
  near(p.rate,1);
});

const passages=score=>score.marks.filter(m=>m.formation!==undefined);

test('the nine static patterns remain independent resting manual displays',()=>{
  const poses=C.patterns.map(p=>C.pattern(p.id));
  assert.equal(poses.length,9);
  assert.equal(new Set(poses.map(p=>JSON.stringify(p))).size,poses.length);
  for(const pose of poses) {
    const score=new C.Score(states('0935')).pose(pose);
    check(score);assert.equal(passages(score).length,0);
    score.states.forEach(s=>{near(s[1],0);near(s[2],0);});
    for(let c=0;c<144;c++) {
      const [a,b]=score.states.slice(2*c,2*c+2).map(s=>s[0]),[x,y]=pose[c];
      near(Math.min(Math.abs(C.wrap(a-x))+Math.abs(C.wrap(b-y)),Math.abs(C.wrap(a-y))+Math.abs(C.wrap(b-x))),0);
    }
  }
  const p=new C.Director(now,'exhibition',()=>0);
  p.showPose(C.pattern('wave'),'Wave');
  const duration=p.score.duration,target=p.score.states.map(s=>s.slice());
  p.tick(duration+60,now+(duration+60)*1000);
  assert.equal(p.phase,'manual');assert.equal(p.label,'Wave');
  p.states.forEach((s,h)=>s.forEach((v,j)=>near(v,target[h][j])));
});

test('dedicated formations align all hands on four straight axes without dwelling',()=>{
  assert.equal(C.formations.length,4);
  assert.equal(new Set(C.formations.map(f=>C.mod(f.angle,Math.PI))).size,4);
  for(let i=0;i<C.formations.length;i++) {
    const score=new C.Score(states('0935')).passage(i).field(C.repertoire.find(p=>p.id==='concentric-breathing').field,2);
    check(score);
    const [mark]=passages(score),at=score.sample(mark.at);
    assert.equal(at.length,288);
    for(let h=0;h<288;h++) {
      near(C.wrap(at[h][0]-C.formations[i].angle-(h%2)*Math.PI),0);
      near(Math.abs(at[h][1]),.14);near(at[h][2],0);
      for(const t of [mark.at-.1,mark.at,mark.at+.1]) assert.ok(Math.abs(score.sample(t)[h][1])>.1);
    }
  }
});

test('repeated letter strokes move together while gathering into every formation',()=>{
  for(let i=0;i<C.formations.length;i++) {
    const initial=states('0935'),score=new C.Score(initial).passage(i);
    for(const fraction of [.15,.5,.85]) {
      const groups=new Map(),at=score.sample(score.duration*fraction);
      initial.forEach((s,h)=>{
        const key=`${h%2}:${s[0]}`;
        if(groups.has(key)) at[h].forEach((v,j)=>near(v,groups.get(key)[j]));
        else groups.set(key,at[h]);
      });
    }
  }
});

test('Director organizes only text-to-pattern departures and returns directly',()=>{
  const p=new C.Director(now,'exhibition',()=>0);
  const route=(action,expected)=>{
    action();check(p.score);
    const marks=passages(p.score);
    assert.deepEqual(Array.from(marks,m=>m.formation),expected);
    p.states=p.score.sample(p.score.duration);
  };
  route(()=>p.showPose(C.pattern('rings'),'rings'),[0]);
  route(()=>p.showPose(C.pattern('fan'),'fan'),[]);
  route(()=>p.showPose(C.textPose('TIME'),'TIME','text'),[]);
  route(()=>p.showPose(C.textPose('0935',true),'0935','text'),[]);
  route(()=>p.next(now),[1]);
  route(()=>p.showTime(now),[]);
  assert.equal(p.formationIndex,2);
  route(()=>p.showPose(C.pattern('wave'),'wave'),[2]);
  assert.equal(p.formationIndex,3);
});

test('random choices skip immediate repeats and survive direct routes and failed plans',()=>{
  const draws=[.6,.8,.1,.5,.999];let calls=0;
  const p=new C.Director(now,'exhibition',()=>draws[calls++]);
  const first=p.formationIndex;
  assert.equal(calls,1);
  assert.equal(p.startTimed(now+59999),false);
  assert.equal(p.formationIndex,first);assert.equal(calls,1,'A failed plan must keep its cached draw.');
  const used=[];
  for(let i=0;i<4;i++) {
    p.showPose(C.textPose('TIME'),'TIME','text');
    p.showTime(now);
    assert.equal(calls,i+1,'Direct routes must not consume a draw.');
    const pending=p.formationIndex;
    p.showPose(C.pattern('rings'),'Rings');
    assert.deepEqual(Array.from(passages(p.score),m=>m.formation),[pending]);
    used.push(pending);
    assert.equal(calls,i+2);assert.notEqual(p.formationIndex,pending);
    p.showPose(C.pattern('wave'),'Wave');
    assert.equal(calls,i+2);assert.equal(passages(p.score).length,0);
  }
  assert.deepEqual(used,[2,1,2,0]);
});

test('every minute sequence fits all random formations without redrawing during retries',()=>{
  for(let i=0;i<C.references.length;i++) for(let index=0;index<C.formations.length;index++) {
    const t=new Date(2026,8,5,23,i,6).getTime();let draws=0;
    const p=new C.Director(t,'active',()=>++draws===1?(index+.5)/C.formations.length:.5);
    assert.equal(p.formationIndex,index);
    assert.ok(p.startTimed(t));
    assert.equal(p.phase,'scheduled',`family ${i}, formation ${index} was replaced by a clock-only update`);
    assert.equal(draws,2,'Budget retries must reuse the cached formation.');
    assert.notEqual(p.formationIndex,index);
    assert.deepEqual(Array.from(passages(p.score),m=>m.formation),[index]);
    near(p.score.duration,54,1e-6);check(p.score);
    const next=p.formationIndex;
    for(const mark of passages(p.score)) for(const state of p.score.sample(mark.at)) assert.ok(Math.abs(state[1])>.1);
    p.tick(54,t+54000);
    assert.equal(p.kind,'text');assert.equal(p.formationIndex,next);assert.equal(draws,2);
  }
});

test('interrupting a formation passage preserves the sampled motion and speed limits',()=>{
  for(let i=0;i<C.formations.length;i++) {
    const p=new C.Director(now,'exhibition',()=>0);p.formationIndex=i;p.start(now);
    const mark=passages(p.score)[0];p.tick(mark.at,now+mark.at*1000);
    const before=p.states.map(s=>s.slice());p.showTime(now+mark.at*1000);
    assert.equal(passages(p.score).length,0);
    assert.equal(p.formationIndex,(i+1)%C.formations.length);
    p.score.sample(0).forEach((s,h)=>s.forEach((v,j)=>near(v,before[h][j])));
    check(p.score);
  }
});

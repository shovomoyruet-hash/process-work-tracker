const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const nodes={};const node=()=>({innerHTML:'',textContent:'',style:{},addEventListener(){},showModal(){},close(){},querySelectorAll(){return []}});
let response={data:null,error:null};const query={update(){return this},eq(){return this},select(){return this},maybeSingle:async()=>response};
const ctx={console,crypto,Date,structuredClone,setTimeout,clearTimeout,window:{addEventListener(){}},document:{querySelector:s=>nodes[s]??=node(),querySelectorAll:()=>[]},mock:{from:()=>query}};vm.createContext(ctx);const run=s=>vm.runInContext(s,ctx);
run(fs.readFileSync('app.js','utf8'));run(fs.readFileSync('cloud.js','utf8').replace('boot().catch(e=>authScreen(e.message));',''));
(async()=>{
run("sb=mock;user={id:'owner',email:'owner@example.com'};state=emptyState();workspace={owner_id:'owner',revision:0,data:state};state.tasks=[{...blank(),title:'Trial',assignee:'owner',finish:'2026-10-01'}]");
for(const v of ['Dashboard','All Tasks','Board','Calendar','My Tasks','Deliveries','Archive','People & teams','Help']){run(`view=${JSON.stringify(v)};render()`);assert.ok(nodes['#app'].innerHTML.includes('Process Work'));}
assert.equal(run("validate({...state.tasks[0],start:'2026-10-02'})"),'Planned finish must be on or after planned start.');
assert.equal(run("validate({...state.tasks[0],actualStart:'2026-10-02',actualFinish:'2026-10-01'})"),'Actual finish must be on or after actual start.');
response={data:{owner_id:'owner',revision:1},error:null};assert.equal(await run('persist(structuredClone(state))'),true);assert.equal(run('workspace.revision'),1);
response={data:null,error:null};assert.equal(await run('persist({...state,people:["changed"]})'),false);assert.equal(run('conflict'),true);assert.equal(run('state.people[0]'),'owner');
run('conflict=false');response={data:null,error:{message:'Offline'}};assert.equal(await run('persist({...state,people:["changed"]})'),false);assert.equal(run('state.people[0]'),'owner');
assert.throws(()=>run("safeState({...state,tasks:[{...state.tasks[0],id:'\" onclick=bad'}]})"));
assert.equal(run('parseCSV(\'title,description\\r\\n"A, B","Line 1\\nLine 2"\')[1][1]'),'Line 1\nLine 2');
response={data:{owner_id:'owner',revision:2},error:null};assert.equal(await run("importCSV('title,assignee,finish,priority,status,progress\\nImported,Engineer,2026-10-02,High,Not Started,0')"),1);assert.equal(run('state.tasks.length'),2);assert.equal(run('state.people.includes("Engineer")'),true);
console.log('PASS: view rendering, date validation, cloud saves, stale-write protection, failed-save retention, payload validation, multiline CSV, task import.');
})().catch(e=>{console.error(e);process.exitCode=1});

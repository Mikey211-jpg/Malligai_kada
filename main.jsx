import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import { LogIn, LogOut, Clock3, CalendarDays, WalletCards, Users, LayoutDashboard, CheckCircle2, XCircle, Menu, X, Plus, RefreshCw } from "lucide-react";
import "./styles.css";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://wqfhdivirchfbfncdzpw.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_uaHkSXYQCylWaEgNGY6TlA_KBLICLre";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function fmtHours(v) { return `${Number(v || 0).toFixed(2)} h`; }
function today() { return new Date().toISOString().slice(0,10); }
function monthStart() { return new Date().toISOString().slice(0,7)+"-01"; }

function App() {
  const [session,setSession] = useState(null);
  const [employee,setEmployee] = useState(null);
  const [loading,setLoading] = useState(true);
  const [authMode,setAuthMode] = useState("login");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [fullName,setFullName] = useState("");
  const [error,setError] = useState("");
  const [tab,setTab] = useState("dashboard");
  const [mobileMenu,setMobileMenu] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({data}) => {
      setSession(data.session);
      if (data.session) loadEmployee(data.session.user.id);
      else setLoading(false);
    });
    const {data: sub} = supabase.auth.onAuthStateChange((_e,s) => {
      setSession(s);
      if (s) loadEmployee(s.user.id); else {setEmployee(null);setLoading(false);}
    });
    return () => sub.subscription.unsubscribe();
  },[]);

  async function loadEmployee(id) {
    setLoading(true); setError("");
    const {data,error} = await supabase.from("employees").select("*").eq("id",id).maybeSingle();
    if (error) setError(error.message);
    setEmployee(data || null); setLoading(false);
  }

  async function auth(e) {
    e.preventDefault(); setError(""); setLoading(true);
    if (authMode==="signup") {
      const {data,error} = await supabase.auth.signUp({email,password,options:{data:{full_name:fullName}}});
      if (error) setError(error.message);
      else if (data.user && !data.session) setError("Account created. Check your email, then sign in.");
    } else {
      const {error} = await supabase.auth.signInWithPassword({email,password});
      if (error) setError(error.message);
    }
    setLoading(false);
  }

  if (loading) return <div className="center"><div className="loader"></div><p>Loading Surya Super Market…</p></div>;
  if (!session) return <Auth authMode={authMode} setAuthMode={setAuthMode} email={email} setEmail={setEmail} password={password} setPassword={setPassword} fullName={fullName} setFullName={setFullName} auth={auth} error={error} />;

  if (!employee) return <SetupNotice email={session.user.email} onRefresh={()=>loadEmployee(session.user.id)} onLogout={()=>supabase.auth.signOut()} />;

  const isAdmin = employee.role==="admin" && employee.status==="active";
  return <Shell employee={employee} isAdmin={isAdmin} tab={tab} setTab={setTab} mobileMenu={mobileMenu} setMobileMenu={setMobileMenu} onLogout={()=>supabase.auth.signOut()} />;
}

function Auth(p) {
  return <div className="auth-page"><div className="auth-card">
    <div className="brand"><div className="logo">S</div><div><h1>Surya Super Market</h1><span>Employee Management</span></div></div>
    <h2>{p.authMode==="login"?"Welcome back":"Create account"}</h2>
    <p className="muted">{p.authMode==="login"?"Sign in to continue":"Create your employee login account"}</p>
    <form onSubmit={p.auth}>
      {p.authMode==="signup" && <input placeholder="Full name" value={p.fullName} onChange={e=>p.setFullName(e.target.value)} required />}
      <input type="email" placeholder="Email" value={p.email} onChange={e=>p.setEmail(e.target.value)} required />
      <input type="password" placeholder="Password (6+ characters)" minLength="6" value={p.password} onChange={e=>p.setPassword(e.target.value)} required />
      {p.error && <div className="alert">{p.error}</div>}
      <button className="primary" disabled={p.loading}>{p.authMode==="login"?<><LogIn size={18}/> Sign in</>:<><Plus size={18}/> Create account</>}</button>
    </form>
    <button className="linkbtn" onClick={()=>{p.setError("");p.setAuthMode(p.authMode==="login"?"signup":"login")}}>
      {p.authMode==="login"?"New employee? Create an account":"Already have an account? Sign in"}
    </button>
  </div></div>
}

function SetupNotice({email,onRefresh,onLogout}) {
  return <div className="center"><div className="setup-card">
    <div className="logo big">S</div><h2>Account created</h2>
    <p className="muted">Signed in as <b>{email}</b>, but an employee record has not been assigned yet.</p>
    <p className="muted">An admin must add this account to the <b>employees</b> table and choose the role.</p>
    <div className="row"><button className="secondary" onClick={onRefresh}><RefreshCw size={17}/> Check again</button><button className="ghost" onClick={onLogout}>Sign out</button></div>
  </div></div>
}

function Shell({employee,isAdmin,tab,setTab,mobileMenu,setMobileMenu,onLogout}) {
  const nav = isAdmin
    ? [["dashboard","Dashboard",LayoutDashboard],["attendance","Attendance",Clock3],["leave","Leave Requests",CalendarDays],["employees","Employees",Users],["payroll","Payroll",WalletCards]]
    : [["dashboard","Dashboard",LayoutDashboard],["attendance","My Attendance",Clock3],["leave","My Leave",CalendarDays],["payroll","My Salary",WalletCards]];
  return <div className="app">
    <aside className={mobileMenu?"sidebar open":"sidebar"}><div className="sidebrand"><div className="logo">S</div><div><b>Surya</b><small>Super Market</small></div><button className="close" onClick={()=>setMobileMenu(false)}><X/></button></div>
      <nav>{nav.map(([id,label,Icon])=><button key={id} className={tab===id?"active":""} onClick={()=>{setTab(id);setMobileMenu(false)}}><Icon size={19}/>{label}</button>)}</nav>
      <div className="sidebottom"><div className="user-mini"><div className="avatar">{employee.full_name?.[0]||"U"}</div><div><b>{employee.full_name}</b><small>{isAdmin?"Administrator":"Employee"}</small></div></div><button onClick={onLogout}><LogOut size={18}/> Sign out</button></div>
    </aside>
    {mobileMenu && <div className="backdrop" onClick={()=>setMobileMenu(false)}></div>}
    <main><header><button className="hamb" onClick={()=>setMobileMenu(true)}><Menu/></button><div><h2>{nav.find(x=>x[0]===tab)?.[1]}</h2><span className="muted">{new Date().toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long"})}</span></div></header>
      {tab==="dashboard" && <Dashboard employee={employee} isAdmin={isAdmin}/>}
      {tab==="attendance" && <Attendance employee={employee} isAdmin={isAdmin}/>}
      {tab==="leave" && <Leave employee={employee} isAdmin={isAdmin}/>}
      {tab==="employees" && isAdmin && <Employees/>}
      {tab==="payroll" && <Payroll employee={employee} isAdmin={isAdmin}/>}
    </main>
  </div>
}

function Dashboard({employee,isAdmin}) {
  const [att,setAtt]=useState(null), [leave,setLeave]=useState(0);
  useEffect(()=>{(async()=>{const {data}=await supabase.from("attendance").select("*").eq("employee_id",employee.id).eq("work_date",today()).maybeSingle();setAtt(data); const q=await supabase.from("leave_requests").select("*",{count:"exact",head:true}).eq("employee_id",employee.id).eq("status","pending");setLeave(q.count||0)})()},[employee.id]);
  const hours=att?.total_hours||0;
  return <section className="content"><div className="welcome"><div><span className="eyebrow">GOOD DAY 👋</span><h1>Hi, {employee.full_name?.split(" ")[0]}!</h1><p>Here’s your work summary for today.</p></div><div className="datepill">{today()}</div></div>
    <div className="cards">
      <Stat title="Today’s hours" value={fmtHours(hours)} icon={Clock3}/>
      <Stat title="Punch status" value={att?.punch_in?(att.punch_out?"Completed":"Working"):"Not started"} icon={CheckCircle2}/>
      <Stat title="Pending leave" value={String(leave)} icon={CalendarDays}/>
      <Stat title="Hourly rate" value={`₹${Number(employee.hourly_rate||0).toFixed(0)}`} icon={WalletCards}/>
    </div>
    <div className="panel"><h3>Quick actions</h3><div className="quick"><a onClick={()=>document.querySelector('[data-tab="attendance"]')?.click()}>Go to attendance →</a><span className="muted">Use the left menu to punch in/out, request leave, and view salary.</span></div></div>
  </section>
}
function Stat({title,value,icon:Icon}) { return <div className="stat"><div className="staticon"><Icon size={20}/></div><div><span>{title}</span><strong>{value}</strong></div></div> }

function Attendance({employee,isAdmin}) {
  const [rows,setRows]=useState([]),[busy,setBusy]=useState(false),[breakMin,setBreakMin]=useState(0),[note,setNote]=useState("");
  async function load(){let q=supabase.from("attendance").select("*").order("work_date",{ascending:false}).limit(60); if(!isAdmin) q=q.eq("employee_id",employee.id); const {data}=await q;setRows(data||[])}
  useEffect(()=>{load()},[employee.id,isAdmin]);
  const mine=rows.find(r=>r.employee_id===employee.id&&r.work_date===today());
  async function punch(type){
    setBusy(true);
    if(type==="in"){await supabase.from("attendance").upsert({employee_id:employee.id,work_date:today(),punch_in:new Date().toISOString(),break_minutes:Number(breakMin)||0,notes:note},{onConflict:"employee_id,work_date"});}
    else await supabase.from("attendance").update({punch_out:new Date().toISOString()}).eq("employee_id",employee.id).eq("work_date",today());
    setBusy(false);load();
  }
  return <section className="content"><div className="panel punch"><div><span className="eyebrow">TODAY</span><h3>{mine?.punch_in ? mine.punch_out?"Shift completed":"You are clocked in":"Ready to start your shift?"}</h3><p className="muted">{mine?.punch_in?`In: ${new Date(mine.punch_in).toLocaleTimeString()}`:"Punch in when you start work."}</p></div>
    <div className="punchactions">{!mine?.punch_in?<><input type="number" min="0" placeholder="Break minutes" value={breakMin} onChange={e=>setBreakMin(e.target.value)}/><input placeholder="Note (optional)" value={note} onChange={e=>setNote(e.target.value)}/><button className="primary" disabled={busy} onClick={()=>punch("in")}><Clock3 size={18}/> Punch in</button></>:!mine.punch_out?<button className="danger" disabled={busy} onClick={()=>punch("out")}><LogOut size={18}/> Punch out</button>:null}</div>
  </div>
  <div className="panel"><div className="panelhead"><h3>{isAdmin?"Attendance records":"My attendance"}</h3><button className="iconbtn" onClick={load}><RefreshCw size={17}/></button></div><div className="tablewrap"><table><thead><tr><th>Date</th>{isAdmin&&<th>Employee</th>}<th>In</th><th>Out</th><th>Break</th><th>Total</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.work_date}</td>{isAdmin&&<td>{r.employee_id.slice(0,8)}</td>}<td>{r.punch_in?new Date(r.punch_in).toLocaleTimeString(): "—"}</td><td>{r.punch_out?new Date(r.punch_out).toLocaleTimeString():"—"}</td><td>{r.break_minutes||0}m</td><td><b>{fmtHours(r.total_hours)}</b></td></tr>)}</tbody></table></div></div></section>
}

function Leave({employee,isAdmin}) {
  const [rows,setRows]=useState([]),[start,setStart]=useState(today()),[end,setEnd]=useState(today()),[reason,setReason]=useState(""),[type,setType]=useState("casual");
  async function load(){let q=supabase.from("leave_requests").select("*").order("created_at",{ascending:false}); if(!isAdmin)q=q.eq("employee_id",employee.id);const {data}=await q;setRows(data||[])} useEffect(()=>{load()},[employee.id,isAdmin]);
  async function submit(e){e.preventDefault();await supabase.from("leave_requests").insert({employee_id:employee.id,start_date:start,end_date:end,leave_type:type,reason});setReason("");load()}
  async function decide(id,status){await supabase.from("leave_requests").update({status,approved_by:employee.id,approved_at:new Date().toISOString()}).eq("id",id);load()}
  return <section className="content"><div className="grid2"><div className="panel"><h3>Request leave</h3><form onSubmit={submit}><label>Leave type<select value={type} onChange={e=>setType(e.target.value)}><option>casual</option><option>sick</option><option>annual</option><option>unpaid</option></select></label><div className="formrow"><label>From<input type="date" value={start} onChange={e=>setStart(e.target.value)}/></label><label>To<input type="date" value={end} onChange={e=>setEnd(e.target.value)}/></label></div><label>Reason<textarea value={reason} onChange={e=>setReason(e.target.value)} required /></label><button className="primary"><Plus size={18}/> Submit request</button></form></div>
  <div className="panel"><h3>{isAdmin?"All leave requests":"My requests"}</h3><div className="list">{rows.map(r=><div className="leaveitem" key={r.id}><div><b>{r.leave_type}</b><span>{r.start_date} → {r.end_date}</span><small>{r.reason}</small></div><div className="leaveactions"><span className={`badge ${r.status}`}>{r.status}</span>{isAdmin&&r.status==="pending"&&<><button className="approve" onClick={()=>decide(r.id,"approved")}><CheckCircle2 size={17}/></button><button className="reject" onClick={()=>decide(r.id,"rejected")}><XCircle size={17}/></button></>}</div></div>)}</div></div></div></section>
}

function Employees() {
  const [rows,setRows]=useState([]),[editing,setEditing]=useState(null);
  async function load(){const {data}=await supabase.from("employees").select("*").order("created_at",{ascending:false});setRows(data||[])} useEffect(()=>{load()},[]);
  async function save(e){e.preventDefault();const f=new FormData(e.currentTarget);const obj={full_name:f.get("name"),phone:f.get("phone"),employee_code:f.get("code"),hourly_rate:Number(f.get("rate")),role:f.get("role"),status:f.get("status")};if(editing){await supabase.from("employees").update(obj).eq("id",editing.id)}else{alert("Create the user's Auth account first, then add their UUID here. For security, employee Auth creation should use the server function.");}setEditing(null);load()}
  return <section className="content"><div className="panel"><div className="panelhead"><div><h3>Employees</h3><p className="muted">Manage role, rate and active status.</p></div><button className="secondary" onClick={()=>setEditing({})}><Plus size={17}/> Edit existing</button></div><div className="tablewrap"><table><thead><tr><th>Name</th><th>Code</th><th>Phone</th><th>Rate</th><th>Role</th><th>Status</th><th></th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td><b>{r.full_name}</b></td><td>{r.employee_code}</td><td>{r.phone||"—"}</td><td>₹{r.hourly_rate}</td><td>{r.role}</td><td><span className={`badge ${r.status}`}>{r.status}</span></td><td><button className="linkbtn" onClick={()=>setEditing(r)}>Edit</button></td></tr>)}</tbody></table></div></div>
  {editing&&editing.id&&<div className="modal"><form className="modalcard" onSubmit={save}><div className="panelhead"><h3>Edit employee</h3><button type="button" className="iconbtn" onClick={()=>setEditing(null)}><X/></button></div><label>Name<input name="name" defaultValue={editing.full_name}/></label><div className="formrow"><label>Code<input name="code" defaultValue={editing.employee_code}/></label><label>Phone<input name="phone" defaultValue={editing.phone||""}/></label></div><div className="formrow"><label>Hourly rate<input name="rate" type="number" defaultValue={editing.hourly_rate}/></label><label>Role<select name="role" defaultValue={editing.role}><option>employee</option><option>admin</option></select></label></div><label>Status<select name="status" defaultValue={editing.status}><option>active</option><option>inactive</option></select></label><button className="primary">Save changes</button></form></div>}</section>
}

function Payroll({employee,isAdmin}) {
  const [rows,setRows]=useState([]);
  async function load(){let q=supabase.from("salary_records").select("*").order("salary_month",{ascending:false});if(!isAdmin)q=q.eq("employee_id",employee.id);const {data}=await q;setRows(data||[])}useEffect(()=>{load()},[employee.id,isAdmin]);
  return <section className="content"><div className="panel"><div className="panelhead"><div><h3>{isAdmin?"Payroll records":"My salary"}</h3><p className="muted">Salary records are calculated from approved hours and hourly rate.</p></div><button className="iconbtn" onClick={load}><RefreshCw size={17}/></button></div><div className="tablewrap"><table><thead><tr><th>Month</th>{isAdmin&&<th>Employee</th>}<th>Rate</th><th>Hours</th><th>Gross</th><th>Adjustments</th><th>Final</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.salary_month}</td>{isAdmin&&<td>{r.employee_id.slice(0,8)}</td>}<td>₹{r.hourly_rate}</td><td>{fmtHours(r.total_hours)}</td><td>₹{Number(r.gross_salary||0).toFixed(2)}</td><td>₹{Number(r.adjustments||0).toFixed(2)}</td><td><b>₹{Number(r.final_salary||0).toFixed(2)}</b></td></tr>)}</tbody></table></div></div></section>
}

createRoot(document.getElementById("root")).render(<App/>);
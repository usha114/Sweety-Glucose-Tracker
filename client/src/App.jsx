import React, { useEffect, useMemo, useState } from "react";
import { api, todayLocal, slotLabels } from "./api";

function Auth({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const change = e => setForm({ ...form, [e.target.name]: e.target.value });
  async function submit(e) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      const data = await api(`/auth/${mode}`, { method: "POST", body: JSON.stringify(form) });
      localStorage.setItem("sweety_token", data.token);
      onAuth(data.user);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <main className="auth-wrap"><section className="auth-card">
    <div className="brand-mark">♥</div><p className="eyebrow">YOUR HEALTH, IN YOUR HANDS</p>
    <h1>Welcome to <span>Sweety</span></h1><p className="muted">A simple way to keep track of your glucose readings.</p>
    <div className="tabs"><button className={mode==="login"?"active":""} onClick={()=>{setMode("login");setError("");}}>Log in</button><button className={mode==="register"?"active":""} onClick={()=>{setMode("register");setError("");}}>Create account</button></div>
    <form onSubmit={submit} className="form">
      {mode==="register" && <label>Full name<input name="name" value={form.name} onChange={change} required minLength="2" placeholder="Your name"/></label>}
      <label>Email address<input type="email" name="email" value={form.email} onChange={change} required placeholder="you@example.com"/></label>
      <label>Password<input type="password" name="password" value={form.password} onChange={change} required minLength="8" placeholder="At least 8 characters"/></label>
      {error && <p className="error">{error}</p>}
      <button className="primary full" disabled={busy}>{busy?"Please wait…":mode==="login"?"Log in":"Create account"}</button>
    </form><p className="small muted">Your password is securely hashed before it is stored.</p>
  </section></main>;
}

function Stat({ label, value, unit="" }) {
  return <div className="stat"><span>{label}</span><strong>{value ?? "—"}{value !== null && value !== undefined ? unit : ""}</strong></div>;
}

function App() {
  const [user, setUser] = useState(null);
  const [readings, setReadings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayLocal());
  const [report, setReport] = useState(null);
  const [form, setForm] = useState({ date: todayLocal(), slot: "morning_fasting", value: "" });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadReadings() {
    const data = await api("/readings");
    setReadings(data.readings);
  }
  async function loadReport(date = selectedDate) {
    const data = await api(`/reports?date=${date}`);
    setReport(data);
  }
  useEffect(() => {
    const token = localStorage.getItem("sweety_token");
    if (!token) return;
    api("/auth/me").then(data => setUser(data.user)).catch(() => localStorage.removeItem("sweety_token"));
  }, []);
  useEffect(() => { if (user) { loadReadings().catch(e=>setError(e.message)); loadReport().catch(e=>setError(e.message)); } }, [user]);
  useEffect(() => { if (user) loadReport(selectedDate).catch(e=>setError(e.message)); }, [selectedDate]);
  const todays = useMemo(() => readings.filter(r => String(r.date).slice(0,10) === selectedDate), [readings, selectedDate]);

  function resetForm() { setForm({ date: todayLocal(), slot: "morning_fasting", value: "" }); setEditing(null); }
  async function saveReading(e) {
    e.preventDefault(); setError(""); setNotice(""); setLoading(true);
    try {
      const path = editing ? `/readings/${editing}` : "/readings";
      await api(path, { method: editing ? "PUT" : "POST", body: JSON.stringify({ ...form, value: Number(form.value) }) });
      setNotice(editing ? "Reading updated successfully." : "Reading saved successfully.");
      resetForm(); await loadReadings(); await loadReport(selectedDate);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }
  function editReading(r) {
    setEditing(r.id); setForm({ date: String(r.date).slice(0,10), slot: r.slot, value: String(r.value) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function deleteReading(id) {
    if (!window.confirm("Delete this glucose reading?")) return;
    setError(""); setNotice("");
    try { await api(`/readings/${id}`, { method: "DELETE" }); setNotice("Reading deleted."); await loadReadings(); await loadReport(selectedDate); }
    catch (err) { setError(err.message); }
  }
  function logout() { localStorage.removeItem("sweety_token"); setUser(null); setReadings([]); setReport(null); }

  if (!user) return <Auth onAuth={setUser}/>;
  return <div className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark small-mark">♥</span><span>Sweety</span></div><div className="top-actions"><span className="welcome">Hello, {user.name}</span><button className="ghost" onClick={logout}>Log out</button></div></header>
    <main className="content">
      <section className="intro"><div><p className="eyebrow">GLUCOSE OVERVIEW</p><h1>Your health dashboard</h1><p className="muted">Track your readings and keep your records in one place.</p></div><div className="date-picker"><label htmlFor="report-date">Report date</label><input id="report-date" type="date" max={todayLocal()} value={selectedDate} onChange={e=>setSelectedDate(e.target.value)}/></div></section>
      {error && <div className="alert error">{error}<button onClick={()=>setError("")}>×</button></div>}
      {notice && <div className="alert success">{notice}<button onClick={()=>setNotice("")}>×</button></div>}
      <section className="panel">
        <div className="section-heading"><div><p className="eyebrow">{editing?"UPDATE ENTRY":"NEW ENTRY"}</p><h2>{editing?"Edit glucose reading":"Add a glucose reading"}</h2></div><span className="pill">{todays.length}/4 readings on selected day</span></div>
        <form className="reading-form" onSubmit={saveReading}>
          <label>Date<input type="date" max={todayLocal()} required value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label>
          <label>Time slot<select value={form.slot} onChange={e=>setForm({...form,slot:e.target.value})}>{Object.entries(slotLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
          <label>Glucose (mg/dL)<input type="number" min="40" max="600" step="1" required placeholder="e.g. 110" value={form.value} onChange={e=>setForm({...form,value:e.target.value})}/></label>
          <div className="form-buttons"><button className="primary" disabled={loading}>{loading?"Saving…":editing?"Update reading":"Save reading"}</button>{editing && <button type="button" className="ghost" onClick={resetForm}>Cancel</button>}</div>
        </form>
      </section>

      <section className="panel">
        <div className="section-heading"><div><p className="eyebrow">DAILY LOG</p><h2>Readings for {selectedDate}</h2></div></div>
        {todays.length===0 ? <div className="empty"><div>☼</div><strong>No readings yet</strong><p>Add a reading to see it in your daily log.</p></div> :
          <div className="table-scroll"><table><thead><tr><th>Time slot</th><th>Glucose</th><th>Actions</th></tr></thead><tbody>{todays.map(r=><tr key={r.id}><td>{slotLabels[r.slot]}</td><td><strong>{r.value} mg/dL</strong></td><td><button className="text-btn" onClick={()=>editReading(r)}>Edit</button><button className="text-btn danger-text" onClick={()=>deleteReading(r.id)}>Delete</button></td></tr>)}</tbody></table></div>}
      </section>

      <section className="report-heading"><div><p className="eyebrow">YOUR NUMBERS</p><h2>Reports & insights</h2></div><button className="ghost" onClick={()=>loadReport().catch(e=>setError(e.message))}>Refresh reports</button></section>
      <div className="report-grid">
        <ReportCard title="Daily report" range={report?.ranges.daily} data={report?.daily}/>
        <ReportCard title="Month-to-date" range={report?.ranges.monthToDate} data={report?.monthToDate}/>
        <ReportCard title="Previous month" range={report?.ranges.previousMonth} data={report?.previousMonth}/>
      </div>
      <footer>Keep tracking, one day at a time. <span>Sweety · Blood Glucose Tracker</span></footer>
    </main>
  </div>;
}

function ReportCard({ title, range, data }) {
  return <section className="panel report-card"><p className="eyebrow">SUMMARY</p><h3>{title}</h3><p className="muted range">{range || "Loading date range…"}</p>
    {!data ? <p className="muted">Loading…</p> : data.count===0 ? <div className="empty compact"><strong>No readings yet</strong><p>There are no readings in this period.</p></div> :
      <><div className="stats"><Stat label="Highest" value={data.highest} unit=""/><Stat label="Lowest" value={data.lowest}/><Stat label="Average" value={data.average}/></div><div className="count-line">{data.count} reading{data.count===1?"":"s"}</div></>}
  </section>;
}
export default App;

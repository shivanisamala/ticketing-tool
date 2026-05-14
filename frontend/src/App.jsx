import { useState, useEffect, useCallback } from "react";

const API = "https://ticketing-backend-mfqq.onrender.com";

const priorities = ["Low", "Medium", "High", "Critical"];
const categories = ["IT Support", "HR", "Facilities", "Finance", "Security"];
const statuses = ["Open", "In Progress", "Pending", "Resolved", "Closed"];

const priorityColors = { Low: "#22c55e", Medium: "#f59e0b", High: "#f97316", Critical: "#ef4444" };
const statusColors   = { Open: "#3b82f6", "In Progress": "#8b5cf6", Pending: "#f59e0b", Resolved: "#22c55e", Closed: "#6b7280" };
const categoryIcons  = { "IT Support": "💻", HR: "👥", Facilities: "🏢", Finance: "💰", Security: "🔒" };

export default function App() {
  const [tickets, setTickets]   = useState([]);
  const [stats, setStats]       = useState(null);
  const [view, setView]         = useState("list");
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState("");
  const [filterStatus, setFilterStatus]     = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [form, setForm] = useState({ title: "", category: "IT Support", priority: "Medium", desc: "", assignee: "Unassigned" });
  const [formErr, setFormErr] = useState("");
  const [loading, setLoading]   = useState(false);
  const [toast, setToast]       = useState(null);
  const [apiDown, setApiDown]   = useState(false);
  const [theme, setTheme]       = useState("dark");
  const [mounted, setMounted]   = useState(false);

  const dark = theme === "dark";

  useEffect(() => { setMounted(true); }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const apiFetch = useCallback(async (path, opts = {}) => {
    try {
      const res = await fetch(API + path, { headers: { "Content-Type": "application/json" }, ...opts });
      if (!res.ok) { const e = await res.json().catch(() => ({ detail: "Error" })); throw new Error(e.detail || "Request failed"); }
      if (res.status === 204) return null;
      return res.json();
    } catch (err) {
      if (err.message === "Failed to fetch") setApiDown(true);
      throw err;
    }
  }, []);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (filterStatus !== "All") p.set("status", filterStatus);
      if (filterPriority !== "All") p.set("priority", filterPriority);
      if (search.trim()) p.set("search", search.trim());
      const data = await apiFetch(`/tickets?${p}`);
      setTickets(data);
      setApiDown(false);
    } catch {}
    finally { setLoading(false); }
  }, [filterStatus, filterPriority, search, apiFetch]);

  const loadStats = useCallback(async () => {
    try { setStats(await apiFetch("/stats")); } catch {}
  }, [apiFetch]);

  useEffect(() => { loadTickets(); loadStats(); }, [loadTickets, loadStats]);

  const openDetail = async (id) => {
    try { const t = await apiFetch(`/tickets/${id}`); setSelected(t); setView("detail"); }
    catch (e) { showToast(e.message, "error"); }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const updated = await apiFetch(`/tickets/${id}`, { method: "PATCH", body: JSON.stringify({ status: newStatus }) });
      setSelected(updated);
      setTickets(ts => ts.map(t => t.id === id ? updated : t));
      loadStats();
      showToast(`Status updated to "${newStatus}"`);
    } catch (e) { showToast(e.message, "error"); }
  };

  const deleteTicket = async (id) => {
    if (!confirm(`Delete ticket ${id}?`)) return;
    try {
      await apiFetch(`/tickets/${id}`, { method: "DELETE" });
      setView("list"); loadTickets(); loadStats();
      showToast(`${id} deleted`);
    } catch (e) { showToast(e.message, "error"); }
  };

  const submitTicket = async () => {
    if (!form.title.trim()) { setFormErr("Title is required."); return; }
    if (!form.desc.trim()) { setFormErr("Description is required."); return; }
    try {
      const created = await apiFetch("/tickets", { method: "POST", body: JSON.stringify(form) });
      setForm({ title: "", category: "IT Support", priority: "Medium", desc: "", assignee: "Unassigned" });
      setFormErr(""); setView("list"); loadTickets(); loadStats();
      showToast(`${created.id} created successfully!`);
    } catch (e) { setFormErr(e.message); }
  };

  const bg      = dark ? "#0d1117" : "#f4f6fb";
  const surface = dark ? "#161b22" : "#ffffff";
  const surface2= dark ? "#1c2130" : "#f0f2f8";
  const border  = dark ? "#30363d" : "#e2e6ef";
  const text1   = dark ? "#e6edf3" : "#1a1f36";
  const text2   = dark ? "#8b949e" : "#6b7280";
  const text3   = dark ? "#484f58" : "#b0b8c8";
  const accent  = "#3b82f6";

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .card { background: ${surface}; border: 1px solid ${border}; border-radius: 14px; transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease; }
    .card:hover { transform: translateY(-3px); box-shadow: 0 8px 28px ${dark ? "#0006" : "#1a1f3614"}; border-color: ${accent}66; cursor: pointer; }
    .fade-in { animation: fadeIn 0.3s ease both; }
    @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    .slide-in { animation: slideIn 0.25s ease both; }
    @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
    .s1{animation-delay:.04s} .s2{animation-delay:.08s} .s3{animation-delay:.12s} .s4{animation-delay:.16s} .s5{animation-delay:.20s}
    .btn { border:none; font-family:inherit; font-size:13px; cursor:pointer; border-radius:8px; font-weight:600; transition:all 0.15s; padding:9px 18px; }
    .btn-blue { background:${accent}; color:#fff; } .btn-blue:hover { background:#2563eb; transform:translateY(-1px); }
    .btn-ghost { background:transparent; color:${text2}; border:1px solid ${border}; } .btn-ghost:hover { border-color:${accent}; color:${accent}; }
    .btn-red { background:#ef444415; color:#f87171; border:1px solid #ef444430; } .btn-red:hover { background:#ef444425; }
    input,select,textarea { background:${surface2}; border:1px solid ${border}; color:${text1}; font-family:inherit; font-size:13px; border-radius:8px; padding:10px 12px; outline:none; transition:border 0.15s,box-shadow 0.15s; width:100%; }
    input:focus,select:focus,textarea:focus { border-color:${accent}; box-shadow:0 0 0 3px ${accent}22; }
    select option { background:${surface}; }
    label { display:block; color:${text2}; font-size:11px; letter-spacing:.8px; text-transform:uppercase; margin-bottom:6px; font-weight:600; }
    .tag { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; letter-spacing:.4px; }
    .toast { position:fixed; bottom:24px; right:24px; padding:12px 20px; border-radius:10px; font-size:13px; z-index:999; animation:fadeIn .2s ease; box-shadow:0 8px 24px #0005; border:1px solid ${border}; background:${surface}; color:${text1}; font-weight:500; }
    .sbtn { padding:6px 14px; border-radius:20px; font-size:12px; font-weight:700; cursor:pointer; border:1.5px solid transparent; font-family:inherit; transition:all 0.15s; }
    .sbtn:hover { transform:translateY(-1px); }
    .skeleton { background:linear-gradient(90deg,${surface2} 25%,${border} 50%,${surface2} 75%); background-size:200% 100%; animation:shimmer 1.2s infinite; border-radius:8px; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    .spin { display:inline-block; width:20px; height:20px; border:2px solid ${border}; border-top-color:${accent}; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to{transform:rotate(360deg)} }
    .nav-link { background:none; border:none; font-family:inherit; font-size:13px; font-weight:600; cursor:pointer; padding:7px 14px; border-radius:8px; transition:all 0.15s; color:${text2}; }
    .nav-link:hover { background:${surface2}; color:${text1}; }
    .nav-link.active { background:${accent}15; color:${accent}; }
    .search-wrap { position:relative; }
    .search-wrap input { padding-left:36px; }
    .search-icon { position:absolute; left:11px; top:50%; transform:translateY(-50%); color:${text3}; font-size:14px; pointer-events:none; }
    .toggle { width:46px; height:24px; border-radius:12px; border:none; cursor:pointer; position:relative; transition:background 0.3s; background:${dark ? accent : border}; flex-shrink:0; }
    .toggle::after { content:''; position:absolute; top:3px; left:${dark ? "25px" : "3px"}; width:18px; height:18px; border-radius:50%; background:white; transition:left 0.3s ease; }
  `;

  const SkeletonCard = () => (
    <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 14, overflow: "hidden" }}>
      <div style={{ height: 4, background: border }} />
      <div style={{ padding: "18px 20px 20px" }}>
        {[["40%", 12], ["75%", 16], ["55%", 12]].map(([w, h], i) => (
          <div key={i} className="skeleton" style={{ height: h, width: w, marginBottom: i < 2 ? 12 : 20 }} />
        ))}
        <div style={{ display: "flex", gap: 8 }}>
          <div className="skeleton" style={{ height: 24, width: 60, borderRadius: 20 }} />
          <div className="skeleton" style={{ height: 24, width: 80, borderRadius: 20 }} />
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: bg, minHeight: "100vh", color: text1, transition: "background 0.3s,color 0.3s" }}>
      <style>{css}</style>

      {/* Header */}
      <div style={{ background: surface, borderBottom: `1px solid ${border}`, padding: "14px 28px", display: "flex", alignItems: "center", gap: 14, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ width: 32, height: 32, background: `${accent}22`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎫</div>
        <span style={{ fontWeight: 700, fontSize: 16 }}>
          ServiceDesk <span style={{ color: accent }}>Lite</span>
          <span style={{ fontSize: 10, color: accent, marginLeft: 8, fontWeight: 600, background: `${accent}15`, padding: "2px 7px", borderRadius: 4 }}>FastAPI</span>
        </span>
        <div style={{ flex: 1 }} />
        <button className={`nav-link ${view === "list" ? "active" : ""}`} onClick={() => { setView("list"); loadTickets(); loadStats(); }}>All Tickets</button>
        <button className="btn btn-blue" onClick={() => setView("create")}>+ New Ticket</button>
        <button className="toggle" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} title="Toggle theme" />
      </div>

      {/* Stats strip — clickable filters */}
      {stats && (
        <div style={{ background: surface, borderBottom: `1px solid ${border}`, padding: "10px 28px", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {statuses.map(s => (
            <div key={s} onClick={() => setFilterStatus(filterStatus === s ? "All" : s)}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12,
                color: filterStatus === s ? statusColors[s] : text2,
                background: filterStatus === s ? statusColors[s] + "15" : "transparent",
                padding: "4px 10px", borderRadius: 20, cursor: "pointer", transition: "all 0.15s",
                fontWeight: filterStatus === s ? 700 : 500 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusColors[s], display: "inline-block" }} />
              {s}
              <span style={{ background: dark ? "#ffffff15" : "#00000010", borderRadius: 10, padding: "1px 7px", fontWeight: 700 }}>
                {stats.by_status?.[s] ?? 0}
              </span>
            </div>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 12, color: text3 }}>{stats.total} tickets total</span>
        </div>
      )}

      <div style={{ padding: "24px 28px", maxWidth: 1180, margin: "0 auto" }}>

        {apiDown && (
          <div style={{ background: "#ef444412", border: "1px solid #ef444430", borderRadius: 10, padding: "14px 18px", color: "#f87171", fontSize: 13, marginBottom: 20, lineHeight: 1.8 }}>
            ⚠ Cannot reach API at <strong>{API}</strong>. Start the backend:<br />
            <code style={{ background: dark ? "#0d1117" : "#f0f2f8", padding: "2px 8px", borderRadius: 4, marginTop: 4, display: "inline-block", fontSize: 12 }}>
              cd backend &amp;&amp; python -m uvicorn main:app --reload --port 8000
            </code>
          </div>
        )}

        {/* LIST */}
        {view === "list" && (
          <div className="fade-in">
            {stats && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 24 }}>
                {[
                  { label: "Total Tickets", val: stats.total, color: accent },
                  { label: "Open", val: stats.by_status?.Open ?? 0, color: statusColors.Open },
                  { label: "In Progress", val: stats.by_status?.["In Progress"] ?? 0, color: statusColors["In Progress"] },
                  { label: "Critical", val: stats.by_priority?.Critical ?? 0, color: priorityColors.Critical },
                ].map((s, i) => (
                  <div key={s.label} className={`s${i + 1} fade-in`}
                    style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, padding: "16px 18px" }}>
                    <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: 12, color: text2, fontWeight: 500, marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
              <div className="search-wrap" style={{ flex: "1 1 200px", minWidth: 160 }}>
                <span className="search-icon">🔍</span>
                <input placeholder="Search by ID or title…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: "auto" }}>
                <option>All</option>{statuses.map(s => <option key={s}>{s}</option>)}
              </select>
              <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ width: "auto" }}>
                <option>All</option>{priorities.map(p => <option key={p}>{p}</option>)}
              </select>
              {(search || filterStatus !== "All" || filterPriority !== "All") && (
                <button className="btn btn-ghost" onClick={() => { setSearch(""); setFilterStatus("All"); setFilterPriority("All"); }}>✕ Clear</button>
              )}
              <button className="btn btn-ghost" style={{ padding: "9px 12px" }} onClick={() => { loadTickets(); loadStats(); }}>↺</button>
            </div>

            {loading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 16 }}>
                {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : tickets.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: text3, fontSize: 14 }}>No tickets found.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 16 }}>
                {tickets.map((t, i) => (
                  <div key={t.id} className={`card fade-in s${Math.min(i + 1, 5)}`}
                    onClick={() => openDetail(t.id)} style={{ overflow: "hidden" }}>
                    {/* Priority color bar */}
                    <div style={{ height: 4, background: priorityColors[t.priority] }} />
                    <div style={{ padding: "16px 18px 18px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <span style={{ fontSize: 11, color: accent, fontWeight: 700, letterSpacing: ".5px" }}>{t.id}</span>
                        <span style={{ fontSize: 18 }}>{categoryIcons[t.category] || "📁"}</span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: text1, marginBottom: 6, lineHeight: 1.4 }}>{t.title}</div>
                      <div style={{ fontSize: 12, color: text2, marginBottom: 16, lineHeight: 1.5,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {t.desc}
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                        <span className="tag" style={{ background: priorityColors[t.priority] + "20", color: priorityColors[t.priority] }}>{t.priority}</span>
                        <span className="tag" style={{ background: statusColors[t.status] + "20", color: statusColors[t.status] }}>{t.status}</span>
                        <span className="tag" style={{ background: dark ? "#ffffff08" : "#00000008", color: text2 }}>{t.category}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: text3 }}>
                        <span>👤 {t.assignee}</span>
                        <span>🗓 {t.created}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DETAIL */}
        {view === "detail" && selected && (
          <div className="slide-in">
            <button className="btn btn-ghost" style={{ marginBottom: 20 }} onClick={() => setView("list")}>← Back</button>
            <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 16, overflow: "hidden" }}>
              <div style={{ height: 6, background: priorityColors[selected.priority] }} />
              <div style={{ padding: 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
                  <div>
                    <div style={{ color: accent, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{selected.id}</div>
                    <div style={{ fontWeight: 700, fontSize: 22, color: text1 }}>{selected.title}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span className="tag" style={{ background: priorityColors[selected.priority] + "20", color: priorityColors[selected.priority], fontSize: 12, padding: "4px 12px" }}>{selected.priority}</span>
                    <span className="tag" style={{ background: statusColors[selected.status] + "20", color: statusColors[selected.status], fontSize: 12, padding: "4px 12px" }}>{selected.status}</span>
                    <button className="btn btn-red" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => deleteTicket(selected.id)}>🗑 Delete</button>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14, background: surface2, borderRadius: 12, padding: 18, marginBottom: 24 }}>
                  {[["Category", categoryIcons[selected.category] + " " + selected.category],
                    ["Assignee", "👤 " + selected.assignee],
                    ["Created", "🗓 " + selected.created],
                    ["Ticket ID", selected.id]].map(([k, v]) => (
                    <div key={k}><label>{k}</label><div style={{ color: text1, fontSize: 14, fontWeight: 500 }}>{v}</div></div>
                  ))}
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label>Description</label>
                  <div style={{ color: text2, lineHeight: 1.75, fontSize: 14, background: surface2, borderRadius: 10, padding: 16 }}>{selected.desc}</div>
                </div>
                <div>
                  <label style={{ marginBottom: 12 }}>Update Status</label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {statuses.map(s => (
                      <button key={s} className="sbtn" onClick={() => updateStatus(selected.id, s)}
                        style={{ background: selected.status === s ? statusColors[s] : statusColors[s] + "18",
                          color: selected.status === s ? "#fff" : statusColors[s],
                          borderColor: statusColors[s] + "50" }}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CREATE */}
        {view === "create" && (
          <div style={{ maxWidth: 640 }} className="fade-in">
            <button className="btn btn-ghost" style={{ marginBottom: 20 }} onClick={() => { setView("list"); setFormErr(""); }}>← Back</button>
            <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 16, padding: 28 }}>
              <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 24, color: text1 }}>🎫 Create New Ticket</div>
              {formErr && (
                <div style={{ background: "#ef444415", border: "1px solid #ef444430", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13, marginBottom: 16 }}>⚠ {formErr}</div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div><label>Title *</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Brief description of the issue…" /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div><label>Category</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                      {categories.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div><label>Priority</label>
                    <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                      {priorities.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div><label>Assignee</label><input value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))} placeholder="Name or Unassigned" /></div>
                <div><label>Description *</label><textarea value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} rows={5} placeholder="Provide details about the issue…" style={{ resize: "vertical" }} /></div>
                {form.priority && (
                  <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${priorityColors[form.priority]}30`, background: priorityColors[form.priority] + "10" }}>
                    <div style={{ height: 4, background: priorityColors[form.priority] }} />
                    <div style={{ padding: "8px 12px", fontSize: 12, color: priorityColors[form.priority], fontWeight: 600 }}>Priority: {form.priority}</div>
                  </div>
                )}
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn btn-blue" onClick={submitTicket}>Submit Ticket</button>
                  <button className="btn btn-ghost" onClick={() => { setView("list"); setFormErr(""); }}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="toast" style={{ borderColor: toast.type === "error" ? "#ef444440" : border }}>
          {toast.type === "error" ? "❌" : "✅"} {toast.msg}
        </div>
      )}
    </div>
  );
}
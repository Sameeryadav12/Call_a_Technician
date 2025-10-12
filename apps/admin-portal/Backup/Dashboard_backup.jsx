// src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { api } from '../lib/api';
import { exportCSV } from '../lib/csv';
import Header from '../components/Header';

export default function Dashboard(){
  const { user } = useAuth();
  const name = user?.name || (user?.email?.split('@')[0]);
  const nav = useNavigate();

  // data
  const [jobs, setJobs] = useState([]);
  const [techNames, setTechNames] = useState([]);

  // ui state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // modal state (create/edit)
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankForm());

  // drawer state (view/notes/status)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeJob, setActiveJob] = useState(null);
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  // filters
  const [q, setQ] = useState('');
  const [fStatus, setFStatus] = useState('All');
  const [fPriority, setFPriority] = useState('All');

  function blankForm(){
    return { title:'', invoice:'', priority:'Low', status:'Open', technician:'', phone:'', description:'' };
  }

  async function load(){
    setLoading(true); setError('');
    try{
      const [jobsData, names] = await Promise.all([
        api('/jobs'),
        api('/techs/names')
      ]);
      setJobs(jobsData || []);
      setTechNames(names || []);
    }catch(e){ setError(e.message) }
    finally{ setLoading(false) }
  }
  useEffect(()=>{ load() }, []);

  const kpi = useMemo(()=>({
    total: jobs.length,
    open: jobs.filter(j=>j.status==='Open').length,
    progress: jobs.filter(j=>j.status==='In Progress').length,
    closed: jobs.filter(j=>j.status==='Closed').length,   // only Closed
  }), [jobs]);

  const filtered = useMemo(()=>{
    const qq = q.trim().toLowerCase();
    return jobs.filter(j=>{
      const text = [j.title,j.invoice,j.technician,j.phone,j.description]
        .some(v => (v||'').toLowerCase().includes(qq));
      const sOk = fStatus==='All' || j.status===fStatus;
      const pOk = fPriority==='All' || j.priority===fPriority;
      return (!qq || text) && sOk && pOk;
    });
  }, [jobs,q,fStatus,fPriority]);

  async function saveJob(){
    if(!form.title || !form.invoice){ alert('Title and Invoice are required'); return }
    try{
      if(editingId) await api(`/jobs/${editingId}`, { method:'PUT', body: form });
      else          await api('/jobs', { method:'POST', body: form });
      setOpen(false); setEditingId(null); setForm(blankForm()); await load();
    }catch(e){ alert(e.message) }
  }

  async function removeJob(id){
    if(!confirm('Delete this job?')) return;
    try{ await api(`/jobs/${id}`, { method:'DELETE' }); await load(); }
    catch(e){ alert(e.message) }
  }

  function openCreate(){ setEditingId(null); setForm(blankForm()); setOpen(true); }
  function openEdit(j){
    setEditingId(j._id || j.id);
    setForm({
      title: j.title||'',
      invoice: j.invoice||'',
      priority: j.priority||'Low',
      status: j.status||'Open',
      technician: j.technician||'',
      phone: j.phone||'',
      description: j.description||'',
    });
    setOpen(true);
  }

  // --- Drawer (view/notes/status) ---
  async function openDrawer(j){
    setActiveJob(j);
    setDrawerOpen(true);
    setNoteText('');
    try{
      const list = await api(`/jobs/${j._id || j.id}/notes`);
      setNotes(list || []);
    }catch{ setNotes([]) }
  }
  async function addNote(){
    if(!noteText.trim() || !activeJob) return;
    try{
      const created = await api(`/jobs/${activeJob._id || activeJob.id}/notes`, {
        method: 'POST',
        body: { text: noteText.trim() }
      });
      setNotes(n => [...n, created]);
      setNoteText('');
    }catch(e){ alert(e.message) }
  }
  async function updateStatus(newStatus){
    if(!activeJob) return;
    setSavingStatus(true);
    try{
      const updated = await api(`/jobs/${activeJob._id || activeJob.id}`, {
        method: 'PUT',
        body: { status: newStatus }
      });
      setActiveJob(updated);
      setJobs(arr => arr.map(x => (x._id===updated._id ? updated : x)));
    }catch(e){ alert(e.message) }
    finally{ setSavingStatus(false) }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Header />

      <main className="max-w-6xl mx-auto p-6 space-y-4">
        <section className="bg-slate-800/60 border border-white/10 rounded-2xl p-5">
          <h1 className="text-2xl font-bold">Welcome, {name} 👋</h1>
          <p className="text-slate-400">Here’s your dashboard.</p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <KPI label="Total Jobs" value={kpi.total}/>
          <KPI label="Open" value={kpi.open}/>
          <KPI label="In Progress" value={kpi.progress}/>
          <KPI label="Closed" value={kpi.closed}/>
        </section>

        <section className="bg-slate-800/60 border border-white/10 rounded-2xl p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
            <h2 className="font-semibold text-lg">Jobs</h2>
            <div className="flex flex-wrap items-center gap-2">
              <input className="px-3 py-2 rounded-xl bg-transparent border border-white/10"
                     placeholder="Search jobs…" value={q} onChange={e=>setQ(e.target.value)} />
              <select className="px-3 py-2 rounded-xl bg-transparent border border-white/10" value={fStatus} onChange={e=>setFStatus(e.target.value)}>
                {['All','Open','In Progress','Closed'].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              <select className="px-3 py-2 rounded-xl bg-transparent border border-white/10" value={fPriority} onChange={e=>setFPriority(e.target.value)}>
                {['All','Low','Medium','High','Urgent'].map(s=><option key={s} value={s}>{s}</option>)}
              </select>

              {/* Export CSV */}
              <button
                className="px-3 py-2 rounded-xl border border-white/10 hover:bg-white/5"
                onClick={()=>{
                  const cols = [
                    { key:'title',       label:'Title' },
                    { key:'invoice',     label:'Invoice' },
                    { key:'priority',    label:'Priority' },
                    { key:'status',      label:'Status' },
                    { key:'technician',  label:'Technician' },
                    { key:'phone',       label:'Phone' },
                    { key:'createdAt',   label:'Created' },
                    { key:'description', label:'Description' },
                  ];
                  const rows = filtered.map(j => ({
                    ...j,
                    createdAt: new Date(j.createdAt).toLocaleString(),
                  }));
                  exportCSV('jobs', cols, rows);
                }}
              >
                Export CSV
              </button>

              <button className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500" onClick={openCreate}>New Job</button>
            </div>
          </div>

          {loading && <p className="text-slate-400">Loading…</p>}
          {error && <p className="text-red-400">{error}</p>}

          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-slate-400">
                  <tr className="text-left">
                    <th className="py-2">Title</th>
                    <th className="py-2">Invoice</th>
                    <th className="py-2">Priority</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Technician</th>
                    <th className="py-2">Created</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(j=>(
                    <tr key={j._id || j.id} className="border-t border-white/5">
                      <td className="py-2 font-semibold">{j.title}</td>

                      {/* Jump to Invoices filtered by this number */}
                      <td className="py-2">
                        {j.invoice ? (
                          <button
                            className="underline text-sky-400"
                            onClick={()=> nav('/invoices?q=' + encodeURIComponent(j.invoice))}
                          >
                            {j.invoice}
                          </button>
                        ) : '—'}
                      </td>

                      <td className="py-2">{j.priority}</td>
                      <td className="py-2">{j.status}</td>
                      <td className="py-2">{j.technician || '—'}</td>
                      <td className="py-2">{new Date(j.createdAt).toLocaleString()}</td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          <button className="px-2 py-1 rounded-lg border border-white/10 hover:bg-white/5"
                                  onClick={()=>openDrawer(j)}>View</button>
                          <button className="px-2 py-1 rounded-lg border border-white/10 hover:bg-white/5"
                                  onClick={()=>openEdit(j)}>Edit</button>
                          <button className="px-2 py-1 rounded-lg border border-white/10 hover:bg-white/5"
                                  onClick={()=>removeJob(j._id || j.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length===0 && (
                    <tr><td colSpan={7} className="py-6 text-center text-slate-400">No matching jobs.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Create/Edit Job Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/60 grid place-items-center p-4"
             onClick={(e)=>{ if(e.target===e.currentTarget) setOpen(false) }}>
          <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl p-4">
            <h3 className="text-lg font-bold mb-3">{editingId? 'Edit Job' : 'Create Job'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Title" value={form.title} onChange={v=>setForm(f=>({...f,title:v}))} placeholder="Laptop won't boot"/>
              <Field label="Invoice" value={form.invoice} onChange={v=>setForm(f=>({...f,invoice:v}))} placeholder="INV-1024"/>
              <Select label="Priority" value={form.priority} onChange={v=>setForm(f=>({...f,priority:v}))} options={['Low','Medium','High','Urgent']}/>
              <Select label="Status" value={form.status} onChange={v=>setForm(f=>({...f,status:v}))} options={['Open','In Progress','Closed']}/>
              <div>
                <label className="text-sm text-slate-400">Technician</label>
                <input
                  list="techList"
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-transparent border border-white/10"
                  value={form.technician}
                  onChange={e=>setForm(f=>({...f, technician: e.target.value}))}
                  placeholder="Start typing…"
                />
                <datalist id="techList">
                  {techNames.map(t => (
                    <option key={t._id || t.name} value={t.name} />
                  ))}
                </datalist>
              </div>
              <Field label="Phone" value={form.phone} onChange={v=>setForm(f=>({...f,phone:v}))} placeholder="0400 123 456"/>
              <div className="md:col-span-2">
                <label className="text-sm text-slate-400">Description</label>
                <textarea className="w-full mt-1 px-3 py-2 rounded-xl bg-transparent border border-white/10" rows={3}
                  value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Problem details…"/>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button className="px-3 py-2 rounded-xl border border-white/10" onClick={()=>setOpen(false)}>Cancel</button>
              <button className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500" onClick={saveJob}>
                {editingId? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer: Job Details + Status + Notes */}
      {drawerOpen && activeJob && (
        <div className="fixed inset-0 z-20">
          <div className="absolute inset-0 bg-black/60" onClick={()=>setDrawerOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-slate-900 border-l border-white/10 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold">Job Details</h3>
              <button className="px-3 py-1.5 rounded-lg border border-white/10" onClick={()=>setDrawerOpen(false)}>Close</button>
            </div>

            <div className="space-y-2 text-sm">
              <Row label="Title" value={activeJob.title}/>
              <Row label="Invoice" value={activeJob.invoice}/>
              <Row label="Priority" value={activeJob.priority}/>
              <Row label="Technician" value={activeJob.technician || '—'}/>
              <Row label="Phone" value={activeJob.phone || '—'}/>
              <Row label="Created" value={new Date(activeJob.createdAt).toLocaleString()}/>
            </div>

            <div className="mt-4">
              <label className="text-sm text-slate-400">Status</label>
              <select
                className="w-full mt-1 px-3 py-2 rounded-xl bg-transparent border border-white/10"
                value={activeJob.status}
                disabled={savingStatus}
                onChange={e=>updateStatus(e.target.value)}
              >
                {['Open','In Progress','Closed'].map(s=> <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <hr className="my-4 border-white/10"/>

            <h4 className="font-semibold mb-2">Notes</h4>
            <div className="space-y-3">
              {notes.map(n=>(
                <div key={n._id} className="bg-slate-800/60 border border-white/10 rounded-xl p-3">
                  <div className="text-xs text-slate-400">{n.author} • {new Date(n.createdAt).toLocaleString()}</div>
                  <div className="whitespace-pre-wrap">{n.text}</div>
                </div>
              ))}
              {notes.length===0 && <div className="text-slate-400 text-sm">No notes yet.</div>}
            </div>

            <div className="mt-3">
              <textarea
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-transparent border border-white/10"
                placeholder="Add a note…"
                value={noteText}
                onChange={e=>setNoteText(e.target.value)}
              />
              <div className="flex justify-end mt-2">
                <button className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500" onClick={addNote}>Add note</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KPI({ label, value }){
  return (
    <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-4">
      <div className="text-slate-400 text-sm">{label}</div>
      <div className="text-2xl font-extrabold">{value}</div>
    </div>
  );
}
function Field({ label, value, onChange, placeholder }){
  return (
    <div>
      <label className="text-sm text-slate-400">{label}</label>
      <input className="w-full mt-1 px-3 py-2 rounded-xl bg-transparent border border-white/10"
        value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>
    </div>
  );
}
function Select({ label, value, onChange, options }){
  return (
    <div>
      <label className="text-sm text-slate-400">{label}</label>
      <select className="w-full mt-1 px-3 py-2 rounded-xl bg-transparent border border-white/10"
        value={value} onChange={e=>onChange(e.target.value)}>
        {options.map(o=> <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
function Row({ label, value }){
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-slate-400 text-sm">{label}</div>
      <div className="text-right">{value}</div>
    </div>
  );
}

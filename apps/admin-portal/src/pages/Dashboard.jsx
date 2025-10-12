import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthProvider';

export default function Dashboard() {
  const { user } = useAuth();
  const who = user?.name || user?.email?.split('@')[0] || 'Admin';
  const nav = useNavigate();
  const location = useLocation();

  const BASE_PRICE = 165; // covers up to 2 hours
  const EXTRA_PRICE = {
    0:   0,
    15:  20.625,
    30:  41.25,
    45:  61.875,
    60:  82.5,
  };
  // Add this after EXTRA_PRICE
  const currency = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' });


  // ----- data state -----
  const [jobs, setJobs] = useState([]);
  const [techNames, setTechNames] = useState([]); // raw list from API
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // ----- modal state (New/Edit job) -----
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const empty = {
    title: '',
    invoice: '',
    priority: 'Medium',
    status: 'Open',
    technician: '',
    phone: '',
    description: '',
    // scheduling + customer
    startAt: '',
    endAt: '',
    durationMins: 120, // default 2 hour
    additionalMins: 0,     // extra beyond base
    amount: BASE_PRICE,    // base price by default
    customerName: '',
    customerId: '' // 5-digit id or existing
  };
  const [form, setForm] = useState(empty);

  // ----- file input for Import -----
  const fileRef = useRef(null);

  const [customers, setCustomers] = useState([]);
  useEffect(() => { (async () => {
    try { setCustomers(await api('/customers')); } catch { setCustomers([]); }
  })(); }, []);

  useEffect(() => {
    load();
    const saved = localStorage.getItem('cat_theme');
    if (saved) document.documentElement.dataset.theme = saved;
  }, []);

  // If we were sent here from Customers with { state: { newJobFor: {...} } }, open New Job prefilled
useEffect(() => {
  const data = location.state?.newJobFor;
  if (data) {
    // Prefill with customer info, default base=120 (2h), extra=0.
    openNew({
      customerId: data.customerId || genCustomerId5(),
      customerName: data.customerName || '',
      phone: data.phone || '',
      durationMins: 120,
      additionalMins: 0,
    });

    // Clear the state so refresh/back won’t reopen the modal
    nav('/app', { replace: true, state: {} });
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [location.state]);


  async function load() {
    setLoading(true);
    setErr('');
    try {
      const [data, names] = await Promise.all([
        api('/jobs'),
        api('/techs/names').catch(() => []),
      ]);
      setJobs(Array.isArray(data) ? data : []);
      setTechNames(Array.isArray(names) ? names : []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Build a unique list of technician names (deduped, preserve first casing)
  const techOptions = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const t of techNames) {
      const name = (t?.name || t || '').trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(name);
      }
    }
    return out;
  }, [techNames]);

  // ----- UI actions -----
  function toggleTheme() {
    const root = document.documentElement;
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    localStorage.setItem('cat_theme', next);
  }

  function openNew(prefill = {}) {
    const startIso = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      new Date().getDate(),
      new Date().getHours(), 0, 0
    ).toISOString();

    const existingIds = new Set((customers || []).map(c => String(c.customerId)));
    const duration = Number(prefill.durationMins ?? 120);
    const extra = Number(prefill.additionalMins ?? 0);
    const endIso = addMinutesISO(startIso, duration + extra);

    setEditingId(null);
    setForm({
      ...empty,
      startAt: startIso,
      endAt: endIso,
      durationMins: duration,
      additionalMins: extra,
      amount: BASE_PRICE + (EXTRA_PRICE[extra] ?? 0),
      customerId: prefill.customerId || genUniqueCustomerId(existingIds),
      customerName: prefill.customerName || '',
      phone: prefill.phone || '',
      ...prefill,
    });
    setOpen(true);
  }

  function openEdit(j) {
  const add = Number(j.additionalMins || 0);
  const amt = BASE_PRICE + (EXTRA_PRICE[add] ?? 0);

  setEditingId(j._id);
  setForm({
    title: j.title || '',
    invoice: j.invoice || '',
    priority: j.priority || 'Medium',
    status: j.status || 'Open',
    technician: j.technician || '',
    phone: j.phone || '',
    description: j.description || '',

    // schedule
    startAt: j.startAt || '',
    endAt: j.endAt || (j.startAt ? addMinutesISO(j.startAt, 120 + add) : ''),

    // fixed base 2h + existing additional mins
    durationMins: 120,
    additionalMins: add,

    // pricing
    amount: amt,

    // customer
    customerName: j.customerName || '',
    customerId: j.customerId || '',
  });
  setOpen(true);
}


async function save() {
  try {
    // 1) Normalize duration + extra and recompute derived fields
    const base = Number(form.durationMins || 0);
    const extra = Number(form.additionalMins || 0);

    const endAt = form.startAt
      ? addMinutesISO(form.startAt, base + extra)
      : form.endAt;

    const amount = BASE_PRICE + (EXTRA_PRICE[extra] ?? 0);

    const body = {
      ...form,
      durationMins: base,
      additionalMins: extra,
      endAt,
      amount,
    };

    // 2) Create/Update the job
    let saved;
    if (editingId) {
      saved = await api(`/jobs/${editingId}`, { method: 'PUT', body });
      setJobs(prev => prev.map(j => (j._id === saved._id ? saved : j)));
    } else {
      saved = await api('/jobs', { method: 'POST', body });
      setJobs(prev => [saved, ...prev]);
    }

    // 3) Best-effort sync to a related invoice (if the job references one)
    //    Keeps the invoice amount and extra minutes aligned with the job.
    try {
      if (body.invoice) {
        // if your API supports ?number=… (common), this will work.
        const list = await api(`/invoices?number=${encodeURIComponent(body.invoice)}`).catch(() => []);
        const inv = Array.isArray(list) ? list[0] : null;

        if (inv?._id) {
          await api(`/invoices/${inv._id}`, {
            method: 'PUT',
            body: {
              fixedPrice: BASE_PRICE,
              additionalMins: extra,
              amount, // same total as job
            },
          });
        }
      }
    } catch {
      // ignore sync errors — saving the job must not fail
    }

    // 4) Close modal (table already updated above)
    setOpen(false);
  } catch (e) {
    alert(e.message || 'Save failed');
  }
}



  async function removeJob(id) {
    if (!confirm('Delete this job?')) return;
    try {
      await api(`/jobs/${id}`, { method: 'DELETE' });
      setJobs((prev) => prev.filter((j) => j._id !== id));
    } catch (e) {
      alert(e.message);
    }
  }

  function exportCSV() {
    const header = ['Title', 'Invoice', 'Priority', 'Status', 'Technician', 'Phone', 'Created'];
    const rows = jobs.map((j) => [
      j.title,
      j.invoice,
      j.priority,
      j.status,
      j.technician,
      j.phone,
      j.createdAt ? new Date(j.createdAt).toLocaleString() : '',
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((x) => `"${(x ?? '').toString().replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'jobs.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importClick() {
    fileRef.current?.click();
  }
  async function onImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const [, ...rest] = lines;
    const items = rest
      .map((line) => {
        const parts = line.split(',').map((s) => s.replace(/^"|"$/g, '').replace(/""/g, '"'));
        return {
          title: parts[0],
          invoice: parts[1],
          priority: parts[2],
          status: parts[3],
          technician: parts[4],
          phone: parts[5],
        };
      })
      .filter((r) => r.title && r.invoice);

    for (const row of items) {
      try {
        const created = await api('/jobs', { method: 'POST', body: row });
        setJobs((prev) => [created, ...prev]);
      } catch (e) {
        console.warn('Import row failed', row, e);
      }
    }
    e.target.value = '';
  }

  // helpers
  function toLocal(iso) {
    if (!iso) return '';
    const dt = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(
      dt.getHours()
    )}:${pad(dt.getMinutes())}`;
  }
  function fromLocal(local) {
    return new Date(local).toISOString();
  }
  function addMinutesISO(iso, minutes) {
    const d = new Date(iso);
    d.setMinutes(d.getMinutes() + minutes);
    return d.toISOString();
  }
  function genCustomerId5() {
    return String(Math.floor(10000 + Math.random() * 90000));
  }
  function genUniqueCustomerId(existingIds) {
  let id;
  do { id = String(Math.floor(10000 + Math.random() * 90000)); }
  while (existingIds.has(id));
  return id;
}

  // ----- quick KPIs -----
  const kpi = useMemo(
    () => ({
      total: jobs.length,
      open: jobs.filter((j) => j.status === 'Open').length,
      progress: jobs.filter((j) => j.status === 'In Progress').length,
      done: jobs.filter((j) => j.status === 'Closed').length,
    }),
    [jobs]
  );

  return (
    <div className="min-h-screen bg-[#000154] text-white">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold">
            Welcome, <span className="text-brand-sky">{who}</span> 👋
          </h1>

          <div className="flex gap-3">
            <button onClick={toggleTheme} className="px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-600">
              Theme
            </button>
            <button onClick={() => openNew()} className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600">
              New Job
            </button>
            <button onClick={exportCSV} className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600">
              Export
            </button>
            <button onClick={importClick} className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600">
              Import
            </button>
            <input ref={fileRef} type="file" accept=".csv" hidden onChange={onImport} />
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card label="Total Jobs" value={kpi.total} />
          <Card label="Open" value={kpi.open} />
          <Card label="In Progress" value={kpi.progress} />
          <Card label="Resolved" value={kpi.done} />
        </div>

        <h2 className="text-xl font-bold mb-3">Recent Jobs</h2>

        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-white/5">
              <tr className="text-slate-300">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Technician</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-slate-400" colSpan={7}>
                    {loading ? 'Loading…' : err ? `Error: ${err}` : 'No matching jobs.'}
                  </td>
                </tr>
              )}
              {jobs.map((j) => (
                <tr key={j._id} className="border-t border-white/10">
                  <td className="px-4 py-3">{j.title}</td>

                  {/* Invoice → click to open invoices filtered to this number */}
                  <td className="px-4 py-3">
                    {j.invoice ? (
                      <button
                        type="button"
                        className="underline text-sky-400 hover:text-sky-300"
                        onClick={() => nav(`/invoices?q=${encodeURIComponent((j.invoice || '').trim())}`)}
                        title="Find this invoice"
                      >
                        {j.invoice}
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>

                  <td className="px-4 py-3">{j.priority}</td>
                  <td className="px-4 py-3">{j.status}</td>
                  <td className="px-4 py-3">{j.technician || '—'}</td>
                  <td className="px-4 py-3">
                    {j.createdAt ? new Date(j.createdAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(j)}
                        className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => removeJob(j._id)}
                        className="px-3 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* New/Edit Job Modal */}
        {open && (
            <div
              className="fixed inset-0 bg-black/60 grid items-start justify-center p-4 overflow-y-auto"
              onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
            >

            <div className="w-full max-w-xl rounded-2xl bg-[#0e1036] border border-white/10 p-5 mt-6 max-h-[85vh] overflow-y-auto">
              {/* header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <h3 className="text-lg font-bold">{editingId ? 'Edit Job' : 'New Job'}</h3>
                <button onClick={() => setOpen(false)} className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20">
                  Close
                </button>
              </div>

              {/* scrollable content */}
              <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Title">
                    <input
                      className="w-full px-3 py-2 rounded-lg bg-transparent border border-white/10"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                  </Field>
                  <Field label="Invoice">
                    <input
                      className="w-full px-3 py-2 rounded-lg bg-transparent border border-white/10"
                      value={form.invoice}
                      onChange={(e) => setForm({ ...form, invoice: e.target.value })}
                    />
                  </Field>

                  <Field label="Priority">
                    <select
                      className="w-full px-3 py-2 rounded-lg bg-transparent border border-white/10"
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                      <option>Urgent</option>
                    </select>
                  </Field>
                  <Field label="Status">
                    <select
                      className="w-full px-3 py-2 rounded-lg bg-transparent border border-white/10"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option>Open</option>
                      <option>In Progress</option>
                      <option>Closed</option>
                    </select>
                  </Field>

                  {/* Technician with suggestions (deduped) */}
                  <Field label="Technician">
                    <input
                      list="techList"
                      className="w-full px-3 py-2 rounded-lg bg-transparent border border-white/10"
                      value={form.technician}
                      onChange={(e) => setForm({ ...form, technician: e.target.value })}
                      placeholder="Start typing…"
                      autoComplete="off"
                    />
                    <datalist id="techList">
                      {techOptions.map((name) => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                  </Field>

                  <Field label="Phone">
                    <input
                      className="w-full px-3 py-2 rounded-lg bg-transparent border border-white/10"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </Field>

                  <div className="md:col-span-2">
                    <Field label="Description">
                      <textarea
                        className="w-full px-3 py-2 rounded-lg bg-transparent border border-white/10"
                        rows={3}
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                      />
                    </Field>
                  </div>

                  {/* Scheduling (fixed base + adjustable extra) */}

{/* Start */}
<Field label="Start">
  <input
    type="datetime-local"
    className="w-full px-3 py-2 rounded-lg bg-transparent border border-white/10"
    value={toLocal(form.startAt)}
    onChange={e => {
      const startAt = fromLocal(e.target.value);
      const endAt = addMinutesISO(startAt, 120 + Number(form.additionalMins || 0)); // 2h base + extra
      const amount = BASE_PRICE + (EXTRA_PRICE[Number(form.additionalMins) || 0] ?? 0);
      setForm({ ...form, startAt, endAt, durationMins: 120, amount });
    }}
  />
</Field>

{/* Time (fixed base) */}
<Field label="Time (base)">
  <input
    className="w-full px-3 py-2 rounded-lg bg-transparent border border-white/10"
    value="2 hours"
    readOnly
  />
</Field>

{/* Additional time (adds charge) */}
<Field label="Additional Time Taken (+charge)">
  <select
    className="w-full px-3 py-2 rounded-lg bg-transparent border border-white/10"
    value={form.additionalMins || 0}
    onChange={e => {
      const additionalMins = Number(e.target.value);
      const endAt = form.startAt
        ? addMinutesISO(form.startAt, 120 + additionalMins) // base 2h + extra
        : '';
      const amount = BASE_PRICE + (EXTRA_PRICE[additionalMins] ?? 0);
      setForm({ ...form, additionalMins, endAt, amount, durationMins: 120 });
    }}
  >
    <option value={0}>None (+$0.00)</option>
    <option value={15}>+15 mins (+$20.625)</option>
    <option value={30}>+30 mins (+$41.25)</option>
    <option value={45}>+45 mins (+$61.875)</option>
    <option value={60}>+60 mins (+$82.50)</option>
  </select>
</Field>

{/* End (auto-derived) */}
<Field label="End">
  <input
    type="datetime-local"
    className="w-full px-3 py-2 rounded-lg bg-transparent border border-white/10"
    value={toLocal(form.endAt)}
    readOnly
  />
</Field>


{/* Total (read-only) */}
<Field label="Total price">
  <input
    className="w-full px-3 py-2 rounded-lg bg-transparent border border-white/10"
    value={currency.format(BASE_PRICE + (EXTRA_PRICE[Number(form.additionalMins)||0] ?? 0))}
    readOnly
  />
</Field>


                  {/* Customer */}
                  <Field label="Customer Name">
  <input
    list="customerList"
    className="w-full px-3 py-2 rounded-lg bg-transparent border border-white/10"
    value={form.customerName}
    onChange={e => {
      const name = e.target.value;
      const c = customers.find(x => (x.name || '').toLowerCase() === name.toLowerCase());
      if (c) {
        setForm(f => ({
          ...f,
          customerName: name,
          customerId: String(c.customerId || f.customerId),
          phone: c.phone || f.phone,
        }));
      } else {
        const existingIds = new Set((customers || []).map(x => String(x.customerId)));
        setForm(f => ({
          ...f,
          customerName: name,
          customerId: f.customerId || genUniqueCustomerId(existingIds),
        }));
      }
    }}
    placeholder="Customer full name"
  />
  <datalist id="customerList">
    {(customers || []).map(c => (
      <option key={c._id || c.customerId} value={c.name} />
    ))}
  </datalist>
</Field>

              
                  <Field label="Customer ID">
                    <div className="flex gap-2">
                      <input
                        className="w-full px-3 py-2 rounded-lg bg-transparent border border-white/10"
                        value={form.customerId}
                        onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                        placeholder="5-digit ID"
                      />
                      <button
  type="button"
  className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20"
  onClick={() => {
    const existingIds = new Set((customers || []).map(x => String(x.customerId)));
    setForm(f => ({ ...f, customerId: genUniqueCustomerId(existingIds) }));
  }}
  title="Generate ID"
>
  Generate
</button>

                    </div>
                  </Field>
                </div>
              </div>

              {/* sticky footer */}
              <div className="px-5 py-4 border-t border-white/10 bg-[#0e1036]">
                <div className="flex justify-between">
                  <div>
                    {editingId && (
                      <button
                        onClick={() => removeJob(editingId)}
                        className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/10"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setOpen(false)}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20"
                    >
                      Cancel
                    </button>
                    <button
  onClick={save}
  className="px-4 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue/90"
>
  {editingId ? 'Update' : 'Create'} · {currency.format(
    form.amount || (BASE_PRICE + (EXTRA_PRICE[Number(form.additionalMins)||0] ?? 0))
  )}
</button>

                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Card({ label, value }) {
  return (
    <div className="rounded-2xl p-5 bg-white/5">
      <div className="text-sm opacity-75">{label}</div>
      <div className="text-4xl font-extrabold mt-2">{value}</div>
    </div>
  );
}

function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <div className="text-sm text-slate-300 mb-1">{label}</div>
      {children}
    </label>
  );
}

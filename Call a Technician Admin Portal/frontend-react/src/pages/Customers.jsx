// src/pages/Customers.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { api } from '../lib/api';

export default function Customers() {
  const nav = useNavigate();

  // data
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // ui
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // form
  const blank = () => ({
    name: '',
    phone: '',
    address: '',
    suburb: '',
    customerId: '', // 5-digit
  });
  const [form, setForm] = useState(blank());

  // load
  async function load() {
    setLoading(true);
    setErr('');
    try {
      const data = await api('/customers');
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  // search + sort
  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return (items || [])
      .filter(c => {
        if (!qq) return true;
        const txt = [
          c.customerId, c.name, c.phone, c.address, c.suburb
        ].map(v => String(v || '').toLowerCase()).join(' ');
        return txt.includes(qq);
      })
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [items, q]);

  function openCreate() {
    setEditingId(null);
    setForm({
      ...blank(),
      customerId: genUniqueId(new Set(items.map(c => String(c.customerId))))
    });
    setOpen(true);
  }
  function openEdit(c) {
    setEditingId(c._id);
    setForm({
      name: c.name || '',
      phone: c.phone || '',
      address: c.address || '',
      suburb: c.suburb || '',
      customerId: String(c.customerId || ''),
    });
    setOpen(true);
  }

  function genUniqueId(existing) {
    let id;
    do { id = String(Math.floor(10000 + Math.random() * 90000)); }
    while (existing.has(id));
    return id;
  }

  async function save() {
    try {
      // simple client validation
      const cid = String(form.customerId || '').trim();
      const name = String(form.name || '').trim();

      if (!name) {
        alert('Name is required');
        return;
      }
      if (!/^\d{5}$/.test(cid)) {
        alert('Customer ID must be a 5-digit number');
        return;
      }

      // ensure uniqueness (client-side precheck; backend should also enforce)
      const exists = items.some(
        c => String(c.customerId) === cid && c._id !== editingId
      );
      if (exists) {
        alert('Customer ID already exists. Click Generate to get a new one.');
        return;
      }

      const payload = {
        name,
        phone: form.phone || '',
        address: form.address || '',
        suburb: form.suburb || '',
        customerId: cid,
      };

      if (editingId) {
        await api(`/customers/${editingId}`, { method: 'PUT', body: payload });
      } else {
        await api('/customers', { method: 'POST', body: payload });
      }

      setOpen(false);
      setEditingId(null);
      setForm(blank());
      await load();
    } catch (e) {
      alert(e.message || 'Save failed');
    }
  }

  async function removeOne(id) {
    if (!confirm('Delete this customer?')) return;
    try {
      await api(`/customers/${id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      alert(e.message || 'Delete failed');
    }
  }

  function createJobFor(c) {
    nav('/app', {
      state: {
        newJobFor: {
          customerId: String(c.customerId || ''),
          customerName: c.name || '',
          phone: c.phone || '',
        }
      }
    });
  }

  return (
    <div className="page">
      <Header />

      <main className="max-w-6xl mx-auto p-4 space-y-4">
        <section className="card p-4">
          {/* toolbar */}
          <div className="toolbar">
            <div className="flex flex-wrap items-center gap-2 w-full">
              <h2 className="text-lg font-semibold mr-2">Customers</h2>
              <input
                className="input flex-1 min-w-[220px]"
                placeholder="Search name / phone / address / suburb / ID…"
                value={q}
                onChange={e => setQ(e.target.value)}
              />
              <div className="toolbar-spacer" />
              <button className="btn btn-primary" onClick={openCreate}>
                New Customer
              </button>
            </div>
          </div>

          {/* list */}
          {loading && <p className="text-slate-300 mt-3">Loading…</p>}
          {err && <p className="text-rose-300 mt-3">{err}</p>}

          {!loading && !err && (
            <div className="overflow-x-auto mt-3">
              <table className="table text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-2">Customer ID</th>
                    <th className="py-2">Name</th>
                    <th className="py-2">Phone</th>
                    <th className="py-2 hidden md:table-cell">Address</th>
                    <th className="py-2">Suburb</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c._id}>
                      <td className="py-2 font-semibold">{c.customerId || '—'}</td>
                      <td className="py-2">{c.name || '—'}</td>
                      <td className="py-2">{c.phone || '—'}</td>
                      <td className="py-2 hidden md:table-cell">{c.address || '—'}</td>
                      <td className="py-2">{c.suburb || '—'}</td>
                      <td className="py-2">
                        <div className="flex flex-wrap gap-2">
                          <button className="btn-blue" onClick={() => createJobFor(c)}>
                            Create Job
                          </button>
                          <button className="btn-blue" onClick={() => openEdit(c)}>
                            Edit
                          </button>
                          <button className="btn-blue" onClick={() => removeOne(c._id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-300">
                        No customers found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* modal */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 grid items-start justify-center p-4 overflow-y-auto"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-2xl card p-4 bg-[#0e1036] border border-white/10 mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold">{editingId ? 'Edit Customer' : 'New Customer'}</h3>
              <button
                onClick={() => setOpen(false)}
                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Name">
                <input
                  className="input"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Full name"
                />
              </Field>
              <Field label="Phone">
                <input
                  className="input"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="04xx xxx xxx"
                />
              </Field>

              <Field label="Address" className="md:col-span-2">
                <input
                  className="input"
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="123 Example St"
                />
              </Field>

              <Field label="Suburb">
                <input
                  className="input"
                  value={form.suburb}
                  onChange={e => setForm(f => ({ ...f, suburb: e.target.value }))}
                  placeholder="Modbury"
                />
              </Field>

              <Field label="Customer ID (5 digits)">
                <div className="flex gap-2">
                  <input
                    className="input"
                    value={form.customerId}
                    onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}
                    placeholder="e.g. 12345"
                  />
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() =>
                      setForm(f => ({
                        ...f,
                        customerId: genUniqueId(new Set(items.map(c => String(c.customerId))))
                      }))
                    }
                  >
                    Generate
                  </button>
                </div>
              </Field>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button className="btn-blue" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>
                {editingId ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
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

import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import { api } from '../lib/api';

export default function Technicians() {
  const [techs, setTechs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blank());

  const [q, setQ] = useState('');
  const [active, setActive] = useState('All'); // All | Active | Inactive

  function blank() {
    return {
      name: '', email: '', phone: '', skills: '',
      active: true, notes: '',
      address: '',
      emergencyContact: '',
      preferredSuburb: '',          // ✅ unified name
    };
  }

  async function load() {
    setLoading(true); setError('');
    try {
      const data = await api('/techs');
      setTechs(Array.isArray(data) ? data : []);
    } catch (e) { setError(e.message || 'Failed'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return techs
      .filter(t => {
        const txt = [
          t.name, t.email, t.phone, t.notes,
          (t.skills || []).join(', '),
          t.address, t.emergencyContact,
          t.preferredSuburb,                 // ✅ included in search
        ].join(' ').toLowerCase();
        const match = !qq || txt.includes(qq);
        const aok = active === 'All' || (active === 'Active' ? t.active : !t.active);
        return match && aok;
      })
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [techs, q, active]);

  function openCreate() {
    setEditingId(null);
    setForm(blank());
    setOpen(true);
  }

  function openEdit(t) {
    setEditingId(t._id);
    setForm({
      name: t.name || '',
      email: t.email || '',
      phone: t.phone || '',
      skills: (t.skills || []).join(', '),
      active: !!t.active,
      notes: t.notes || '',
      address: t.address || '',
      emergencyContact: t.emergencyContact || '',
      preferredSuburb: t.preferredSuburb || '',    // ✅ unified
    });
    setOpen(true);
  }

  async function save() {
    const payload = {
      ...form,
      skills: (form.skills || '').split(',').map(s => s.trim()).filter(Boolean),
      preferredSuburb: (form.preferredSuburb || '').trim(),   // ✅ unified
    };
    try {
      if (editingId) await api(`/techs/${editingId}`, { method: 'PUT', body: payload });
      else await api('/techs', { method: 'POST', body: payload });
      setOpen(false);
      setEditingId(null);
      setForm(blank());
      await load();
    } catch (e) { alert(e.message || 'Save failed'); }
  }

  async function remove(id) {
    if (!confirm('Delete this technician?')) return;
    try { await api(`/techs/${id}`, { method: 'DELETE' }); await load(); }
    catch (e) { alert(e.message || 'Delete failed'); }
  }

  return (
    <div className="page">
      <Header />

      <main className="max-w-6xl mx-auto p-4 space-y-4">
        <section className="card p-4">
          <div className="toolbar">
            <div className="flex flex-wrap items-center gap-2 w-full">
              <h2 className="text-lg font-semibold mr-2">Technicians</h2>

              <input
                className="input flex-1 min-w-[220px]"
                placeholder="Search name/email/skill…"
                value={q}
                onChange={e => setQ(e.target.value)}
              />
              <select
                className="select w-[160px]"
                value={active}
                onChange={e => setActive(e.target.value)}
              >
                {['All', 'Active', 'Inactive'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <div className="toolbar-spacer" />
              <button className="btn btn-primary" onClick={openCreate}>New Technician</button>
            </div>
          </div>

          {loading && <p className="text-slate-300 mt-3">Loading…</p>}
          {error && <p className="text-rose-300 mt-3">{error}</p>}

          {!loading && !error && (
            <div className="overflow-x-auto mt-3">
              <table className="table text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-2">Name</th>
                    <th className="py-2">Email</th>
                    <th className="py-2">Phone</th>
                    <th className="py-2">Skills</th>
                    <th className="py-2 hidden md:table-cell">Address</th>
                    <th className="py-2 hidden md:table-cell">Emergency Contact</th>
                    <th className="py-2">Preferred Suburb</th>  {/* ✅ visible */}
                    <th className="py-2">Status</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t._id}>
                      <td className="py-2 font-semibold">{t.name}</td>
                      <td className="py-2">{t.email || '—'}</td>
                      <td className="py-2">{t.phone || '—'}</td>
                      <td className="py-2">{(t.skills || []).join(', ') || '—'}</td>
                      <td className="py-2 hidden md:table-cell">{t.address || '—'}</td>
                      <td className="py-2 hidden md:table-cell">{t.emergencyContact || '—'}</td>
                      <td className="py-2">{t.preferredSuburb || '—'}</td> {/* ✅ aligned */}
                      <td className="py-2">{t.active ? 'Active' : 'Inactive'}</td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          <button
                            className="btn-blue"
                            onClick={() => openEdit(t)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-blue"
                            onClick={() => remove(t._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-slate-300">
                        No technicians found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {open && (
        <div
          className="fixed inset-0 bg-black/60 grid place-items-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          {/* explicit background for the panel */}
          <div className="w-full max-w-2xl card p-4 bg-[#0e1036] border border-white/10 rounded-2xl">
            <h3 className="text-lg font-bold mb-3">
              {editingId ? 'Edit Technician' : 'New Technician'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Name" value={form.name}
                     onChange={v => setForm(f => ({ ...f, name: v }))}
                     placeholder="Jordan Smith" />
              <Field label="Email" value={form.email}
                     onChange={v => setForm(f => ({ ...f, email: v }))}
                     placeholder="jordan@acme.com" />
              <Field label="Phone" value={form.phone}
                     onChange={v => setForm(f => ({ ...f, phone: v }))}
                     placeholder="0400 123 456" />
              <Field label="Skills (comma-separated)" value={form.skills}
                     onChange={v => setForm(f => ({ ...f, skills: v }))}
                     placeholder="Windows, Networking" />

              <Field label="Address" value={form.address}
                     onChange={v => setForm(f => ({ ...f, address: v }))} />
              <Field label="Emergency contact" value={form.emergencyContact}
                     onChange={v => setForm(f => ({ ...f, emergencyContact: v }))} />

              <Field
                label="Preferred Work Suburb"
                value={form.preferredSuburb}
                onChange={v => setForm(f => ({ ...f, preferredSuburb: v }))}
                placeholder="e.g., Modbury"
              />

              <div className="flex items-center gap-2">
                <input
                  id="active"
                  type="checkbox"
                  checked={form.active}
                  onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                />
                <label htmlFor="active" className="text-sm text-slate-300">Active</label>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-slate-300">Notes</label>
                <textarea
                  className="input mt-1"
                  rows={3}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Certs, areas, etc."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-3">
              <button className="btn-blue" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={save}>
                {editingId ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="text-sm text-slate-300">{label}</label>
      <input
        className="input mt-1"
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

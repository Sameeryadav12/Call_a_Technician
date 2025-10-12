// src/pages/Invoices.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import { api } from '../lib/api';
import { exportCSV } from '../lib/csv';

const currency = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
});

// Pricing rules
const BASE_PRICE = 165; // fixed, covers up to 2 hours
const EXTRA_PRICE = {
  0:   0,
  15:  20.625,
  30:  41.25,
  45:  61.875,
  60:  82.5,
};

export default function Invoices() {
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // data
  const [invoices, setInvoices] = useState([]);

  // ui
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // modal
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blank());

  // filters (read ?q= from URL so Dashboard can prefill)
  const initialQ = searchParams.get('q') || '';
  const [q, setQ] = useState(initialQ);
  const [status, setStatus] = useState('All');

  function blank() {
    return {
      number: '',
      customer: '',
      // pricing
      fixedPrice: BASE_PRICE,
      additionalMins: 0,                // 0 | 15 | 30 | 45 | 60
      amount: BASE_PRICE,               // derived total = base + extra
      // other
      status: 'Unpaid',
      date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
      description: '',
    };
  }

  // derived total (single source of truth for UI display)
  const totalAmount = useMemo(
    () => BASE_PRICE + (EXTRA_PRICE[Number(form.additionalMins) || 0] ?? 0),
    [form.additionalMins]
  );

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await api('/invoices');
      setInvoices(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  // keep ?q in URL synced to the input
  useEffect(() => {
    if (q) searchParams.set('q', q);
    else searchParams.delete('q');
    setSearchParams(searchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return invoices.filter(inv => {
      const match =
        !qq ||
        [inv.number, inv.customer, inv.notes, inv.description]
          .some(v => (v || '').toLowerCase().includes(qq));
      const sOk = status === 'All' || inv.status === status;
      return match && sOk;
    });
  }, [invoices, q, status]);

  const kpi = useMemo(() => {
    const total = filtered.length;
    const unpaid = filtered
      .filter(i => i.status === 'Unpaid')
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const paid = filtered
      .filter(i => i.status === 'Paid')
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const overdue = filtered.filter(i => i.status === 'Overdue').length;
    return { total, unpaid, paid, overdue };
  }, [filtered]);

  function openCreate() {
    setEditingId(null);
    setForm(blank());
    setOpen(true);
  }

  function openEdit(inv) {
    setEditingId(inv._id);
    const add = Number(inv?.additionalMins ?? 0);
    const computedAmount =
      typeof inv?.amount === 'number'
        ? inv.amount
        : BASE_PRICE + (EXTRA_PRICE[add] ?? 0);

    setForm({
      number: inv.number || '',
      customer: inv.customer || '',
      fixedPrice: BASE_PRICE,
      additionalMins: add,
      amount: computedAmount, // derived total
      status: inv.status || 'Unpaid',
      date: (inv.date ? new Date(inv.date) : new Date()).toISOString().slice(0, 10),
      description: inv.description || inv.notes || '',
    });
    setOpen(true);
  }

  async function save() {
    // 1) Compute final amount from base + extra
    const additionalMins = Number(form.additionalMins || 0);
    const amount = BASE_PRICE + (EXTRA_PRICE[additionalMins] ?? 0);

    // 2) Build payload (map UI 'description' -> backend 'notes')
    const payload = {
      ...form,
      fixedPrice: BASE_PRICE,
      additionalMins,
      amount,
      notes: form.description,
      date: form.date ? new Date(form.date) : new Date(),
    };
    delete payload.description;

    try {
      // 3) Create / Update the invoice
      if (editingId) {
        await api(`/invoices/${editingId}`, { method: 'PUT', body: payload });
      } else {
        await api('/invoices', { method: 'POST', body: payload });
      }

      // 4) Sync related job duration & amount (if any)
      try {
        if (payload.number) {
          // find job that references this invoice number
          const jobs = await api(`/jobs?invoice=${encodeURIComponent(payload.number)}`).catch(() => []);
          const j = Array.isArray(jobs) ? jobs[0] : null;

          if (j && j.startAt) {
            // base durationMins (fallback to 120 = 2h if not present)
            const base = Number(j.durationMins || 120);
            const extra = Number(payload.additionalMins || 0);

            // new end time = start + base + extra
            const start = new Date(j.startAt);
            start.setMinutes(start.getMinutes() + base + extra);
            const newEndISO = start.toISOString();

            await api(`/jobs/${j._id}`, {
              method: 'PUT',
              body: {
                endAt: newEndISO,
                durationMins: base,
                additionalMins: extra,
                amount: payload.amount, // keep job amount aligned with invoice
              },
            });
          }
        }
      } catch {
        // swallow sync errors – invoice save should still succeed
      }

      // 5) Reset modal + refresh list
      setOpen(false);
      setEditingId(null);
      setForm(blank());
      await load();
    } catch (e) {
      alert(e.message || 'Save failed');
    }
  }

  async function remove(id) {
    if (!confirm('Delete this invoice?')) return;
    try {
      await api(`/invoices/${id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      alert(e.message || 'Delete failed');
    }
  }

  function exportFilteredCSV() {
    const cols = [
      { key: 'number', label: 'Number' },
      { key: 'customer', label: 'Customer' },
      { key: 'amount', label: 'Amount' },
      { key: 'status', label: 'Status' },
      { key: 'date', label: 'Date' },
      { key: 'description', label: 'Description' },
    ];
    const rows = filtered.map(i => ({
      ...i,
      description: i.description || i.notes || '',
      date: new Date(i.date || i.createdAt).toLocaleDateString(),
    }));
    exportCSV('invoices', cols, rows);
  }

  return (
    <div className="page">
      <Header />

      <main className="max-w-6xl mx-auto p-4 space-y-4">
        {/* KPIs */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <KPI label="Total Invoices" value={kpi.total} />
          <KPI label="Unpaid Total" value={currency.format(kpi.unpaid)} />
          <KPI label="Paid Total" value={currency.format(kpi.paid)} />
          <KPI label="Overdue Count" value={kpi.overdue} />
        </section>

        {/* Controls + table */}
        <section className="card p-4">
          <div className="toolbar">
            <div className="flex flex-wrap items-center gap-2 w-full">
              {/* LEFT: search + status */}
              <input
                className="input flex-1 min-w-[220px]"
                placeholder="Search number/customer…"
                value={q}
                onChange={e => setQ(e.target.value)}
              />
              <select
                className="select w-[160px]"
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                {['All', 'Unpaid', 'Paid', 'Overdue', 'Void'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {/* RIGHT: buttons */}
              <div className="toolbar-spacer" />
              <button className="btn btn-ghost" onClick={exportFilteredCSV}>Export CSV</button>
              <button className="btn btn-primary" onClick={openCreate}>New Invoice</button>
            </div>
          </div>

          {loading && <p className="text-slate-300">Loading…</p>}
          {error && <p className="text-red-300">{error}</p>}

          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="table text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-2">Number</th>
                    <th className="py-2">Customer</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Date</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(inv => (
                    <tr key={inv._id}>
                      <td className="py-2 font-semibold">
                        {/* Click number → print view (same tab) */}
                        <button
                          className="underline text-brand-psky"
                          onClick={() => nav(`/invoices/${inv._id}/print`)}
                          title="Open print view"
                        >
                          {inv.number}
                        </button>
                      </td>
                      <td className="py-2">{inv.customer || '—'}</td>
                      <td className="py-2">
                        {currency.format(Number(inv.amount) || 0)}
                      </td>
                      <td className="py-2">{inv.status}</td>
                      <td className="py-2">
                        {new Date(inv.date || inv.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          <button
                            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                            onClick={() => openEdit(inv)}
                          >
                            Edit
                          </button>
                          <button
                            className="px-3 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white"
                            onClick={() => remove(inv._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-300">
                        No invoices found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Create/Edit Modal */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 grid place-items-center p-4"
          onClick={e => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="card w-full max-w-2xl p-4 bg-[#0e1036]">
            <h3 className="text-lg font-bold mb-3">
              {editingId ? 'Edit Invoice' : 'New Invoice'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field
                label="Number"
                value={form.number}
                onChange={v => setForm(f => ({ ...f, number: v }))}
                placeholder="INV-1201"
              />
              <Field
                label="Customer"
                value={form.customer}
                onChange={v => setForm(f => ({ ...f, customer: v }))}
                placeholder="Acme Pty Ltd"
              />

              {/* Pricing */}
              <Field label="Time">
                <input className="input mt-1" value="2 hours" readOnly />
              </Field>

              <Field label="Fixed Price (covers up to 2 hrs)">
                <input className="input mt-1" value={currency.format(BASE_PRICE)} readOnly />
              </Field>

              <Select
                label="Additional Time Taken"
                value={form.additionalMins}
                onChange={v => setForm(f => ({
                  ...f,
                  additionalMins: Number(v),
                  amount: BASE_PRICE + (EXTRA_PRICE[Number(v)] ?? 0),
                }))}
                options={[
                  { value: 0,   label: 'None (+$0.00)' },
                  { value: 15,  label: '+15 mins (+$20.625)' },
                  { value: 30,  label: '+30 mins (+$41.25)' },
                  { value: 45,  label: '+45 mins (+$61.875)' },
                  { value: 60,  label: '+60 mins (+$82.50)' },
                ]}
              />

              <Field label="Total Price">
                <input
                  className="input mt-1"
                  value={currency.format(totalAmount)}
                  readOnly
                />
              </Field>

              <Select
                label="Status"
                value={form.status}
                onChange={v => setForm(f => ({ ...f, status: v }))}
                options={['Unpaid', 'Paid', 'Overdue', 'Void']}
              />

              <div>
                <label className="text-sm text-slate-300">Date</label>
                <input
                  type="date"
                  className="input mt-1"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-slate-300">Description</label>
                <textarea
                  className="input mt-1"
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Details…"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-3">
              <button className="btn-blue" onClick={() => setOpen(false)}>
                Cancel
              </button>
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

/* Small UI helpers */
function KPI({ label, value }) {
  return (
    <div className="card p-4">
      <div className="text-slate-300 text-sm">{label}</div>
      <div className="text-2xl font-extrabold">{value}</div>
    </div>
  );
}

/**
 * Field:
 * - If `children` is provided, render it (advanced / custom).
 * - Else render an input. If `onChange` exists → editable. Otherwise → read-only.
 */
function Field({ label, children, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="text-sm text-slate-300">{label}</label>
      {children ? (
        <div className="mt-1">{children}</div>
      ) : (
        <input
          className="input mt-1"
          type={type}
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          readOnly={!onChange}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  const normalized = (options || []).map(o =>
    typeof o === 'object' ? o : { value: o, label: o }
  );
  return (
    <div>
      <label className="text-sm text-slate-300">{label}</label>
      <select
        className="input mt-1"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {normalized.map(o => (
          <option key={String(o.value)} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

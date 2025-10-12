import { useState } from "react";
import { portal } from "../lib/portal";

export default function BookingForm() {
  const [form, setForm] = useState({
    title: "", description: "", customerName: "",
    phone: "", suburb: "", date: "", time: "", additionalMins: 0,
  });
  const [msg, setMsg] = useState("");

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("Submitting…");
    try {
      const startAt = new Date(`${form.date}T${form.time}`).toISOString();
      const result = await portal.createPublicJob({
        title: form.title,
        description: form.description,
        customerName: form.customerName,
        phone: form.phone,
        suburb: form.suburb,
        startAt,
        additionalMins: Number(form.additionalMins) || 0,
      });
      setMsg(`Success! Job ID: ${result.id}`);
    } catch (err) {
      setMsg(`Failed: ${err.message || err}`);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 max-w-md">
      <input className="border p-2 rounded" placeholder="Issue title" required
             value={form.title} onChange={e=>update("title", e.target.value)} />
      <textarea className="border p-2 rounded" placeholder="Description"
                value={form.description} onChange={e=>update("description", e.target.value)} />
      <input className="border p-2 rounded" placeholder="Customer name" required
             value={form.customerName} onChange={e=>update("customerName", e.target.value)} />
      <input className="border p-2 rounded" placeholder="Phone" required
             value={form.phone} onChange={e=>update("phone", e.target.value)} />
      <input className="border p-2 rounded" placeholder="Suburb"
             value={form.suburb} onChange={e=>update("suburb", e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <input className="border p-2 rounded" type="date" required
               value={form.date} onChange={e=>update("date", e.target.value)} />
        <input className="border p-2 rounded" type="time" required
               value={form.time} onChange={e=>update("time", e.target.value)} />
      </div>
      <label className="text-sm">
        Extra minutes (0/15/30/45/60)
        <input className="border p-2 rounded w-full" type="number"
               min="0" max="60" step="15"
               value={form.additionalMins}
               onChange={e=>update("additionalMins", e.target.value)} />
      </label>
      <button className="bg-blue-600 text-white rounded px-4 py-2">Book technician</button>
      <div className="text-sm">{msg}</div>
    </form>
  );
}

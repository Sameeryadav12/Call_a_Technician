'use strict';
/**
 * Call a Technician — API (Express + MongoDB + JWT)
 * Public endpoints used by the frontend.
 */

require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const bcrypt    = require('bcrypt');
const jwt       = require('jsonwebtoken');

const app  = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'change_me_in_env';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

/* ------------------------ MIDDLEWARE ------------------------ */
app.use(cors({
  origin: CLIENT_ORIGIN,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET','POST','PUT','DELETE','OPTIONS']
}));
app.use(express.json({ limit: '256kb' }));

/* ------------------------ HELPERS --------------------------- */
function sendErr(res, code, message) {
  return res.status(code).json({ error: message });
}

function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return sendErr(res, 401, 'No token');
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { sub, email, name? }
    next();
  } catch {
    return sendErr(res, 401, 'Invalid token');
  }
}

/* ------------------------ MODELS ---------------------------- */
const Job = require('./models/Job'); // expects startAt, endAt, owner, etc.

// User
const UserSchema = new mongoose.Schema({
  name:         { type: String, default: 'Admin' },
  email:        { type: String, required: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
}, { timestamps: true });
UserSchema.index({ email: 1 }, { unique: true });
const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Job notes
const JobNoteSchema = new mongoose.Schema({
  job:    { type: mongoose.Schema.Types.ObjectId, ref: 'Job', index: true, required: true },
  text:   { type: String, required: true },
  author: { type: String, default: '' },
  owner:  { type: String, index: true, required: true },
}, { timestamps: true });
const JobNote = mongoose.models.JobNote || mongoose.model('JobNote', JobNoteSchema);

// Invoices
const InvoiceSchema = new mongoose.Schema({
  number:    { type: String, required: true, trim: true }, // e.g. INV-1101
  customer:  { type: String, default: '' },
  amount:    { type: Number, default: 0 },
  status:    { type: String, enum: ['Unpaid','Paid','Overdue','Void'], default: 'Unpaid' },
  date:      { type: Date, default: Date.now },
  notes:     { type: String, default: '' },                 // UI “Description” maps here
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
}, { timestamps: true });
InvoiceSchema.index({ createdBy: 1, number: 1 }, { unique: true });
const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);

// Technicians
const TechSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, trim: true, default: '' },
  phone:    { type: String, trim: true, default: '' },
  skills:   { type: [String], default: [] },
  active:   { type: Boolean, default: true },
  notes:    { type: String, default: '' },
  address:  { type: String, default: '' },          // NEW
  emergencyContact: { type: String, default: '' },  // NEW
  createdBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
}, { timestamps: true });
const Tech = mongoose.models.Tech || mongoose.model('Tech', TechSchema);

// models/Technician.js
const mongoose = require('mongoose');

const SlotSchema = new mongoose.Schema(
  { start: { type: String, required: true }, end: { type: String, required: true } }, // "HH:mm"
  { _id: false }
);

const WorkingHoursSchema = new mongoose.Schema(
  {
    mon: { type: [SlotSchema], default: [{ start: '09:00', end: '17:00' }] },
    tue: { type: [SlotSchema], default: [{ start: '09:00', end: '17:00' }] },
    wed: { type: [SlotSchema], default: [{ start: '09:00', end: '17:00' }] },
    thu: { type: [SlotSchema], default: [{ start: '09:00', end: '17:00' }] },
    fri: { type: [SlotSchema], default: [{ start: '09:00', end: '17:00' }] },
    sat: { type: [SlotSchema], default: [] },
    sun: { type: [SlotSchema], default: [] },
  },
  { _id: false }
);

const TimeOffSchema = new mongoose.Schema(
  { start: { type: Date, required: true }, end: { type: Date, required: true }, reason: String },
  { _id: true }
);

const TechnicianSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  email: String,
  phone: String,
  skills: [String],
  active: { type: Boolean, default: true },

  workingHours: { type: WorkingHoursSchema, default: () => ({}) },
  timeOff: { type: [TimeOffSchema], default: [] },
});

module.exports = mongoose.model('Technician', TechnicianSchema);

// models/Job.js
JobSchema.index({ technician: 1, startAt: 1, endAt: 1 });


/* ------------------------ ROUTES ---------------------------- */
// Health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

/* ---------- Auth ---------- */
app.post('/api/auth/register', async (req, res) => {
  try {
    const name = (req.body.name || 'Admin').trim();
    const email = (req.body.email || '').toLowerCase().trim();
    const password = req.body.password || '';
    if (!email || !password) return sendErr(res, 400, 'Email and password are required');

    const existing = await User.findOne({ email }).lean();
    if (existing) return sendErr(res, 400, 'Email already registered');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });
    const token = jwt.sign({ sub: user._id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email } });
  } catch (e) { return sendErr(res, 400, e.message || 'Registration failed'); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = (req.body.email || '').toLowerCase().trim();
    const password = req.body.password || '';
    const user = await User.findOne({ email });
    if (!user) return sendErr(res, 400, 'Invalid credentials');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return sendErr(res, 400, 'Invalid credentials');

    const token = jwt.sign({ sub: user._id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email } });
  } catch (e) { return sendErr(res, 400, e.message || 'Login failed'); }
});

app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub).select('email name').lean();
    if (!user) return sendErr(res, 404, 'User not found');
    return res.json({ user });
  } catch (e) { return sendErr(res, 500, e.message || 'Failed to fetch user'); }
});

/* ---------- Jobs ---------- */
// list (+ calendar filters)
app.get('/api/jobs', auth, async (req, res) => {
  try {
    const {
      q = '', status, priority, invoice, technician,
      scheduled, from, to
    } = req.query;

    const query = { owner: req.user.sub };

    if (q) {
      query.$or = [
        { title:       { $regex: q, $options: 'i' } },
        { invoice:     { $regex: q, $options: 'i' } },
        { technician:  { $regex: q, $options: 'i' } },
        { phone:       { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }
    if (status && status !== 'All')     query.status = status;
    if (priority && priority !== 'All') query.priority = priority;
    if (invoice)                        query.invoice = invoice;
    if (technician && technician !== 'All') query.technician = technician;

    if (scheduled === 'true') {
      query.startAt = { $ne: null };
      const and = [];
      if (from) and.push({ endAt:   { $gte: new Date(from) } });
      if (to)   and.push({ startAt: { $lt:  new Date(to)   } });
      if (and.length) query.$and = and;
    }

    const jobs = await Job.find(query).sort({ createdAt: -1 }).lean();
    return res.json(jobs);
  } catch (e) { return sendErr(res, 500, e.message || 'Failed to load jobs'); }
});

// create (+ start/end)
app.post('/api/jobs', auth, async (req, res) => {
  try {
    let { title, invoice, priority, status, technician, phone, description, startAt, endAt } = req.body;
    if (!title || !invoice) return sendErr(res, 400, 'Title and Invoice are required');

    startAt = startAt ? new Date(startAt) : null;
    endAt   = endAt   ? new Date(endAt)   : null;
    if (startAt && endAt && endAt < startAt) return sendErr(res, 400, 'endAt must be after startAt');

    const job = await Job.create({
      title, invoice, priority, status, technician, phone, description,
      startAt, endAt,
      owner: req.user.sub
    });
    return res.json(job);
  } catch (e) { return sendErr(res, 400, e.message || 'Create failed'); }
});

// update
app.put('/api/jobs/:id', auth, async (req, res) => {
  try {
    const update = { ...req.body };
    if ('startAt' in update) update.startAt = update.startAt ? new Date(update.startAt) : null;
    if ('endAt'   in update) update.endAt   = update.endAt   ? new Date(update.endAt)   : null;
    if (update.startAt && update.endAt && update.endAt < update.startAt) {
      return sendErr(res, 400, 'endAt must be after startAt');
    }

    const updated = await Job.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.sub },
      update,
      { new: true }
    ).lean();
    if (!updated) return sendErr(res, 404, 'Not found');
    return res.json(updated);
  } catch (e) { return sendErr(res, 400, e.message || 'Update failed'); }
});

// delete
app.delete('/api/jobs/:id', auth, async (req, res) => {
  try {
    const out = await Job.deleteOne({ _id: req.params.id, owner: req.user.sub });
    if (out.deletedCount === 0) return sendErr(res, 404, 'Not found');
    return res.json({ ok: true });
  } catch (e) { return sendErr(res, 400, e.message || 'Delete failed'); }
});

/* ---------- Job Notes ---------- */
app.get('/api/jobs/:id/notes', auth, async (req, res) => {
  try {
    const notes = await JobNote.find({ job: req.params.id, owner: req.user.sub })
      .sort({ createdAt: 1 }).lean();
    res.json(notes);
  } catch (e) { res.status(500).json({ error: e.message || 'Failed to load notes' }); }
});

app.post('/api/jobs/:id/notes', auth, async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || !text.trim()) return res.status(400).json({ error: 'Note text is required' });
    const note = await JobNote.create({
      job: req.params.id,
      text: text.trim(),
      author: (req.user?.name || req.user?.email || 'Admin'),
      owner: req.user.sub
    });
    res.json(note);
  } catch (e) { res.status(400).json({ error: e.message || 'Failed to add note' }); }
});

/* ---------- Invoices ---------- */
// list
app.get('/api/invoices', auth, async (req, res) => {
  try {
    const { q = '', status } = req.query;
    const query = {
      createdBy: req.user.sub,
      ...(q ? { $or: [
        { number:   { $regex: q, $options: 'i' } },
        { customer: { $regex: q, $options: 'i' } },
        { notes:    { $regex: q, $options: 'i' } }, // description
      ] } : {}),
      ...(status && status !== 'All' ? { status } : {}),
    };
    const list = await Invoice.find(query).sort({ createdAt: -1 }).lean();
    res.json(list);
  } catch (e) { return sendErr(res, 500, 'Failed to load invoices'); }
});

// create (accepts description -> notes)
app.post('/api/invoices', auth, async (req, res) => {
  try {
    const {
      number,
      customer = '',
      amount = 0,
      status = 'Unpaid',
      date = Date.now(),
      notes = '',
      description
    } = req.body || {};

    if (!number) return res.status(400).json({ error: 'Invoice number is required' });

    const doc = await Invoice.create({
      number: String(number).trim(),
      customer,
      amount: Number(amount) || 0,
      status,
      date,
      notes: (description ?? notes ?? ''),
      createdBy: req.user.sub
    });
    res.json(doc);
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ error: 'Invoice number already exists' });
    res.status(500).json({ error: e.message });
  }
});

// update (owner-scoped; map description -> notes)
app.put('/api/invoices/:id', auth, async (req, res) => {
  const { id } = req.params;
  const payload = { ...(req.body || {}) };
  if (payload.amount != null) payload.amount = Number(payload.amount) || 0;
  if ('description' in payload) { payload.notes = payload.description; delete payload.description; }
  try {
    const doc = await Invoice.findOneAndUpdate(
      { _id: id, createdBy: req.user.sub },
      payload,
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: 'Invoice not found' });
    res.json(doc);
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ error: 'Invoice number already exists' });
    res.status(500).json({ error: e.message });
  }
});

// delete (owner-scoped)
app.delete('/api/invoices/:id', auth, async (req, res) => {
  const { id } = req.params;
  const doc = await Invoice.findOneAndDelete({ _id: id, createdBy: req.user.sub });
  if (!doc) return res.status(404).json({ error: 'Invoice not found' });
  res.json({ ok: true });
});

// single (owner-scoped)
app.get('/api/invoices/:id', auth, async (req, res) => {
  const { id } = req.params;
  const doc = await Invoice.findOne({ _id: id, createdBy: req.user.sub }).lean();
  if (!doc) return res.status(404).json({ error: 'Invoice not found' });
  res.json(doc);
});

/* ---------- Technicians ---------- */
// list (+ filters)
app.get('/api/techs', auth, async (req, res) => {
  const { q = '', active } = req.query;
  const query = {
    createdBy: req.user.sub,
    ...(q ? { $or: [
      { name:  { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } },
      { notes: { $regex: q, $options: 'i' } },
      { address: { $regex: q, $options: 'i' } },
      { emergencyContact: { $regex: q, $options: 'i' } },
    ] } : {}),
    ...(active === 'true' ? { active: true } : active === 'false' ? { active: false } : {}),
  };
  const docs = await Tech.find(query).sort({ name: 1 }).lean();
  res.json(docs);
});

// names (active + owner-scoped) for dropdowns
app.get('/api/techs/names', auth, async (req, res) => {
  const list = await Tech.find({ createdBy: req.user.sub, active: true })
    .select('name').sort({ name: 1 }).lean();
  res.json(list);
});

// create (accept address & emergencyContact)
app.post('/api/techs', auth, async (req, res) => {
  const {
    name, email = '', phone = '', skills = [],
    active = true, notes = '', address = '', emergencyContact = ''
  } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Name required' });
  const doc = await Tech.create({
    name, email, phone, skills, active, notes, address, emergencyContact,
    createdBy: req.user.sub
  });
  res.json(doc);
});

// update (owner-scoped)
app.put('/api/techs/:id', auth, async (req, res) => {
  const { id } = req.params;
  const doc = await Tech.findOneAndUpdate(
    { _id: id, createdBy: req.user.sub },
    req.body || {},
    { new: true }
  );
  if (!doc) return res.status(404).json({ error: 'Technician not found' });
  res.json(doc);
});

// delete (owner-scoped)
app.delete('/api/techs/:id', auth, async (req, res) => {
  const { id } = req.params;
  const doc = await Tech.findOneAndDelete({ _id: id, createdBy: req.user.sub });
  if (!doc) return res.status(404).json({ error: 'Technician not found' });
  res.json({ ok: true });
});

/* ------------------------ STARTUP --------------------------- */
async function start() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ Missing MONGODB_URI in .env');
      process.exit(1);
    }
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
  } catch (e) {
    console.error('❌ Failed to connect to MongoDB:', e.message);
    console.error('Check: Network Access, DB user/password, and MONGODB_URI.');
    process.exit(1);
  }
}
mongoose.connection.on('error', err => console.error('Mongo connection error:', err.message));
start();

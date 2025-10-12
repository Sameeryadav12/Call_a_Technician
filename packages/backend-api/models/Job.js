const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema(
  {
    owner: { type: String, required: true, index: true },
    title: { type: String, required: true },
    invoice: { type: String, required: true },
    priority: { type: String, enum: ['Low','Medium','High','Urgent'], default: 'Low' },
    status:   { type: String, enum: ['Open','In Progress','Closed'], default: 'Open' },
    technician: { type: String, default: '' },
    phone: { type: String, default: '' },
    description: { type: String, default: '' },

    // calendar scheduling
    startAt: { type: Date, default: null },
    endAt:   { type: Date, default: null },
  },
  { timestamps: true }
);

// indexes belong here (not in server.js)
JobSchema.index({ owner: 1, startAt: 1, endAt: 1 });
JobSchema.index({ owner: 1, technician: 1, startAt: 1 });

module.exports = mongoose.model('Job', JobSchema);

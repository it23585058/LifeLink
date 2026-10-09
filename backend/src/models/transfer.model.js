const mongoose = require('mongoose');

const transferEventSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    kind: { type: String, default: 'status_change', trim: true },
    by: { type: String, default: 'System', trim: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const transferSchema = new mongoose.Schema(
  {
    caseCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
    },
    ward: { type: String, trim: true },
    attendingStaff: { type: String, trim: true },
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BloodRequest',
    },
    donorName: {
      type: String,
      required: true,
      trim: true,
    },
    bloodGroup: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    component: {
      type: String,
      required: true,
      enum: ['whole_blood', 'platelets', 'ffp'],
      default: 'whole_blood',
    },
    units: {
      type: Number,
      default: 1,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} must be an integer.',
      },
    },
    transitMode: {
      type: String,
      default: 'Personal Vehicle',
      trim: true,
    },
    vehicleInfo: { type: String, trim: true },
    etaMinutes: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        'dispatched',
        'arrived_at_gate',
        'triage_crossmatch',
        'completed',
        'cancelled',
      ],
      default: 'dispatched',
    },
    events: {
      type: [transferEventSchema],
      default: () => [
        {
          label: 'Dispatched & En Route',
          kind: 'status_change',
          by: 'System',
          at: new Date(),
        },
      ],
    },
  },
  { timestamps: true }
);

transferSchema.index({ hospital: 1, status: 1 });

module.exports = mongoose.model('Transfer', transferSchema);

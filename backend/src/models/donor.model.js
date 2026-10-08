const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    bloodGroup: { type: String, required: true, uppercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    available: { type: Boolean, default: true },
    lastDonationAt: { type: Date },
  

  nic: { type: String, trim: true, uppercase: true, unique: true, sparse: true },
    eligibility: {
      ageWeightOk: { type: Boolean, default: false },
      donationIntervalOk: { type: Boolean, default: false },
      medicalSafetyOk: { type: Boolean, default: false },
    },
    emergencyAlerts: { type: Boolean, default: true },
    travelRadiusKm: { type: Number, default: 5 },
  },

  { timestamps: true }
);

donorSchema.index({ bloodGroup: 1, city: 1, available: 1 });

module.exports = mongoose.model('Donor', donorSchema);
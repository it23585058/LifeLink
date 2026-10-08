const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ['hospital', 'blood_bank', 'ngo_camp'],
      default: 'hospital',
    },
    city: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    accreditation: {
      type: String,
      enum: ['nbts_accredited', 'hospital_verified', 'unverified'],
      default: 'unverified',
    },
    phone: { type: String, required: true, trim: true },
    wardExtension: { type: String, trim: true },
    portalUrl: { type: String, trim: true },
  },
  { timestamps: true }
);

hospitalSchema.index({ city: 1, type: 1, accreditation: 1 });

module.exports = mongoose.model('Hospital', hospitalSchema);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const donorSchema = new mongoose.Schema(
  {
    // =========================
    // Basic Donor Information
    // =========================
    name: {
      type: String,
      required: true,
      trim: true,
    },

    bloodGroup: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    nic: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },

    // =========================
    // Donor Availability
    // =========================
    available: {
      type: Boolean,
      default: true,
    },

    emergencyAlerts: {
      type: Boolean,
      default: true,
    },

    travelRadiusKm: {
      type: Number,
      default: 5,
      min: 1,
    },

    // =========================
    // Donor Credentials
    // =========================
    age: {
      type: Number,
      min: 18,
      max: 100,
    },

    weightKg: {
      type: Number,
      min: 30,
      max: 300,
    },

    heightCm: {
      type: Number,
      min: 100,
      max: 250,
    },

    lastDonationAt: {
      type: Date,
    },

    // =========================
    // Medical Information
    // =========================
    bloodPressure: {
      type: String,
      trim: true,
    },

    hemoglobin: {
      type: Number,
      min: 1,
      max: 30,
    },

    diabetes: {
      type: Boolean,
      default: false,
    },

    highBloodPressure: {
      type: Boolean,
      default: false,
    },

    heartDisease: {
      type: Boolean,
      default: false,
    },

    otherMedicalConditions: {
      type: String,
      trim: true,
    },

    previousSurgeries: {
      type: String,
      trim: true,
    },

    currentlySick: {
      type: Boolean,
      default: false,
    },

    takingMedication: {
      type: Boolean,
      default: false,
    },

    medicationDetails: {
      type: String,
      trim: true,
    },

    allergies: {
      type: String,
      trim: true,
    },

    recentDonationComplications: {
      type: String,
      trim: true,
    },

    // =========================
    // Donation Eligibility
    // =========================
    eligibility: {
      ageWeightOk: {
        type: Boolean,
        default: false,
      },

      donationIntervalOk: {
        type: Boolean,
        default: false,
      },

      medicalSafetyOk: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// =========================
// Search Index
// =========================
donorSchema.index({
  bloodGroup: 1,
  city: 1,
  available: 1,
});

// =========================
// Password Hashing
// =========================
donorSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// =========================
// Password Compare
// =========================
donorSchema.methods.comparePassword = function (plainPassword) {
  if (!this.password) {
    return false;
  }

  return bcrypt.compare(plainPassword, this.password);
};

// =========================
// Never Return Password
// =========================
donorSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

const Donor = mongoose.model('Donor', donorSchema);

module.exports = Donor;
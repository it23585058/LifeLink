const mongoose = require('mongoose');

const bloodInventorySchema = new mongoose.Schema(
  {
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
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
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} must be an integer.',
      },
    },
    lowThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },
    updatedBy: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

bloodInventorySchema.index({ hospital: 1, bloodGroup: 1, component: 1 }, { unique: true });

function stockStatus(units, lowThreshold = 5) {
  if (units <= 0) return 'out';
  if (units <= lowThreshold) return 'low';
  return 'available';
}

const BloodInventory = mongoose.model('BloodInventory', bloodInventorySchema);
BloodInventory.stockStatus = stockStatus;

module.exports = BloodInventory;

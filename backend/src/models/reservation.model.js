const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
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
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} must be an integer.',
      },
    },
    reservedBy: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'collected', 'cancelled'],
      default: 'pending',
    },
    note: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

reservationSchema.index({ reservedBy: 1, status: 1 });
reservationSchema.index({ hospital: 1, status: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);

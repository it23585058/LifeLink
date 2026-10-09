const mongoose = require("mongoose");

const donorResponseSchema = new mongoose.Schema(
  {
    bloodRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BloodRequest",
      required: true,
    },

    donorId: {
      type: String,
      required: true,
    },

    donorName: {
      type: String,
      required: true,
    },

    donorContact: {
      type: String,
      required: true,
    },

    response: {
      type: String,
      enum: ["WILL_DONATE", "CANNOT_DONATE"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("DonorResponse", donorResponseSchema);
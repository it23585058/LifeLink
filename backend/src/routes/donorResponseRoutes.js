const express = require("express");
const router = express.Router();

const DonorResponse = require("../models/DonorResponse");
const BloodRequest = require("../models/BloodRequest");

// ========================================
// CREATE DONOR RESPONSE
// ========================================

router.post("/", async (req, res) => {
  try {
    const {
      bloodRequestId,
      donorId,
      donorName,
      donorContact,
      response,
    } = req.body;

    // Check fields
    if (
      !bloodRequestId ||
      !donorId ||
      !donorName ||
      !donorContact ||
      !response
    ) {
      return res.status(400).json({
        message: "Please provide all donor response details",
      });
    }

    // Check whether blood request exists
    const bloodRequest = await BloodRequest.findById(bloodRequestId);

    if (!bloodRequest) {
      return res.status(404).json({
        message: "Blood request not found",
      });
    }

    // Check if donor already responded
    const existingResponse = await DonorResponse.findOne({
      bloodRequestId,
      donorId,
    });

    if (existingResponse) {
      return res.status(400).json({
        message: "You have already responded to this request",
      });
    }

    const donorResponse = new DonorResponse({
      bloodRequestId,
      donorId,
      donorName,
      donorContact,
      response,
    });

    const savedResponse = await donorResponse.save();

    res.status(201).json({
      message: "Donor response saved successfully",
      data: savedResponse,
    });
  } catch (error) {
    console.error("Donor response error:", error);

    res.status(500).json({
      message: "Failed to save donor response",
      error: error.message,
    });
  }
});

// ========================================
// GET RESPONSES FOR A BLOOD REQUEST
// ========================================

router.get("/request/:bloodRequestId", async (req, res) => {
  try {
    const responses = await DonorResponse.find({
      bloodRequestId: req.params.bloodRequestId,
    }).sort({ createdAt: -1 });

    res.status(200).json(responses);
  } catch (error) {
    console.error("Get donor responses error:", error);

    res.status(500).json({
      message: "Failed to get donor responses",
      error: error.message,
    });
  }
});

// ========================================
// GET ALL DONOR RESPONSES
// ========================================

router.get("/", async (req, res) => {
  try {
    const responses = await DonorResponse.find()
      .populate("bloodRequestId")
      .sort({ createdAt: -1 });

    res.status(200).json(responses);
  } catch (error) {
    console.error("Get all responses error:", error);

    res.status(500).json({
      message: "Failed to get donor responses",
      error: error.message,
    });
  }
});

module.exports = router;
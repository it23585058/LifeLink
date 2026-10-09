const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const BloodRequest = require("../models/BloodRequest");
const DonorResponse = require("../models/DonorResponse");

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// ========================================
// CREATE BLOOD REQUEST
// ========================================

router.post("/", async (req, res) => {
  try {
    const {
      requesterId,
      patientName,
      bloodGroup,
      hospital,
      location,
      unitsRequired,
      contactNumber,
    } = req.body;

    // Check required fields
    if (
      !requesterId ||
      !patientName ||
      !bloodGroup ||
      !hospital ||
      !location ||
      !unitsRequired ||
      !contactNumber
    ) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    const bloodRequest = new BloodRequest({
      requesterId,
      patientName,
      bloodGroup,
      hospital,
      location,
      unitsRequired,
      contactNumber,
    });

    const savedRequest = await bloodRequest.save();

    res.status(201).json({
      message: "Blood request created successfully",
      data: savedRequest,
    });
  } catch (error) {
    console.error("Create blood request error:", error);

    res.status(500).json({
      message: "Failed to create blood request",
      error: error.message,
    });
  }
});

// ========================================
// GET ALL BLOOD REQUESTS
// ========================================

router.get("/", async (req, res) => {
  try {
    const requests = await BloodRequest.find()
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    console.error("Get blood requests error:", error);

    res.status(500).json({
      message: "Failed to get blood requests",
      error: error.message,
    });
  }
});

// ========================================
// GET ONE BLOOD REQUEST
// ========================================

router.get("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid blood request id",
      });
    }

    const request = await BloodRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        message: "Blood request not found",
      });
    }

    res.status(200).json(request);
  } catch (error) {
    console.error("Get blood request error:", error);

    res.status(500).json({
      message: "Failed to get blood request",
      error: error.message,
    });
  }
});

// ========================================
// UPDATE BLOOD REQUEST STATUS
// ========================================

router.put("/:id/status", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid blood request id",
      });
    }

    const { status } = req.body;

    const request = await BloodRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({
        message: "Blood request not found",
      });
    }

    res.status(200).json({
      message: "Request status updated",
      data: request,
    });
  } catch (error) {
    console.error("Update status error:", error);

    res.status(500).json({
      message: "Failed to update status",
      error: error.message,
    });
  }
});

// ========================================
// UPDATE BLOOD REQUEST
// ========================================

router.put("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid blood request id",
      });
    }

    const {
      patientName,
      bloodGroup,
      hospital,
      location,
      unitsRequired,
      contactNumber,
      status,
    } = req.body;

    if (
      !patientName ||
      !bloodGroup ||
      !hospital ||
      !location ||
      !unitsRequired ||
      !contactNumber
    ) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    const units = Number(unitsRequired);

    if (!Number.isInteger(units) || units < 1) {
      return res.status(400).json({
        message: "Required units must be a number greater than 0",
      });
    }

    const updateData = {
      patientName: String(patientName).trim(),
      bloodGroup,
      hospital: String(hospital).trim(),
      location: String(location).trim(),
      unitsRequired: units,
      contactNumber: String(contactNumber).trim(),
    };

    if (status) {
      updateData.status = status;
    }

    const request = await BloodRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!request) {
      return res.status(404).json({
        message: "Blood request not found",
      });
    }

    res.status(200).json({
      message: "Blood request updated successfully",
      data: request,
    });
  } catch (error) {
    console.error("Update blood request error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to update blood request",
      error: error.message,
    });
  }
});

// ========================================
// DELETE BLOOD REQUEST
// ========================================

router.delete("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid blood request id",
      });
    }

    const request = await BloodRequest.findByIdAndDelete(req.params.id);

    if (!request) {
      return res.status(404).json({
        message: "Blood request not found",
      });
    }

    await DonorResponse.deleteMany({
      bloodRequestId: req.params.id,
    });

    res.status(200).json({
      message: "Blood request deleted successfully",
      data: request,
    });
  } catch (error) {
    console.error("Delete blood request error:", error);

    res.status(500).json({
      message: "Failed to delete blood request",
      error: error.message,
    });
  }
});

module.exports = router;
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Donor = require('../models/donor.model');
const requireAuth = require('../middleware/requireAuth');
const { jwtSecret } = require('../config/env');

const router = express.Router();

const publicDonorFields = '_id name bloodGroup phone city available lastDonationAt createdAt';
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function publicDonor(donor) {
  return {
    _id: donor._id,
    name: donor.name,
    bloodGroup: donor.bloodGroup,
    phone: donor.phone,
    city: donor.city,
    available: donor.available,
    lastDonationAt: donor.lastDonationAt,
    createdAt: donor.createdAt,
  };
}

// =========================
// GET ALL DONORS
// =========================
router.get('/', async (request, response, next) => {
  try {
    const filter = {};

    if (request.query.bloodGroup) {
      filter.bloodGroup = String(
        request.query.bloodGroup
      ).toUpperCase();
    }

    if (request.query.city) {
      filter.city = new RegExp(
        `^${escapeRegex(String(request.query.city))}$`,
        'i'
      );
    }

    if (request.query.available !== undefined) {
      filter.available =
        request.query.available === 'true';
    }

    const donors = await Donor.find(filter).select(publicDonorFields).sort({
      createdAt: -1,
    });

    response.json(donors.map(publicDonor));
  } catch (error) {
    next(error);
  }
});

// =========================
// CREATE DONOR
// =========================
router.post('/', async (request, response, next) => {
  try {
    const {
      name,
      bloodGroup,
      phone,
      city,
      nic,
      password,
      available,
      eligibility,
      emergencyAlerts,
      travelRadiusKm,

      // Donor credentials
      age,
      weightKg,
      heightCm,
      lastDonationAt,

      // Medical
      bloodPressure,
      hemoglobin,
      diabetes,
      highBloodPressure,
      heartDisease,
      otherMedicalConditions,
      previousSurgeries,
      currentlySick,
      takingMedication,
      medicationDetails,
      allergies,
      recentDonationComplications,
    } = request.body;

    if (
      !name ||
      !bloodGroup ||
      !phone ||
      !city ||
      !password
    ) {
      return response.status(400).json({
        error:
          'Name, blood group, phone, city and password are required.',
      });
    }

    const existingDonor = nic
      ? await Donor.findOne({
          nic: nic.trim().toUpperCase(),
        })
      : null;

    if (existingDonor) {
      return response.status(409).json({
        error:
          'A donor with this NIC already exists.',
      });
    }

    const donor = await Donor.create({
      name,
      bloodGroup,
      phone,
      city,
      nic: nic?.trim().toUpperCase(),
      password,

      available,
      eligibility,
      emergencyAlerts,
      travelRadiusKm,

      age,
      weightKg,
      heightCm,
      lastDonationAt,

      bloodPressure,
      hemoglobin,
      diabetes,
      highBloodPressure,
      heartDisease,
      otherMedicalConditions,
      previousSurgeries,
      currentlySick,
      takingMedication,
      medicationDetails,
      allergies,
      recentDonationComplications,
    });

    const token = jwt.sign({ id: donor._id, role: 'donor' }, jwtSecret, { expiresIn: '7d' });
    return response.status(201).json({
      ...publicDonor(donor),
      token,
    });
  } catch (error) {
    return next(error);
  }
});

// =========================
// GET ONE DONOR
// =========================
router.get(
  '/:donorId',
  requireAuth,
  async (request, response, next) => {
    try {
      if (request.auth?.role !== 'donor') {
        return response.status(403).json({ error: 'Donor access is required.' });
      }
      if (!mongoose.isValidObjectId(request.params.donorId)) {
        return response.status(400).json({ error: 'Invalid donor ID.' });
      }
      const donor = await Donor.findById(request.params.donorId);

      if (!donor) {
        return response.status(404).json({
          error: 'Donor not found.',
        });
      }

      if (String(request.auth?.donorId) !== String(donor._id)) {
        return response.status(403).json({ error: 'You cannot access another donor profile.' });
      }

      response.json(donor);
    } catch (error) {
      next(error);
    }
  }
);

// =========================
// UPDATE DONOR
// =========================
router.put(
  '/:donorId',
  requireAuth,
  async (request, response, next) => {
    try {
      if (request.auth?.role !== 'donor') {
        return response.status(403).json({ error: 'Donor access is required.' });
      }
      if (!mongoose.isValidObjectId(request.params.donorId)) {
        return response.status(400).json({ error: 'Invalid donor ID.' });
      }
      if (String(request.auth.donorId) !== String(request.params.donorId)) {
        return response.status(403).json({ error: 'You cannot modify another donor profile.' });
      }
      const donor =
        await Donor.findById(
          request.params.donorId
        ).select('+password');

      if (!donor) {
        return response.status(404).json({
          error: 'Donor not found.',
        });
      }

      const allowedFields = [
        'name',
        'bloodGroup',
        'phone',
        'city',
        'nic',
        'available',
        'emergencyAlerts',
        'travelRadiusKm',

        // Donor credentials
        'age',
        'weightKg',
        'heightCm',
        'lastDonationAt',

        // Medical
        'bloodPressure',
        'hemoglobin',
        'diabetes',
        'highBloodPressure',
        'heartDisease',
        'otherMedicalConditions',
        'previousSurgeries',
        'currentlySick',
        'takingMedication',
        'medicationDetails',
        'allergies',
        'recentDonationComplications',

        // Eligibility
        'eligibility',

        // Password
        'password',
      ];

      for (const field of allowedFields) {
        if (
          Object.prototype.hasOwnProperty.call(
            request.body,
            field
          )
        ) {
          donor[field] =
            request.body[field];
        }
      }

      if (request.body.nic) {
        donor.nic =
          String(request.body.nic)
            .trim()
            .toUpperCase();
      }

      await donor.save();

      response.json(donor);
    } catch (error) {
      next(error);
    }
  }
);

// =========================
// DELETE DONOR
// =========================
router.delete(
  '/:donorId',
  requireAuth,
  async (request, response, next) => {
    try {
      if (request.auth?.role !== 'donor') {
        return response.status(403).json({ error: 'Donor access is required.' });
      }
      if (!mongoose.isValidObjectId(request.params.donorId)) {
        return response.status(400).json({ error: 'Invalid donor ID.' });
      }
      if (String(request.auth.donorId) !== String(request.params.donorId)) {
        return response.status(403).json({ error: 'You cannot delete another donor profile.' });
      }
      const donor =
        await Donor.findByIdAndDelete(
          request.params.donorId
        );

      if (!donor) {
        return response.status(404).json({
          error: 'Donor not found.',
        });
      }

      response.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
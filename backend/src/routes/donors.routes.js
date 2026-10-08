import express from 'express';
import Donor from '../models/donor.model.js';

const router = express.Router();

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
        `^${String(request.query.city)}$`,
        'i'
      );
    }

    if (request.query.available !== undefined) {
      filter.available =
        request.query.available === 'true';
    }

    const donors = await Donor.find(filter).sort({
      createdAt: -1,
    });

    response.json(donors);
  } catch (error) {
    next(error);
  }
});

// =========================
// CREATE DONOR
// =========================
router.post('/', async (request, response, next) => {
  try {
    console.log('CREATE DONOR BODY:', {
      ...request.body,
      password: request.body?.password
        ? '********'
        : undefined,
    });

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

    console.log(
      'DONOR CREATED:',
      donor._id
    );

    return response.status(201).json(donor);
  } catch (error) {
    console.error(
      'CREATE DONOR ERROR:',
      error
    );

    return response.status(500).json({
      error:
        error.message ||
        'Internal server error',
    });
  }
});

// =========================
// GET ONE DONOR
// =========================
router.get(
  '/:donorId',
  async (request, response, next) => {
    try {
      const donor = await Donor.findById(
        request.params.donorId
      );

      console.log(
        'DONOR GET FROM DATABASE:',
        {
          id: donor?._id,
          name: donor?.name,
          city: donor?.city,
        }
      );

      if (!donor) {
        return response.status(404).json({
          error: 'Donor not found.',
        });
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
  async (request, response, next) => {
    try {
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
  async (request, response, next) => {
    try {
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

export default router;
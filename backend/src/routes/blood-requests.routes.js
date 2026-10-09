const express = require('express');

const BloodRequest = require('../models/blood-request.model');
const DonorResponse = require('../models/donor-response.model');
const Donor = require('../models/donor.model');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.get('/', async (request, response, next) => {
  try {
    const filter = { status: request.query.status || 'open' };
    if (request.query.bloodGroup) filter.bloodGroup = String(request.query.bloodGroup).toUpperCase();
    if (request.query.city) filter.city = new RegExp(`^${String(request.query.city)}$`, 'i');

    const requests = await BloodRequest.find(filter).sort({ createdAt: -1 });
    response.json(requests);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, async (request, response, next) => {
  try {
    if (!['donor', 'recipient'].includes(request.auth.role)) {
      return response.status(403).json({ error: 'Only donors and recipients can create blood requests.' });
    }
    const {
      patientName,
      bloodGroup,
      hospital,
      city,
      location,
      unitsNeeded,
      unitsRequired,
      urgency,
      notes,
      contactNumber,
    } = request.body;

    const normalizedCity = city || location;
    const normalizedUnits = unitsNeeded ?? unitsRequired;

    if (
      !patientName ||
      !bloodGroup ||
      !hospital ||
      !normalizedCity ||
      !contactNumber ||
      normalizedUnits === undefined
    ) {
      return response.status(400).json({
        error: 'Requester, patient, blood group, hospital, location, units and contact number are required.',
      });
    }

    const parsedUnits = Number(normalizedUnits);
    if (!Number.isInteger(parsedUnits) || parsedUnits < 1) {
      return response.status(400).json({
        error: 'Required units must be a whole number greater than 0.',
      });
    }

    const bloodRequest = await BloodRequest.create({
      requesterId: request.auth.donorId,
      patientName: String(patientName).trim(),
      bloodGroup: String(bloodGroup).trim().toUpperCase(),
      hospital: String(hospital).trim(),
      city: String(normalizedCity).trim(),
      unitsNeeded: parsedUnits,
      urgency: urgency || 'urgent',
      notes: notes ? String(notes).trim() : undefined,
      contactNumber: String(contactNumber).trim(),
    });

    response.status(201).json(bloodRequest);
  } catch (error) {
    next(error);
  }
});

router.get('/:requestId', async (request, response, next) => {
  try {
    const bloodRequest = await BloodRequest.findById(request.params.requestId);
    if (!bloodRequest) return response.status(404).json({ error: 'Blood request not found.' });
    response.json(bloodRequest);
  } catch (error) {
    next(error);
  }
});

router.put('/:requestId', requireAuth, async (request, response, next) => {
  try {
    const existing = await BloodRequest.findById(request.params.requestId);
    if (!existing) return response.status(404).json({ error: 'Blood request not found.' });
    if (String(existing.requesterId) !== String(request.auth.donorId) || !['donor', 'recipient'].includes(request.auth.role)) {
      return response.status(403).json({ error: 'You can only modify your own blood requests.' });
    }
    const bloodRequest = await BloodRequest.findByIdAndUpdate(request.params.requestId, request.body, {
      new: true,
      runValidators: true,
    });
    if (!bloodRequest) return response.status(404).json({ error: 'Blood request not found.' });
    response.json(bloodRequest);
  } catch (error) {
    next(error);
  }
});

router.delete('/:requestId', requireAuth, async (request, response, next) => {
  try {
    const existing = await BloodRequest.findById(request.params.requestId);
    if (!existing) return response.status(404).json({ error: 'Blood request not found.' });
    if (String(existing.requesterId) !== String(request.auth.donorId) || !['donor', 'recipient'].includes(request.auth.role)) {
      return response.status(403).json({ error: 'You can only delete your own blood requests.' });
    }
    const bloodRequest = await BloodRequest.findByIdAndDelete(request.params.requestId);
    if (!bloodRequest) return response.status(404).json({ error: 'Blood request not found.' });
    await DonorResponse.deleteMany({ request: request.params.requestId });
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post('/:requestId/responses', requireAuth, async (request, response, next) => {
  try {
    if (request.auth.role !== 'donor') {
      return response.status(403).json({ error: 'Only donors can respond to blood requests.' });
    }
    if (String(request.body.donor) !== String(request.auth.donorId)) {
      return response.status(403).json({ error: 'You can only respond as the authenticated donor.' });
    }
    const donor = await Donor.findOne({
      _id: request.auth.donorId,
      available: true,
    }).select('_id');
    if (!donor) {
      return response.status(403).json({ error: 'Your donor availability is turned off.' });
    }
    const donorResponse = await DonorResponse.create({
      ...request.body,
      donor: request.auth.donorId,
      request: request.params.requestId,
    });
    response.status(201).json(donorResponse);
  } catch (error) {
    next(error);
  }
});

router.get('/:requestId/responses', async (request, response, next) => {
  try {
    const responses = await DonorResponse.find({ request: request.params.requestId })
      .populate('donor', '_id name bloodGroup phone city available');
    response.json(responses);
  } catch (error) {
    next(error);
  }
});

router.get('/:requestId/responses/:responseId', async (request, response, next) => {
  try {
    const donorResponse = await DonorResponse.findOne({
      _id: request.params.responseId,
      request: request.params.requestId,
    }).populate('donor', '_id name bloodGroup phone city available');
    if (!donorResponse) return response.status(404).json({ error: 'Donor response not found.' });
    response.json(donorResponse);
  } catch (error) {
    next(error);
  }
});

router.put('/:requestId/responses/:responseId', requireAuth, async (request, response, next) => {
  try {
    const donorResponse = await DonorResponse.findOneAndUpdate(
      { _id: request.params.responseId, request: request.params.requestId },
      { ...request.body, donor: request.auth.donorId },
      { new: true, runValidators: true }
    ).populate('donor');
    if (!donorResponse) return response.status(404).json({ error: 'Donor response not found.' });
    response.json(donorResponse);
  } catch (error) {
    next(error);
  }
});

router.delete('/:requestId/responses/:responseId', requireAuth, async (request, response, next) => {
  try {
    const donorResponse = await DonorResponse.findOneAndDelete({
      _id: request.params.responseId,
      request: request.params.requestId,
    });
    if (!donorResponse) return response.status(404).json({ error: 'Donor response not found.' });
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
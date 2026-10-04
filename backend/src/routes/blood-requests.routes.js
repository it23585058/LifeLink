const express = require('express');

const BloodRequest = require('../models/blood-request.model');
const DonorResponse = require('../models/donor-response.model');

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

router.post('/', async (request, response, next) => {
  try {
    const bloodRequest = await BloodRequest.create(request.body);
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

router.put('/:requestId', async (request, response, next) => {
  try {
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

router.delete('/:requestId', async (request, response, next) => {
  try {
    const bloodRequest = await BloodRequest.findByIdAndDelete(request.params.requestId);
    if (!bloodRequest) return response.status(404).json({ error: 'Blood request not found.' });
    await DonorResponse.deleteMany({ request: request.params.requestId });
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post('/:requestId/responses', async (request, response, next) => {
  try {
    const donorResponse = await DonorResponse.create({
      ...request.body,
      request: request.params.requestId,
    });
    response.status(201).json(donorResponse);
  } catch (error) {
    next(error);
  }
});

router.get('/:requestId/responses', async (request, response, next) => {
  try {
    const responses = await DonorResponse.find({ request: request.params.requestId }).populate('donor');
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
    }).populate('donor');
    if (!donorResponse) return response.status(404).json({ error: 'Donor response not found.' });
    response.json(donorResponse);
  } catch (error) {
    next(error);
  }
});

router.put('/:requestId/responses/:responseId', async (request, response, next) => {
  try {
    const donorResponse = await DonorResponse.findOneAndUpdate(
      { _id: request.params.responseId, request: request.params.requestId },
      request.body,
      { new: true, runValidators: true }
    ).populate('donor');
    if (!donorResponse) return response.status(404).json({ error: 'Donor response not found.' });
    response.json(donorResponse);
  } catch (error) {
    next(error);
  }
});

router.delete('/:requestId/responses/:responseId', async (request, response, next) => {
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
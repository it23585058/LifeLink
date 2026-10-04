const express = require('express');

const Donor = require('../models/donor.model');

const router = express.Router();

router.get('/', async (request, response, next) => {
  try {
    const filter = {};
    if (request.query.bloodGroup) filter.bloodGroup = String(request.query.bloodGroup).toUpperCase();
    if (request.query.city) filter.city = new RegExp(`^${String(request.query.city)}$`, 'i');
    if (request.query.available !== undefined) filter.available = request.query.available === 'true';

    const donors = await Donor.find(filter).sort({ createdAt: -1 });
    response.json(donors);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (request, response, next) => {
  try {
    const donor = await Donor.create(request.body);
    response.status(201).json(donor);
  } catch (error) {
    next(error);
  }
});

router.get('/:donorId', async (request, response, next) => {
  try {
    const donor = await Donor.findById(request.params.donorId);
    if (!donor) return response.status(404).json({ error: 'Donor not found.' });
    response.json(donor);
  } catch (error) {
    next(error);
  }
});

router.put('/:donorId', async (request, response, next) => {
  try {
    const donor = await Donor.findByIdAndUpdate(request.params.donorId, request.body, {
      new: true,
      runValidators: true,
    });
    if (!donor) return response.status(404).json({ error: 'Donor not found.' });
    response.json(donor);
  } catch (error) {
    next(error);
  }
});

router.delete('/:donorId', async (request, response, next) => {
  try {
    const donor = await Donor.findByIdAndDelete(request.params.donorId);
    if (!donor) return response.status(404).json({ error: 'Donor not found.' });
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
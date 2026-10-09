const express = require('express');
const mongoose = require('mongoose');

const BloodInventory = require('../models/blood-inventory.model');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.get('/', async (request, response, next) => {
  try {
    const filter = {};
    if (request.query.hospital) {
      if (!mongoose.isValidObjectId(request.query.hospital)) {
        return response.status(400).json({ error: 'Invalid hospital ID.' });
      }
      filter.hospital = request.query.hospital;
    }

    const items = await BloodInventory.find(filter)
      .sort({ bloodGroup: 1, component: 1 })
      .lean();

    const formatted = items.map((item) => ({
      ...item,
      status: BloodInventory.stockStatus(item.units, item.lowThreshold),
    }));

    response.json(formatted);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRole(['hospital_staff']), async (request, response, next) => {
  try {
    const { hospital, bloodGroup, component, units, lowThreshold } = request.body;

    if (!hospital || !mongoose.isValidObjectId(hospital)) {
      return response.status(400).json({ error: 'Valid hospital ID is required.' });
    }

    if (!bloodGroup) {
      return response.status(400).json({ error: 'Blood group is required.' });
    }

    const normalizedGroup = String(bloodGroup).toUpperCase().trim();
    const normalizedComponent = component || 'whole_blood';

    const existing = await BloodInventory.findOne({
      hospital,
      bloodGroup: normalizedGroup,
      component: normalizedComponent,
    });

    if (existing) {
      return response.status(409).json({
        error: 'Inventory entry already exists for this hospital, blood group, and component.',
      });
    }

    const created = await BloodInventory.create({
      hospital,
      bloodGroup: normalizedGroup,
      component: normalizedComponent,
      units: units !== undefined ? units : 0,
      lowThreshold: lowThreshold !== undefined ? lowThreshold : 5,
      updatedBy: request.demoUser ? request.demoUser.userId : 'staff',
    });

    const item = created.toObject();
    item.status = BloodInventory.stockStatus(item.units, item.lowThreshold);

    response.status(201).json(item);
  } catch (error) {
    if (error.code === 11000) {
      return response.status(409).json({
        error: 'Inventory entry already exists for this hospital, blood group, and component.',
      });
    }
    next(error);
  }
});

router.put('/:id', requireRole(['hospital_staff']), async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      return response.status(400).json({ error: 'Invalid inventory ID.' });
    }

    const update = {};
    if (request.body.units !== undefined) {
      const unitsNum = Number(request.body.units);
      if (!Number.isInteger(unitsNum) || unitsNum < 0) {
        return response.status(400).json({ error: 'Units must be a non-negative integer.' });
      }
      update.units = unitsNum;
    }
    if (request.body.lowThreshold !== undefined) {
      const thresholdNum = Number(request.body.lowThreshold);
      if (thresholdNum < 0) {
        return response.status(400).json({ error: 'Low threshold must be a non-negative number.' });
      }
      update.lowThreshold = thresholdNum;
    }
    if (request.demoUser) {
      update.updatedBy = request.demoUser.userId;
    }

    const updated = await BloodInventory.findByIdAndUpdate(
      request.params.id,
      { $set: update },
      { returnDocument: 'after', runValidators: true }
    ).lean();

    if (!updated) {
      return response.status(404).json({ error: 'Inventory record not found.' });
    }

    response.json({
      ...updated,
      status: BloodInventory.stockStatus(updated.units, updated.lowThreshold),
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireRole(['hospital_staff']), async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      return response.status(400).json({ error: 'Invalid inventory ID.' });
    }

    const deleted = await BloodInventory.findByIdAndDelete(request.params.id);
    if (!deleted) {
      return response.status(404).json({ error: 'Inventory record not found.' });
    }

    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;

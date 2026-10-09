const express = require('express');
const mongoose = require('mongoose');

const Reservation = require('../models/reservation.model');
const BloodInventory = require('../models/blood-inventory.model');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.post('/', requireAuth, async (request, response, next) => {
  try {
    const { hospital, bloodGroup, component, units, note } = request.body;
    const reservedBy = request.auth.donorId;

    if (!hospital || !mongoose.isValidObjectId(hospital)) {
      return response.status(400).json({ error: 'Valid hospital ID is required.' });
    }

    if (!bloodGroup) {
      return response.status(400).json({ error: 'Blood group is required.' });
    }

    const unitsNum = Number(units);
    if (!Number.isInteger(unitsNum) || unitsNum < 1) {
      return response.status(400).json({ error: 'Units must be an integer of at least 1.' });
    }

    const normalizedGroup = String(bloodGroup).toUpperCase().trim();
    const normalizedComponent = component || 'whole_blood';

    // Step 1: Check if inventory row exists
    const existingInventory = await BloodInventory.findOne({
      hospital,
      bloodGroup: normalizedGroup,
      component: normalizedComponent,
    });

    if (!existingInventory) {
      return response.status(404).json({
        error: 'No inventory record found for this blood group and component at this hospital.',
      });
    }

    // Step 2: Atomic decrement
    const stock = await BloodInventory.findOneAndUpdate(
      {
        hospital,
        bloodGroup: normalizedGroup,
        component: normalizedComponent,
        units: { $gte: unitsNum },
      },
      { $inc: { units: -unitsNum } },
      { returnDocument: 'after' }
    );

    if (!stock) {
      return response.status(409).json({
        error: 'INSUFFICIENT_STOCK',
        availableUnits: existingInventory.units,
      });
    }

    // Step 3: Create reservation with rollback safeguard
    try {
      const reservation = await Reservation.create({
        hospital,
        bloodGroup: normalizedGroup,
        component: normalizedComponent,
        units: unitsNum,
        reservedBy,
        status: 'pending',
        note,
      });

      return response.status(201).json(reservation);
    } catch (err) {
      await BloodInventory.findByIdAndUpdate(stock._id, { $inc: { units: unitsNum } });
      throw err;
    }
  } catch (error) {
    next(error);
  }
});

router.get('/', requireAuth, async (request, response, next) => {
  try {
    const filter = {};
    if (request.query.reservedBy) {
      if (String(request.query.reservedBy) !== String(request.auth.donorId)) {
        return response.status(403).json({ error: 'You can only view your own reservations.' });
      }
      filter.reservedBy = request.auth.donorId;
    } else {
      filter.reservedBy = request.auth.donorId;
    }
    if (request.query.hospital) {
      if (!mongoose.isValidObjectId(request.query.hospital)) {
        return response.status(400).json({ error: 'Invalid hospital ID.' });
      }
      filter.hospital = request.query.hospital;
    }
    if (request.query.status) {
      filter.status = request.query.status;
    }

    const reservations = await Reservation.find(filter)
      .populate('hospital', 'name city address phone accreditation')
      .sort({ createdAt: -1 })
      .lean();

    response.json(reservations);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAuth, async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      return response.status(400).json({ error: 'Invalid reservation ID.' });
    }

    const { status } = request.body;
    if (!status || !['cancelled', 'collected'].includes(status)) {
      return response.status(400).json({ error: "Status must be either 'cancelled' or 'collected'." });
    }
    const ownedReservation = await Reservation.findOne({
      _id: request.params.id,
      reservedBy: request.auth.donorId,
    });
    if (!ownedReservation) {
      return response.status(403).json({ error: 'You can only modify your own reservations.' });
    }

    const updated = await Reservation.findOneAndUpdate(
      { _id: request.params.id, status: 'pending' },
      { $set: { status } },
      { returnDocument: 'after' }
    );

    if (!updated) {
      const existing = await Reservation.findById(request.params.id);
      if (!existing) {
        return response.status(404).json({ error: 'Reservation not found.' });
      }
      return response.status(409).json({
        error: `Cannot modify reservation with status '${existing.status}'. Only pending reservations can be modified.`,
      });
    }

    // If cancelled, restore stock atomically
    if (status === 'cancelled') {
      await BloodInventory.findOneAndUpdate(
        {
          hospital: updated.hospital,
          bloodGroup: updated.bloodGroup,
          component: updated.component,
        },
        { $inc: { units: updated.units } }
      );
    }

    response.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      return response.status(400).json({ error: 'Invalid reservation ID.' });
    }

    const reservation = await Reservation.findById(request.params.id);
    if (!reservation) {
      return response.status(404).json({ error: 'Reservation not found.' });
    }
    if (String(reservation.reservedBy) !== String(request.auth.donorId)) {
      return response.status(403).json({ error: 'You can only delete your own reservations.' });
    }

    if (reservation.status === 'pending') {
      return response.status(400).json({
        error: 'Cannot delete a pending reservation. Cancel it first to restore inventory stock.',
      });
    }

    await Reservation.findByIdAndDelete(request.params.id);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;

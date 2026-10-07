const express = require('express');
const mongoose = require('mongoose');

const Transfer = require('../models/transfer.model');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

function generateCaseCode() {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `BL-${randomNum}`;
}

const FORWARD_TRANSITIONS = {
  arrived_at_gate: 'dispatched',
  triage_crossmatch: 'arrived_at_gate',
  completed: 'triage_crossmatch',
};

const STATUS_LABELS = {
  arrived_at_gate: 'Arrived at Hospital Gate',
  triage_crossmatch: 'Triage & Serology Crossmatch Initiated',
  completed: 'Transfusion Complete',
  cancelled: 'Transfer Cancelled',
};

router.post('/', requireRole(['hospital_staff']), async (request, response, next) => {
  try {
    const {
      hospital,
      ward,
      attendingStaff,
      donorName,
      bloodGroup,
      component,
      units,
      transitMode,
      vehicleInfo,
      etaMinutes,
    } = request.body;

    if (!hospital || !mongoose.isValidObjectId(hospital)) {
      return response.status(400).json({ error: 'Valid hospital ID is required.' });
    }

    if (!donorName || !String(donorName).trim()) {
      return response.status(400).json({ error: 'Donor name is required.' });
    }

    if (!bloodGroup) {
      return response.status(400).json({ error: 'Blood group is required.' });
    }

    const etaNum = Number(etaMinutes);
    if (Number.isNaN(etaNum) || etaNum < 0) {
      return response.status(400).json({ error: 'ETA minutes must be a non-negative number.' });
    }

    const user = request.demoUser ? request.demoUser.userId : 'Staff';

    let transfer = null;
    let attempts = 0;
    while (!transfer && attempts < 5) {
      attempts += 1;
      const caseCode = generateCaseCode();
      try {
        transfer = await Transfer.create({
          caseCode,
          hospital,
          ward,
          attendingStaff,
          donorName: String(donorName).trim(),
          bloodGroup: String(bloodGroup).toUpperCase().trim(),
          component: component || 'whole_blood',
          units: units ? Number(units) : 1,
          transitMode: transitMode || 'Personal Vehicle',
          vehicleInfo,
          etaMinutes: etaNum,
          status: 'dispatched',
          events: [
            {
              label: 'Dispatched & En Route',
              kind: 'status_change',
              by: user,
              at: new Date(),
            },
          ],
        });
      } catch (err) {
        if (err.code === 11000 && attempts < 5) {
          continue;
        }
        throw err;
      }
    }

    response.status(201).json(transfer);
  } catch (error) {
    next(error);
  }
});

router.get('/', async (request, response, next) => {
  try {
    const filter = {};
    if (request.query.hospital) {
      if (!mongoose.isValidObjectId(request.query.hospital)) {
        return response.status(400).json({ error: 'Invalid hospital ID.' });
      }
      filter.hospital = request.query.hospital;
    }
    if (request.query.status) {
      filter.status = request.query.status;
    }

    const transfers = await Transfer.find(filter)
      .populate('hospital', 'name city address phone wardExtension accreditation')
      .sort({ createdAt: -1 })
      .lean();

    response.json(transfers);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      return response.status(400).json({ error: 'Invalid transfer ID.' });
    }

    const transfer = await Transfer.findById(request.params.id)
      .populate('hospital', 'name city address phone wardExtension accreditation coordinates portalUrl')
      .lean();

    if (!transfer) {
      return response.status(404).json({ error: 'Transfer not found.' });
    }

    response.json(transfer);
  } catch (error) {
    next(error);
  }
});

router.put('/:id/status', async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      return response.status(400).json({ error: 'Invalid transfer ID.' });
    }

    const { status, note } = request.body;
    if (!status || !['arrived_at_gate', 'triage_crossmatch', 'completed', 'cancelled'].includes(status)) {
      return response.status(400).json({
        error: "Status must be 'arrived_at_gate', 'triage_crossmatch', 'completed', or 'cancelled'.",
      });
    }

    const user = request.headers['x-demo-user'] || 'Staff';

    let query;
    if (status === 'cancelled') {
      query = {
        _id: request.params.id,
        status: { $in: ['dispatched', 'arrived_at_gate', 'triage_crossmatch'] },
      };
    } else {
      const expectedPrev = FORWARD_TRANSITIONS[status];
      query = {
        _id: request.params.id,
        status: expectedPrev,
      };
    }

    const eventLabel = note || STATUS_LABELS[status] || status;

    const updated = await Transfer.findOneAndUpdate(
      query,
      {
        $set: { status },
        $push: {
          events: {
            label: eventLabel,
            kind: 'status_change',
            by: user,
            at: new Date(),
          },
        },
      },
      { returnDocument: 'after' }
    ).populate('hospital', 'name city phone wardExtension');

    if (!updated) {
      const existing = await Transfer.findById(request.params.id);
      if (!existing) {
        return response.status(404).json({ error: 'Transfer not found.' });
      }
      return response.status(409).json({
        error: `Cannot transition transfer from status '${existing.status}' to '${status}'.`,
      });
    }

    response.json(updated);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      return response.status(400).json({ error: 'Invalid transfer ID.' });
    }

    const existing = await Transfer.findById(request.params.id);
    if (!existing) {
      return response.status(404).json({ error: 'Transfer not found.' });
    }

    const { etaMinutes, note } = request.body;
    const updateOps = { $set: {} };
    const user = request.headers['x-demo-user'] || 'Driver';

    if (etaMinutes !== undefined) {
      const etaNum = Number(etaMinutes);
      if (Number.isNaN(etaNum) || etaNum < 0) {
        return response.status(400).json({ error: 'ETA minutes must be a non-negative number.' });
      }
      updateOps.$set.etaMinutes = etaNum;
    }

    if (note || etaMinutes !== undefined) {
      const label = note || `ETA updated to ${etaMinutes} mins`;
      updateOps.$push = {
        events: {
          label,
          kind: 'eta_update',
          by: user,
          at: new Date(),
        },
      };
    }

    if (Object.keys(updateOps.$set).length === 0 && !updateOps.$push) {
      return response.json(existing);
    }

    const updated = await Transfer.findByIdAndUpdate(request.params.id, updateOps, {
      returnDocument: 'after',
      runValidators: true,
    }).populate('hospital', 'name city phone wardExtension');

    response.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireRole(['hospital_staff']), async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      return response.status(400).json({ error: 'Invalid transfer ID.' });
    }

    const existing = await Transfer.findById(request.params.id);
    if (!existing) {
      return response.status(404).json({ error: 'Transfer not found.' });
    }

    if (existing.status !== 'cancelled') {
      return response.status(400).json({
        error: `Cannot delete transfer in '${existing.status}' state. Only cancelled transfers can be removed.`,
      });
    }

    await Transfer.findByIdAndDelete(request.params.id);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;

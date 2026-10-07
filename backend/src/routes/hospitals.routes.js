const express = require('express');
const mongoose = require('mongoose');

const Hospital = require('../models/hospital.model');
const BloodInventory = require('../models/blood-inventory.model');
const Transfer = require('../models/transfer.model');

const router = express.Router();

const COLOMBO_FORT = { lat: 6.9344, lng: 79.8428 };
const ALL_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function haversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

router.get('/summary', async (request, response, next) => {
  try {
    const facilities = await Hospital.countDocuments();
    const wholeBloodItems = await BloodInventory.find({ component: 'whole_blood' });

    let totalUnits = 0;
    const groupTotals = {};
    for (const group of ALL_BLOOD_GROUPS) {
      groupTotals[group] = 0;
    }

    for (const item of wholeBloodItems) {
      totalUnits += item.units;
      if (groupTotals[item.bloodGroup] !== undefined) {
        groupTotals[item.bloodGroup] += item.units;
      }
    }

    const criticalShortages = [];
    for (const group of ALL_BLOOD_GROUPS) {
      if (groupTotals[group] < 4) {
        criticalShortages.push({
          bloodGroup: group,
          totalUnits: groupTotals[group],
        });
      }
    }

    response.json({
      facilities,
      totalUnits,
      criticalShortages,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (request, response, next) => {
  try {
    const hospitalFilter = {};
    if (request.query.type) {
      hospitalFilter.type = request.query.type;
    }
    if (request.query.city) {
      hospitalFilter.city = new RegExp(`^${String(request.query.city).trim()}$`, 'i');
    }
    if (request.query.q) {
      const sanitized = String(request.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      hospitalFilter.name = new RegExp(sanitized, 'i');
    }

    const refLat = request.query.lat ? Number(request.query.lat) : COLOMBO_FORT.lat;
    const refLng = request.query.lng ? Number(request.query.lng) : COLOMBO_FORT.lng;

    const hospitals = await Hospital.find(hospitalFilter).lean();
    if (hospitals.length === 0) {
      return response.json([]);
    }

    const hospitalIds = hospitals.map((h) => h._id);
    const inventories = await BloodInventory.find({ hospital: { $in: hospitalIds } }).lean();

    const inventoryMap = new Map();
    for (const inv of inventories) {
      const key = String(inv.hospital);
      if (!inventoryMap.has(key)) {
        inventoryMap.set(key, []);
      }
      inventoryMap.get(key).push({
        _id: inv._id,
        bloodGroup: inv.bloodGroup,
        component: inv.component,
        units: inv.units,
        lowThreshold: inv.lowThreshold,
        status: BloodInventory.stockStatus(inv.units, inv.lowThreshold),
        updatedAt: inv.updatedAt,
      });
    }

    let results = hospitals.map((hospital) => {
      const stock = inventoryMap.get(String(hospital._id)) || [];
      const totalUnits = stock.reduce((sum, item) => sum + item.units, 0);

      let latestDate = hospital.updatedAt ? new Date(hospital.updatedAt) : new Date(0);
      for (const item of stock) {
        if (item.updatedAt && new Date(item.updatedAt) > latestDate) {
          latestDate = new Date(item.updatedAt);
        }
      }

      const distanceKm =
        hospital.coordinates && hospital.coordinates.lat != null && hospital.coordinates.lng != null
          ? haversineDistance(refLat, refLng, hospital.coordinates.lat, hospital.coordinates.lng)
          : null;

      return {
        ...hospital,
        stock,
        totalUnits,
        lastUpdatedAt: latestDate.toISOString(),
        distanceKm,
      };
    });

    if (request.query.bloodGroup) {
      const requestedGroup = String(request.query.bloodGroup).trim().toUpperCase();
      results = results.filter((h) =>
        h.stock.some((s) => s.bloodGroup === requestedGroup && s.units > 0)
      );
    }

    if (request.query.sort === 'name') {
      results.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      results.sort((a, b) => {
        if (a.distanceKm == null && b.distanceKm == null) return 0;
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }

    response.json(results);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      return response.status(400).json({ error: 'Invalid hospital ID.' });
    }

    const hospital = await Hospital.findById(request.params.id).lean();
    if (!hospital) {
      return response.status(404).json({ error: 'Hospital not found.' });
    }

    const rawStock = await BloodInventory.find({ hospital: hospital._id }).lean();
    const stock = rawStock.map((inv) => ({
      _id: inv._id,
      bloodGroup: inv.bloodGroup,
      component: inv.component,
      units: inv.units,
      lowThreshold: inv.lowThreshold,
      status: BloodInventory.stockStatus(inv.units, inv.lowThreshold),
      updatedAt: inv.updatedAt,
    }));

    const totalUnits = stock.reduce((sum, item) => sum + item.units, 0);

    const activeTransfers = await Transfer.find({
      hospital: hospital._id,
      status: { $nin: ['completed', 'cancelled'] },
    })
      .select('caseCode donorName bloodGroup component units transitMode etaMinutes status events createdAt')
      .sort({ createdAt: -1 })
      .lean();

    response.json({
      ...hospital,
      stock,
      totalUnits,
      activeTransfers,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

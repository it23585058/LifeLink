const express = require('express');
const jwt = require('jsonwebtoken');

const Donor = require('../models/donor.model');
const Recipient = require('../models/recipient.model');
const HospitalStaff = require('../models/hospital-staff.model');
const requireAuth = require('../middleware/requireAuth');
const { jwtSecret } = require('../config/env');

const router = express.Router();

function tokenFor(subject, role) {
  return jwt.sign({ id: subject, role }, jwtSecret, { expiresIn: '7d' });
}

function publicRecipient(recipient) {
  return {
    _id: recipient._id,
    name: recipient.name,
    phone: recipient.phone,
    city: recipient.city,
    email: recipient.email,
  };
}

router.post('/recipients/register', async (request, response, next) => {
  try {
    const { name, phone, city, email, password } = request.body;
    if (!name || !phone || !city || !email || !password) {
      return response.status(400).json({ error: 'Name, phone, city, email and password are required.' });
    }

    const recipient = await Recipient.create({
      name: String(name).trim(),
      phone: String(phone).trim(),
      city: String(city).trim(),
      email: String(email).trim().toLowerCase(),
      password,
    });

    return response.status(201).json({
      token: tokenFor(recipient._id, 'recipient'),
      recipient: publicRecipient(recipient),
    });
  } catch (error) {
    if (error?.code === 11000) return response.status(409).json({ error: 'A recipient with this email already exists.' });
    return next(error);
  }
});

router.post('/recipients/login', async (request, response, next) => {
  try {
    const { email, password } = request.body;
    if (!email || !password) return response.status(400).json({ error: 'Email and password are required.' });

    const recipient = await Recipient.findOne({ email: String(email).trim().toLowerCase() }).select('+password');
    if (!recipient || !(await recipient.comparePassword(password))) {
      return response.status(401).json({ error: 'Incorrect email or password.' });
    }

    return response.json({
      token: tokenFor(recipient._id, 'recipient'),
      recipient: publicRecipient(recipient),
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/hospital/login', async (request, response, next) => {
  try {
    const { email, password } = request.body;
    if (!email || !password) return response.status(400).json({ error: 'Email and password are required.' });

    const staff = await HospitalStaff.findOne({
      email: String(email).trim().toLowerCase(),
      active: true,
    }).select('+password');
    if (!staff || !(await staff.comparePassword(password))) {
      return response.status(401).json({ error: 'Incorrect staff credentials.' });
    }

    return response.json({
      token: tokenFor(staff._id, 'hospital_staff'),
      staff: {
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        hospital: staff.hospital,
        role: staff.role,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/recipients/me', requireAuth, async (request, response, next) => {
  try {
    if (request.auth.role !== 'recipient') return response.status(403).json({ error: 'Recipient access is required.' });
    const recipient = await Recipient.findById(request.auth.donorId);
    if (!recipient) return response.status(404).json({ error: 'Recipient not found.' });
    return response.json(publicRecipient(recipient));
  } catch (error) {
    return next(error);
  }
});

router.put('/recipients/me', requireAuth, async (request, response, next) => {
  try {
    if (request.auth.role !== 'recipient') return response.status(403).json({ error: 'Recipient access is required.' });
    const allowed = ['name', 'phone', 'city'];
    const update = {};
    for (const field of allowed) {
      if (request.body[field] !== undefined) update[field] = String(request.body[field]).trim();
    }
    const recipient = await Recipient.findByIdAndUpdate(request.auth.donorId, update, {
      new: true,
      runValidators: true,
    });
    if (!recipient) return response.status(404).json({ error: 'Recipient not found.' });
    return response.json(publicRecipient(recipient));
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

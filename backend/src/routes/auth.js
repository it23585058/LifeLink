const express = require('express');
const jwt = require('jsonwebtoken');
const Donor = require('../models/donor.model');
const { jwtSecret } = require('../config/env');

const router = express.Router();

function publicDonor(donor) {
  return {
    _id: donor._id,
    name: donor.name,
    bloodGroup: donor.bloodGroup,
    phone: donor.phone,
    city: donor.city,
    available: donor.available,
  };
}

router.post('/login', async (req, res) => {
  try {
    const { nic, password } = req.body;

    if (!nic || !password) {
      return res.status(400).json({
        error: 'NIC and password are required.',
      });
    }

    const donor = await Donor.findOne({
      nic: nic.trim().toUpperCase(),
    }).select('+password');

    if (!donor) {
      return res.status(401).json({
        error: 'Incorrect NIC or password.',
      });
    }

    if (!donor.password) {
      return res.status(401).json({
        error: 'Incorrect NIC or password.',
      });
    }

    const passwordMatches = await donor.comparePassword(password);

    if (!passwordMatches) {
      return res.status(401).json({
        error: 'Incorrect NIC or password.',
      });
    }

    const token = jwt.sign(
      { id: donor._id, role: 'donor' },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      donor: publicDonor(donor),
    });
  } catch (err) {
    console.error('LOGIN ERROR:', err);

    res.status(500).json({
      error: 'Unable to complete login.',
    });
  }
});

module.exports = router;
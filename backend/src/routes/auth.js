import express from 'express';
import jwt from 'jsonwebtoken';
import Donor from '../models/donor.model.js';

const router = express.Router();

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

    console.log('LOGIN DEBUG');
    console.log('NIC:', nic);
    console.log('Donor found:', !!donor);
    console.log('Password received:', !!password);
    console.log('Password from DB:', !!donor?.password);

    if (!donor) {
      return res.status(401).json({
        error: 'Incorrect NIC or password.',
      });
    }

    if (!donor.password) {
      return res.status(500).json({
        error: 'Password is missing for this donor in database.',
      });
    }

    const passwordMatches = await donor.comparePassword(password);

    if (!passwordMatches) {
      return res.status(401).json({
        error: 'Incorrect NIC or password.',
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        error: 'JWT_SECRET is missing in .env',
      });
    }

    const token = jwt.sign(
      { id: donor._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      donor,
    });
  } catch (err) {
    console.error('LOGIN ERROR:', err);

    res.status(500).json({
      error: err.message,
    });
  }
});

export default router;
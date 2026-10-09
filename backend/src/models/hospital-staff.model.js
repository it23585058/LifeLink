const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const hospitalStaffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    password: { type: String, required: true, minlength: 8, select: false },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    role: { type: String, enum: ['hospital_staff'], default: 'hospital_staff' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

hospitalStaffSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

hospitalStaffSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('HospitalStaff', hospitalStaffSchema);

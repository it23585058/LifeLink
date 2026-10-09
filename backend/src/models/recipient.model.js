const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const recipientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    password: { type: String, required: true, minlength: 8, select: false },
  },
  { timestamps: true }
);

recipientSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

recipientSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('Recipient', recipientSchema);

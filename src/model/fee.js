const mongoose = require('mongoose');

const feeRecordSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to the student
  date: { type: Date, default: Date.now },
  amount: String,
  discount: Number,
  name: String,//type
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'sent']
  }, // 'Pending', 'Paid', 'Discounted', etc.
}, {
  timestamps: true
});

const Fee = mongoose.model('Fee', feeRecordSchema);
module.exports = Fee;
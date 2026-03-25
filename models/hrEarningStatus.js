const mongoose = require('mongoose');

const historySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'earned', 'refund'],
      required: true,
    },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    changedByRole: {
      type: String,
      enum: ['admin', 'staff', 'hr', 'student'],
      default: null,
    },
  },
  { _id: false }
);

const hrEarningStatusSchema = new mongoose.Schema(
  {
    hr: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true, index: true },
    recordType: {
      type: String,
      enum: ['initial', 'installment'],
      required: true,
      index: true,
    },
    recordId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'earned', 'refund'],
      default: 'pending',
      index: true,
    },
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true }
);

hrEarningStatusSchema.index({ hr: 1, recordType: 1, recordId: 1 }, { unique: true });

module.exports = mongoose.model('HrEarningStatus', hrEarningStatusSchema);

const mongoose = require('mongoose');

const installmentSchema = mongoose.Schema(
  {
    register: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentRegister', required: true, index: true },
    paymentMode: {
      type: String,
      enum: ['Cash', 'UPI', 'Card', 'Bank', 'Other'],
      default: 'Cash',
      index: true,
    },
    amountPaid: { type: Number, required: true, min: 0 },
    latePenalty: { type: Number, default: 0, min: 0 },
    totalPaidForThisTxn: { type: Number, default: 0, min: 0 },
    dueDate: { type: Date, default: null, index: true },
    receiptNumber: { type: String, trim: true, index: true },
    receiptGeneratedBy: { type: String, trim: true },
    note: { type: String, trim: true, default: '' },
    paymentStatus: {
      type: String,
      enum: ['paid', 'unpaid', 'overdue', 'due_today'],
      default: 'unpaid',
      index: true,
    },

    // Legacy compatibility fields used in existing UI
    paymentType: { type: String, trim: true },
    amountReceived: { type: Number, min: 0 },
    receiptGen: { type: String, trim: true },
    balance: { type: Number, min: 0 },
    nextIns: { type: Date, default: null },
    totalReceived: { type: Number, min: 0 },
  },
  { timestamps: true }
);

installmentSchema.index({ register: 1, createdAt: -1 });
installmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Installment', installmentSchema);

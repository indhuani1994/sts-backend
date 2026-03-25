const Installment = require('../models/installment');
const StudentRegister = require('../models/studentRegister');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');
const { createListQuery } = require('../utils/query');
const { isValidObjectId } = require('../utils/validators');

const normalizePaymentMode = (value) => {
  const mode = String(value || '').toLowerCase();
  if (mode === 'cash') return 'Cash';
  if (mode === 'upi') return 'UPI';
  if (mode === 'card') return 'Card';
  if (mode === 'bank') return 'Bank';
  return 'Other';
};

const computePaymentStatus = (balance, dueDate) => {
  const numericBalance = Math.max(Number(balance || 0), 0);
  if (numericBalance <= 0) return 'paid';

  if (!dueDate) return 'unpaid';

  const due = new Date(dueDate);
  const now = new Date();

  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  if (dueDay === nowDay) return 'due_today';
  if (dueDay < nowDay) return 'overdue';
  return 'unpaid';
};

const applyRegisterFinancials = async (registerId) => {
  const register = await StudentRegister.findById(registerId);
  if (!register) throw new ApiError(404, 'Student Register not found');

  const aggregates = await Installment.aggregate([
    { $match: { register: register._id } },
    {
      $group: {
        _id: '$register',
        totalAmountPaid: { $sum: '$amountPaid' },
        totalPenaltyPaid: { $sum: '$latePenalty' },
      },
    },
  ]);

  const totalInstallmentAmount = aggregates[0]?.totalAmountPaid || 0; // Sum of amounts paid for installments
  const totalPenaltiesPaid = aggregates[0]?.totalPenaltyPaid || 0; // Sum of all penalties paid
  const initialPaid = Number(register.amountReceivedd || 0);
  const courseFees = Number(register.courseFees || 0);

  const totalPaid = Number((initialPaid + totalInstallmentAmount + totalPenaltiesPaid).toFixed(2));
  const totalOwed = courseFees + totalPenaltiesPaid;
  const balance = Number(Math.max(totalOwed - totalPaid, 0).toFixed(2));

  register.amountReceived = totalPaid;
  register.balance = balance;
  register.balanced = balance;
  await register.save();

  const latest = await Installment.findOne({ register: register._id }).sort({ createdAt: -1 });
  const paymentStatus = computePaymentStatus(balance, latest?.dueDate || latest?.nextIns || register.secondInstallment || null);

  await Installment.updateMany(
    { register: register._id },
    {
      $set: {
        totalReceived: totalPaid,
        balance,
        paymentStatus,
      },
    }
  );

  return { register, totalPaid, balance, paymentStatus };
};

exports.addStudentInstallment = catchAsync(async (req, res) => {
  
  const registerId = req.body.registerId || req.body.register;
  if (!registerId || !isValidObjectId(registerId)) {
    throw new ApiError(400, 'Valid registerId is required');
  }

  const amountPaid = Number(req.body.amountPaid ?? req.body.amountReceived ?? 0);
  const latePenalty = Number(req.body.latePenalty || 0);

  if (Number.isNaN(amountPaid) || amountPaid <= 0) {
    throw new ApiError(400, 'amountPaid must be greater than zero');
  }
 
  console.log({nextIns: req.body.nextIns});

  const installment = await Installment.create({
    register: registerId,
    paymentMode: normalizePaymentMode(req.body.paymentMode || req.body.paymentType),
    amountPaid,
    latePenalty,
    totalPaidForThisTxn: Number((amountPaid + latePenalty).toFixed(2)),
    dueDate: req.body.dueDate || req.body.nextIns || null,
    receiptNumber: req.body.receiptNumber || '',
    receiptGeneratedBy: req.body.receiptGeneratedBy || req.body.receiptGen || '',
    note: req.body.note || '',
    nextIns: req.body.nextIns || null,
  });

  const financials = await applyRegisterFinancials(registerId);

  const updatedInstallment = await Installment.findByIdAndUpdate(
    installment._id,
    {
      $set: {
        totalReceived: financials.totalPaid,
        balance: financials.balance,
        paymentStatus: financials.paymentStatus,
      },
    },
    { new: true }
  );

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Installment added successfully',
    data: updatedInstallment,
  });
});

exports.updateStudentInstallment = catchAsync(async (req, res) => {
  const installment = await Installment.findById(req.params.id);
  if (!installment) throw new ApiError(404, 'Installment not found');

  const registerId = req.body.registerId || req.body.register || installment.register.toString();
  if (!isValidObjectId(registerId)) {
    throw new ApiError(400, 'Valid registerId is required');
  }

  const amountPaid = Number(req.body.amountPaid ?? req.body.amountReceived ?? installment.amountPaid);
  const latePenalty = Number(req.body.latePenalty ?? installment.latePenalty ?? 0);

  if (Number.isNaN(amountPaid) || amountPaid <= 0) {
    throw new ApiError(400, 'amountPaid must be greater than zero');
  }

  const previousRegisterId = installment.register.toString();
  installment.register = registerId;
  installment.paymentMode = normalizePaymentMode(req.body.paymentMode || req.body.paymentType || installment.paymentMode);
  installment.amountPaid = amountPaid;
  installment.latePenalty = latePenalty;
  installment.totalPaidForThisTxn = Number((amountPaid + latePenalty).toFixed(2));
  installment.dueDate = req.body.dueDate || req.body.nextIns || installment.dueDate || null;
  installment.receiptNumber = req.body.receiptNumber ?? installment.receiptNumber;
  installment.receiptGeneratedBy = req.body.receiptGeneratedBy || req.body.receiptGen || installment.receiptGeneratedBy;
  installment.note = req.body.note ?? installment.note;

  await installment.save();

  await applyRegisterFinancials(previousRegisterId);
  if (previousRegisterId !== registerId) {
    await applyRegisterFinancials(registerId);
  }

  return sendSuccess(res, {
    message: 'Installment updated successfully',
    data: installment,
  });
});

exports.deleteStudentInstallment = catchAsync(async (req, res) => {
  const installment = await Installment.findByIdAndDelete(req.params.id);
  if (!installment) throw new ApiError(404, 'Installment not found');

  await applyRegisterFinancials(installment.register);

  return sendSuccess(res, {
    message: 'Installment deleted successfully',
  });
});

exports.getAllStudentInstallments = catchAsync(async (req, res) => {
  const { page, limit, skip, sort, paginated } = createListQuery(req, [
    'createdAt',
    'amountPaid',
    'paymentStatus',
    'dueDate',
  ]);

  const filter = {};

  if (req.query.registerId && isValidObjectId(req.query.registerId)) {
    filter.register = req.query.registerId;
  }

  if (req.query.paymentStatus) {
    const today = new Date();
    const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const nextDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    if (req.query.paymentStatus === 'paid') {
      filter.balance = { $lte: 0 };
    } else if (req.query.paymentStatus === 'due_today') {
      filter.balance = { $gt: 0 };
      filter.dueDate = { $gte: dayStart, $lt: nextDay };
    } else if (req.query.paymentStatus === 'overdue') {
      filter.balance = { $gt: 0 };
      filter.dueDate = { $lt: dayStart };
    } else if (req.query.paymentStatus === 'unpaid') {
      filter.balance = { $gt: 0 };
    } else {
      filter.paymentStatus = req.query.paymentStatus;
    }
  }

  if (req.query.paymentMode) {
    filter.paymentMode = normalizePaymentMode(req.query.paymentMode);
  }

  if (req.query.dateFrom || req.query.dateTo) {
    filter.createdAt = {};
    if (req.query.dateFrom) filter.createdAt.$gte = new Date(req.query.dateFrom);
    if (req.query.dateTo) filter.createdAt.$lte = new Date(req.query.dateTo);
  }

  const [rows, total] = await Promise.all([
    Installment.find(filter)
      .populate({
        path: 'register',
        populate: [
          { path: 'student' },
          { path: 'course' },
          { path: 'staff' },
        ],
      })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Installment.countDocuments(filter),
  ]);

  if (paginated) {
    return sendSuccess(res, {
      data: rows,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  return res.json(rows);
});

exports.getStudentInstallmentById = catchAsync(async (req, res) => {
  const installment = await Installment.findById(req.params.id).populate({
    path: 'register',
    populate: [{ path: 'student' }, { path: 'course' }, { path: 'staff' }],
  });

  if (!installment) {
    throw new ApiError(404, 'Installment not found');
  }

  return res.json(installment);
});

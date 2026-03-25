const StudentRegister = require('../models/studentRegister');
const Course = require('../models/course');
const Installment = require('../models/installment');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');
const { createListQuery } = require('../utils/query');
const { isValidObjectId } = require('../utils/validators');
const mongoose = require('mongoose');

const computeBalance = ({ courseFees, amountReceived, latePenalty = 0 }) => {
  const totalFees = Number(courseFees || 0);
  const paid = Number(amountReceived || 0);
  const penalty = Number(latePenalty || 0);
  const remaining = Math.max(totalFees + penalty - paid, 0);

  return {
    totalFees,
    paid,
    penalty,
    remaining,
  };
};

exports.addStudentRegister = catchAsync(async (req, res) => {
  const {
    studentId,
    courseId,
    staffId,
    courseFees,
    paymentType,
    amountReceived,
    amountReceivedd,
    receiptGen,
    courseDuration,
    freezingDate,
    secondInstallment,
    availTime,
  } = req.body;

  if (!isValidObjectId(studentId) || !isValidObjectId(courseId) || !isValidObjectId(staffId)) {
    throw new ApiError(400, 'Valid studentId, courseId and staffId are required');
  }

  const existingRegistration = await StudentRegister.findOne({ student: studentId, course: courseId, staff: staffId }).lean();
  if (existingRegistration) {
    throw new ApiError(400, 'This student is already registered for this course with the selected staff');
  }

  let resolvedCourseFees = Number(courseFees || 0);
  if (!resolvedCourseFees) {
    const course = await Course.findById(courseId).select('fees').lean();
    resolvedCourseFees = Number(course?.fees || 0);
  }

  const initialPaid = Number(amountReceived ?? amountReceivedd ?? 0);
  const { totalFees, remaining } = computeBalance({ courseFees: resolvedCourseFees, amountReceived: initialPaid });

  const newStudentRegister = await StudentRegister.create({
    student: studentId,
    course: courseId,
    staff: staffId,
    courseFees: totalFees,
    paymentType,
    amountReceived: initialPaid,
    amountReceivedd: initialPaid,
    receiptGen,
    courseDuration,
    freezingDate,
    secondInstallment,
    availTime,
    balance: remaining,
    balanced: remaining,
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Student registered successfully',
    data: newStudentRegister,
  });
});

exports.bulkRegisterStudents = catchAsync(async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (!items.length) {
    throw new ApiError(400, 'items array is required');
  }

  const results = await Promise.allSettled(
    items.map(async (item) => {
      const { studentId, courseId, staffId, courseFees } = item;
      if (!isValidObjectId(studentId) || !isValidObjectId(courseId) || !isValidObjectId(staffId)) {
        throw new ApiError(400, 'Valid studentId, courseId and staffId are required');
      }

      const existing = await StudentRegister.findOne({ student: studentId, course: courseId, staff: staffId }).lean();
      if (existing) {
        return { skipped: true, reason: 'already_registered', studentId, courseId, staffId };
      }

      let resolvedCourseFees = Number(courseFees || 0);
      if (!resolvedCourseFees) {
        const course = await Course.findById(courseId).select('fees').lean();
        resolvedCourseFees = Number(course?.fees || 0);
      }

      const { totalFees, remaining } = computeBalance({ courseFees: resolvedCourseFees, amountReceived: 0 });

      const created = await StudentRegister.create({
        student: studentId,
        course: courseId,
        staff: staffId,
        courseFees: totalFees,
        amountReceived: 0,
        amountReceivedd: 0,
        balance: remaining,
        balanced: remaining,
      });

      return { created: true, id: created._id };
    })
  );

  const summary = results.map((result) =>
    result.status === 'fulfilled' ? result.value : { error: result.reason?.message || 'failed' }
  );

  return sendSuccess(res, {
    message: 'Bulk registration completed',
    data: summary,
  });
});

exports.getAllStudentRegisters = catchAsync(async (req, res) => {
  const { page, limit, skip, search, sort, paginated } = createListQuery(req, [
    'createdAt',
    'courseFees',
    'amountReceived',
    'balance',
  ]);

  const match = {};

  if (req.user?.role === 'student') {
    if (req.user.profileId) {
      match.student = req.user.profileId;
    }
  } else if (req.user?.role === 'staff') {
    if (req.user.profileId) {
      match.staff = req.user.profileId;
    }
  } else if (req.query.staffId && isValidObjectId(req.query.staffId)) {
    match.staff = req.query.staffId;
  }

  if (req.query.courseId && isValidObjectId(req.query.courseId)) {
    match.course = req.query.courseId;
  }

  if (req.query.paymentStatus) {
    if (req.query.paymentStatus === 'paid') {
      match.balance = { $lte: 0 };
    }
    if (req.query.paymentStatus === 'unpaid') {
      match.balance = { $gt: 0 };
    }
  }

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: 'students',
        localField: 'student',
        foreignField: '_id',
        as: 'student',
      },
    },
    { $unwind: '$student' },
    {
      $lookup: {
        from: 'courses',
        localField: 'course',
        foreignField: '_id',
        as: 'course',
      },
    },
    { $unwind: '$course' },
    {
      $lookup: {
        from: 'staffs',
        localField: 'staff',
        foreignField: '_id',
        as: 'staff',
      },
    },
    { $unwind: '$staff' },
  ];

  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { 'student.studentName': { $regex: search, $options: 'i' } },
          { 'student.studentMobile': { $regex: search, $options: 'i' } },
          { 'course.courseName': { $regex: search, $options: 'i' } },
        ],
      },
    });
  }

  const countPipeline = [...pipeline, { $count: 'total' }];
  const totalResult = await StudentRegister.aggregate(countPipeline);
  const total = totalResult[0]?.total || 0;

  if (paginated) {
    pipeline.push({ $sort: sort }, { $skip: skip }, { $limit: limit });
    const studentRegisters = await StudentRegister.aggregate(pipeline);
    return sendSuccess(res, {
      data: studentRegisters,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  pipeline.push({ $sort: sort });
  const studentRegisters = await StudentRegister.aggregate(pipeline);
  return res.json(studentRegisters);
});

exports.getStudentRegisterById = catchAsync(async (req, res) => {
  const studentRegister = await StudentRegister.findById(req.params.id)
    .populate('student')
    .populate('course')
    .populate('staff');

  if (!studentRegister) throw new ApiError(404, 'Student Register not found');

  const installmentTimeline = await Installment.find({ register: studentRegister._id })
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, {
    data: {
      ...studentRegister.toObject(),
      installmentTimeline,
    },
  });
});

exports.updateStudentRegister = catchAsync(async (req, res) => {
  const {
    studentId,
    courseId,
    staffId,
    availTime,
    courseFees,
    paymentType,
    amountReceived,
    receiptGen,
    courseDuration,
    freezingDate,
    secondInstallment,
  } = req.body;

  const current = await StudentRegister.findById(req.params.id);
  if (!current) throw new ApiError(404, 'Student Register not found');

  const totalFees = Number(courseFees ?? current.courseFees ?? 0);
  const paid = Number(amountReceived ?? current.amountReceived ?? 0);
  const remaining = Math.max(totalFees - paid, 0);

  const updatedData = {
    student: studentId || current.student,
    course: courseId || current.course,
    staff: staffId || current.staff,
    courseFees: totalFees,
    paymentType,
    amountReceived: paid,
    receiptGen,
    courseDuration,
    freezingDate,
    secondInstallment,
    balance: remaining,
    balanced: remaining,
    availTime,
  };

  const updated = await StudentRegister.findByIdAndUpdate(req.params.id, updatedData, { new: true });

  await Installment.updateMany({ register: updated._id }, { $set: { balance: updated.balance, totalReceived: updated.amountReceived } });

  return sendSuccess(res, {
    message: 'Student registration updated successfully',
    data: updated,
  });
});

exports.deleteStudentRegister = catchAsync(async (req, res) => {
  const deleted = await StudentRegister.findOneAndDelete({ _id: req.params.id });
  if (!deleted) throw new ApiError(404, 'Student Register not found');

  await Installment.deleteMany({ register: deleted._id });

  return sendSuccess(res, { message: 'Student registration deleted successfully' });
});


exports.getStudentsByStaffId = catchAsync(async (req, res) => {
  const { staffId } = req.params;

  if (!isValidObjectId(staffId)) {
    throw new ApiError(400, 'Valid staffId is required');
  }

  if (req.user?.role === 'staff' && req.user.profileId !== staffId) {
    throw new ApiError(403, 'You can only view your own students');
  }

  const students = await StudentRegister.find({ staff: staffId })
    .populate('student')
    .populate('course')
    .populate('staff')
    .sort({ createdAt: -1 });

  return sendSuccess(res, {
    message: 'Students fetched successfully',
    data: students,
  });
});
exports.getStudentRegistrationsByStudentId = async (req, res) => {
  try {

    const { studentId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid Student ID" });
    }

    const registrations = await StudentRegister.find({
      student: studentId
    })
      .populate("student")
      .populate("course")
      .populate("staff")
      .sort({ createdAt: -1 });

    if (!registrations.length) {
      return res.status(404).json({
        message: "No registrations found for this student"
      });
    }

    res.status(200).json(registrations);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error"
    });
  }
};

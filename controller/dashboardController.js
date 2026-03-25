const Student = require('../models/student');
const Staff = require('../models/staffs');
const StudentRegister = require('../models/studentRegister');
const Installment = require('../models/installment');
const Placement = require('../models/placement');
const Attendance = require('../models/attendance');
const CourseUpdate = require('../models/course_update');

const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');
const ApiError = require('../utils/ApiError');

const monthlyGroupPipeline = (dateField = 'createdAt', valueExpr = { $sum: 1 }) => [
  {
    $group: {
      _id: {
        year: { $year: `$${dateField}` },
        month: { $month: `$${dateField}` },
      },
      value: valueExpr,
    },
  },
  { $sort: { '_id.year': 1, '_id.month': 1 } },
];

const mapMonthly = (rows) =>
  rows.map((row) => ({
    label: `${row._id.year}-${String(row._id.month).padStart(2, '0')}`,
    value: Number(row.value || 0),
  }));

exports.getAdminDashboard = catchAsync(async (_req, res) => {
  const [
    totalStudents,
    totalStaff,
    totalRegistrations,
    totalPlacements,
    totalAttendance,
    approvedAttendance,
    upcomingClasses,
    revenueAgg,
    pendingAgg,
    enrollTrendAgg,
    revenueTrendAgg,
    placementTrendAgg,
  ] = await Promise.all([
    Student.countDocuments(),
    Staff.countDocuments(),
    StudentRegister.countDocuments(),
    Placement.countDocuments(),
    Attendance.countDocuments(),
    Attendance.countDocuments({ status: { $in: ['present', 'online'] } }),
    CourseUpdate.countDocuments(),
    StudentRegister.aggregate([{ $group: { _id: null, total: { $sum: '$amountReceived' } } }]),
    StudentRegister.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]),
    StudentRegister.aggregate(monthlyGroupPipeline('createdAt')),
    Installment.aggregate(monthlyGroupPipeline('createdAt', { $sum: '$amountPaid' })),
    Placement.aggregate(monthlyGroupPipeline('createdAt')),
  ]);

  const totalRevenue = Number(revenueAgg[0]?.total || 0);
  const pendingFees = Number(pendingAgg[0]?.total || 0);
  const placementRate = totalRegistrations > 0 ? Number(((totalPlacements / totalRegistrations) * 100).toFixed(2)) : 0;
  const attendancePercentage = totalAttendance > 0 ? Number(((approvedAttendance / totalAttendance) * 100).toFixed(2)) : 0;

  return sendSuccess(res, {
    data: {
      cards: {
        totalStudents,
        totalStaff,
        totalRevenue,
        pendingFees,
        placementRate,
        attendancePercentage,
        upcomingClasses,
      },
      charts: {
        enrollmentTrends: mapMonthly(enrollTrendAgg),
        monthlyRevenue: mapMonthly(revenueTrendAgg),
        placementStats: mapMonthly(placementTrendAgg),
      },
    },
  });
});

exports.getStaffDashboard = catchAsync(async (req, res) => {
  const { profileId } = req.user;
  if (!profileId) throw new ApiError(400, 'Staff profile not found in token');

  const assignedRegisters = await StudentRegister.find({ staff: profileId }).select('_id student').lean();
  const registerIds = assignedRegisters.map((row) => row._id);

  const [todayAttendance, totalAttendance, approvedAttendance] = await Promise.all([
    Attendance.countDocuments({
      studentId: { $in: registerIds },
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }),
    Attendance.countDocuments({ studentId: { $in: registerIds } }),
    Attendance.countDocuments({ studentId: { $in: registerIds }, status: { $in: ['present', 'online'] } }),
  ]);

  const attendancePercentage = totalAttendance > 0 ? Number(((approvedAttendance / totalAttendance) * 100).toFixed(2)) : 0;

  return sendSuccess(res, {
    data: {
      assignedStudents: assignedRegisters.length,
      todaysClasses: 0,
      attendanceSummary: {
        total: totalAttendance,
        approved: approvedAttendance,
        percentage: attendancePercentage,
        today: todayAttendance,
      },
    },
  });
});

exports.getStudentDashboard = catchAsync(async (req, res) => {
  const { profileId } = req.user;
  if (!profileId) throw new ApiError(400, 'Student profile not found in token');

  const registrations = await StudentRegister.find({ student: profileId }).select('_id amountReceived courseFees balance').lean();
  const registerIds = registrations.map((row) => row._id);

  const [attendanceRows, installmentRows] = await Promise.all([
    Attendance.find({ studentId: { $in: registerIds } }).select('status createdAt').lean(),
    Installment.find({ register: { $in: registerIds } }).sort({ createdAt: -1 }).limit(20).lean(),
  ]);

  const approvedCount = attendanceRows.filter((row) => row.status === 'present' || row.status === 'online').length;
  const attendancePercentage = attendanceRows.length > 0 ? Number(((approvedCount / attendanceRows.length) * 100).toFixed(2)) : 0;

  const totalFees = registrations.reduce((sum, row) => sum + Number(row.courseFees || 0), 0);
  const totalPaid = registrations.reduce((sum, row) => sum + Number(row.amountReceived || 0), 0);
  const remainingBalance = registrations.reduce((sum, row) => sum + Number(row.balance || 0), 0);

  return sendSuccess(res, {
    data: {
      attendancePercentage,
      totalFees,
      totalPaid,
      remainingBalance,
      paymentTimeline: installmentRows,
    },
  });
});

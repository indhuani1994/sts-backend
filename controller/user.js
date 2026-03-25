const User = require('../models/user');
const Student = require('../models/student');
const Staff = require('../models/staffs');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');
const { generateToken } = require('../services/authService');

const buildProfile = async (user) => {
  if (user.role === 'student') {
    return Student.findById(user.studentId).lean();
  }

  if (user.role === 'staff' || user.role === 'hr') {
    return Staff.findById(user.staffId).lean();
  }

  return null;
};

exports.getStudentsForDropdown = catchAsync(async (_req, res) => {
  const students = await Student.find({}, 'studentName studentMobile studentMail').sort({ studentName: 1 }).lean();
  return sendSuccess(res, { data: students });
});

exports.getStaffForDropdown = catchAsync(async (_req, res) => {
  const staff = await Staff.find({}, 'staffName staffMobile staffMail').sort({ staffName: 1 }).lean();
  return sendSuccess(res, { data: staff });
});

exports.createUser = catchAsync(async (req, res) => {
  const { username, password, role, studentId, staffId, hrCommissionPercent } = req.body;

  if (!username || !password || !role) {
    throw new ApiError(400, 'username, password and role are required');
  }

  if (!['student', 'staff', 'hr'].includes(role)) {
    throw new ApiError(400, 'Role must be student, staff, or hr');
  }

  const existingUsername = await User.findOne({ username: username.trim() }).lean();
  if (existingUsername) {
    throw new ApiError(400, 'Username already exists');
  }

  if (role === 'student') {
    if (!studentId) {
      throw new ApiError(400, 'studentId is required for student role');
    }

    const student = await Student.findById(studentId).lean();
    if (!student) {
      throw new ApiError(404, 'Student not found');
    }

    const linkedUser = await User.findOne({ studentId, role: 'student' }).lean();
    if (linkedUser) {
      throw new ApiError(400, 'User account already exists for this student');
    }
  }

  if (role === 'staff' || role === 'hr') {
    if (!staffId) {
      throw new ApiError(400, 'staffId is required for staff/hr role');
    }

    const staff = await Staff.findById(staffId).lean();
    if (!staff) {
      throw new ApiError(404, 'Staff not found');
    }

    const linkedUser = await User.findOne({ staffId, role: { $in: ['staff', 'hr'] } }).lean();
    if (linkedUser) {
      throw new ApiError(400, 'User account already exists for this staff');
    }

    if (role === 'hr') {
      const percent = Number(hrCommissionPercent ?? 0);
      if (Number.isNaN(percent) || percent < 0 || percent > 100) {
        throw new ApiError(400, 'hrCommissionPercent must be between 0 and 100');
      }
      await Staff.findByIdAndUpdate(staffId, { hrCommissionPercent: percent });
    }
  }

  const newUser = await User.create({
    username: username.trim(),
    password,
    role,
    studentId: role === 'student' ? studentId : undefined,
    staffId: role === 'staff' || role === 'hr' ? staffId : undefined,
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: `${role} account created successfully`,
    data: {
      id: newUser._id,
      username: newUser.username,
      role: newUser.role,
    },
  });
});

exports.adminLogin = catchAsync(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new ApiError(400, 'Username and password are required');
  }

  const admin = await User.findOne({ username, role: 'admin', isActive: true });
  if (!admin) {
    throw new ApiError(401, 'Invalid admin credentials');
  }

  const isPasswordValid = await admin.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid admin credentials');
  }

  return sendSuccess(res, {
    message: 'Admin login successful',
    data: {
      token: generateToken(admin),
      user: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
      },
    },
  });
});

exports.getManagedUsers = catchAsync(async (_req, res) => {
  const users = await User.find({ role: { $in: ['student', 'staff', 'hr'] } })
    .sort({ createdAt: -1 })
    .select('-password')
    .lean();

  return sendSuccess(res, { data: users });
});

exports.loginStudentOrStaff = catchAsync(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new ApiError(400, 'Username and password are required');
  }

  const user = await User.findOne({ username, isActive: true });
  if (!user || user.role === 'admin') {
    throw new ApiError(401, 'Invalid credentials');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const profile = await buildProfile(user);
  if (!profile) {
    throw new ApiError(404, 'Profile data not found');
  }

  return sendSuccess(res, {
    message: `${user.role} login successful`,
    data: {
      token: generateToken(user),
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        profileId: user.studentId || user.staffId,
        name: profile.studentName || profile.staffName,
      },
      profile,
    },
  });
});

exports.getUserProfile = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId).select('-password');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const profile = await buildProfile(user);
  if (!profile && user.role !== 'admin') {
    throw new ApiError(404, 'Profile data not found');
  }

  return sendSuccess(res, {
    data: {
      user,
      profile,
    },
  });
});

exports.updateUserAccount = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { username, password } = req.body;

  const user = await User.findById(userId);
  if (!user || !['staff', 'student', 'hr'].includes(user.role)) {
    throw new ApiError(404, 'User not found or invalid role');
  }

  if (username && username !== user.username) {
    const existing = await User.findOne({ username: username.trim() }).lean();
    if (existing) {
      throw new ApiError(400, 'Username already exists');
    }
    user.username = username.trim();
  }

  if (password) {
    user.password = password;
  }

  await user.save();

  return sendSuccess(res, { message: 'User updated successfully' });
});

exports.deleteUserAccount = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user || !['staff', 'student', 'hr'].includes(user.role)) {
    throw new ApiError(404, 'User not found or invalid role');
  }

  await User.findByIdAndDelete(userId);

  return sendSuccess(res, { message: 'User deleted successfully' });
});

exports.toggleUserStatus = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user || !['student', 'staff', 'hr'].includes(user.role)) {
    throw new ApiError(404, 'User not found or invalid role');
  }

  user.isActive = !user.isActive;
  await user.save();

  return sendSuccess(res, {
    message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    data: { isActive: user.isActive },
  });
});

exports.getUserStatus = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId, 'username role isActive').lean();
  if (!user || !['student', 'staff', 'hr'].includes(user.role)) {
    throw new ApiError(404, 'User not found or invalid role');
  }

  return sendSuccess(res, {
    data: {
      userId: user._id,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
    },
  });
});

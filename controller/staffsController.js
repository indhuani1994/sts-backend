const Staff = require('../models/staffs');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');
const { createListQuery } = require('../utils/query');
const { deleteCloudinaryByUrl } = require('../utils/cloudinaryHelpers');

const parseJsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];

  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
};

exports.getAllStaff = catchAsync(async (req, res) => {
  const { page, limit, skip, search, sort, paginated } = createListQuery(req, [
    'staffName',
    'staffMail',
    'staffMobile',
    'staffRole',
    'createdAt',
  ]);

  const filter = {};

  if (search) {
    filter.$or = [
      { staffName: { $regex: search, $options: 'i' } },
      { staffMail: { $regex: search, $options: 'i' } },
      { staffMobile: { $regex: search, $options: 'i' } },
      { staffRole: { $regex: search, $options: 'i' } },
    ];
  }

  if (req.query.staffRole) {
    filter.staffRole = req.query.staffRole;
  }

  if (paginated) {
    const [staffList, total] = await Promise.all([
      Staff.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Staff.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      data: staffList,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  const staffList = await Staff.find(filter).sort(sort).lean();
  return res.json(staffList);
});

exports.addStaff = catchAsync(async (req, res) => {
  const {
    staffName,
    staffMobile,
    staffMail,
    staffAddress,
    staffQualification,
    staffExperience,
    staffRole,
    hrCommissionPercent,
  } = req.body;

  const newStaff = await Staff.create({
    staffName,
    staffMobile,
    staffMail,
    staffAddress,
    staffRole,
    hrCommissionPercent: Number(hrCommissionPercent || 0),
    staffQualification: parseJsonArray(staffQualification),
    staffExperience: parseJsonArray(staffExperience),
    staffImage: req.files?.staffImage?.[0]?.path || '',
    staffAadharImage: req.files?.staffAadharImage?.[0]?.path || '',
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Staff added successfully',
    data: newStaff,
  });
});

exports.UpdateStaff = catchAsync(async (req, res) => {
  const existing = await Staff.findById(req.params.id);
  if (!existing) {
    throw new ApiError(404, 'Staff not found');
  }

  const {
    staffName,
    staffMobile,
    staffMail,
    staffAddress,
    staffQualification,
    staffExperience,
    staffRole,
    hrCommissionPercent,
  } = req.body;

  const updateData = {
    staffName,
    staffMobile,
    staffMail,
    staffAddress,
    staffQualification: parseJsonArray(staffQualification),
    staffExperience: parseJsonArray(staffExperience),
    staffRole,
    hrCommissionPercent: Number(hrCommissionPercent || 0),
  };

  if (req.files?.staffImage?.[0]) {
    await deleteCloudinaryByUrl(existing.staffImage, 'staffImage');
    updateData.staffImage = req.files.staffImage[0].path;
  }

  if (req.files?.staffAadharImage?.[0]) {
    await deleteCloudinaryByUrl(existing.staffAadharImage, 'staffAadharImage');
    updateData.staffAadharImage = req.files.staffAadharImage[0].path;
  }

  const updated = await Staff.findByIdAndUpdate(req.params.id, updateData, { new: true });
  if (!updated) throw new ApiError(404, 'Staff not found');

  return sendSuccess(res, { message: 'Staff updated successfully', data: updated });
});

exports.deleteStaff = catchAsync(async (req, res) => {
  const staff = await Staff.findById(req.params.id);
  if (!staff) {
    throw new ApiError(404, 'Staff not found');
  }

  await deleteCloudinaryByUrl(staff.staffImage, 'staffImage');
  await deleteCloudinaryByUrl(staff.staffAadharImage, 'staffAadharImage');
  await Staff.findByIdAndDelete(req.params.id);

  return sendSuccess(res, { message: 'Staff deleted successfully' });
});

exports.getStaffById = catchAsync(async (req, res) => {
  const staff = await Staff.findById(req.params.id).lean();
  if (!staff) {
    throw new ApiError(404, 'Staff not found');
  }

  return res.json(staff);
});

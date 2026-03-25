const { deleteCloudinaryByUrl } = require('../utils/cloudinaryHelpers');
const Student = require('../models/student');
const Placement = require('../models/placement');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');
const { createListQuery } = require('../utils/query');

const parseJsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];

  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
};

exports.getAllStudent = catchAsync(async (req, res) => {
  const { page, limit, skip, search, sort, paginated } = createListQuery(req, [
    'studentName',
    'studentMail',
    'studentMobile',
    'studentCourse',
    'studentStatus',
    'createdAt',
  ]);

  const filter = {};

  if (search) {
    filter.$or = [
      { studentName: { $regex: search, $options: 'i' } },
      { studentMail: { $regex: search, $options: 'i' } },
      { studentMobile: { $regex: search, $options: 'i' } },
      { studentCourse: { $regex: search, $options: 'i' } },
    ];
  }

  if (req.query.studentCourse) {
    filter.studentCourse = req.query.studentCourse;
  }

  if (req.query.studentStatus) {
    filter.studentStatus = req.query.studentStatus;
  }

  if (paginated) {
    const [students, total] = await Promise.all([
      Student.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Student.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      data: students,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  const students = await Student.find(filter).sort(sort).lean();
  return res.json(students);
});

exports.addStudent = catchAsync(async (req, res) => {
  const {
    studentName,
    studentMobile,
    studentMail,
    studentEducation,
    studentCollege,
    studentCollegeAddress,
    studentYearOrExperience,
    studentAddress,
    studentStatus,
    studentCourse,
    studentRedId,
    studentCollegeId,
  } = req.body;

  const newStudent = await Student.create({
    studentCourse,
    studentName,
    studentMobile,
    studentMail,
    studentEducation: parseJsonArray(studentEducation),
    studentCollege,
    studentCollegeAddress,
    studentYearOrExperience,
    studentAddress,
    studentStatus,
    studentRedId,
    studentCollegeId,
    studentImage: req.files?.studentImage?.[0]?.path || '',
    studentAadharImage: req.files?.studentAadharImage?.[0]?.path || '',
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Student added successfully',
    data: newStudent,
  });
});

exports.UpdateStudent = catchAsync(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw new ApiError(404, 'Student not found');

  const {
    studentName,
    studentMobile,
    studentMail,
    studentEducation,
    studentCollege,
    studentCollegeAddress,
    studentYearOrExperience,
    studentAddress,
    studentStatus,
    studentRedId,
    studentCollegeId,
    studentCourse,
  } = req.body;

  const updateData = {
    studentName,
    studentMobile,
    studentMail,
    studentEducation: parseJsonArray(studentEducation),
    studentCollege,
    studentCollegeAddress,
    studentYearOrExperience,
    studentAddress,
    studentStatus,
    studentRedId,
    studentCollegeId,
    studentCourse,
  };

  // --- Handle studentImage ---
  if (req.files?.studentImage?.[0]) {
    await deleteCloudinaryByUrl(student.studentImage, 'studentImage');
    updateData.studentImage = req.files.studentImage[0].path;
  }

  // --- Handle studentAadharImage ---
  if (req.files?.studentAadharImage?.[0]) {
    await deleteCloudinaryByUrl(student.studentAadharImage, 'studentAadharImage');
    updateData.studentAadharImage = req.files.studentAadharImage[0].path;
  }

  const updated = await Student.findByIdAndUpdate(req.params.id, updateData, { new: true });

  return sendSuccess(res, { message: 'Student updated successfully', data: updated });
});

exports.deleteStudent = catchAsync(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw new ApiError(404, 'Student not found');

  await deleteCloudinaryByUrl(student.studentImage, 'studentImage');
  await deleteCloudinaryByUrl(student.studentAadharImage, 'studentAadharImage');

  await Student.findByIdAndDelete(req.params.id);

  return sendSuccess(res, { message: 'Student deleted successfully' });
});

exports.getStudent = catchAsync(async (req, res) => {
  const student = await Student.findById(req.params.id).lean();
  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  return res.json(student);
});

exports.getStudentAllDetail = catchAsync(async (req, res) => {
  const [student, placement] = await Promise.all([
    Student.findById(req.params.id).lean(),
    Placement.findOne({ student: req.params.id }).lean(),
  ]);

  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  return sendSuccess(res, {
    data: {
      student,
      placement,
    },
  });
});

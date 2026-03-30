const Course = require('../models/course');
const StudentRegister = require('../models/studentRegister');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');
const { createListQuery } = require('../utils/query');
const { deleteCloudinaryByUrl } = require('../utils/cloudinaryHelpers');

const parseSyllabus = (syllabus) => {
  if (Array.isArray(syllabus)) {
    return syllabus.filter(Boolean);
  }

  if (!syllabus) {
    return [];
  }

  return String(syllabus)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

exports.getCourses = catchAsync(async (req, res) => {
  const { page, limit, skip, search, sort, paginated } = createListQuery(req, [
    'courseName',
    'courseCode',
    'fees',
    'type',
    'createdAt',
  ]);

  const filter = {};

  if (search) {
    filter.$or = [
      { courseName: { $regex: search, $options: 'i' } },
      { courseCode: { $regex: search, $options: 'i' } },
      { type: { $regex: search, $options: 'i' } },
    ];
  }

  if (req.query.type) {
    filter.type = req.query.type;
  }

  if (paginated) {
    const [courses, total] = await Promise.all([
      Course.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Course.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      data: courses,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  const courses = await Course.find(filter).sort(sort).lean();
  return res.json(courses);
});

exports.getAssignedCourses = catchAsync(async (req, res) => {
  const { role, profileId } = req.user || {};
  if (!profileId || (role !== 'staff' && role !== 'student' && role !== 'hr')) {
    throw new ApiError(403, 'Assigned courses are only available for staff, hr, and students');
  }

  const filter = role === 'staff' || role === 'hr' ? { staff: profileId } : { student: profileId };
  const courseIds = await StudentRegister.distinct('course', filter);

  const courses = await Course.find({ _id: { $in: courseIds } })
    .sort({ courseName: 1 })
    .lean();

  return res.json(courses);
});

exports.getCourseById = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.id).lean();
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  return res.json(course);
});

exports.createCourse = catchAsync(async (req, res) => {
  const {
    courseCode,
    courseName,
    fees,
    duration,
    prerequire,
    syllabus,
    description,
    type,
    offer,
    drivelink
  } = req.body;

  const course = await Course.create({
    courseCode,
    courseName,
    fees: Number(fees || 0),
    duration,
    prerequire,
    image: req.file ? req.file.path : '',
    description,
    type,
    offer,
    drivelink,
    syllabus: parseSyllabus(syllabus),
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Course created successfully',
    data: course,
  });
});

exports.updateCourse = catchAsync(async (req, res) => {
  const {
    courseCode,
    courseName,
    fees,
    duration,
    prerequire,
    syllabus,
    description,
    type,
    offer,
    drivelink
  } = req.body;

  const updateData = {
    courseCode,
    courseName,
    fees: Number(fees || 0),
    duration,
    prerequire,
    description,
    type,
    offer,
    drivelink,
    syllabus: parseSyllabus(syllabus),
  };

  if (req.file) {
    const existing = await Course.findById(req.params.id).lean();
    if (existing?.image) {
      await deleteCloudinaryByUrl(existing.image, 'courseImage');
    }
    updateData.image = req.file.path;
  }

  const updated = await Course.findByIdAndUpdate(req.params.id, updateData, { new: true });
  if (!updated) {
    throw new ApiError(404, 'Course not found');
  }

  return sendSuccess(res, { message: 'Course updated successfully', data: updated });
});

// exports.updateCourseSyllabus = catchAsync(async (req, res) => {
//   const { role, profileId } = req.user || {};
//   if (role !== 'staff' || !profileId) {
//     throw new ApiError(403, 'Only staff can update syllabus');
//   }

//   const courseId = req.params.id;
//   const assigned = await StudentRegister.exists({ staff: profileId, course: courseId });
//   if (!assigned) {
//     throw new ApiError(403, 'You can only update syllabus for your assigned courses');
//   }

//   const syllabus = parseSyllabus(req.body.syllabus);

//   const updated = await Course.findByIdAndUpdate(
//     courseId,
//     { syllabus },
//     { new: true }
//   );

//   if (!updated) {
//     throw new ApiError(404, 'Course not found');
//   }

//   return sendSuccess(res, { message: 'Syllabus updated successfully', data: updated });
// });


exports.updateCourseSyllabus = catchAsync(async (req, res) => {
  const { role, profileId } = req.user || {};

  if (role !== "staff" || !profileId) {
    throw new ApiError(403, "Only staff can update syllabus");
  }

  const courseId = req.params.id;

  const assigned = await StudentRegister.exists({
    staff: profileId,
    course: courseId
  });

  if (!assigned) {
    throw new ApiError(403, "You can only update syllabus for your assigned courses");
  }

  const syllabus = parseSyllabus(req.body.syllabus);
  const drivelink = req.body.drivelink || "";

  const updated = await Course.findByIdAndUpdate(
    courseId,
    {
      syllabus,
      drivelink
    },
    { new: true }
  );

  if (!updated) {
    throw new ApiError(404, "Course not found");
  }

  return sendSuccess(res, {
    message: "Syllabus updated successfully",
    data: updated
  });
});


exports.deleteCourse = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.id);
  console.log(course);
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }
  console.log("Course Image");
  console.log(course.image);
  await deleteCloudinaryByUrl(course.image, 'image');
  await Course.findByIdAndDelete(req.params.id);

  return sendSuccess(res, { message: 'Course deleted successfully' });
});

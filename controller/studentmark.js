const StudentRegister = require('../models/studentRegister');
const StudentMarks = require('../models/studentmark');
const User = require('../models/user');
const { isValidObjectId } = require('../utils/validators');

const EDIT_WINDOW_DAYS = 7;
const EDIT_WINDOW_MS = EDIT_WINDOW_DAYS * 24 * 60 * 60 * 1000;

const isWithinEditWindow = (createdAt) => {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() <= EDIT_WINDOW_MS;
};

const formatMark = (mark, role) => {
  const createdAt = mark.createdAt;
  const editableUntil = createdAt ? new Date(createdAt.getTime() + EDIT_WINDOW_MS) : null;
  const canEdit =
    role === 'admin' ||
    (role === 'staff' && mark.staff && isWithinEditWindow(createdAt));

  return {
    id: mark._id,
    date: mark.createdAt,
    updatedAt: mark.updatedAt,
    editableUntil,
    canEdit,
    canDelete: canEdit,
    studentRegisterId: mark.studentRegister?._id,
    studentName: mark.studentRegister?.student?.studentName || 'N/A',
    studentImage: mark.studentRegister?.student?.studentImage || '',
    courseName: mark.studentRegister?.course?.courseName || 'N/A',
    staffName: mark.staff?.staffName || mark.studentRegister?.staff?.staffName || 'N/A',
    syllabusName: mark.syllabusName,
    testMark: mark.testMark,
    teacherRemark: mark.teacherRemark || '',
    history: mark.history || [],
  };
};

const resolveStaffId = async (reqUser) => {
  if (!reqUser) return null;
  if (reqUser.profileId) return reqUser.profileId;
  if (reqUser.userId) {
    const user = await User.findById(reqUser.userId).select('staffId role').lean();
    if (user?.role === 'staff' && user.staffId) {
      return user.staffId;
    }
  }
  return null;
};

exports.getMyStudents = async (req, res) => {
  try {
    const { role } = req.user || {};
    const staffId = (await resolveStaffId(req.user)) || req.query.staffId;
    if (role !== 'staff' || !staffId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const students = await StudentRegister.find({ staff: staffId })
      .populate('student', 'studentName studentImage')
      .populate('course', 'courseName');

    res.json(
      students.map((s) => ({
        studentRegisterId: s._id,
        studentName: s.student?.studentName || 'N/A',
        studentImage: s.student?.studentImage || '',
        courseName: s.course?.courseName || 'N/A',
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addStudentMark = async (req, res) => {
  try {
    const { role } = req.user || {};
    const staffId = await resolveStaffId(req.user);
    if (role !== 'staff' || !staffId) {
      return res.status(403).json({ message: 'Only staff can add marks' });
    }

    const { studentRegisterId, syllabusName, testMark, teacherRemark } = req.body;

    if (!studentRegisterId || !isValidObjectId(studentRegisterId)) {
      return res.status(400).json({ message: 'Valid studentRegisterId is required' });
    }
    if (!syllabusName || testMark === undefined || testMark === null) {
      return res.status(400).json({ message: 'Syllabus and mark are required' });
    }

    const register = await StudentRegister.findById(studentRegisterId).select('staff').lean();
    if (!register) {
      return res.status(404).json({ message: 'Student register not found' });
    }
    if (register.staff?.toString() !== staffId.toString()) {
      return res.status(403).json({ message: 'You can only add marks for your students' });
    }

    const mark = new StudentMarks({
      studentRegister: studentRegisterId,
      staff: staffId,
      syllabusName: syllabusName.trim(),
      testMark: Number(testMark),
      teacherRemark: teacherRemark?.trim() || '',
    });

    await mark.save();

    res.status(201).json({ message: 'Mark added successfully', data: mark });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMarksForRole = async (req, res) => {
  try {
    const { role, profileId } = req.user || {};
    if (!role) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const filter = {};

    if (role === 'staff' || role === 'hr') {
      const staffId = await resolveStaffId(req.user);
      if (!staffId) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      filter.staff = staffId;
    } else if (role === 'student') {
      const registers = await StudentRegister.find({ student: profileId }).select('_id').lean();
      const registerIds = registers.map((r) => r._id);
      filter.studentRegister = { $in: registerIds };
    }

    const marks = await StudentMarks.find(filter)
      .populate({
        path: 'studentRegister',
        populate: [
          { path: 'student', select: 'studentName studentImage' },
          { path: 'course', select: 'courseName' },
          { path: 'staff', select: 'staffName' },
        ],
      })
      .populate('staff', 'staffName')
      .sort({ createdAt: -1 });

    res.json(marks.map((m) => formatMark(m, role)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStudentMarks = async (req, res) => {
  try {
    const { studentRegisterId } = req.params;
    const { role, profileId } = req.user || {};

    if (!studentRegisterId || !isValidObjectId(studentRegisterId)) {
      return res.status(400).json({ message: 'Valid studentRegisterId is required' });
    }

    if (role === 'staff') {
      const staffId = await resolveStaffId(req.user);
      const register = await StudentRegister.findById(studentRegisterId).select('staff').lean();
      if (!register || register.staff?.toString() !== staffId?.toString()) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    if (role === 'student') {
      const register = await StudentRegister.findById(studentRegisterId).select('student').lean();
      if (!register || register.student?.toString() !== profileId?.toString()) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    const marks = await StudentMarks.find({ studentRegister: studentRegisterId })
      .populate({
        path: 'studentRegister',
        populate: [
          { path: 'student', select: 'studentName studentImage' },
          { path: 'course', select: 'courseName' },
          { path: 'staff', select: 'staffName' },
        ],
      })
      .populate('staff', 'staffName')
      .sort({ createdAt: -1 });

    res.json(marks.map((m) => formatMark(m, role)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStudentMark = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, profileId } = req.user || {};
    const staffId = role === 'staff' ? await resolveStaffId(req.user) : null;
    const { syllabusName, testMark, teacherRemark } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Valid mark id is required' });
    }

    const mark = await StudentMarks.findById(id);
    if (!mark) {
      return res.status(404).json({ message: 'Mark not found' });
    }

    if (role === 'staff') {
      if (!staffId || mark.staff?.toString() !== staffId?.toString()) {
        return res.status(403).json({ message: 'You can only update your own marks' });
      }
      if (!isWithinEditWindow(mark.createdAt)) {
        return res.status(403).json({ message: 'Edit window expired (7 days)' });
      }
    }

    if (!syllabusName && testMark === undefined && teacherRemark === undefined) {
      return res.status(400).json({ message: 'No changes provided' });
    }

    const nextValues = {
      syllabusName: syllabusName !== undefined ? syllabusName.trim() : mark.syllabusName,
      testMark: testMark !== undefined ? Number(testMark) : mark.testMark,
      teacherRemark: teacherRemark !== undefined ? teacherRemark.trim() : mark.teacherRemark,
    };

    mark.history = mark.history || [];
    mark.history.push({
      updatedAt: new Date(),
      updatedByRole: role,
      updatedById: profileId || staffId || req.user?.userId || mark.staff,
      previous: {
        syllabusName: mark.syllabusName,
        testMark: mark.testMark,
        teacherRemark: mark.teacherRemark,
      },
      next: { ...nextValues },
    });

    mark.syllabusName = nextValues.syllabusName;
    mark.testMark = nextValues.testMark;
    mark.teacherRemark = nextValues.teacherRemark;

    await mark.save();

    res.json({ message: 'Mark updated successfully', data: mark });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteStudentMark = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.user || {};
    const staffId = role === 'staff' ? await resolveStaffId(req.user) : null;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Valid mark id is required' });
    }

    const mark = await StudentMarks.findById(id);
    if (!mark) {
      return res.status(404).json({ message: 'Mark not found' });
    }

    if (role === 'staff') {
      if (!staffId || mark.staff?.toString() !== staffId?.toString()) {
        return res.status(403).json({ message: 'You can only delete your own marks' });
      }
      if (!isWithinEditWindow(mark.createdAt)) {
        return res.status(403).json({ message: 'Delete window expired (7 days)' });
      }
    }

    await mark.deleteOne();

    res.json({ message: 'Mark deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllStudentMarks = async (req, res) => {
  try {
    const marks = await StudentMarks.find()
      .populate({
        path: 'studentRegister',
        populate: [
          { path: 'student', select: 'studentName studentImage' },
          { path: 'course', select: 'courseName' },
          { path: 'staff', select: 'staffName' },
        ],
      })
      .populate('staff', 'staffName')
      .sort({ createdAt: -1 });

    res.json(marks.map((m) => formatMark(m, 'admin')));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

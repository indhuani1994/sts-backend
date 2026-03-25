const CourseUpdate = require('../models/course_update');
const StudentRegister = require('../models/studentRegister');

const createCourseUpdate = async (req, res) => {
  try {
    const updates = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: 'Invalid input format. Expecting an array of updates.' });
    }

    const role = req.user?.role;
    const profileId = req.user?.profileId;
    const regIds = updates.map((item) => item?.regId).filter(Boolean);
    const uniqueRegIds = [...new Set(regIds)];

    if (regIds.length !== updates.length) {
      return res.status(400).json({ message: 'Each update must include regId' });
    }

    let allowedRegIds = null;
    let studentByReg = null;

    if (role === 'staff') {
      if (!profileId) {
        return res.status(403).json({ message: 'Staff profile not found' });
      }

      const registers = await StudentRegister.find({
        _id: { $in: uniqueRegIds },
        staff: profileId,
      })
        .select('_id student')
        .lean();

      allowedRegIds = new Set(registers.map((r) => r._id.toString()));
      studentByReg = new Map(registers.map((r) => [r._id.toString(), r.student?.toString()]));

      if (allowedRegIds.size !== uniqueRegIds.length) {
        return res.status(403).json({ message: 'You can only update schedules for your students' });
      }
    }

    const results = [];

    for (const update of updates) {
      if (!update.studentId) {
        return res.status(400).json({ message: 'Each update must include studentId' });
      }

      if (role === 'staff' && allowedRegIds && !allowedRegIds.has(update.regId)) {
        return res.status(403).json({ message: 'You can only update schedules for your students' });
      }

      if (role === 'staff' && studentByReg) {
        const expectedStudentId = studentByReg.get(update.regId);
        if (expectedStudentId && expectedStudentId !== update.studentId) {
          return res.status(400).json({ message: 'studentId does not match the registration record' });
        }
      }

      const updatedDoc = await CourseUpdate.findOneAndUpdate(
        { regId: update.regId, studentId: update.studentId }, // find by regId + studentId
        { $set: update },
        { new: true, upsert: true }
      );
      results.push(updatedDoc);
    }

    res.status(200).json({ message: 'Schedule saved/updated successfully', data: results });
  } catch (error) {
    console.error('Error in schedule update:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

const getCourseUpdates = async (req, res) => {
  try {
    const role = req.user?.role;
    const profileId = req.user?.profileId;

    if (role === 'staff' || role === 'hr') {
      if (!profileId) {
        return res.status(403).json({ message: 'Staff profile not found' });
      }

      const registers = await StudentRegister.find({ staff: profileId }).select('_id').lean();
      const regIds = registers.map((r) => r._id.toString());
      const updates = await CourseUpdate.find({ regId: { $in: regIds } }).sort({ updatedAt: -1 });
      return res.status(200).json(updates);
    }

    const updates = await CourseUpdate.find().sort({ updatedAt: -1 });
    return res.status(200).json(updates);
  } catch (error) {
    console.error('Error fetching course updates:', error);
    res.status(500).json({ message: 'Failed to fetch course updates' });
  }
};

const getCourseUpdatesByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!studentId) {
      return res.status(400).json({ message: 'studentId is required' });
    }

    const role = req.user?.role;
    const profileId = req.user?.profileId;

    if (role === 'student' && profileId && profileId !== studentId) {
      return res.status(403).json({ message: 'You can only view your own schedule' });
    }

    if (role === 'staff') {
      const register = await StudentRegister.findOne({ student: studentId, staff: profileId }).lean();
      if (!register) {
        return res.status(403).json({ message: 'You can only view schedules for your students' });
      }
    }

    const schedules = await CourseUpdate.find({ studentId }).sort({ time: 1, updatedAt: -1 });

    if (!schedules || schedules.length === 0) {
      return res.status(404).json({ message: 'No schedules found for this student' });
    }

    // Return as an array of schedules
    res.status(200).json({
      studentId,
      totalSchedules: schedules.length,
      schedules,
    });
  } catch (error) {
    console.error('Error fetching student schedules:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
module.exports = {
  createCourseUpdate,
  getCourseUpdates,
  getCourseUpdatesByStudentId,
};


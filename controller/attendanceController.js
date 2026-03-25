// const Attendance = require('../models/attendance');
// const StudentRegister = require('../models/studentRegister');

// // Office location coordinates
// const OFFICE_LAT = 9.945088;
// const OFFICE_LNG = 78.09857;
// const MAX_DISTANCE_KM = 0.5; // 500 meters
// // allowed distance in KM




// function haversineDistance(lat1, lon1, lat2, lon2) {
//     function toRad(x) { return x * Math.PI / 180; }
//     const R = 6371;
//     const dLat = toRad(lat2 - lat1);
//     const dLon = toRad(lon2 - lon1);
//     const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//         Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
//         Math.sin(dLon / 2) * Math.sin(dLon / 2);
//     return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// }

// // Student marks attendance
// exports.markAttendance = async (req, res) => {
//     try {
//         const { studentRegisterId, mode, latitude, longitude } = req.body;

//         const studentData = await StudentRegister.findById(studentRegisterId)
//             .populate('student', 'name')
//             .populate('course', 'courseName')
//             .populate('staff', 'name');

//         if (!studentData) {
//             return res.status(404).json({ message: 'Student not found' });
//         }

//         // Location check for offline mode
//         if (mode === 'offline') {
//             const distance = haversineDistance(latitude, longitude, OFFICE_LAT, OFFICE_LNG);
//             console.log('Student Location:', latitude, longitude);
//             console.log('Office Location:', OFFICE_LAT, OFFICE_LNG);
//             console.log('Calculated Distance (km):', distance);

//             if (distance > MAX_DISTANCE_KM) {
//                 return res.status(400).json({ message: 'Offline attendance must be marked from office location' });
//             }
//         }


//         const attendance = await Attendance.create({
//             studentRegister: studentRegisterId,
//             mode,
//             location: latitude && longitude ? `${latitude},${longitude}` : undefined
//         });

//         res.json({ message: 'Attendance request submitted', data: attendance });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// // Admin views pending requests
// exports.getPendingAttendance = async (req, res) => {
//     try {
//         const pending = await Attendance.find({ status: 'pending' })
//             .populate({
//                 path: 'studentRegister',
//                 populate: [
//                     { path: 'student', select: 'name' },
//                     { path: 'course', select: 'courseName' }
//                 ]
//             });
//         res.json(pending);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// // Admin approves/rejects
// exports.updateAttendanceStatus = async (req, res) => {
//     try {
//         const { attendanceId, status } = req.body;
//         if (!['approved', 'rejected'].includes(status)) {
//             return res.status(400).json({ message: 'Invalid status' });
//         }
//         const attendance = await Attendance.findByIdAndUpdate(
//             attendanceId,
//             { status, markedBy: 'admin' },
//             { new: true }
//         );
//         res.json({ message: 'Attendance updated', data: attendance });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// exports.getallattend = async (req, res) => {
//   try {
//     const records = await Attendance.find()
//       .populate({
//         path: "studentRegister",
//         populate: [
//           { path: "student", model: "Student", select: "studentName" },
//           { path: "course", model: "Course", select: "courseName" }
//         ]
//       })
//       .lean();

//     res.json(records);
//   } catch (err) {
//     console.error("Error fetching attendance:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// exports.deleteAttendance = async (req, res) => {
//     try {
//         const { id } = req.params;

//         const deleted = await Attendance.findByIdAndDelete(id);

//         if (!deleted) {
//             return res.status(404).json({ message: "Attendance record not found" });
//         }

//         res.json({ message: "Attendance record deleted successfully", data: deleted });
//     } catch (error) {
//         console.error("Error deleting attendance:", error);
//         res.status(500).json({ message: "Server error" });
//     }
// };


const Attendance = require("../models/attendance");
const StudentRegister = require("../models/studentRegister");
const Student = require("../models/student");
const { isValidObjectId } = require("../utils/validators");

const ALLOWED_STATUSES = new Set(["present", "absent", "leave", "online"]);

const normalizeDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const getToday = () => normalizeDate(new Date());

const isAllowedStatus = (status) => ALLOWED_STATUSES.has(status);




const getDayRange = (baseDate) => {
  const start = normalizeDate(baseDate);
  if (!start) return null;
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

// ===========================================
// STAFF MARK / UPDATE ATTENDANCE (SINGLE)
// ===========================================

exports.adminBulkUpdate = async (req, res) => {
  try {
    const { date, updates } = req.body; // updates: [{ studentId: "...", status: "..." }]

    if (!date || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: "Date and updates array are required" });
    }

    const targetDate = normalizeDate(date);
    if (!targetDate) {
      return res.status(400).json({ message: "Valid date is required" });
    }

    const today = getToday();
    if (targetDate.getTime() !== today.getTime()) {
      return res.status(403).json({ message: "Admin can update only today's attendance" });
    }

    const dayRange = getDayRange(targetDate);

    // Prepare MongoDB Bulk Operations
    const validUpdates = updates.filter(
      (item) => isValidObjectId(item.studentId) && isAllowedStatus(item.status)
    );

    if (validUpdates.length === 0) {
      return res.status(400).json({ message: "No valid records to update" });
    }

    const uniqueIds = Array.from(new Set(validUpdates.map((u) => u.studentId.toString())));
    const registers = await StudentRegister.find({ _id: { $in: uniqueIds } })
      .select("_id staff")
      .lean();

    const registerMap = new Map();
    registers.forEach((reg) => {
      registerMap.set(reg._id.toString(), reg);
    });

    const missing = uniqueIds.filter((id) => !registerMap.has(id));
    if (missing.length) {
      return res.status(400).json({ message: "One or more students not found" });
    }

    const operations = validUpdates.map((item) => {
      const register = registerMap.get(item.studentId.toString());
      return ({
        updateOne: {
          filter: {
            studentId: item.studentId,
            date: { $gte: dayRange.start, $lt: dayRange.end },
          },
          update: {
            $set: {
              studentId: item.studentId,
              staffId: register?.staff,
              status: item.status,
              date: targetDate,
            },
          },
          upsert: true,
        },
      });
    });

    await Attendance.bulkWrite(operations);
    res.json({ message: `Successfully updated ${operations.length} records` });
  } catch (err) {
    console.error("Admin Bulk Update Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const { role, profileId } = req.user ;
    const { studentId, status, staffId } = req.body;

    if ( role !== "admin") {
      return res.status(403).json({ message: "Forbidden only admin can mark attendance" });
    }

    

    if (!isValidObjectId(studentId)) {
      return res.status(400).json({ message: "Valid studentId is required" });
    }

    if (!isAllowedStatus(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

  

    const today = getToday();
    const dayRange = getDayRange(today);

    let resolvedStaffId = staffId;
    if (!resolvedStaffId) {
      const register = await StudentRegister.findById(studentId).select("staff").lean();
      resolvedStaffId = register?.staff;
    }

    if (!resolvedStaffId) {
      return res.status(400).json({ message: "Valid staffId is required" });
    }

    const attendance = await Attendance.findOneAndUpdate(
      { studentId, date: { $gte: dayRange.start, $lt: dayRange.end } },
      {
        $set: {
          studentId,
          staffId: resolvedStaffId,
          status,
          date: today,
        },
      },
      { new: true, upsert: true }
    );

    return res.json({ message: "Attendance saved", attendance });
  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
};

// ===========================================
// REPORT FILTER (Common)
// ===========================================
exports.getAttendanceReport = async (req, res) => {
  try {
    const { role, profileId } = req.user || {};
    const { studentId, type, date, startDate, endDate } = req.query;

    if (!role) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (studentId && !isValidObjectId(studentId)) {
      return res.status(400).json({ message: "Valid studentId is required" });
    }

    const filter = {};

    if (role === "student") {
      if (!profileId) {
        return res.status(400).json({ message: "Student profile not found" });
      }

      const registers = await StudentRegister.find({ student: profileId }).select("_id").lean();
      const registerIds = registers.map((row) => row._id.toString());

      if (studentId && !registerIds.includes(studentId)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      if (!registerIds.length) {
        return res.json([]);
      }

      filter.studentId = studentId ? studentId : { $in: registerIds };
    } else if (role === "staff") {
      if (!profileId) {
        return res.status(400).json({ message: "Staff profile not found" });
      }

      const registers = await StudentRegister.find({ staff: profileId }).select("_id").lean();
      const registerIds = registers.map((row) => row._id.toString());

      if (studentId && !registerIds.includes(studentId)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      if (!registerIds.length) {
        return res.json([]);
      }

      filter.studentId = studentId ? studentId : { $in: registerIds };
    } else if (role === "admin") {
      if (studentId) {
        filter.studentId = studentId;
      }
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (type === "date") {
      const range = getDayRange(date);
      if (!range) {
        return res.status(400).json({ message: "Valid date is required" });
      }
      filter.date = { $gte: range.start, $lt: range.end };
    }

    if (type === "week") {
      const start = normalizeDate(startDate);
      const end = normalizeDate(endDate);
      if (!start || !end) {
        return res.status(400).json({ message: "Valid startDate and endDate are required" });
      }
      if (end.getTime() < start.getTime()) {
        return res.status(400).json({ message: "endDate must be after startDate" });
      }
      const endExclusive = new Date(end);
      endExclusive.setDate(endExclusive.getDate() + 1);
      filter.date = { $gte: start, $lt: endExclusive };
    }

    if (type === "month") {
      const base = normalizeDate(date);
      if (!base) {
        return res.status(400).json({ message: "Valid date is required" });
      }
      const firstDay = new Date(base.getFullYear(), base.getMonth(), 1);
      firstDay.setHours(0, 0, 0, 0);
      const nextMonth = new Date(base.getFullYear(), base.getMonth() + 1, 1);
      nextMonth.setHours(0, 0, 0, 0);
      filter.date = { $gte: firstDay, $lt: nextMonth };
    }

    const data = await Attendance.find(filter)
      .populate({
        path: "studentId",
        select: "student course",
        populate: [
          { path: "student", select: "studentName" },
          { path: "course", select: "courseName" },
        ],
      })
      .sort({ date: -1 })
      .lean();

    const missingIds = data
      .filter((row) => {
        const hasName =
          row.studentName ||
          row.studentId?.student?.studentName ||
          row.studentId?.studentName;
        return !hasName && row.studentId;
      })
      .map((row) => (row.studentId?._id ? row.studentId._id.toString() : row.studentId.toString()));

    const uniqueMissingIds = Array.from(new Set(missingIds));
    const registerMap = new Map();
    const studentMap = new Map();

    if (uniqueMissingIds.length) {
      const registers = await StudentRegister.find({ _id: { $in: uniqueMissingIds } })
        .populate("student", "studentName")
        .populate("course", "courseName")
        .lean();

      registers.forEach((reg) => {
        registerMap.set(reg._id.toString(), reg);
      });

      const unresolvedIds = uniqueMissingIds.filter((id) => !registerMap.has(id));
      if (unresolvedIds.length) {
        const students = await Student.find({ _id: { $in: unresolvedIds } })
          .select("studentName")
          .lean();
        students.forEach((s) => {
          studentMap.set(s._id.toString(), s);
        });
      }
    }

    const mapped = data.map((row) => {
      const register = row.studentId;
      const registerId = register?._id ? register._id.toString() : row.studentId?.toString();
      const fromRegister = registerId ? registerMap.get(registerId) : null;
      const fromStudent = registerId ? studentMap.get(registerId) : null;
      const studentName =
        register?.student?.studentName ||
        register?.studentName ||
        fromRegister?.student?.studentName ||
        fromStudent?.studentName ||
        row.studentName ||
        "";
      const courseName =
        register?.course?.courseName ||
        register?.courseName ||
        fromRegister?.course?.courseName ||
        row.courseName ||
        "";

      return {
        ...row,
        studentName,
        courseName,
      };
    });

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: "Error fetching report" });
  }
};

// ===========================================
// ADMIN UPDATE TODAY ONLY
// ===========================================
exports.adminUpdateToday = async (req, res) => {
  try {
    const { attendanceId, status } = req.body;

    console.log({attendanceId})

    if (!isValidObjectId(attendanceId)) {
      return res.status(400).json({ message: "Valid attendanceId is required" });
    }

    if (!isAllowedStatus(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const today = getToday();

    const record = await Attendance.findById(attendanceId);

    if (!record) {
      return res.status(404).json({ message: "Not found" });
    }

    const recordDay = normalizeDate(record.date);
    if (!recordDay || recordDay.getTime() !== today.getTime()) {
      return res.status(403).json({
        message: "Admin can update only today's attendance",
      });
    }

    record.status = status;
    await record.save();

    res.json({ message: "Updated by admin" });
  } catch (err) {
    res.status(500).json({ message: err.message});
  }
};

exports.bulkMarkAttendance = async (req, res) => {
  try {
    const { role, profileId } = req.user || {};
    const records = Array.isArray(req.body.records) ? req.body.records : [];

    if (role !== "staff") {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!profileId) {
      return res.status(400).json({ message: "Staff profile not found" });
    }

    if (records.length === 0) {
      return res.status(400).json({ message: "records array required" });
    }

    const invalidRecord = records.find(
      (item) => !isValidObjectId(item?.studentId) || !isAllowedStatus(item?.status)
    );

    if (invalidRecord) {
      return res.status(400).json({ message: "Invalid studentId or status in records" });
    }

    const staffStudents = await StudentRegister.find({ staff: profileId }).select("_id").lean();
    const allowedIds = new Set(staffStudents.map((s) => s._id.toString()));

    const unauthorized = records.find((item) => !allowedIds.has(item.studentId));
    if (unauthorized) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const today = getToday();
    const dayRange = getDayRange(today);

    const deduped = new Map();
    for (const item of records) {
      deduped.set(item.studentId, item.status);
    }

    const operations = Array.from(deduped.entries()).map(([id, status]) => ({
      updateOne: {
        filter: {
          studentId: id,
          date: { $gte: dayRange.start, $lt: dayRange.end },
        },
        update: {
          $set: {
            studentId: id,
            staffId: profileId,
            status,
            date: today,
          },
        },
        upsert: true,
      },
    }));

    if (operations.length > 0) {
      await Attendance.bulkWrite(operations);
    }

    res.json({ message: "Bulk attendance saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving bulk attendance" });
  }
};

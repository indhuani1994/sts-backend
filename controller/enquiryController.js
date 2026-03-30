const enquiry = require('../models/enquiry');
const Staff = require('../models/staffs');
const StudentRegister = require('../models/studentRegister');
const Installment = require('../models/installment');
const HrEarningStatus = require('../models/hrEarningStatus');

const toNumber = (value) => {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num : 0;
};

const buildHrEarningRecords = async (staffId) => {
  const staff = await Staff.findById(staffId).lean();
  if (!staff) return [];

  const percent = toNumber(staff.hrCommissionPercent || 0);

  const enquiries = await enquiry
    .find({ createdBy: staffId, registeredStudent: { $ne: null } })
    .select('registeredStudent')
    .lean();

  const studentIds = enquiries
    .map((item) => item.registeredStudent?._id || item.registeredStudent)
    .filter(Boolean)
    .map((id) => id.toString());

  if (!studentIds.length) return [];

  const registers = await StudentRegister.find({ student: { $in: studentIds } })
    .populate('student', 'studentName studentMobile studentMail')
    .populate('course', 'courseName')
    .lean();

  const registerIds = registers.map((reg) => reg._id);

  const installments = await Installment.find({ register: { $in: registerIds } })
    .populate({
      path: 'register',
      populate: [
        { path: 'student', select: 'studentName studentMobile studentMail' },
        { path: 'course', select: 'courseName' },
      ],
    })
    .lean();

  const installmentIds = installments.map((item) => item._id);

  const statusRows = await HrEarningStatus.find({
    hr: staffId,
    $or: [
      { recordType: 'initial', recordId: { $in: registerIds } },
      { recordType: 'installment', recordId: { $in: installmentIds } },
    ],
  }).lean();

  const statusMap = new Map(
    statusRows.map((row) => [`${row.recordType}:${row.recordId.toString()}`, row])
  );

  const result = [];

  registers.forEach((reg) => {
    const initialPaid = toNumber(reg.amountReceivedd ?? reg.amountReceived ?? 0);
    if (initialPaid <= 0) return;

    const student = reg.student || {};
    const key = `initial:${reg._id.toString()}`;
    const statusRow = statusMap.get(key);
    const earningAmount = Number(((initialPaid * percent) / 100).toFixed(2));

    result.push({
      recordType: 'initial',
      recordId: reg._id,
      registerId: reg._id,
      hrId: staffId,
      installmentId: null,
      studentId: student._id || reg.student,
      studentName: student.studentName || 'Student',
      courseName: reg.course?.courseName || 'Course',
      paymentDate: reg.createdAt,
      amountPaid: initialPaid,
      commissionPercent: percent,
      earningAmount,
      status: statusRow?.status || 'pending',
      history: statusRow?.history || [],
      paymentLabel: reg.paymentType ? `Initial (${reg.paymentType})` : 'Initial Payment',
    });
  });

  installments.forEach((inst) => {
    const reg = inst.register || {};
    const student = reg.student || {};
    const paid = toNumber(inst.totalPaidForThisTxn ?? (toNumber(inst.amountPaid) + toNumber(inst.latePenalty)));
    if (paid <= 0) return;

    const key = `installment:${inst._id.toString()}`;
    const statusRow = statusMap.get(key);
    const earningAmount = Number(((paid * percent) / 100).toFixed(2));
    const modeLabel = inst.paymentMode ? `Installment (${inst.paymentMode})` : 'Installment';

    result.push({
      recordType: 'installment',
      recordId: inst._id,
      registerId: reg._id || inst.register,
      hrId: staffId ,
      installmentId: inst._id,
      studentId: student._id || reg.student,
      studentName: student.studentName || 'Student',
      courseName: reg.course?.courseName || 'Course',
      paymentDate: inst.createdAt,
      amountPaid: paid,
      commissionPercent: percent,
      earningAmount,
      status: statusRow?.status || 'pending',
      history: statusRow?.history || [],
      paymentLabel: modeLabel,
    });
  });

  result.sort((a, b) => new Date(b.paymentDate || 0) - new Date(a.paymentDate || 0));
  return result;
};

exports.addEnquiry = async (req, res) => {
    try {
      const { enName,
    enMail,
    enMobile,
    enCourse,
    enReference,
    enReferedStudent,
    enStatus,
    enNextFollowUp} = req.body;

    const data = {
         enName,
    enMail,
    enMobile,
    enCourse,
    enReference,
    enReferedStudent,
    enStatus,
    enNextFollowUp
    }

    if ((req.user?.role === 'hr' || req.user?.role === 'staff') && req.user?.profileId) {
      data.createdBy = req.user.profileId;
    }

    if (enStatus) {
      data.enStatusHistory = [
        {
          status: enStatus,
          changedAt: new Date(),
          changedBy: req.user?.userId || req.user?.profileId || null,
          changedByRole: req.user?.role || null,
        },
      ];
    }
     
    const enquData = new enquiry(data);
    await enquData.save();
    res.json({message: 'Enquiry added successfully', data: enquData});


    } catch (error) {
        

        if (error.name ===  "ValidationError") {
         return res.status(400).json({error: "Validation error", message: error.errors.enName.message})
        }
        res.status(500).json({error: "Can't add Enquiry Details server error", error})
    }
}

exports.getEnquiry = async (req, res) => {
  try {
     const { role, profileId } = req.user || {};
     const filter = (role === 'hr' || role === 'staff') && profileId ? { createdBy: profileId } : {};
     const data = await enquiry
       .find(filter)
       .populate('createdBy', 'staffName staffMail staffMobile')
       .populate('registeredBy', 'staffName staffMail staffMobile')
       .populate('registeredStudent', 'studentName studentMobile studentMail');
     res.json(data);  
  } catch (error) {
    res.status(501).json({error: "internal error can't fetch enquiry details"});
  }
}

exports.getSingleEnquiry = async (req, res) => {
  try {
    const data = await enquiry
      .findById(req.params.id)
      .populate('createdBy', 'staffName staffMail staffMobile')
      .populate('registeredBy', 'staffName staffMail staffMobile')
      .populate('registeredStudent', 'studentName studentMobile studentMail');
    if(!data) {
      res.status(404).json({error: "oops Enquiry  not found"});
    }
    if ((req.user?.role === 'hr' || req.user?.role === 'staff') && req.user?.profileId) {
      if (String(data.createdBy || '') !== String(req.user.profileId)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }
    res.json(data);
  } catch (error) {
     res.status(500).json({error: "Internal error is occur"});
  }
}




exports.updateSingleEnquiry = async (req, res ) => {
  try {
     const { enName,
    enMail,
    enMobile,
    enCourse,
    enReference,
    enReferedStudent,
    enStatus,
    enNextFollowUp} = req.body;

    const updateData = {
         enName,
    enMail,
    enMobile,
    enCourse,
    enReference,
    enReferedStudent,
    enStatus,
    enNextFollowUp
    }

    const needsExisting =
      ((req.user?.role === 'hr' || req.user?.role === 'staff') && req.user?.profileId) ||
      typeof enStatus !== 'undefined';
    let existing = null;
    if (needsExisting) {
      existing = await enquiry
        .findById(req.params.id)
        .select('createdBy enStatus')
        .lean();
      if (!existing) {
        return res.status(404).json({error: "Enquiry page not found check again give the correct id"});
      }
      if ((req.user?.role === 'hr' || req.user?.role === 'staff') && req.user?.profileId) {
        if (String(existing.createdBy || '') !== String(req.user.profileId)) {
          return res.status(403).json({ error: 'Forbidden' });
        }
      }
    }

    Object.keys(updateData).forEach((key) => {
      if (typeof updateData[key] === 'undefined') delete updateData[key];
    });

    let historyEntry = null;
    if (typeof enStatus !== 'undefined') {
      const prevStatus = String(existing?.enStatus || '');
      const nextStatus = String(enStatus || '');
      if (prevStatus !== nextStatus) {
        historyEntry = {
          status: enStatus,
          changedAt: new Date(),
          changedBy: req.user?.userId || req.user?.profileId || null,
          changedByRole: req.user?.role || null,
        };
      }
    }
     
    const updatePayload = {};
    if (Object.keys(updateData).length) updatePayload.$set = updateData;
    if (historyEntry) updatePayload.$push = { enStatusHistory: historyEntry };

    if (!Object.keys(updatePayload).length) {
      return res.json(existing || null);
    }

    const data = await enquiry.findByIdAndUpdate(req.params.id, updatePayload, {new: true});

    if (!data) {
      res.status(404).json({error: "Enquiry page not found check again give the correct id"});
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({error: "Network error is occur can't update the enquiry"});
  }
}

exports.deleteSingleEnquiry = async (req,res) => {
  try {
     if ((req.user?.role === 'hr' || req.user?.role === 'staff') && req.user?.profileId) {
       const existing = await enquiry.findById(req.params.id).select('createdBy').lean();
       if (!existing) {
         return res.status(404).json({error: "page not found can't delete the unknown enquiry"});
       }
       if (String(existing.createdBy || '') !== String(req.user.profileId)) {
         return res.status(403).json({ error: 'Forbidden' });
       }
     }
     const data = await enquiry.findByIdAndDelete(req.params.id);
     if(!data) {
      res.status(404).json({error: "page not found can't delete the unknown enquiry"});
     }
     res.json({message: "deleted successfully", data: data})
  } catch (error) {
      res.status(500).json({error: 'network error is occur '});
  }
}

exports.getFollowup = async (req, res) => {
  try {
    const { role, profileId } = req.user || {};
    const filter = role === 'hr' && profileId ? { createdBy: profileId } : {};
    const data = await enquiry
      .find(filter)
      .sort({ enNextFollowUp: 1 })
      .populate('createdBy', 'staffName staffMail staffMobile')
      .populate('registeredBy', 'staffName staffMail staffMobile')
      .populate('registeredStudent', 'studentName studentMobile studentMail');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.registerEnquiry = async (req, res) => {
  try {
    const { role, profileId } = req.user || {};
    if (role !== 'hr' && role !== 'admin' && role !== 'staff') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const data = await enquiry.findById(req.params.id);
    if (!data) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    if (role === 'hr' || role === 'staff') {
      if (!profileId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      if (data.createdBy && String(data.createdBy) !== String(profileId)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      data.registeredBy = profileId;
      data.registeredByRole = role;
    } else if (role === 'admin') {
      data.registeredBy = null;
      data.registeredByRole = 'admin';
    }

    data.registerStatus = data.registerStatus === 'student_added' ? 'student_added' : 'registered';
    data.registeredAt = new Date();
    await data.save();

    const populated = await enquiry
      .findById(data._id)
      .populate('createdBy', 'staffName staffMail staffMobile')
      .populate('registeredBy', 'staffName staffMail staffMobile')
      .populate('registeredStudent', 'studentName studentMobile studentMail');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.linkStudentToEnquiry = async (req, res) => {
  try {
    const { role } = req.user || {};
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { studentId } = req.body;
    if (!studentId) {
      return res.status(400).json({ error: 'studentId is required' });
    }

    const data = await enquiry.findByIdAndUpdate(
      req.params.id,
      {
        registeredStudent: studentId,
        registerStatus: 'student_added',
      },
      { new: true }
    );

    if (!data) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    const populated = await enquiry
      .findById(data._id)
      .populate('createdBy', 'staffName staffMail staffMobile')
      .populate('registeredBy', 'staffName staffMail staffMobile')
      .populate('registeredStudent', 'studentName studentMobile studentMail');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateEarningsStatus = async (req, res) => {
  try {
    const { role } = req.user || {};
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { status } = req.body;
    if (!['pending', 'earned', 'refund'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const data = await enquiry.findByIdAndUpdate(
      req.params.id,
      { earningsStatus: status },
      { new: true }
    );

    if (!data) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    const populated = await enquiry
      .findById(data._id)
      .populate('createdBy', 'staffName staffMail staffMobile')
      .populate('registeredBy', 'staffName staffMail staffMobile')
      .populate('registeredStudent', 'studentName studentMobile studentMail');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getHrEarnings = async (req, res) => {
  try {
    const { role, profileId } = req.user || {};
    if ((role !== 'hr' && role !== 'staff') || !profileId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await buildHrEarningRecords(profileId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// exports.getAdminHrEarnings = async (req, res) => {
//   try {
//     const { role } = req.user || {};
//     if (role !== 'admin') {
//       return res.status(403).json({ error: 'Forbidden' });
//     }

//     const { hrId } = req.query;
//     if (!hrId) {
//       return res.status(400).json({ error: 'hrId is required' });
//     }

//     const result = await buildHrEarningRecords(hrId);
//     res.json(result);
//   } catch (error) {
//     res.status(500).json({ error: 'Server error' });
//   }
// };



exports.getAdminHrEarnings = async (req, res) => {
  try {
    const { role } = req.user || {};
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { hrId } = req.query;

    // Case 1: Fetch earnings for a specific HR
    if (hrId) {
      const result = await buildHrEarningRecords(hrId);
      return res.json(result);
    }

    // Case 2: Fetch earnings for ALL HRs
    // Find all staff members who have a commission percent (or just all staff)
    const allHrStaff = await Staff.find({ hrCommissionPercent: { $exists: true } }).select('_id').lean();
    
    // Use Promise.all to run builds in parallel for efficiency
    const allRecordsNested = await Promise.all(
      allHrStaff.map(hr => buildHrEarningRecords(hr._id))
    );

    // Flatten the array of arrays into a single list
    const combinedResult = allRecordsNested.flat();

    // Re-sort the combined list by date (newest first)
    combinedResult.sort((a, b) => new Date(b.paymentDate || 0) - new Date(a.paymentDate || 0));

    res.json(combinedResult);
  } catch (error) {
    console.error("Error in getAdminHrEarnings:", error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateHrEarningStatus = async (req, res) => {
  try {
    const { role, userId } = req.user || {};
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { hrId, recordType, recordId, status } = req.body || {};
    if (!hrId || !recordType || !recordId) {
      return res.status(400).json({ error: 'hrId, recordType and recordId are required' });
    }

    if (!['initial', 'installment'].includes(recordType)) {
      return res.status(400).json({ error: 'Invalid recordType' });
    }

    if (!['pending', 'earned', 'refund'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const existing = await HrEarningStatus.findOne({ hr: hrId, recordType, recordId });
    const shouldUpdate = !existing || existing.status !== status;

    const historyEntry = {
      status,
      changedAt: new Date(),
      changedBy: userId || null,
      changedByRole: role || null,
    };

    let updated;
    if (!existing) {
      updated = await HrEarningStatus.create({
        hr: hrId,
        recordType,
        recordId,
        status,
        history: [historyEntry],
      });
    } else if (shouldUpdate) {
      existing.status = status;
      existing.history = [...(existing.history || []), historyEntry];
      updated = await existing.save();
    } else {
      updated = existing;
    }

    res.json({
      recordType: updated.recordType,
      recordId: updated.recordId,
      status: updated.status,
      history: updated.history || [],
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

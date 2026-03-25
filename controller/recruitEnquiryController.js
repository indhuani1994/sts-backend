const RecruitEnquiry = require('../models/recruitenquiry');
const { deleteCloudinaryByUrl } = require('../utils/cloudinaryHelpers');

exports.getJobEnquiry = async (req, res) => {
  try {
    const recruits = await RecruitEnquiry.find();
    res.json(recruits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRecruitById = async (req, res) => {
  try {
    const recruit = await RecruitEnquiry.findById(req.params.id);
    if (!recruit) return res.status(404).json({ error: 'No candidates found' });
    res.json(recruit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createRecruit = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      email,
      joiningDate,
      currentCTC,
      expectedCTC,
      shift,
      experience,
      position,
      source,
      reason,
    } = req.body;

    const resume = req.file ? req.file.path : '';

    const recruit = new RecruitEnquiry({
      fullName,
      phone,
      email,
      joiningDate,
      currentCTC,
      expectedCTC,
      shift,
      experience,
      position,
      source,
      reason,
      resume,
    });

    await recruit.save();
    res.json(recruit);
  } catch (err) {
    console.log('Error while creating new job candidate');
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

// Update Recruit
exports.updateRecruit = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      email,
      joiningDate,
      currentCTC,
      expectedCTC,
      shift,
      experience,
      position,
      source,
      reason,
    } = req.body;

    const recruit = await RecruitEnquiry.findById(req.params.id);
    if (!recruit) return res.status(404).json({ error: 'Recruit not found' });

    const updateData = {
      fullName,
      phone,
      email,
      joiningDate,
      currentCTC,
      expectedCTC,
      shift,
      experience,
      position,
      source,
      reason,
    };

    if (req.file) {
      await deleteCloudinaryByUrl(recruit.resume, 'recruitResume');
      updateData.resume = req.file.path;
    }

    const updated = await RecruitEnquiry.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Recruit
exports.deleteRecruit = async (req, res) => {
  try {
    const recruit = await RecruitEnquiry.findById(req.params.id);
    if (!recruit) {
      return res.status(404).json({ error: 'Recruit not found' });
    }

    await deleteCloudinaryByUrl(recruit.resume, 'recruitResume');
    await RecruitEnquiry.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

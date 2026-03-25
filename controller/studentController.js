const Student = require('../models/student');

// READ (Get all students)
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    console.error('Fetch Students Error:', err);
    res.status(500).json({ error: err.message });
  }
};
const mongoose = require('mongoose');

const courseUpdateSchema = new mongoose.Schema({
  regId: {
    type: String,
   
    required: true,
    
  },
  studentId: {
    type: String,
    required: true,
  },
  time: String,
  topic: String,
  course: String,
  staff: String,
  classType: String,
}, { timestamps: true });

courseUpdateSchema.index({ regId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Course_Update', courseUpdateSchema);

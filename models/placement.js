const mongoose = require('mongoose');

const placementSchema = mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  company: {type: mongoose.Schema.Types.ObjectId , ref: 'Company', required: true},
  jobRole: String,
  package: String,
 
}, { timestamps: true });

module.exports = mongoose.model('Placement', placementSchema);




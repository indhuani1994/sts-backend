const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  companyImage: String,
  companyName: String,
  companyLocation: String
}, {timestamps: true})

module.exports = mongoose.model('Company' , companySchema);
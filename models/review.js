const mongoose = require('mongoose');

const revewSchema = new mongoose.Schema({
  stuImage: String,
  stuId: String,
  review: String,
  rate: Number,
})

  module.exports = mongoose.model('StuReview',  revewSchema);

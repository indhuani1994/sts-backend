const mongoose = require('mongoose');

const dummySchema = mongoose.Schema({
    name: String,
    school: String,
}, {timestamps: true});

module.exports = mongoose.model('Dummy', dummySchema);
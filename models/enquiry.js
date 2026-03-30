const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
    enName: {type: String, required: [true, "Name field is required"]},
    enMail: String,
    enMobile: String,
    enCourse: String,
    enReference: String,
    enReferedStudent: String,
    enStatus: String,
    enStatusHistory: [
        {
            status: String,
            changedAt: { type: Date, default: Date.now },
            changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
            changedByRole: { type: String, enum: ['hr', 'admin', 'staff'], default: null },
        },
    ],
    enNextFollowUp: {type: Date},
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', index: true },
    registerStatus: {
        type: String,
        enum: ['new', 'registered', 'student_added'],
        default: 'new',
        index: true,
    },
    registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', index: true },
    registeredByRole: { type: String, enum: ['hr', 'admin', 'staff'], default: null, index: true },
    registeredAt: { type: Date, default: null },
    registeredStudent: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', index: true },
    earningsStatus: {
        type: String,
        enum: ['pending', 'earned', 'refund'],
        default: 'pending',
        index: true,
    },
    

}, {timestamps: true});

module.exports = mongoose.model('Enquiry', enquirySchema);

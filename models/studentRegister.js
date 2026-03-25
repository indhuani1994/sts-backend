const mongoose = require('mongoose');
const CourseUpdate = require('./course_update');

const studentRegisterSchema = mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true, index: true },
    courseFees: { type: Number, default: 0 },
    paymentType: { type: String, trim: true },
    amountReceived: { type: Number, default: 0 },
    amountReceivedd: { type: Number, default: 0 },
    balanced: { type: Number, default: 0 },
    receiptGen: { type: String, trim: true },
    courseDuration: { type: String, trim: true },
    freezingDate: { type: String, trim: true },
    secondInstallment: { type: String, trim: true },
    balance: { type: Number, default: 0 },
    availTime: { type: String, trim: true },
  },
  { timestamps: true }
);

studentRegisterSchema.index({ student: 1, course: 1, staff: 1 }, { unique: true });
studentRegisterSchema.index({ createdAt: -1 });

studentRegisterSchema.pre('findOneAndDelete', async function (next) {
  try {
    const doc = await this.model.findOne(this.getFilter());
    if (!doc) return next();

    const regIdToDelete = doc.regId || doc._id.toString();
    await CourseUpdate.deleteMany({ regId: regIdToDelete });
    next();
  } catch (error) {
    next(error);
  }
});

module.exports =
  mongoose.models.StudentRegister ||
  mongoose.model('StudentRegister', studentRegisterSchema);

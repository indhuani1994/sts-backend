const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentRegister",
      required: true,
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    status: {
      type: String,
      enum: ["present", "absent", "leave", "online"],
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

attendanceSchema.pre("validate", function (next) {
  if (this.date instanceof Date && !Number.isNaN(this.date.getTime())) {
    this.date.setHours(0, 0, 0, 0);
  }
  next();
});

// One student per day only one record
attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });
module.exports = mongoose.model("Attendance", attendanceSchema);
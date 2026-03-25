const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: ['Seminar', 'Workshop', 'Celebration', 'Other'],
    },
  },
  { timestamps: true }
);

eventSchema.index({ title: 1, eventType: 1 });

module.exports = mongoose.model('Event', eventSchema);

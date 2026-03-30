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
 enum: [
  'seminar',
  'workshop',
  'celebration',
  'career_guidance_seminar',
  'webinar',
  'bootcamp',
  'masterclass',
  'demo_class',
  'guest_lecture',
  'training_session',
  'placement_drive',
  'interview_preparation',
  'resume_workshop',
  'soft_skills_training',
  'other'
]
    },
  },
  { timestamps: true }
);

eventSchema.index({ title: 1, eventType: 1 });

module.exports = mongoose.model('Event', eventSchema);

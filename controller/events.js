const Event = require('../models/events');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');
const { deleteCloudinaryByUrl } = require('../utils/cloudinaryHelpers');

exports.postevents = catchAsync(async (req, res) => {
  const { title, description, eventType } = req.body;

  if (!title || !description || !eventType) {
    throw new ApiError(400, 'Title, description, and event type are required');
  }

  const uploadedFile =
    req.file ||
    (Array.isArray(req.files) && req.files[0]) ||
    (req.files?.image && req.files.image[0]) ||
    (req.files?.src && req.files.src[0]);

  if (!uploadedFile) {
    throw new ApiError(400, 'Event image is required');
  }

  const newEvent = await Event.create({
    title,
    description,
    eventType,
    image: uploadedFile.path,
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Event created successfully',
    data: newEvent,
  });
});

exports.getevents = catchAsync(async (_req, res) => {
  const allEvents = await Event.find().sort({ createdAt: -1 }).lean();
  return res.json(allEvents);
});

exports.geteventById = catchAsync(async (req, res) => {
  const event = await Event.findById(req.params.id).lean();
  if (!event) throw new ApiError(404, 'Event not found');

  return res.json(event);
});

exports.updateevent = catchAsync(async (req, res) => {
  const { title, description, eventType } = req.body;

  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(404, 'Event not found');

  if (title) event.title = title;
  if (description) event.description = description;
  if (eventType) event.eventType = eventType;

  const uploadedFile =
    req.file ||
    (Array.isArray(req.files) && req.files[0]) ||
    (req.files?.image && req.files.image[0]) ||
    (req.files?.src && req.files.src[0]);

  if (uploadedFile) {
    await deleteCloudinaryByUrl(event.image, 'eventImage');
    event.image = uploadedFile.path;
  }

  await event.save();

  return sendSuccess(res, {
    message: 'Event updated successfully',
    data: event,
  });
});

exports.deleteevent = catchAsync(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(404, 'Event not found');

  await deleteCloudinaryByUrl(event.image, 'eventImage');
  await Event.findByIdAndDelete(req.params.id);

  return sendSuccess(res, { message: 'Event deleted successfully' });
});

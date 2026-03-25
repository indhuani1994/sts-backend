const express = require('express');
const router = express.Router();
const eventController = require('../controller/events');
const upload = require('../middleware/upload');
const { authenticate, authorizeRoles } = require('../middleware/auth');

router.get('/', authenticate, eventController.getevents);
router.get('/:id', authenticate, eventController.geteventById);

router.post(
  '/',
  authenticate,
  authorizeRoles('admin'),
  upload.any(),
  eventController.postevents
);
router.put(
  '/:id',
  authenticate,
  authorizeRoles('admin'),
  upload.any(),
  eventController.updateevent
);
router.delete('/:id', authenticate, authorizeRoles('admin'), eventController.deleteevent);

module.exports = router;


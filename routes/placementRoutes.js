const express = require('express');
const router = express.Router();
const placementController = require('../controller/placementController');
const upload = require('../middleware/upload');

// Routes
router.get('/', placementController.getAllPlacements);
router.get('/:id', placementController.getPlacementById);
router.post('/', upload.single('companyLogo'), placementController.addPlacement);
router.put('/:id', upload.single('companyLogo'), placementController.updatePlacement);
router.delete('/:id', placementController.deletePlacement);

module.exports = router;

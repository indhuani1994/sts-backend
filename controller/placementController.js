const Placement = require('../models/placement');

// CREATE (Add a new placement)
exports.addPlacement = async (req, res) => {
  try {
    const {
      studentId,
      companyId,
      jobRole,
      salaryPackage,
     
    } = req.body;

    const newPlacement = new Placement({
      student: studentId,
      company: companyId,
      jobRole,
      package: salaryPackage,
    
     
    });

    await newPlacement.save();
    res.status(201).json(newPlacement);
  } catch (err) {
    console.error('Add Placement Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// READ (Get all placements)
exports.getAllPlacements = async (req, res) => {
  try {
    const placements = await Placement.find().populate('student').populate('company');
    res.json(placements);
  } catch (err) {
    console.error('Fetch Placements Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// READ (Get single placement)
exports.getPlacementById = async (req, res) => {
  try {
    const placement = await Placement.findById(req.params.id).populate('student').populate('company');
    if (!placement) return res.status(404).json({ error: 'Placement not found' });
    res.json(placement);
  } catch (err) {
    console.error('Fetch Placement Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE (Edit placement)
exports.updatePlacement = async (req, res) => {
  try {
    const {
      studentId,
      companyId,
      jobRole,
      salaryPackage,
     
    } = req.body;

    const updatedData = {
      student: studentId,
      company: companyId,
      jobRole,
      package: salaryPackage,
   
    };

  

    const updated = await Placement.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    if (!updated) return res.status(404).json({ error: 'Placement not found' });
    res.json(updated);
  } catch (err) {
    console.error('Update Placement Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE (Remove placement)
exports.deletePlacement = async (req, res) => {
  try {
    const deleted = await Placement.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Placement not found' });
    res.json({ message: 'Placement deleted successfully' });
  } catch (err) {
    console.error('Delete Placement Error:', err);
    res.status(500).json({ error: err.message });
  }
};





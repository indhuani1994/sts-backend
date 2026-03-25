const Company = require('../models/company');
const { deleteCloudinaryByUrl } = require('../utils/cloudinaryHelpers');

// READ - Get all companies
exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find();
    res.status(200).json(companies);
  } catch (error) {
    console.error('Fetch Companies Error:', error);
    res.status(500).json({ error: error.message });
  }
};

  // CREATE - Add a new company
exports.createCompany = async (req, res) => {
  try {
    const companyData = req.body;

    // If image uploaded
    if (req.file) {
      companyData.companyImage = req.file.path;
    }

    const company = new Company(companyData);
    await company.save();
    res.status(201).json(company);
  } catch (error) {
    console.error('Create Company Error:', error);
    res.status(400).json({ error: error.message });
  }
};

// READ - Get single company by ID
exports.getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: 'Company not found' });
    res.status(200).json(company);
  } catch (error) {
    console.error('Get Company Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// UPDATE - Edit a company
exports.updateCompany = async (req, res) => {
  try {
    const updateData = req.body;

    // If new image uploaded
    if (req.file) {
      const existing = await Company.findById(req.params.id);
      if (existing?.companyImage) {
        await deleteCloudinaryByUrl(existing.companyImage, 'companyImage');
      }
      updateData.companyImage = req.file.path;
    }

    const company = await Company.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!company) return res.status(404).json({ message: 'Company not found' });
    res.status(200).json(company);
  } catch (error) {
    console.error('Update Company Error:', error);
    res.status(400).json({ error: error.message });
  }
};

// DELETE - Remove a company
exports.deleteCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: 'Company not found' });
    await deleteCloudinaryByUrl(company.companyImage, 'companyImage');
    await Company.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Delete Company Error:', error);
    res.status(500).json({ error: error.message });
  }
};

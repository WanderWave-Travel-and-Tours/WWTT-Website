const PSA = require('../models/psa');

exports.getPSADocuments = async (req, res) => {
  try {
    const psaDocs = await PSA.find().sort({ createdAt: -1 });
    res.status(200).json(psaDocs);
  } catch (error) {
    console.error('Get PSA documents error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getPSADocument = async (req, res) => {
  try {
    const { id } = req.params;
    const psaDoc = await PSA.findById(id);
    
    if (!psaDoc) {
      return res.status(404).json({ message: 'PSA document not found' });
    }
    
    res.status(200).json(psaDoc);
  } catch (error) {
    console.error('Get PSA document error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.createPSA = async (req, res) => {
  try {
    const { documentType, description, price, requirements, downloadForms, stepsProcess } = req.body;
    
    const newPSA = new PSA({
      documentType,
      description,
      price,
      requirements: requirements || [
        { title: "Primary Requirements", items: ["Valid ID", "Authorization Letter (if applicable)"] }
      ],
      downloadForms: downloadForms || [],
      stepsProcess: stepsProcess || []
    });

    await newPSA.save();
    res.status(201).json(newPSA);
  } catch (error) {
    console.error('Create PSA error:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.updatePSA = async (req, res) => {
  try {
    const { id } = req.params;
    const { documentType, description, price, requirements, downloadForms, stepsProcess } = req.body;

    const updateData = {};
    if (documentType) updateData.documentType = documentType;
    if (description) updateData.description = description;
    if (price) updateData.price = price;
    if (requirements) updateData.requirements = requirements;
    if (downloadForms) updateData.downloadForms = downloadForms;
    if (stepsProcess) updateData.stepsProcess = stepsProcess;

    const updatedPSA = await PSA.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedPSA) {
      return res.status(404).json({ message: 'PSA document not found' });
    }

    res.status(200).json(updatedPSA);
  } catch (error) {
    console.error('Update PSA error:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.deletePSA = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPSA = await PSA.findByIdAndDelete(id);
    
    if (!deletedPSA) {
      return res.status(404).json({ message: 'PSA document not found' });
    }

    res.status(200).json({ 
      message: 'PSA document deleted successfully',
      deletedDocument: deletedPSA
    });
  } catch (error) {
    console.error('Delete PSA error:', error);
    res.status(500).json({ message: error.message });
  }
};
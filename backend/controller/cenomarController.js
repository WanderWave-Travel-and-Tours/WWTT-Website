const CENOMAR = require('../models/cenomar');

exports.getCENOMARDocuments = async (req, res) => {
  try {
    const cenomarDocs = await CENOMAR.find().sort({ createdAt: -1 });
    res.status(200).json(cenomarDocs);
  } catch (error) {
    console.error('Get CENOMAR documents error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getCENOMARDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const cenomarDoc = await CENOMAR.findById(id);
    
    if (!cenomarDoc) {
      return res.status(404).json({ message: 'CENOMAR document not found' });
    }
    
    res.status(200).json(cenomarDoc);
  } catch (error) {
    console.error('Get CENOMAR document error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.createCENOMAR = async (req, res) => {
  try {
    const { documentType, description, price, processingTime, requirements, downloadForms, stepsProcess } = req.body;
    
    const newCENOMAR = new CENOMAR({
      documentType,
      description,
      price,
      processingTime: processingTime || '5-7 business days',
      requirements: requirements || [
        { title: "Primary Requirements", items: ["Valid ID", "Authorization Letter (if applicable)"] }
      ],
      downloadForms: downloadForms || [],
      stepsProcess: stepsProcess || []
    });

    await newCENOMAR.save();
    res.status(201).json(newCENOMAR);
  } catch (error) {
    console.error('Create CENOMAR error:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.updateCENOMAR = async (req, res) => {
  try {
    const { id } = req.params;
    const { documentType, description, price, processingTime, requirements, downloadForms, stepsProcess } = req.body;

    const updateData = {};
    if (documentType) updateData.documentType = documentType;
    if (description) updateData.description = description;
    if (price) updateData.price = price;
    if (processingTime) updateData.processingTime = processingTime;
    if (requirements) updateData.requirements = requirements;
    if (downloadForms) updateData.downloadForms = downloadForms;
    if (stepsProcess) updateData.stepsProcess = stepsProcess;

    const updatedCENOMAR = await CENOMAR.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedCENOMAR) {
      return res.status(404).json({ message: 'CENOMAR document not found' });
    }

    res.status(200).json(updatedCENOMAR);
  } catch (error) {
    console.error('Update CENOMAR error:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.deleteCENOMAR = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCENOMAR = await CENOMAR.findByIdAndDelete(id);
    
    if (!deletedCENOMAR) {
      return res.status(404).json({ message: 'CENOMAR document not found' });
    }

    res.status(200).json({ 
      message: 'CENOMAR document deleted successfully',
      deletedDocument: deletedCENOMAR
    });
  } catch (error) {
    console.error('Delete CENOMAR error:', error);
    res.status(500).json({ message: error.message });
  }
};
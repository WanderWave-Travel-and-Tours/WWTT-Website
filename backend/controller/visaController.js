const Visa = require('../models/visa');

// Get All Visas
exports.getVisas = async (req, res) => {
    try {
        const visas = await Visa.find().sort({ createdAt: -1 });
        res.status(200).json(visas);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create New Visa
exports.createVisa = async (req, res) => {
    try {
        const { country, flagCode, description, price } = req.body;
        
        const defaultRequirements = [
            { title: "Primary Requirements", items: ["Valid Passport"] }
        ];

        const newVisa = new Visa({
            country,
            flagCode,
            description,
            price,
            requirements: defaultRequirements,
            downloadForms: [],
            stepsProcess: []
        });

        await newVisa.save();
        res.status(201).json(newVisa);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update Visa (Requirements, Download Forms, Steps)
exports.updateVisa = async (req, res) => {
    try {
        const { id } = req.params;
        const { requirements, downloadForms, stepsProcess } = req.body;

        const updateData = {};
        if (requirements) updateData.requirements = requirements;
        if (downloadForms) updateData.downloadForms = downloadForms;
        if (stepsProcess) updateData.stepsProcess = stepsProcess;

        const updatedVisa = await Visa.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true }
        );

        if (!updatedVisa) {
            return res.status(404).json({ message: "Visa not found" });
        }

        res.status(200).json(updatedVisa);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete Visa
exports.deleteVisa = async (req, res) => {
    try {
        const deletedVisa = await Visa.findByIdAndDelete(req.params.id);
        
        if (!deletedVisa) {
            return res.status(404).json({ message: "Visa not found" });
        }

        res.status(200).json({ message: "Visa deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
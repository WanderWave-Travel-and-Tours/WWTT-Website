const Tour = require('../models/tour');

exports.createTour = async (req, res) => {
  try {
    const { 
      title, destination, duration, category, 
      sellerPrice, markup, inclusions 
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Image is required' });
    }
    let parsedInclusions = [];
    if (inclusions) {
      try {
        parsedInclusions = JSON.parse(inclusions);
      } catch (e) {
        parsedInclusions = [inclusions];
      }
    }

    const sPrice = parseFloat(sellerPrice);
    const mkup = parseFloat(markup);
    const totalPrice = sPrice + mkup;

    const newTour = new Tour({
      title,
      destination,
      duration,
      category,
      sellerPrice: sPrice,
      markup: mkup,
      price: totalPrice,
      inclusions: parsedInclusions,
      image: req.file.filename
    });

    await newTour.save();
    res.status(201).json({ status: 'ok', data: newTour });

  } catch (error) {
    console.error('Error creating tour:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAllTours = async (req, res) => {
  try {
    const tours = await Tour.find().sort({ createdAt: -1 });
    res.status(200).json({ status: 'ok', data: tours });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    res.status(200).json({ status: 'ok', message: 'Tour deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
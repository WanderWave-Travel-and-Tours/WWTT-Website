const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');

router.post('/', async (req, res) => {
  try {
    const { category, message, name, rating, screenshot, technicalData } = req.body;

    if (!category || !message) {
      return res.status(400).json({ success: false, message: 'Category and message are required' });
    }

    const newFeedback = new Feedback({
      category,
      message: message.trim(),
      name: name?.trim() || 'Anonymous',
      rating: rating || 0,
      screenshot: screenshot || null,
      technicalData: {
        url: technicalData?.url || '',
        browser: technicalData?.browser || '',
        screenSize: technicalData?.screenSize || '',
        timestamp: technicalData?.timestamp || new Date().toISOString(),
        language: technicalData?.language || '',
        platform: technicalData?.platform || ''
      },
      status: 'new',
      isArchive: 'No' // Default to not archived
    });

    const savedFeedback = await newFeedback.save();
    console.log('✅ Feedback submitted:', savedFeedback._id);

    res.status(201).json({ success: true, message: 'Feedback submitted successfully', feedback: savedFeedback });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, count: feedbacks.length, feedbacks: feedbacks });
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.patch('/:id/archive', async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { 
        isArchive: 'Yes', 
        updatedAt: new Date() 
      },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    console.log('📦 Feedback Archived:', req.params.id);

    res.status(200).json({
      success: true,
      message: 'Feedback archived successfully',
      feedback: feedback
    });

  } catch (error) {
    console.error('Error archiving feedback:', error);
    res.status(500).json({ success: false, message: 'Server error while archiving' });
  }
});

router.patch('/:id/restore', async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { isArchive: 'No' }, // Set Archive back to NO
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    console.log('♻️ Feedback Restored:', req.params.id);

    res.status(200).json({
      success: true,
      message: 'Feedback restored successfully',
      feedback: feedback
    });

  } catch (error) {
    console.error('Error restoring feedback:', error);
    res.status(500).json({ success: false, message: 'Server error while restoring' });
  }
});
router.delete('/:id', async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }
    res.status(200).json({ success: true, message: 'Feedback deleted permanently' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
router.get('/admin/stats', async (req, res) => {
  try {
    // Only count active feedbacks
    const matchQuery = { isArchive: { $ne: 'Yes' } };

    const totalFeedback = await Feedback.countDocuments(matchQuery);
    const bugReports = await Feedback.countDocuments({ ...matchQuery, category: 'bug' });
    const suggestions = await Feedback.countDocuments({ ...matchQuery, category: 'suggestion' });
    const general = await Feedback.countDocuments({ ...matchQuery, category: 'general' });

    const feedbackWithRatings = await Feedback.find({ ...matchQuery, rating: { $gt: 0 } });
    const avgRating = feedbackWithRatings.length > 0
      ? feedbackWithRatings.reduce((sum, f) => sum + f.rating, 0) / feedbackWithRatings.length
      : 0;

    res.status(200).json({
      success: true,
      stats: {
        total: totalFeedback,
        bugs: bugReports,
        suggestions: suggestions,
        general: general,
        avgRating: avgRating.toFixed(1)
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
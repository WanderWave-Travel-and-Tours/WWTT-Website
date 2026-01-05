const express = require('express');
const router = express.Router();
const Draft = require('../models/Draft');
const auth = require('../middleware/auth');

// ✅ SAVE/UPDATE DRAFT
router.post('/save', auth, async (req, res) => {
  try {
    const { module, data } = req.body;

    if (!module || !data) {
      return res.status(400).json({ 
        success: false, 
        message: 'Module and data are required' 
      });
    }

    const draft = await Draft.findOneAndUpdate(
      { userId: req.user._id, module },
      { 
        data, 
        updatedAt: new Date() 
      },
      { 
        upsert: true, 
        new: true 
      }
    );

    res.json({ 
      success: true, 
      draft 
    });

  } catch (error) {
    console.error('Draft save error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save draft' 
    });
  }
});

// ✅ GET DRAFT BY MODULE
router.get('/:module', auth, async (req, res) => {
  try {
    const draft = await Draft.findOne({
      userId: req.user._id,
      module: req.params.module
    });

    if (!draft) {
      return res.status(404).json({ 
        success: false, 
        message: 'No draft found' 
      });
    }

    res.json({ 
      success: true, 
      data: draft.data,
      updatedAt: draft.updatedAt
    });

  } catch (error) {
    console.error('Draft get error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get draft' 
    });
  }
});

// ✅ DELETE DRAFT
router.delete('/:module', auth, async (req, res) => {
  try {
    await Draft.deleteOne({
      userId: req.user._id,
      module: req.params.module
    });

    res.json({ 
      success: true, 
      message: 'Draft deleted successfully' 
    });

  } catch (error) {
    console.error('Draft delete error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete draft' 
    });
  }
});

// ✅ GET ALL DRAFTS FOR USER
router.get('/', auth, async (req, res) => {
  try {
    const drafts = await Draft.find({ userId: req.user._id })
      .sort({ updatedAt: -1 });

    res.json({ 
      success: true, 
      drafts 
    });

  } catch (error) {
    console.error('Draft list error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get drafts' 
    });
  }
});

module.exports = router;
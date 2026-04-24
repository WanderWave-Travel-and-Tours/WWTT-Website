const router = require('express').Router();
const Destination = require('../models/destination');
const ActivityLog = require('../models/ActivityLog');
const Package = require('../models/package'); // Import package model
// HELPER: Sanitize Admin ID
const getValidAdminId = (id) => {
    if (id && id !== 'null' && id !== 'undefined' && id !== '') return id;
    return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Parse & validate tips from request body.
//
// Accepts either:
//   - tips as a JSON string:  '[{"text":"Tip one"},{"text":"Tip two"}]'
//   - tips as a plain array already parsed by express.json()
//
// Always returns an array of { text } objects, capped at 5.
// ─────────────────────────────────────────────────────────────────────────────
const parseTips = (raw) => {
    if (!raw) return [];
    let arr = raw;
    if (typeof raw === 'string') {
        try { arr = JSON.parse(raw); } catch { return []; }
    }
    if (!Array.isArray(arr)) return [];
    return arr
        .filter(t => t && typeof t.text === 'string' && t.text.trim() !== '')
        .map(t => ({ text: t.text.trim() }))
        .slice(0, 5);
};

// ============================================================
// 1. ADD DESTINATION
// POST /api/destinations/add
// ============================================================
router.post('/add', async (req, res) => {
    try {
        const {
            name, country,
            destinationGreeting, tips, emergencyNumber,
            userEmail, adminId
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ status: 'error', error: 'Destination name is required.' });
        }

        const logUserId = getValidAdminId(adminId);

        const newDestination = new Destination({
            name:                name.trim(),
            country:             country?.trim() || '',
            destinationGreeting: destinationGreeting?.trim() || '',
            tips:                parseTips(tips),
            emergencyNumber:     emergencyNumber?.trim() || '911 (Philippines)',
            isArchive:           'No'
        });

        const saved = await newDestination.save();

        await ActivityLog.create({
            action:      'CREATE',
            module:      'Destinations',
            user:         userEmail || 'System Admin',
            userId:       logUserId,
            severity:    'SUCCESS',
            description: `Created destination: ${saved.name}`,
            details: {
                recordTitle: saved.name,
                recordId:    saved._id,
                method:      'POST',
                endpoint:    '/api/destinations/add'
            }
        });

        console.log('✅ Destination created:', saved.name);
        res.status(201).json({ status: 'ok', message: 'Destination created successfully!', data: saved });

    } catch (err) {
        // Mongoose duplicate-key error (name already exists)
        if (err.code === 11000) {
            return res.status(409).json({ status: 'error', error: 'A destination with that name already exists.' });
        }
        console.error('❌ Error adding destination:', err);
        res.status(500).json({ status: 'error', error: err.message });
    }
});

// ============================================================
// 2. EDIT DESTINATION
// PUT /api/destinations/edit/:id
// ============================================================
router.put('/edit/:id', async (req, res) => {
    try {
        const {
            name, country,
            destinationGreeting, tips, emergencyNumber,
            userEmail, adminId, changes
        } = req.body;

        const logUserId = getValidAdminId(adminId);

        const existing = await Destination.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ status: 'error', error: 'Destination not found.' });
        }

        const updateData = {};
        if (name !== undefined)                updateData.name                = name.trim();
        if (country !== undefined)             updateData.country             = country.trim();
        if (destinationGreeting !== undefined) updateData.destinationGreeting = destinationGreeting.trim();
        if (tips !== undefined)                updateData.tips                = parseTips(tips);
        if (emergencyNumber !== undefined)     updateData.emergencyNumber     = emergencyNumber.trim();

        const updated = await Destination.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        await ActivityLog.create({
            action:      'UPDATE',
            module:      'Destinations',
            user:         userEmail || 'System Admin',
            userId:       logUserId,
            severity:    'INFO',
            description: `Updated destination: ${updated.name}`,
            details: {
                recordTitle: updated.name,
                recordId:    updated._id,
                method:      'PUT',
                endpoint:    `/api/destinations/edit/${req.params.id}`,
                changes:      changes || {}
            }
        });

        console.log('✅ Destination updated:', updated.name);
        res.status(200).json({ status: 'ok', message: 'Destination updated successfully!', data: updated });

    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ status: 'error', error: 'A destination with that name already exists.' });
        }
        console.error('❌ Error editing destination:', err);
        res.status(500).json({ status: 'error', error: err.message });
    }
});

// ============================================================
// 3. ARCHIVE TOGGLE
// POST /api/destinations/:id/archive
// ============================================================
router.post('/:id/archive', async (req, res) => {
    try {
        const { userEmail, adminId } = req.body;
        const logUserId = getValidAdminId(adminId);

        const dest = await Destination.findById(req.params.id);
        if (!dest) {
            return res.status(404).json({ status: 'error', message: 'Destination not found.' });
        }

        const newStatus    = dest.isArchive === 'Yes' ? 'No' : 'Yes';
        const newArchivedAt = newStatus === 'Yes' ? new Date() : null;

        await Destination.findByIdAndUpdate(
            req.params.id,
            { $set: { isArchive: newStatus, archivedAt: newArchivedAt } },
            { new: true, runValidators: false }
        );

        const actionType = newStatus === 'Yes' ? 'ARCHIVE' : 'RESTORE';
        const severity   = newStatus === 'Yes' ? 'WARNING' : 'SUCCESS';

        await ActivityLog.create({
            action:      actionType,
            module:      'Destinations',
            user:         userEmail || 'System Admin',
            userId:       logUserId,
            severity,
            description: `${newStatus === 'Yes' ? 'Archived' : 'Restored'} destination: ${dest.name}`,
            details: {
                recordTitle: dest.name,
                recordId:    dest._id,
                method:      'POST',
                endpoint:    `/api/destinations/${req.params.id}/archive`
            }
        });

        console.log(`✅ Destination ${newStatus === 'Yes' ? 'archived' : 'restored'}:`, dest.name);
        res.json({
            status:    'ok',
            message:   `Destination ${newStatus === 'Yes' ? 'archived' : 'restored'} successfully`,
            isArchive: newStatus
        });

    } catch (err) {
        console.error('❌ Archive toggle error:', err);
        res.status(500).json({ status: 'error', error: err.message });
    }
});

// ============================================================
// 4. FETCH ALL ACTIVE DESTINATIONS
// GET /api/destinations/all
// ============================================================
router.get('/all', async (req, res) => {
    try {
        const destinations = await Destination.find({ isArchive: 'No' }).sort({ name: 1 });
        res.status(200).json({ status: 'ok', data: destinations });
    } catch (err) {
        console.error('❌ Error fetching destinations:', err);
        res.status(500).json({ status: 'error', error: 'Failed to retrieve destinations.' });
    }
});

// ============================================================
// 5. FETCH ARCHIVED DESTINATIONS
// GET /api/destinations/archived-list
// ============================================================
router.get('/archived-list', async (req, res) => {
    try {
        const archived = await Destination.find({ isArchive: 'Yes' }).sort({ name: 1 });
        console.log(`📦 Found ${archived.length} archived destinations`);
        res.status(200).json({ status: 'ok', data: archived });
    } catch (err) {
        console.error('❌ Error fetching archived destinations:', err);
        res.status(500).json({ status: 'error', error: err.message });
    }
});

// ============================================================
// 6. GET WEBHOOK PAYLOAD BY DESTINATION NAME
// GET /api/destinations/webhook-payload?name=Palawan
//
// This is the key endpoint your website/backend calls when a
// booking is confirmed. It returns the fully-shaped webhook
// payload ready to POST straight to GHL.
//
// Response shape:
// {
//   "status": "ok",
//   "data": {
//     "destination":          "Palawan",
//     "destination_greeting": "Enjoy the crystal-clear waters...",
//     "destination_tip1":     "...",
//     "destination_tip2":     "...",
//     "destination_tip3":     "...",
//     "destination_tip4":     "...",
//     "destination_tip5":     "...",
//     "emergency_number":     "911 (Philippines)"
//   }
// }
// ============================================================
router.get('/webhook-payload', async (req, res) => {
    try {
        const { name } = req.query;

        if (!name || !name.trim()) {
            return res.status(400).json({ status: 'error', error: 'Query param "name" is required.' });
        }

        // Case-insensitive exact match on name
        const dest = await Destination.findOne({
            name:      { $regex: `^${name.trim()}$`, $options: 'i' },
            isArchive: 'No'
        });

        if (!dest) {
            return res.status(404).json({
                status: 'error',
                error:  `No active destination found matching "${name}".`
            });
        }

        const payload = dest.toWebhookPayload();

        console.log(`📤 /webhook-payload → "${dest.name}":`, payload);
        res.status(200).json({ status: 'ok', data: payload });

    } catch (err) {
        console.error('❌ Error in /webhook-payload:', err);
        res.status(500).json({ status: 'error', error: err.message });
    }
});
// ============================================================
// EXTRA: SYNC UNIQUE DESTINATIONS FROM PACKAGES
// POST /api/destinations/sync-packages
// ============================================================
router.post('/sync-packages', async (req, res) => {
    try {
        const { userEmail, adminId } = req.body;
        const logUserId = getValidAdminId(adminId);

        // 1. Kunin lahat ng unique destination strings gamit ang .distinct()
        const uniqueDestinations = await Package.distinct('destination');

        let addedCount = 0;
        let skippedCount = 0;

        // 2. I-loop ang bawat unique destination at i-save kung wala pa
        for (const destName of uniqueDestinations) {
            if (!destName || !destName.trim()) continue; // Skip empty destinations
            
            const cleanName = destName.trim();

            // Check kung nag-eexist na siya (Case-insensitive check)
            const existingDest = await Destination.findOne({
                name: { $regex: `^${cleanName}$`, $options: 'i' }
            });

            if (!existingDest) {
                // Save new destination record
                await Destination.create({
                    name: cleanName,
                    country: '', // Leave blank for admin to update later
                    destinationGreeting: '',
                    tips: [],
                    emergencyNumber: '911 (Philippines)', // Default emergency number
                    isArchive: 'No'
                });
                addedCount++;
            } else {
                skippedCount++;
            }
        }

        // 3. I-log ang activity
        if (addedCount > 0) {
            await ActivityLog.create({
                action:      'CREATE',
                module:      'Destinations',
                user:         userEmail || 'System Admin',
                userId:       logUserId,
                severity:    'SUCCESS',
                description: `Synced ${addedCount} new destinations from Packages collection.`,
                details: {
                    method:   'POST',
                    endpoint: '/api/destinations/sync-packages'
                }
            });
        }

        console.log(`✅ Sync Complete: Added ${addedCount}, Skipped ${skippedCount} existing.`);
        
        res.status(200).json({ 
            status: 'ok', 
            message: 'Destinations synced successfully!', 
            data: {
                totalUniqueFound: uniqueDestinations.length,
                added: addedCount,
                skipped: skippedCount
            }
        });

    } catch (err) {
        console.error('❌ Error syncing destinations from packages:', err);
        res.status(500).json({ status: 'error', error: err.message });
    }
});
// ============================================================
// 7. FETCH SINGLE DESTINATION BY ID  ← keep at the bottom
// GET /api/destinations/:id
// ============================================================
router.get('/:id', async (req, res) => {
    try {
        const dest = await Destination.findById(req.params.id);
        if (!dest) return res.status(404).json({ status: 'error', error: 'Destination not found.' });
        res.status(200).json({ status: 'ok', data: dest });
    } catch (err) {
        res.status(500).json({ status: 'error', error: 'Failed to retrieve destination.' });
    }
});

// ============================================================
// 8. DELETE DESTINATION (permanent)
// DELETE /api/destinations/:id
// ============================================================
router.delete('/:id', async (req, res) => {
    try {
        const { userEmail, adminId } = req.body;
        const logUserId = getValidAdminId(adminId);

        const dest = await Destination.findByIdAndDelete(req.params.id);
        if (!dest) {
            return res.status(404).json({ status: 'error', error: 'Destination not found.' });
        }

        await ActivityLog.create({
            action:      'DELETE',
            module:      'Destinations',
            user:         userEmail || 'System Admin',
            userId:       logUserId,
            severity:    'DANGER',
            description: `Permanently deleted destination: ${dest.name}`,
            details: {
                recordTitle: dest.name,
                recordId:    dest._id,
                method:      'DELETE',
                endpoint:    `/api/destinations/${req.params.id}`
            }
        });

        console.log('🗑️ Destination permanently deleted:', dest.name);
        res.status(200).json({ status: 'ok', message: 'Destination deleted successfully.' });

    } catch (err) {
        console.error('❌ Error deleting destination:', err);
        res.status(500).json({ status: 'error', error: err.message });
    }
});

module.exports = router;

const Blog = require('../models/blog');
const ActivityLog = require('../models/ActivityLog');
const fs = require('fs');
const path = require('path');
const { cloudinary } = require('../config/cloudinary');

// 1. ADD BLOG
const addBlog = async (req, res) => {
    try {
        // ✅ Extract scheduledAt from body
        const { title, author, category, content, status, isArchive, userEmail, adminId, scheduledAt } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a cover image.' });
        }

        const newBlog = new Blog({
            title,
            author,
            category,
            content,
            imageUrl: req.file.path, // Cloudinary URL
            imagePublicId: req.file.filename, // Cloudinary public_id
            status,
            // ✅ If status is Scheduled, save the date, otherwise null
            scheduledAt: status === 'Scheduled' && scheduledAt ? new Date(scheduledAt) : null,
            isArchive: isArchive || 'No' 
        });

        await newBlog.save();

        // 👇👇👇 ACTIVITY LOG START (ADD) 👇👇👇
        try {
            await ActivityLog.create({
                action: 'CREATE',
                module: 'Blogs',
                user: userEmail || 'Unknown User',
                userId: adminId || null,
                description: `Created new blog post: ${title} (${status})`,
                severity: 'SUCCESS',
                details: {
                    recordTitle: title,
                    recordId: newBlog._id.toString(),
                    method: 'POST'
                }
            });
            console.log('✅ Activity Log saved for Add Blog');
        } catch (logError) {
            console.error('⚠️ Failed to save activity log:', logError.message);
        }
        // 👆👆👆 ACTIVITY LOG END 👆👆👆

        res.status(201).json({ message: 'Blog post created successfully!', blog: newBlog });

    } catch (error) {
        console.error('Error adding blog:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// 2. GET ALL ACTIVE BLOGS (With Auto-Publish Logic)
const getAllBlogs = async (req, res) => {
    try {
        // ✅ LAZY CRON: Check for scheduled posts that are due and publish them
        const now = new Date();
        const dueBlogs = await Blog.find({ 
            status: 'Scheduled', 
            scheduledAt: { $lte: now },
            isArchive: 'No'
        });

        if (dueBlogs.length > 0) {
            await Blog.updateMany(
                { _id: { $in: dueBlogs.map(b => b._id) } },
                { $set: { status: 'Published', scheduledAt: null } }
            );
            console.log(`🔄 Automatically published ${dueBlogs.length} scheduled blogs.`);
        }

        // Fetch all blogs (Published, Drafts, and future Scheduled)
        const blogs = await Blog.find({ isArchive: 'No' }).sort({ createdAt: -1 });
        res.status(200).json(blogs);
    } catch (error) {
        console.error("Error fetching blogs:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// 3. GET BLOG BY ID
const getBlogById = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog not found' });
        res.status(200).json(blog);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// 4. ARCHIVE BLOG
const deleteBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog not found' });

        blog.isArchive = 'Yes';
        await blog.save();

        // 👇👇👇 ACTIVITY LOG START (ARCHIVE) 👇👇👇
        try {
            const { userEmail, adminId } = req.body; 
            if (userEmail) {
                await ActivityLog.create({
                    action: 'ARCHIVE',
                    module: 'Blogs',
                    user: userEmail,
                    userId: adminId || null,
                    description: `Archived blog post: ${blog.title}`,
                    severity: 'WARNING',
                    details: {
                        recordTitle: blog.title,
                        recordId: blog._id.toString(),
                        method: 'DELETE'
                    }
                });
                console.log('✅ Activity Log saved for Archive Blog');
            }
        } catch (logError) {
            console.error('⚠️ Failed to save activity log:', logError.message);
        }
        // 👆👆👆 ACTIVITY LOG END 👆👆👆

        res.status(200).json({ message: 'Blog post archived successfully' });
    } catch (error) {
        console.error('Error archiving blog:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// 5. GET ALL ARCHIVED BLOGS
const getArchivedBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find({ isArchive: 'Yes' }).sort({ updatedAt: -1 });
        res.status(200).json(blogs);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// 6. UPDATE BLOG
const updateBlog = async (req, res) => {
    try {
        // ✅ Extract scheduledAt
        const { title, author, category, content, status, isArchive, userEmail, adminId, imagePublicId, scheduledAt } = req.body;
        
        let updateData = { title, author, category, content, status, isArchive };

        // ✅ Handle Scheduled Date Logic
        if (status === 'Scheduled' && scheduledAt) {
            updateData.scheduledAt = new Date(scheduledAt);
        } else if (status === 'Published' || status === 'Draft') {
            updateData.scheduledAt = null; // Clear date if status changes
        }

        if (req.file) {
            // Delete old image from Cloudinary
            if (imagePublicId) {
                try {
                    await cloudinary.uploader.destroy(imagePublicId);
                } catch (err) {
                    console.error('Failed to delete old image:', err);
                }
            }
            updateData.imageUrl = req.file.path;
            updateData.imagePublicId = req.file.filename;
        }

        const updatedBlog = await Blog.findByIdAndUpdate(
            req.params.id, 
            updateData, 
            { new: true }
        );

        // 👇👇👇 ACTIVITY LOG START (UPDATE) 👇👇👇
        try {
            if (userEmail) {
                await ActivityLog.create({
                    action: 'UPDATE',
                    module: 'Blogs',
                    user: userEmail,
                    userId: adminId || null,
                    description: `Updated blog post: ${updatedBlog.title}`,
                    severity: 'INFO',
                    details: {
                        recordTitle: updatedBlog.title,
                        recordId: updatedBlog._id.toString(),
                        method: 'PUT'
                    }
                });
                console.log('✅ Activity Log saved for Update Blog');
            }
        } catch (logError) {
            console.error('⚠️ Failed to save activity log:', logError.message);
        }
        // 👆👆👆 ACTIVITY LOG END 👆👆👆

        res.status(200).json({ message: 'Blog updated!', blog: updatedBlog });
    } catch (error) {
        console.error('Error updating blog:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    addBlog,
    getAllBlogs,
    getBlogById,
    deleteBlog,
    updateBlog,
    getArchivedBlogs
};
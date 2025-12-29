const Blog = require('../models/blog');
const ActivityLog = require('../models/ActivityLog'); // ✅ IMPORT ADDED
const fs = require('fs');
const path = require('path');

// 1. ADD BLOG
const addBlog = async (req, res) => {
    try {
        const { title, author, category, content, status, isArchive, userEmail, adminId } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a cover image.' });
        }

        const imageUrl = `uploads/${req.file.filename}`;

        const newBlog = new Blog({
            title,
            author,
            category,
            content,
            imageUrl,
            status,
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
                description: `Created new blog post: ${title}`,
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

// 2. GET ALL ACTIVE BLOGS (isArchive: 'No')
const getAllBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find({ isArchive: 'No' }).sort({ createdAt: -1 });
        res.status(200).json(blogs);
    } catch (error) {
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

// 4. ARCHIVE BLOG (Soft Delete)
const deleteBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog not found' });

        // MODIFIED: Change isArchive to "Yes" instead of deleting
        blog.isArchive = 'Yes';
        await blog.save();

        // 👇👇👇 ACTIVITY LOG START (ARCHIVE) 👇👇👇
        try {
            const { userEmail, adminId } = req.body; // Frontend needs to send this!
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
                        method: 'DELETE' // or PUT depending on implementation
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
        const { title, author, category, content, status, isArchive, userEmail, adminId } = req.body;
        let updateData = { title, author, category, content, status, isArchive };

        if (req.file) {
            const blog = await Blog.findById(req.params.id);
            if (blog && blog.imageUrl) {
                const oldFilename = blog.imageUrl.replace('uploads/', '');
                const oldPath = path.join(__dirname, '../uploads', oldFilename);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            updateData.imageUrl = `uploads/${req.file.filename}`;
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

// ISANG module.exports LANG SA DULO PARA SA LAHAT NG FUNCTIONS
module.exports = {
    addBlog,
    getAllBlogs,
    getBlogById,
    deleteBlog,
    updateBlog,
    getArchivedBlogs
};
const Blog = require('../models/blog');
const fs = require('fs');
const path = require('path');

// 1. ADD BLOG
const addBlog = async (req, res) => {
    try {
        const { title, author, category, content, status, isArchive } = req.body;

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
        const { title, author, category, content, status, isArchive } = req.body;
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
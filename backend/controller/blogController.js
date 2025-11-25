const Blog = require('../models/blog');
const fs = require('fs');
const path = require('path');

// 1. ADD BLOG
const addBlog = async (req, res) => {
    try {
        const { title, author, category, content, status } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a cover image.' });
        }

        // Save relative path (consistent with posters)
        const imageUrl = `uploads/${req.file.filename}`;

        const newBlog = new Blog({
            title,
            author,
            category,
            content,
            imageUrl,
            status
        });

        await newBlog.save();
        res.status(201).json({ message: 'Blog post created successfully!', blog: newBlog });

    } catch (error) {
        console.error('Error adding blog:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// 2. GET ALL BLOGS
const getAllBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 });
        res.status(200).json(blogs);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// 3. GET SINGLE BLOG
const getBlogById = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog not found' });
        res.status(200).json(blog);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// 4. DELETE BLOG
const deleteBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog not found' });

        // Delete image file
        if (blog.imageUrl) {
            const filename = blog.imageUrl.replace('uploads/', '');
            const filePath = path.join(__dirname, '../uploads', filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        await Blog.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Blog post deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// 5. UPDATE BLOG
const updateBlog = async (req, res) => {
    try {
        const { title, author, category, content, status } = req.body;
        let updateData = { title, author, category, content, status };

        // If new image is uploaded, replace old one
        if (req.file) {
            const blog = await Blog.findById(req.params.id);
            // Delete old image
            if (blog && blog.imageUrl) {
                const oldFilename = blog.imageUrl.replace('uploads/', '');
                const oldPath = path.join(__dirname, '../uploads', oldFilename);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            // Set new image
            updateData.imageUrl = `uploads/${req.file.filename}`;
        }

        const updatedBlog = await Blog.findByIdAndUpdate(
            req.params.id, 
            updateData, 
            { new: true }
        );

        res.status(200).json({ message: 'Blog updated!', blog: updatedBlog });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    addBlog,
    getAllBlogs,
    getBlogById,
    deleteBlog,
    updateBlog
};
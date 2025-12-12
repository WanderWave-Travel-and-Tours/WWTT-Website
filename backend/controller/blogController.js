const Blog = require('../models/blog');
const fs = require('fs');
const path = require('path');

const addBlog = async (req, res) => {
    try {
        const { title, author, category, content, status } = req.body;

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
            status
        });

        await newBlog.save();
        res.status(201).json({ message: 'Blog post created successfully!', blog: newBlog });

    } catch (error) {
        console.error('Error adding blog:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getAllBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 });
        res.status(200).json(blogs);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const getBlogById = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog not found' });
        res.status(200).json(blog);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const deleteBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog not found' });

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

const updateBlog = async (req, res) => {
    try {
        const { title, author, category, content, status } = req.body;
        let updateData = { title, author, category, content, status };

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
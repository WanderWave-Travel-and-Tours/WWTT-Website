const Blog = require('../models/blog');
const { cloudinary } = require('../config/cloudinary');

// 1. ADD BLOG
const addBlog = async (req, res) => {
    try {
        const { title, author, category, content, status, isArchive } = req.body;

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
            isArchive: isArchive || 'No' 
        });

        await newBlog.save();
        res.status(201).json({ message: 'Blog post created successfully!', blog: newBlog });

    } catch (error) {
        console.error('Error adding blog:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// 2. GET ALL ACTIVE BLOGS
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

// 4. ARCHIVE BLOG
const deleteBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog not found' });

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
        const { title, author, category, content, status, isArchive, imagePublicId } = req.body;
        let updateData = { title, author, category, content, status, isArchive };

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
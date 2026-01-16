import React from 'react';
import { Archive, Eye, Calendar, User, FolderOpen, FileText, Clock } from 'lucide-react';
import './BlogsTable.css';

const BlogsTable = ({ 
    blogs, 
    handleEdit, 
    handleArchive,
    getImageUrl
}) => {

    return (
        <div className="blt-table-wrapper">
            <div className="blt-table-container">
                <table className="blt-table">
                    <thead>
                        <tr>
                            <th className="blt-col-preview">PREVIEW</th>
                            <th className="blt-col-title">TITLE</th>
                            <th className="blt-col-excerpt">EXCERPT</th>
                            <th className="blt-col-date">DATE</th>
                            <th className="blt-col-author">AUTHOR</th>
                            <th className="blt-col-category">CATEGORY</th>
                            <th className="blt-col-status">STATUS</th>
                            <th className="blt-col-actions">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {blogs.map((blog) => (
                            <tr key={blog._id}>
                                {/* PREVIEW */}
                                <td>
                                    <div className="blt-image-preview">
                                        <img 
                                            src={getImageUrl(blog.imageUrl)} 
                                            alt={blog.title}
                                            onError={(e) => { e.target.src = 'https://via.placeholder.com/400x250'; }}
                                        />
                                    </div>
                                </td>

                                {/* TITLE */}
                                <td>
                                    <span className="blt-blog-title" title={blog.title}>{blog.title}</span>
                                </td>

                                {/* EXCERPT */}
                                <td>
                                    <div className="blt-excerpt-cell">
                                        <span className="blt-excerpt-text" title={blog.content}>
                                            {blog.content.substring(0, 100)}...
                                        </span>
                                    </div>
                                </td>

                                {/* DATE */}
                                <td>
                                    <div className={`blt-date-added ${blog.isScheduled ? 'blt-date-scheduled' : ''}`}>
                                        {blog.isScheduled ? <Clock size={14} /> : <Calendar size={14} />}
                                        <span>{blog.displayDate}</span>
                                    </div>
                                </td>

                                {/* AUTHOR */}
                                <td>
                                    <div className="blt-author">
                                        <User size={14} />
                                        <span>{blog.author}</span>
                                    </div>
                                </td>

                                {/* CATEGORY */}
                                <td>
                                    <span className="blt-category">
                                        <FolderOpen size={12} />
                                        {blog.category}
                                    </span>
                                </td>

                                {/* STATUS */}
                                <td>
                                    <span className={`blt-status blt-status--${(blog.status || 'Published').toLowerCase()}`}>
                                        <FileText size={12} />
                                        {blog.status || 'Published'}
                                    </span>
                                </td>

                                {/* ACTIONS */}
                                <td>
                                    <div className="blt-action-group">
                                        {/* Edit Button */}
                                        <button 
                                            className="blt-action-btn blt-view-btn"
                                            onClick={() => handleEdit(blog._id)}
                                            title="Edit Details"
                                        >
                                            <Eye size={16} />
                                            <span>Edit</span>
                                        </button>

                                        {/* Archive Button */}
                                        <button 
                                            className="blt-action-btn blt-archive-btn"
                                            onClick={() => handleArchive(blog._id)}
                                            title="Archive Blog"
                                        >
                                            <Archive size={16} />
                                            <span>Archive</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {/* Empty State */}
                        {blogs.length === 0 && (
                            <tr>
                                <td colSpan="8" className="blt-empty-cell">
                                    No blogs found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BlogsTable;
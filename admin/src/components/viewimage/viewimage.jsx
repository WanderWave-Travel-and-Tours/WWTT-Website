import React, { useState, useEffect } from 'react';
import { Trash2, Copy, Check } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import './viewimage.css';

const ViewImage = () => {

    // --- SIDEBAR TOGGLE LOGIC START ---
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };
    // --- SIDEBAR TOGGLE LOGIC END ---

    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);

    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/images');
            const data = await response.json();
            setImages(data);
        } catch (error) {
            console.error('Error fetching images:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this image?')) {
            try {
                const response = await fetch(`http://localhost:5000/api/images/${id}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    setImages(images.filter(img => img._id !== id));
                } else {
                    console.error('Failed to delete image');
                }
            } catch (error) {
                console.error('Error deleting image:', error);
            }
        }
    };

    const copyUrl = (url, id) => {
        navigator.clipboard.writeText(url).then(() => {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 1500);
        }).catch(err => {
            console.error('Could not copy text: ', err);
        });
    };

    return (
        <div className="vi-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            {/* The main content now gets a class when the sidebar is collapsed */}
            <main className={`vi-main ${isSidebarCollapsed ? 'vi-main-collapsed' : ''}`}>
                <div className="vi-container">
                    <header className="vi-header">
                        <h1 className="vi-title">Your Image Gallery</h1>
                        <p className="vi-subtitle">All your uploaded images in one place.</p>
                    </header>

                    {loading ? (
                        <div className="vi-loading">Loading images...</div>
                    ) : (
                        <div className="vi-grid">
                            {images.length > 0 ? (
                                images.map((img) => (
                                    <div key={img._id} className="vi-card">
                                        <div className="vi-image-wrapper">
                                            <img src={img.imageUrl} alt={img.imageName} />
                                            <div className="vi-overlay">
                                                <button 
                                                    className="vi-btn vi-copy" 
                                                    onClick={() => copyUrl(img.imageUrl, img._id)}
                                                    title="Copy URL"
                                                >
                                                    {copiedId === img._id ? <Check size={18} /> : <Copy size={18} />}
                                                </button>
                                                <button 
                                                    className="vi-btn vi-delete" 
                                                    onClick={() => handleDelete(img._id)}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="vi-empty">No images found.</div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ViewImage;
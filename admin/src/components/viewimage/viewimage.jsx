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
                }
            } catch (error) {
                console.error('Error deleting:', error);
            }
        }
    };

    const copyUrl = (path, id) => {
        const fullUrl = `http://localhost:5000/${path}`;
        navigator.clipboard.writeText(fullUrl);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const getImageUrl = (path) => `http://localhost:5000/${path}`;

    return (
        <div className="vi-page">
             <Sidebar 
                isCollapsed={isSidebarCollapsed} 
                toggleSidebar={toggleSidebar} 
            />
            <main className="vi-main">
                <div className="vi-container">
                    <header className="vi-header">
                        <h1 className="vi-title">GALLERY LIST</h1>
                        <p className="vi-subtitle">Your uploaded images for GHL display</p>
                    </header>

                    {loading ? (
                        <div className="vi-loading">Loading images...</div>
                    ) : (
                        <div className="vi-grid">
                            {images.length > 0 ? (
                                images.map((img) => (
                                    <div key={img._id} className="vi-card">
                                        <div className="vi-image-wrapper">
                                            <img src={getImageUrl(img.imageUrl)} alt="Gallery Item" />
                                            
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
import React, { useState, useEffect } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast'; // Import toast and Toaster
import Sidebar from '../sidebar/sidebar';
import './addimage.css';

const AddImage = () => {
    // --- SIDEBAR LOGIC START ---
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };
    // --- SIDEBAR LOGIC END ---

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Cleanup function for object URL
        return () => {
            if (imagePreview) URL.revokeObjectURL(imagePreview);
        };
    }, [imagePreview]);

    const showToastError = (message) => {
        toast.error(message, {
            position: 'top-center', // Set position to top-center
            style: { 
                border: '1px solid #ef4444', 
                color: '#ef4444',
                padding: '16px',
                fontWeight: '600'
            },
            iconTheme: { 
                primary: '#ef4444', 
                secondary: '#fff' 
            },
        });
    };

    const showToastSuccess = (message) => {
        toast.success(message, {
            position: 'top-center', // Set position to top-center
            style: { 
                border: '1px solid #10b981', // Custom success color
                color: '#10b981',
                padding: '16px',
                fontWeight: '600'
            },
            iconTheme: { 
                primary: '#10b981', 
                secondary: '#fff' 
            },
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // File validation check
            if (!file.type.startsWith('image/')) {
                showToastError('Please upload a valid image file (JPG, PNG, GIF).'); // Use toast for error
                // Reset file input value to allow selecting the same file again after error
                e.target.value = null; 
                return;
            }
            setImageFile(file);
            // Create a preview URL
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setImageFile(null);
        // Clean up the object URL before setting to null
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
    };

    const handleSubmit = async () => {
        if (!imageFile) {
            showToastError('Please select an image to upload.'); // Use toast for validation error
            return;
        }

        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('title', imageFile.name);

        try {
            const response = await fetch('http://localhost:5000/api/images/add', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                showToastSuccess('Image uploaded successfully!'); // Use toast for success
                removeImage(); 
            } else {
                // Handle API error message
                showToastError(`Upload Error: ${data.message || 'Failed to upload image.'}`);
            }
        } catch (error) {
            console.error('Upload Error:', error);
            showToastError('Failed to connect to server. Please check your network.'); // Use toast for network error
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="ai-page">
            <Toaster /> {/* Add the Toaster component here */}
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            <main className={`ai-main ${isSidebarCollapsed ? "ai-main--collapsed" : ""}`}>
                <div className="ai-container">
                    <header className="ai-header">
                        <h1 className="ai-title">UPLOAD IMAGE</h1>
                        <p className="ai-subtitle">Add new images to your gallery list</p>
                    </header>

                    <div className="ai-upload-section">
                        <div className="ai-field">
                            {!imagePreview ? (
                                <div className="ai-upload-zone">
                                    <input 
                                        type="file" 
                                        id="gallery-upload" 
                                        accept="image/*" 
                                        onChange={handleImageChange} 
                                        hidden 
                                    />
                                    <label htmlFor="gallery-upload" className="ai-upload-label">
                                        <div className="ai-upload-icon"><Upload size={40} /></div>
                                        <span className="ai-upload-text">Click to Upload Image</span>
                                        <span className="ai-upload-subtext">Supports JPG, PNG</span>
                                    </label>
                                </div>
                            ) : (
                                <div className="ai-preview-wrapper">
                                    <img src={imagePreview} alt="Preview" className="ai-preview-img" />
                                    <button onClick={removeImage} className="ai-remove-btn">
                                        <Trash2 size={16} /> Remove
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="ai-actions">
                            <button 
                                className="ai-btn-submit" 
                                onClick={handleSubmit} 
                                disabled={isSubmitting || !imageFile}
                            >
                                {isSubmitting ? 'Uploading...' : 'Upload to Gallery'}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AddImage;
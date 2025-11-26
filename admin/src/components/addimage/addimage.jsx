import React, { useState, useEffect } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import './addimage.css';

const AddImage = () => {
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        return () => {
            if (imagePreview) URL.revokeObjectURL(imagePreview);
        };
    }, [imagePreview]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Please upload a valid image file (JPG, PNG).');
                return;
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const handleSubmit = async () => {
        if (!imageFile) {
            alert('Please select an image to upload.');
            return;
        }

        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('image', imageFile);
        // Default title to filename if needed
        formData.append('title', imageFile.name);

        try {
            const response = await fetch('http://localhost:5000/api/images/add', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                alert('Image uploaded successfully!');
                removeImage(); // Clear form
            } else {
                alert(`Error: ${data.message || 'Failed to upload'}`);
            }
        } catch (error) {
            console.error('Upload Error:', error);
            alert('Failed to connect to server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="ai-page">
            <Sidebar />
            <main className="ai-main">
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
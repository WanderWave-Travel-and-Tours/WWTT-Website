import React, { useState, useEffect, useMemo } from 'react';
import { Upload, X, Image as ImageIcon, Trash2 } from 'lucide-react';
import './addposter.css';
import Sidebar from '../sidebar/sidebar';

// Helper function to format a date object to YYYY-MM-DD string
const formatDate = (date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
};

// Helper function to get a date a certain number of days from a reference date
const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};


const AddPoster = () => {
    // --- DATE RESTRICTIONS LOGIC START ---
    // Minimum date: Tomorrow's date (Today + 1 day)
    const minStartDate = useMemo(() => formatDate(addDays(new Date(), 1)), []);

    // Maximum date: One year from tomorrow (Today + 366 days)
    const maxDate = useMemo(() => formatDate(addDays(new Date(), 366)), []);
    // --- DATE RESTRICTIONS LOGIC END ---

    // --- SIDEBAR LOGIC START ---
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };
    // --- SIDEBAR LOGIC END ---

    const [posterDetails, setPosterDetails] = useState({
        title: '',
        description: '',
        startDate: minStartDate, // Set initial value to tomorrow
        endDate: '',
        status: 'Active'
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    // Use useMemo to dynamically calculate the minimum end date
    const minEndDate = useMemo(() => {
        if (posterDetails.startDate) {
            // Minimum end date is 7 days after the selected start date
            return formatDate(addDays(new Date(posterDetails.startDate), 7));
        }
        // If no start date is selected, minimum is 7 days from tomorrow
        return formatDate(addDays(new Date(), 8)); 
    }, [posterDetails.startDate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Custom logic to handle date changes
        if (name === 'startDate') {
            const newStartDate = value;
            let newEndDate = posterDetails.endDate;

            // 1. Calculate the absolute minimum end date based on the new start date (Start + 7 days)
            const absoluteMinEndDate = formatDate(addDays(new Date(newStartDate), 7));

            // 2. If the current end date is earlier than the new absolute minimum,
            //    reset the end date to the new absolute minimum.
            if (newEndDate && new Date(newEndDate) < new Date(absoluteMinEndDate)) {
                newEndDate = absoluteMinEndDate;
            } else if (!newEndDate) {
                // Optionally pre-select the min end date if none is set
                // newEndDate = absoluteMinEndDate;
            }


            setPosterDetails(prev => ({
                ...prev,
                startDate: newStartDate,
                endDate: newEndDate
            }));
        } else {
            setPosterDetails(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Please upload a valid image file (JPG, PNG).');
                return;
            }
            
            setImageFile(file);
            const objectUrl = URL.createObjectURL(file);
            setImagePreview(objectUrl);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const handleSubmit = async () => {
        if (!posterDetails.title || !imageFile) {
            alert('Please provide a title and upload an image.');
            return;
        }

        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('title', posterDetails.title);
        formData.append('description', posterDetails.description);
        formData.append('startDate', posterDetails.startDate);
        formData.append('endDate', posterDetails.endDate);
        formData.append('status', posterDetails.status);

        try {
            const response = await fetch('http://localhost:5000/api/posters/add', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                alert('Poster uploaded successfully!');
                handleCancel(); // Reset form
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

    const handleCancel = () => {
        setPosterDetails({
            title: '',
            description: '',
            startDate: minStartDate, // Reset to tomorrow
            endDate: '',
            status: 'Active'
        });
        setImageFile(null);
        setImagePreview(null);
    };

    return (
        <div className="poster-page">
            {/* 1. Pass the state and toggle function to Sidebar */}
            <Sidebar 
                isCollapsed={isSidebarCollapsed} 
                toggleSidebar={toggleSidebar} 
            /> 
            
            {/* 2. Apply conditional class to the main content */}
            <main className={`poster-main ${
                isSidebarCollapsed ? "poster-main--collapsed" : ""
            }`}>
                <div className="poster-container">
                    <header className="poster-header">
                        <h1 className="poster-title">ADD PROMO POSTER</h1>
                        <p className="poster-subtitle">Upload marketing banners for your website or app</p>
                    </header>

                    <div className="poster-grid">
                        <div className="poster-left">
                            <section className="poster-section">
                                <h2 className="poster-section-title">POSTER DETAILS</h2>
                                <div className="poster-fields">
                                    <div className="poster-field poster-field--full">
                                        <label>Upload Image</label>
                                        
                                        {!imagePreview ? (
                                            <div className="upload-zone">
                                                <input 
                                                    type="file" 
                                                    id="poster-upload" 
                                                    accept="image/*" 
                                                    onChange={handleImageChange}
                                                    hidden 
                                                />
                                                <label htmlFor="poster-upload" className="upload-label">
                                                    <div className="upload-icon-wrapper">
                                                        <Upload size={32} />
                                                    </div>
                                                    <span className="upload-text">Click to Upload Poster</span>
                                                    <span className="upload-subtext">Supports JPG, PNG, GIF (Max 5MB)</span>
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="image-preview-container">
                                                <img src={imagePreview} alt="Preview" className="uploaded-image" />
                                                <button type="button" className="remove-image-btn" onClick={removeImage}>
                                                    <Trash2 size={16} /> Remove
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="poster-field poster-field--full">
                                        <label>Poster Title</label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={posterDetails.title}
                                            onChange={handleChange}
                                            placeholder="e.g., Summer Sale Banner"
                                        />
                                    </div>

                                    <div className="poster-field poster-field--full">
                                        <label>Description / Caption</label>
                                        <textarea
                                            name="description"
                                            value={posterDetails.description}
                                            onChange={handleChange}
                                            placeholder="Optional caption for the poster..."
                                            rows="3"
                                        ></textarea>
                                    </div>

                                    <div className="poster-field">
                                        <label>Start Display Date</label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            value={posterDetails.startDate}
                                            onChange={handleChange}
                                            min={minStartDate} // Minimum is tomorrow
                                            max={maxDate}      // Maximum is 1 year from tomorrow
                                        />
                                    </div>

                                    <div className="poster-field">
                                        <label>End Display Date</label>
                                        <input
                                            type="date"
                                            name="endDate"
                                            value={posterDetails.endDate}
                                            onChange={handleChange}
                                            min={minEndDate}   // Minimum is 7 days after Start Date
                                            max={maxDate}      // Maximum is 1 year from tomorrow
                                        />
                                    </div>

                                    <div className="poster-field poster-field--full">
                                        <label>Status</label>
                                        <select
                                            name="status"
                                            value={posterDetails.status}
                                            onChange={handleChange}
                                        >
                                            <option value="Active">Active (Visible)</option>
                                            <option value="Inactive">Inactive (Hidden)</option>
                                            <option value="Scheduled">Scheduled</option>
                                        </select>
                                    </div>
                                </div>
                            </section>

                            <div className="poster-actions">
                                <button 
                                    type="button" 
                                    className="poster-btn poster-btn--cancel" 
                                    onClick={handleCancel}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="poster-btn poster-btn--submit"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Uploading...' : 'Upload Poster'}
                                </button>
                            </div>
                        </div>

                        <aside className="poster-right">
                            <div className="poster-preview-card">
                                <span className="poster-preview-label">LIVE PREVIEW</span>
                                
                                <div className="phone-mockup">
                                    <div className="phone-screen">
                                        <div className="phone-header">
                                            <div className="phone-brand">Wanderwave</div>
                                        </div>

                                        <div className="phone-content">
                                            {imagePreview ? (
                                                <div className="preview-hero">
                                                    <img src={imagePreview} alt="Banner Preview" />
                                                    <div className="preview-overlay">
                                                        {posterDetails.title && <h3>{posterDetails.title}</h3>}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="empty-state-preview">
                                                    <ImageIcon size={40} />
                                                    <p>Upload an image to see preview</p>
                                                </div>
                                            )}
                                            
                                            <div className="fake-item" style={{width: '80%'}}></div>
                                            <div className="fake-item" style={{width: '90%'}}></div>
                                            <div className="fake-item" style={{width: '60%'}}></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="poster-stats">
                                    <div className="p-stat">
                                        <strong>Type</strong>
                                        <span>{imageFile ? imageFile.type.split('/')[1].toUpperCase() : '--'}</span>
                                    </div>
                                    <div className="p-stat">
                                        <strong>Size</strong>
                                        <span>{imageFile ? (imageFile.size / 1024 / 1024).toFixed(2) + ' MB' : '--'}</span>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AddPoster;
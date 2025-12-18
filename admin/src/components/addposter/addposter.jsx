import React, { useState, useEffect, useMemo } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast'; // Import toast and Toaster
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

    // --- SIDEBAR LOGIC ---
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    // --- STATE MANAGEMENT ---
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
            if (imagePreview) URL.revokeObjectURL(imagePreview);
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
        setPosterDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                // Replace alert with toast notification for invalid file type
                toast.error('Please upload a valid image file (JPG, PNG, GIF).', {
                    style: { border: '1px solid #ef4444', color: '#ef4444' },
                    iconTheme: { primary: '#ef4444', secondary: '#fff' },
                });
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
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
    };

    const handleCancel = () => {
        setPosterDetails({
            title: '',
            description: '',
            startDate: '',
            endDate: '',
            status: 'Active'
        });
        setImageFile(null);
        setImagePreview(null);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        // Validation check for title and image
        if (!posterDetails.title) {
            toast.error('Poster Title is required.', {
                style: { border: '1px solid #ef4444', color: '#ef4444' },
                iconTheme: { primary: '#ef4444', secondary: '#fff' },
            });
            return;
        }
        
        if (!imageFile) {
            toast.error('Please upload an image for the poster.', {
                style: { border: '1px solid #ef4444', color: '#ef4444' },
                iconTheme: { primary: '#ef4444', secondary: '#fff' },
            });
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
            const response = await fetch('http://localhost:5000/api/posters/add', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                // Success notification (using a different toast type for positive feedback)
                toast.success('✅ Poster uploaded successfully!', {
                    style: { border: '1px solid #10b981', color: '#10b981' },
                    iconTheme: { primary: '#10b981', secondary: '#fff' },
                });
                handleCancel();
            } else {
                const data = await response.json();
                // Replace alert with toast notification for server error
                toast.error(`❌ Error: ${data.message || 'Failed to upload poster.'}`, {
                    style: { border: '1px solid #ef4444', color: '#ef4444' },
                    iconTheme: { primary: '#ef4444', secondary: '#fff' },
                });
            }
        } catch (error) {
            // Replace alert with toast notification for connection error
            toast.error('❌ Failed to connect to server. Please check your network.', {
                style: { border: '1px solid #ef4444', color: '#ef4444' },
                iconTheme: { primary: '#ef4444', secondary: '#fff' },
            });
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
        // Important: Revoke the object URL when canceling to free up memory
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
        setImagePreview(null);
    };

    return (
        <div className="apstr-page">
            {/* Toaster Component for Notifications */}
            <Toaster position="top-center" reverseOrder={false} />
            
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            
            <main className={`apstr-main ${isSidebarCollapsed ? "apstr-main--collapsed" : ""}`}>
                <div className="apstr-container">
                    {/* HEADER MATCHED TO PROMO WITH DESTINATION FEEL */}
                    <header className="apstr-header">
                        <div className="apstr-header-content">
                            <h1 className="apstr-title">NEW POSTER</h1>
                            <p className="apstr-subtitle">Upload marketing banners for your website or app</p>
                        </div>
                    </header>

                    <form onSubmit={handleSubmit}>
                        <div className="apstr-grid">
                            <div className="apstr-left">
                                <section className="pstr-section">
                                    <h2 className="pstr-section-title">POSTER IMAGE</h2>
                                    {!imagePreview ? (
                                        <div className="apstr-upload-empty">
                                            <label className="apstr-upload-label" style={{ cursor: 'pointer' }}>
                                                <input type="file" accept="image/*" onChange={handleImageChange} hidden />
                                                <div className="apstr-upload-icon-box">
                                                    <Upload size={32} />
                                                </div>
                                                <p style={{ fontWeight: '700', color: '#1e293b' }}>Click to upload poster</p>
                                                <span style={{ fontSize: '12px', color: '#64748b' }}>JPG, PNG or WebP (Max 5MB)</span>
                                            </label>
                                        </div>
                                    ) : (
                                        <div className="apstr-upload-preview-box">
                                            <img src={imagePreview} alt="Preview" />
                                            <div className="apstr-upload-actions">
                                                <label className="apstr-upload-change-btn">
                                                    <input type="file" onChange={handleImageChange} accept="image/*" hidden />
                                                    Change
                                                </label>
                                                <button type="button" className="apstr-upload-remove-btn" onClick={removeImage}>
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </section>

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
                                <section className="pstr-section">
                                    <h2 className="pstr-section-title">POSTER DETAILS</h2>
                                    <div className="pstr-fields">
                                        <div className="pstr-field pstr-field--full">
                                            <label>Poster Title</label>
                                            <input
                                                type="text"
                                                name="title"
                                                placeholder="e.g. Summer Sale 2024"
                                                value={posterDetails.title}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="pstr-field pstr-field--full">
                                            <label>Description / Caption</label>
                                            <textarea
                                                name="description"
                                                placeholder="Optional caption for the poster..."
                                                value={posterDetails.description}
                                                onChange={handleChange}
                                                rows="4"
                                            ></textarea>
                                        </div>
                                        <div className="pstr-field">
                                            <label>Start Display Date</label>
                                            <input type="date" name="startDate" value={posterDetails.startDate} onChange={handleChange} />
                                        </div>
                                        <div className="pstr-field">
                                            <label>End Display Date</label>
                                            <input type="date" name="endDate" value={posterDetails.endDate} onChange={handleChange} />
                                        </div>
                                        <div className="pstr-field pstr-field--full">
                                            <label>Status</label>
                                            <select name="status" value={posterDetails.status} onChange={handleChange}>
                                                <option value="Active">Active (Visible)</option>
                                                <option value="Inactive">Inactive (Hidden)</option>
                                                <option value="Scheduled">Scheduled</option>
                                            </select>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <aside className="apstr-right">
                                <div className="pstr-preview-card">
                                    <span className="pstr-preview-label">LIVE PREVIEW</span>
                                    <div className="pstr-phone-mockup">
                                        <div className="pstr-phone-screen">
                                            <div className="pstr-phone-header">
                                                <div className="pstr-phone-brand">Wanderwave</div>
                                            </div>
                                            <div className="pstr-phone-content">
                                                {imagePreview ? (
                                                    <div className="pstr-preview-hero">
                                                        <img src={imagePreview} alt="Hero" />
                                                        <div className="pstr-preview-overlay">
                                                            {posterDetails.title && <h3>{posterDetails.title}</h3>}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="pstr-empty-state">
                                                        <ImageIcon size={40} />
                                                        <p>Upload an image to see preview</p>
                                                    </div>
                                                )}
                                                <div className="pstr-fake-item"></div>
                                                <div className="pstr-fake-item"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pstr-stats">
                                        <div className="pstr-stat">
                                            <strong>Type</strong>
                                            <span>{imageFile ? imageFile.type.split('/')[1].toUpperCase() : '--'}</span>
                                        </div>
                                        <div className="pstr-stat">
                                            <strong>Size</strong>
                                            <span>{imageFile ? (imageFile.size / 1024 / 1024).toFixed(2) + ' MB' : '--'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="apstr-actions">
                                    <button 
                                        type="button" 
                                        className="apstr-btn apstr-btn--cancel" 
                                        onClick={handleCancel}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="apstr-btn apstr-btn--submit" 
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Uploading...' : 'Upload'}
                                    </button>
                                </div>
                            </aside>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default AddPoster;
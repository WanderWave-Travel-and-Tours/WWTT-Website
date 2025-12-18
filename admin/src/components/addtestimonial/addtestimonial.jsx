import React, { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast'; // Import toast and Toaster
import { User, Quote, Camera, Loader2 } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import './addtestimonial.css';

const AddTestimonial = () => {
    // --- SIDEBAR LOGIC START ---
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };
    // --- SIDEBAR LOGIC END ---
    
    const [testimonialDetails, setTestimonialDetails] = useState({
        name: '',
        feedback: '',
        source: '',
    });
    const [pictureFile, setPictureFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    // Removed uploadError state as we will use toast notifications
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTestimonialDetails(prev => ({ ...prev, [name]: value }));
    };

    // --- UPDATED: Handle File Change with Toast Validation ---
    const handleFileChange = (e) => {
        const file = e.target.files[0];

        if (!file) {
            setPictureFile(null);
            setPreviewUrl(null);
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        
        if (allowedTypes.includes(file.type)) {
            // File type is supported
            setPictureFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            // File type is NOT supported - show toast error
            setPictureFile(null);
            setPreviewUrl(null);
            toast.error('Unsupported file type. Only JPG, PNG, and WebP are allowed.', {
                position: 'top-center',
                style: { border: '1px solid #ef4444', color: '#ef4444' },
                iconTheme: { primary: '#ef4444', secondary: '#fff' },
            });
            // Clear the file input for re-selection
            e.target.value = null; 
        }
    };
    // --- END UPDATED: Handle File Change with Toast Validation ---

    const handleCancel = () => {
        setTestimonialDetails({
            name: '',
            feedback: '',
            source: '',
        });
        setPictureFile(null);
        setPreviewUrl(null);
    };

    const handleSubmit = async (e) => { 
        e.preventDefault();
        
        // Prevent submission if no file is selected but required for a successful upload logic
        if (e.target.querySelector('input[type="file"]').value && !pictureFile) {
             toast.error('Please select a valid image file before submitting.', {
                position: 'top-center',
                style: { border: '1px solid #ef4444', color: '#ef4444' },
                iconTheme: { primary: '#ef4444', secondary: '#fff' },
            });
             return;
        }

        setIsSubmitting(true);
        const formData = new FormData();

        formData.append('customerName', testimonialDetails.name); 
        formData.append('source', testimonialDetails.source);
        formData.append('feedback', testimonialDetails.feedback);

        if (pictureFile) {
            formData.append('customerImage', pictureFile); 
        }

        try {
            const response = await fetch('http://localhost:5000/api/testimonials', {
                    method: 'POST',
            const response = await fetch('http://localhost:5000/api/testimonials', {
                method: 'POST',
                body: formData, 
            });

            if (response.ok) {
                // Success Toast Notification
                toast.success(`Testimonial from ${testimonialDetails.name} added successfully!`, {
                    position: 'top-center',
                    style: { border: '1px solid #10b981', color: '#065f46' }, // Example success styling
                    iconTheme: { primary: '#10b981', secondary: '#fff' },
                });
                
                // Reset all states
                setTestimonialDetails({
                    name: '',
                    feedback: '',
                    source: '',
                });
                setPictureFile(null);
                setPreviewUrl(null);
                alert(`Testimonial from ${testimonialDetails.name} added successfully!`);
                handleCancel();
                e.target.reset();
            } else {
                // Error Toast Notification for failed API response
                toast.error("Error submitting testimonial. Please check server status.", {
                    position: 'top-center',
                    style: { border: '1px solid #ef4444', color: '#ef4444' },
                    iconTheme: { primary: '#ef4444', secondary: '#fff' },
                });
            }
        } catch (error) {
            console.error("Error:", error);
            // Error Toast Notification for network/server error
            toast.error("Something went wrong with the server or network connection.", {
                position: 'top-center',
                style: { border: '1px solid #ef4444', color: '#ef4444' },
                iconTheme: { primary: '#ef4444', secondary: '#fff' },
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="testi-page">
            {/* The Toaster component is required to display the notifications */}
            <Toaster /> 

            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            
            <main className={`testi-main ${isSidebarCollapsed ? "testi-main--collapsed" : ""}`}>
                <div className="testi-container">
                    <header className="testi-header">
                        <div className="testi-header-content">
                            <h1 className="testi-title">NEW TESTIMONIAL</h1>
                            <p className="testi-subtitle">Add a customer testimonial to display on your website gallery</p>
                        </div>
                    </header>

                    <form onSubmit={handleSubmit} className="testi-form">
                        <div className="testi-grid">
                            <div className="testi-left">
                                <section className="testi-section">
                                    <h2 className="testi-section-title">CUSTOMER PHOTO</h2>
                                    {/* Added accept="image/jpeg,image/png,image/webp" as a pre-filter */}
                                    <label className="testi-upload">
                                        <input 
                                            type="file" 
                                            accept="image/jpeg,image/png,image/webp" // Client-side filter
                                            onChange={handleFileChange} 
                                            hidden 
                                        />
                                        {previewUrl ? (
                                            <div className="testi-upload-preview">
                                                <img src={previewUrl} alt="Preview" />
                                                <span className="testi-upload-change">Change Photo</span>
                                            </div>
                                        ) : (
                                            <div className="testi-upload-empty">
                                                <div className="testi-upload-icon">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                        <path d="M20 21v-2a4 4 4 00-4-4H8a4 4 4 00-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
                                                        <circle cx="12" cy="7" r="4"/>
                                                    </svg>
                                                </div>
                                                <p>Click to upload photo</p>
                                                {/* Updated file type message */}
                                                <span>JPG, PNG, WebP • Max 2MB</span> 
                                            </div>
                                        )}
                                    </label>
                                    
                                    {/* REMOVED: Inline uploadError notification */}
                                    {/* {uploadError && (
                                        <div style={{ color: 'red', marginTop: '10px', fontWeight: 'bold' }}>
                                            {uploadError}
                                        </div>
                                    )} */}

                                    <div className="testi-upload-area">
                                        <label className="testi-upload-label-poster">
                                            <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                                            {!previewUrl ? (
                                                <div className="testi-upload-placeholder">
                                                    <div className="testi-upload-icon-box">
                                                        <Camera size={32} />
                                                    </div>
                                                    <p style={{ fontWeight: '700', color: '#1e293b', margin: '0' }}>Click to upload photo</p>
                                                    <span style={{ fontSize: '12px', color: '#64748b' }}>JPG, PNG • Max 2MB</span>
                                                </div>
                                            ) : (
                                                <div className="testi-upload-preview-box">
                                                    <img src={previewUrl} alt="Preview" />
                                                    <div className="testi-upload-overlay">
                                                        <span>Change Photo</span>
                                                    </div>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </section>

                                <section className="testi-section">
                                    <h2 className="testi-section-title">CUSTOMER DETAILS</h2>
                                    <div className="testi-fields">
                                        <div className="testi-field">
                                            <label>Customer Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={testimonialDetails.name}
                                                onChange={handleChange}
                                                placeholder="e.g., Maria T. Reyes"
                                                required
                                            />
                                        </div>
                                        <div className="testi-field">
                                            <label>Feedback Source</label>
                                            <select
                                                name="source"
                                                value={testimonialDetails.source}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="" disabled>Select Source</option>
                                                <option value="Facebook">Facebook</option>
                                                <option value="Google Review">Google Review</option>
                                                <option value="Website Form">Website Form</option>
                                                <option value="Email">Email</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className="testi-field testi-field--full">
                                            <label>Feedback / Testimonial</label>
                                            <textarea
                                                name="feedback"
                                                value={testimonialDetails.feedback}
                                                onChange={handleChange}
                                                placeholder="Enter the full quote or review here..."
                                                rows="6"
                                                required
                                            ></textarea>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <aside className="testi-right">
                                <div className="testi-preview-card">
                                    <span className="testi-preview-label">LIVE PREVIEW</span>
                                    <div className="testi-card">
                                        <div className="testi-card-quote">
                                            <Quote size={32} />
                                        </div>
                                        <p className="testi-card-feedback">
                                            {testimonialDetails.feedback || 'Customer feedback will appear here...'}
                                        </p>
                                        <div className="testi-card-author">
                                            <div className="testi-card-avatar">
                                                {previewUrl ? (
                                                    <img src={previewUrl} alt="Avatar" />
                                                ) : (
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                        <path d="M20 21v-2a4 4 4 00-4-4H8a4 4 4 00-4 4v2"/>
                                                        <circle cx="12" cy="7" r="4"/>
                                                    </svg>
                                                    <User size={24} />
                                                )}
                                            </div>
                                            <div className="testi-card-info">
                                                <strong>{testimonialDetails.name || 'Customer Name'}</strong>
                                                <span>{testimonialDetails.source || 'Source'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="testi-stats">
                                        <div className="testi-stat">
                                            <strong>{testimonialDetails.name ? '✓' : '--'}</strong>
                                            <span>Name</span>
                                        </div>
                                        <div className="testi-stat">
                                            <strong>{testimonialDetails.source ? '✓' : '--'}</strong>
                                            <span>Source</span>
                                        </div>
                                        <div className="testi-stat">
                                            <strong>{previewUrl ? '✓' : '--'}</strong>
                                            <span>Photo</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="testi-actions">
                                    <button 
                                        type="button" 
                                        className="testi-btn testi-btn--cancel" 
                                        onClick={handleCancel}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="testi-btn testi-btn--submit"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Submit...' : 'Submit'}
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

export default AddTestimonial;
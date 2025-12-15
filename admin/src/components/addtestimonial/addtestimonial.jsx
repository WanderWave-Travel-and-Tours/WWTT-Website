import React, { useState } from 'react';
import './addtestimonial.css';
import Sidebar from '../sidebar/sidebar';

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
    const [uploadError, setUploadError] = useState(''); // New state for upload error

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTestimonialDetails(prev => ({ ...prev, [name]: value }));
    };

    // --- UPDATED: Handle File Change with Validation ---
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setUploadError(''); // Clear previous error

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
            // File type is NOT supported - show error notification and reject file
            setPictureFile(null);
            setPreviewUrl(null);
            setUploadError('Unsupported file type. Only JPG, PNG, and WebP are allowed.');
            // Clear the file input for re-selection
            e.target.value = null; 
        }
    };
    // --- END UPDATED: Handle File Change with Validation ---

    const handleSubmit = async (e) => { 
        e.preventDefault();
        
        // Prevent submission if a rejected file is still causing an error
        if (uploadError) {
             alert(uploadError);
             return;
        }

        const formData = new FormData();

        formData.append('customerName', testimonialDetails.name); 
        formData.append('source', testimonialDetails.source);
        formData.append('feedback', testimonialDetails.feedback);

        if (pictureFile) {
            formData.append('customerImage', pictureFile); 
        }

        try {
            // Ensure the correct Content-Type header is NOT set manually.
            // When using FormData, the browser sets the correct 'multipart/form-data' header 
            // including the boundary automatically.
            const response = await fetch('http://localhost:5000/api/testimonials', {
                    method: 'POST',
                body: formData, 
            });

            if (response.ok) {
                const result = await response.json();
                alert(`Testimonial from ${testimonialDetails.name} added successfully!`);
                
                // Reset all states
                setTestimonialDetails({
                    name: '',
                    feedback: '',
                    source: '',
                });
                setPictureFile(null);
                setPreviewUrl(null);
                setUploadError('');
                e.target.reset();
            } else {
                console.error("Failed to submit");
                alert("Error submitting testimonial.");
            }

        } catch (error) {
            console.error("Error:", error);
            alert("Something went wrong with the server.");
        }
    };

    return (
        <div className="testi-page">
            {/* Sidebar component updated with props */}
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            
            {/* Main content area updated with conditional class */}
            <main className={`testi-main ${isSidebarCollapsed ? "testi-main--collapsed" : ""}`}>
                <div className="testi-container">
                    <header className="testi-header">
                        <h1 className="testi-title">NEW TESTIMONIAL</h1>
                        <p className="testi-subtitle">Add a customer testimonial to display on your website</p>
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
                                                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
                                                        <circle cx="12" cy="7" r="4"/>
                                                    </svg>
                                                </div>
                                                <p>Click to upload photo</p>
                                                {/* Updated file type message */}
                                                <span>JPG, PNG, WebP • Max 2MB</span> 
                                            </div>
                                        )}
                                    </label>
                                    
                                    {/* Display the upload error notification */}
                                    {uploadError && (
                                        <div style={{ color: 'red', marginTop: '10px', fontWeight: 'bold' }}>
                                            {uploadError}
                                        </div>
                                    )}

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
                                                rows="5"
                                                required
                                            ></textarea>
                                        </div>
                                    </div>
                                </section>

                                <div className="testi-actions">
                                    <button type="button" className="testi-btn testi-btn--cancel">Cancel</button>
                                    <button type="submit" className="testi-btn testi-btn--submit">Submit Testimonial</button>
                                </div>
                            </div>

                            <aside className="testi-right">
                                <div className="testi-preview">
                                    <span className="testi-preview-label">PREVIEW</span>
                                    <div className="testi-card">
                                        <div className="testi-card-quote">
                                            <svg viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                                            </svg>
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
                                                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                                                        <circle cx="12" cy="7" r="4"/>
                                                    </svg>
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
                            </aside>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default AddTestimonial;
import React, { useState } from 'react';
import './AddTestimonial.css';
import Sidebar from '../sidebar/sidebar';

const AddTestimonial = () => {
    const [testimonialDetails, setTestimonialDetails] = useState({
        name: '',
        feedback: '',
        source: '',
    });
    const [pictureFile, setPictureFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTestimonialDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setPictureFile(file);
        if (file) setPreviewUrl(URL.createObjectURL(file));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Submitting Testimonial:', testimonialDetails);
        if (pictureFile) console.log('Picture:', pictureFile.name);
        alert(`Testimonial from ${testimonialDetails.name} added successfully!`);
        setTestimonialDetails({ name: '', feedback: '', source: '' });
        setPictureFile(null);
        setPreviewUrl(null);
        e.target.reset();
    };

    return (
        <div className="testi-page">
            <Sidebar />
            <main className="testi-main">
                <div className="testi-container">
                    {/* Header */}
                    <header className="testi-header">
                        <h1 className="testi-title">NEW TESTIMONIAL</h1>
                        <p className="testi-subtitle">Add a customer testimonial to display on your website</p>
                    </header>

                    <form onSubmit={handleSubmit} className="testi-form">
                        <div className="testi-grid">
                            {/* Left Column - Form */}
                            <div className="testi-left">
                                {/* Customer Photo */}
                                <section className="testi-section">
                                    <h2 className="testi-section-title">CUSTOMER PHOTO</h2>
                                    <label className="testi-upload">
                                        <input type="file" accept="image/*" onChange={handleFileChange} hidden />
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
                                                <span>JPG, PNG • Max 2MB</span>
                                            </div>
                                        )}
                                    </label>
                                </section>

                                {/* Customer Details */}
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

                            {/* Right Column - Preview */}
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
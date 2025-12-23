import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Upload, User, MessageSquare } from 'lucide-react';
import Sidebar from '../sidebar/sidebar'; 
import './EditTestimonial.css';

const EditTestimonial = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        customerName: '',
        source: 'Facebook', // Default
        feedback: ''
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const API_BASE_URL = 'http://localhost:5000';

    // Fetch Testimonial Data
    useEffect(() => {
        const fetchTestimonialDetails = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/testimonials/${id}`);
                if (!response.ok) throw new Error('Failed to fetch testimonial details');
                
                const data = await response.json();
                
                setFormData({
                    customerName: data.customerName || '',
                    source: data.source || 'Facebook',
                    feedback: data.feedback || ''
                });

                if (data.customerImage) {
                    // Check if absolute or relative path
                    const imgUrl = data.customerImage.startsWith('http') 
                        ? data.customerImage 
                        : `${API_BASE_URL}/${data.customerImage}`;
                    setImagePreview(imgUrl);
                }
            } catch (err) {
                console.error(err);
                alert('Could not load testimonial details. Please check connection.');
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchTestimonialDetails();
        }
    }, [id]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append("customerName", formData.customerName);
            formDataToSend.append("source", formData.source);
            formDataToSend.append("feedback", formData.feedback);

            if (imageFile) {
                formDataToSend.append("customerImage", imageFile);
            }

            // Gamit ang pattern na katulad sa poster update
            const response = await fetch(`${API_BASE_URL}/api/testimonials/update/${id}`, {
                method: 'PUT',
                body: formDataToSend,
            });

            if (!response.ok) {
                throw new Error('Failed to update testimonial');
            }

            alert('✅ Testimonial updated successfully!');
            navigate('/view-testimonials'); 
        } catch (err) {
            console.error(err);
            alert('❌ Failed to update testimonial. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="eto-page">
                <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
                <main className={`eto-main ${isSidebarCollapsed ? "eto-main--collapsed" : ""}`}>
                    <div className="eto-loading">
                        <div className="eto-spinner"></div>
                        <p>Loading testimonial data...</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="eto-page">
            <Sidebar 
                isCollapsed={isSidebarCollapsed} 
                toggleSidebar={toggleSidebar} 
            />
            
            <main className={`eto-main ${isSidebarCollapsed ? "eto-main--collapsed" : ""}`}>
                <div className="eto-container">
                    
                    {/* Header */}
                    <header className="eto-header">
                        <div className="eto-header-content">
                            <button className="eto-back-btn" onClick={() => navigate('/view-testimonials')}>
                                <ArrowLeft size={18} />
                                Back to Testimonials
                            </button>
                            <h1 className="eto-title">EDIT TESTIMONIAL</h1>
                            <p className="eto-subtitle">Update customer feedback and details</p>
                        </div>
                    </header>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="eto-form">
                        
                        {/* Section 1: Image Upload */}
                        <div className="eto-section">
                            <h2 className="eto-section-title">Customer Photo</h2>
                            <div className="eto-upload-area">
                                <input
                                    type="file"
                                    id="customerImageUpload"
                                    className="eto-file-input"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                                <label htmlFor="customerImageUpload" className="eto-upload-label">
                                    {imagePreview ? (
                                        <div className="eto-image-preview">
                                            <img src={imagePreview} alt="Preview" />
                                            <div className="eto-image-overlay">
                                                <Upload size={32} />
                                                <span>Click to change photo</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="eto-upload-placeholder">
                                            <User size={48} />
                                            <span>Click to upload customer photo</span>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>

                        {/* Section 2: Testimonial Details */}
                        <div className="eto-section">
                            <h2 className="eto-section-title">Testimonial Details</h2>
                            <div className="eto-form-grid">
                                <div className="eto-form-group">
                                    <label className="eto-label">Customer Name *</label>
                                    <input 
                                        type="text" 
                                        name="customerName"
                                        value={formData.customerName}
                                        onChange={handleInputChange}
                                        required
                                        className="eto-input"
                                        placeholder="e.g. John Doe"
                                    />
                                </div>

                                <div className="eto-form-group">
                                    <label className="eto-label">Source *</label>
                                    <select 
                                        name="source" 
                                        value={formData.source} 
                                        onChange={handleInputChange}
                                        className="eto-select"
                                        required
                                    >
                                        <option value="Facebook">Facebook</option>
                                        <option value="Google Reviews">Google Reviews</option>
                                        <option value="Email">Email</option>
                                        <option value="Direct Message">Direct Message</option>
                                        <option value="Website">Website</option>
                                    </select>
                                </div>

                                <div className="eto-form-group eto-form-group--full">
                                    <label className="eto-label">Feedback / Message *</label>
                                    <textarea 
                                        name="feedback"
                                        value={formData.feedback}
                                        onChange={handleInputChange}
                                        className="eto-textarea"
                                        rows="6"
                                        required
                                        placeholder="Enter what the customer said..."
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="eto-form-actions">
                            <button 
                                type="button" 
                                className="eto-btn eto-btn--cancel" 
                                onClick={() => navigate('/view-testimonials')}
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="eto-btn eto-btn--submit" 
                                disabled={submitting}
                            >
                                {submitting ? (
                                    'Updating...' 
                                ) : (
                                    <>
                                        <Save size={18} /> Update Testimonial
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default EditTestimonial;
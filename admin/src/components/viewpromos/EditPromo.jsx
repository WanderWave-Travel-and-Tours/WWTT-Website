import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Percent, DollarSign, Upload, X } from 'lucide-react';
import Sidebar from '../sidebar/sidebar'; 
import './EditPromo.css'; 

const EditPromo = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        category: '',
        discountType: 'Percentage',
        discountValue: '',
        startDate: '',
        validUntil: '',
        description: '',
        durationType: 'Weekly' // Default
    });

    // Image Handling
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [currentImage, setCurrentImage] = useState(null);

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    // Fetch Promo Data
    useEffect(() => {
        const fetchPromoDetails = async () => {
            try {
                const response = await fetch(`https://wanderwaveph-backend.onrender.com/api/promos/${id}`);
                if (!response.ok) throw new Error('Failed to fetch promo details');
                
                const data = await response.json();
                
                setFormData({
                    code: data.code || '',
                    category: data.category || '',
                    discountType: data.discountType || 'Percentage',
                    discountValue: data.discountValue || '',
                    startDate: formatDateForInput(data.startDate),
                    validUntil: formatDateForInput(data.validUntil),
                    description: data.description || '',
                    durationType: data.durationType || 'Weekly'
                });

                if (data.image) {
                    setCurrentImage(data.image);
                }
            } catch (err) {
                console.error(err);
                alert('Could not load promo details. Please check connection.');
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchPromoDetails();
        }
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Image Handlers
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeNewImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const data = new FormData();
            data.append('code', formData.code);
            data.append('category', formData.category);
            data.append('discountType', formData.discountType);
            data.append('discountValue', formData.discountValue);
            data.append('startDate', formData.startDate);
            data.append('validUntil', formData.validUntil);
            data.append('description', formData.description);
            data.append('durationType', formData.durationType);

            if (imageFile) {
                data.append('image', imageFile);
            }

            const response = await fetch(`https://wanderwaveph-backend.onrender.com/api/promos/${id}`, {
                method: 'PUT',
                body: data, // No Content-Type header
            });

            if (!response.ok) {
                throw new Error('Failed to update promo');
            }

            alert('✅ Promo updated successfully!');
            navigate('/view-promos'); 
        } catch (err) {
            console.error(err);
            alert('❌ Failed to update promo. Please check your inputs and try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="epr-page">
                <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
                <main className={`epr-main ${isSidebarCollapsed ? "epr-main--collapsed" : ""}`}>
                    <div className="epr-loading">
                        <div className="epr-spinner"></div>
                        <p>Loading promo data...</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="epr-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            
            <main className={`epr-main ${isSidebarCollapsed ? "epr-main--collapsed" : ""}`}>
                <div className="epr-container">
                    
                    <header className="epr-header">
                        <div className="epr-header-content">
                            <button className="epr-back-btn" onClick={() => navigate('/view-promos')}>
                                <ArrowLeft size={18} />
                                Back to Promos
                            </button>
                            <h1 className="epr-title">EDIT PROMO</h1>
                            <p className="epr-subtitle">Modify promotional voucher details and terms</p>
                        </div>
                    </header>

                    <form onSubmit={handleSubmit} className="epr-form">
                        
                        {/* Image Section */}
                        <div className="epr-section">
                            <h2 className="epr-section-title">Promo Image</h2>
                            <div className="epr-form-group">
                                <label className="epr-label">Upload New Image (Replaces current)</label>
                                <div style={{ border: '2px dashed #e2e8f0', borderRadius: '10px', padding: '20px', textAlign: 'center', background: '#f8fafc' }}>
                                    {imagePreview ? (
                                        <div style={{ position: 'relative', display: 'inline-block' }}>
                                            <p style={{fontSize: '12px', color:'#64748b', marginBottom: '8px'}}>New Image Selected:</p>
                                            <img src={imagePreview} alt="New Preview" style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                            <button 
                                                type="button"
                                                onClick={removeNewImage}
                                                style={{
                                                    position: 'absolute', top: '20px', right: '-10px',
                                                    background: 'red', color: 'white', border: 'none',
                                                    borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'}}>
                                            {currentImage && (
                                                <div style={{marginBottom: '10px'}}>
                                                     <p style={{fontSize: '12px', color:'#64748b', marginBottom: '8px'}}>Current Image:</p>
                                                    <img 
                                                        src={`https://wanderwaveph-backend.onrender.com/uploads/${currentImage}`} 
                                                        alt="Current" 
                                                        style={{ maxWidth: '200px', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                                                        onError={(e) => e.target.style.display = 'none'}
                                                    />
                                                </div>
                                            )}
                                            
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={handleImageChange}
                                                id="edit-promo-image"
                                                style={{ display: 'none' }}
                                            />
                                            <label htmlFor="edit-promo-image" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#475569' }}>
                                                <Upload size={18} />
                                                {currentImage ? 'Change Image' : 'Upload Image'}
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="epr-section">
                            <h2 className="epr-section-title">Voucher Identity</h2>
                            <div className="epr-form-grid">
                                <div className="epr-form-group">
                                    <label className="epr-label">Promo Code *</label>
                                    <input 
                                        type="text" 
                                        name="code"
                                        value={formData.code}
                                        onChange={handleChange}
                                        required
                                        className="epr-input"
                                        style={{ textTransform: 'uppercase' }}
                                    />
                                </div>

                                <div className="epr-form-group">
                                    <label className="epr-label">Category *</label>
                                    <input 
                                        type="text"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        required
                                        className="epr-input"
                                    />
                                </div>

                                <div className="epr-form-group">
                                    <label className="epr-label">Duration Type</label>
                                    <select
                                        name="durationType"
                                        value={formData.durationType}
                                        onChange={handleChange}
                                        className="epr-select"
                                    >
                                        <option value="Weekly">Weekly</option>
                                        <option value="Monthly">Monthly</option>
                                        <option value="Yearly">Yearly</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Value & Discount */}
                        <div className="epr-section">
                            <h2 className="epr-section-title">Value & Discount</h2>
                            <div className="epr-form-grid">
                                <div className="epr-form-group">
                                    <label className="epr-label">Discount Type</label>
                                    <div className="epr-radio-group">
                                        <label className={`epr-radio-label ${formData.discountType === 'Percentage' ? 'active' : ''}`}>
                                            <input 
                                                type="radio" 
                                                name="discountType" 
                                                value="Percentage"
                                                checked={formData.discountType === 'Percentage'}
                                                onChange={handleChange}
                                            />
                                            <Percent size={16} /> Percentage (%)
                                        </label>
                                        <label className={`epr-radio-label ${formData.discountType === 'Fixed Amount (Peso)' || formData.discountType === 'Fixed Amount' ? 'active' : ''}`}>
                                            <input 
                                                type="radio" 
                                                name="discountType" 
                                                value="Fixed Amount (Peso)"
                                                checked={formData.discountType === 'Fixed Amount (Peso)' || formData.discountType === 'Fixed Amount'}
                                                onChange={handleChange}
                                            />
                                            <DollarSign size={16} /> Fixed Amount (₱)
                                        </label>
                                    </div>
                                </div>

                                <div className="epr-form-group">
                                    <label className="epr-label">Discount Value *</label>
                                    <input 
                                        type="number" 
                                        name="discountValue"
                                        value={formData.discountValue}
                                        onChange={handleChange}
                                        required
                                        min="0"
                                        className="epr-input"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Validity & Terms */}
                        <div className="epr-section">
                            <h2 className="epr-section-title">Validity & Terms</h2>
                            <div className="epr-form-grid">
                                <div className="epr-form-group">
                                    <label className="epr-label">Start Date</label>
                                    <input 
                                        type="date" 
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        className="epr-input"
                                    />
                                </div>

                                <div className="epr-form-group">
                                    <label className="epr-label">Expiration Date *</label>
                                    <input 
                                        type="date" 
                                        name="validUntil"
                                        value={formData.validUntil}
                                        onChange={handleChange}
                                        required
                                        className="epr-input"
                                    />
                                </div>

                                <div className="epr-form-group epr-form-group--full">
                                    <label className="epr-label">Description / Terms</label>
                                    <textarea 
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        className="epr-textarea"
                                        rows="4"
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        <div className="epr-form-actions">
                            <button 
                                type="button" 
                                className="epr-btn epr-btn--cancel" 
                                onClick={() => navigate('/view-promos')}
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="epr-btn epr-btn--submit" 
                                disabled={submitting}
                            >
                                {submitting ? 'Saving...' : <><Save size={18} /> Update Promo</>}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default EditPromo;
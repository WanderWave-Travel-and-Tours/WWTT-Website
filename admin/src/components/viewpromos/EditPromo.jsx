import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Tag, Calendar, Percent, DollarSign, FileText } from 'lucide-react';
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
        description: ''
    });

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    // Helper to format date for input type="date" (YYYY-MM-DD)
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
                    description: data.description || ''
                });
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await fetch(`https://wanderwaveph-backend.onrender.com/api/promos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
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
            <Sidebar 
                isCollapsed={isSidebarCollapsed} 
                toggleSidebar={toggleSidebar} 
            />
            
            <main className={`epr-main ${isSidebarCollapsed ? "epr-main--collapsed" : ""}`}>
                <div className="epr-container">
                    
                    {/* Header - Matches EditTour UI */}
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

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="epr-form">
                        
                        {/* Section 1: Basic Information */}
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
                                        placeholder="e.g. SUMMER2024"
                                    />
                                </div>

                                <div className="epr-form-group">
                                    <label className="epr-label">Category *</label>
                                    <select 
                                        name="category" 
                                        value={formData.category} 
                                        onChange={handleChange}
                                        className="epr-select"
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        <option value="Flight">Flight</option>
                                        <option value="Hotel">Hotel</option>
                                        <option value="Tour">Tour</option>
                                        <option value="General">General</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Discount Configuration */}
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
                                        <label className={`epr-radio-label ${formData.discountType === 'Fixed Amount' ? 'active' : ''}`}>
                                            <input 
                                                type="radio" 
                                                name="discountType" 
                                                value="Fixed Amount"
                                                checked={formData.discountType === 'Fixed Amount'}
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
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Validity & Description */}
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
                                        placeholder="Enter terms and conditions or internal notes..."
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
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
                                {submitting ? (
                                    'Saving...' 
                                ) : (
                                    <>
                                        <Save size={18} /> Update Promo
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

export default EditPromo;
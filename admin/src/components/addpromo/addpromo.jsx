import React, { useState, useEffect } from 'react';
import './addpromo.css';
import Sidebar from '../sidebar/sidebar';
import { Upload, X } from 'lucide-react'; 

// ✅ Imports for Draft Functionality
import useAutoDraft from '../../hooks/useAutoDraft';
import RestoreDraftModal from '../../components/RestoreDraftModal/RestoreDraftModal';

const AddPromo = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const [promoDetails, setPromoDetails] = useState({
        code: '',
        discount: '',
        validUntil: '',
        description: '',
        category: '',
        discountType: 'Fixed Amount (Peso)',
        discountValue: '',
        durationType: 'Weekly',
        startDate: '',
        usageLimit: ''
    });

    // Image State
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOtherCategory, setIsOtherCategory] = useState(false);

    // =========================================================
    // ✅ AUTO-DRAFT LOGIC START
    // =========================================================

    // 1. Helper: File <-> Base64 Converters
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const base64ToFile = async (base64String, fileName, mimeType) => {
        const res = await fetch(base64String);
        const blob = await res.blob();
        return new File([blob], fileName, { type: mimeType });
    };

    // 2. Draft Payload State
    const [draftPayload, setDraftPayload] = useState(null);

    // 3. Listen to state changes and update Draft Payload
    useEffect(() => {
        const updateDraft = async () => {
            // 🛑 FIX: Check if form is completely empty/default before saving
            const isFormEmpty = 
                !promoDetails.code &&
                !promoDetails.description &&
                !promoDetails.category &&
                !promoDetails.discountValue &&
                !promoDetails.startDate &&
                !promoDetails.usageLimit &&
                promoDetails.durationType === 'Weekly' && // Default
                !imageFile;

            if (isFormEmpty) {
                setDraftPayload(null); // Do not save anything
                return;
            }

            let imageBase64 = null;
            let imageMeta = null;

            // Handle Image Conversion
            if (imageFile) {
                try {
                    // Limit draft image size (~3MB limit safety)
                    if (imageFile.size < 3 * 1024 * 1024) { 
                        imageBase64 = await fileToBase64(imageFile);
                        imageMeta = { name: imageFile.name, type: imageFile.type };
                    }
                } catch (err) {
                    console.warn("Image too large for draft, saving text only.");
                }
            }

            setDraftPayload({
                ...promoDetails,
                isOtherCategory, // Save this UI state too
                image: imageBase64, // Saved as Base64 string
                imageMeta: imageMeta
            });
        };

        const timeoutId = setTimeout(() => {
            updateDraft();
        }, 500); // Debounce

        return () => clearTimeout(timeoutId);
    }, [promoDetails, isOtherCategory, imageFile]);

    // 4. Restore Function
    const restoreDraftData = async (data) => {
        if (!data) return;

        // Restore Promo Details
        setPromoDetails({
            code: data.code || '',
            discount: data.discount || '',
            validUntil: data.validUntil || '',
            description: data.description || '',
            category: data.category || '',
            discountType: data.discountType || 'Fixed Amount (Peso)',
            discountValue: data.discountValue || '',
            durationType: data.durationType || 'Weekly',
            startDate: data.startDate || '',
            usageLimit: data.usageLimit || ''
        });

        setIsOtherCategory(!!data.isOtherCategory);

        // Restore Image
        if (data.image && data.imageMeta) {
            try {
                const restoredFile = await base64ToFile(data.image, data.imageMeta.name, data.imageMeta.type);
                setImageFile(restoredFile);
                setImagePreview(URL.createObjectURL(restoredFile));
            } catch (err) {
                console.error("Failed to restore image:", err);
            }
        }
    };

    // 5. Initialize Hook
    const { 
        clearDraft, 
        hasDraft, 
        restoreDraft, 
        discardDraft,
        draftInfo 
    } = useAutoDraft({
        module: 'add-promo', // Unique ID
        formData: draftPayload,
        setFormData: restoreDraftData,
        imagePreview: imagePreview, 
        autoRestore: false // Manual via modal
    });

    // 6. Modal State
    const [showRestoreModal, setShowRestoreModal] = useState(false);

    useEffect(() => {
        if (hasDraft) {
            setShowRestoreModal(true);
        }
    }, [hasDraft]);

    const handleRestoreDraft = () => {
        restoreDraft();
        setShowRestoreModal(false);
    };

    const handleDiscardDraft = async () => {
        await discardDraft(); // Ensure storage is cleared
        setShowRestoreModal(false);
    };

    // =========================================================
    // ✅ AUTO-DRAFT LOGIC END
    // =========================================================

    useEffect(() => {
        if (promoDetails.startDate && promoDetails.durationType) {
            const start = new Date(promoDetails.startDate);
            let endDate = new Date(start);

            switch (promoDetails.durationType) {
                case 'Weekly':
                    endDate.setDate(start.getDate() + 7);
                    break;
                case 'Monthly':
                    endDate.setMonth(start.getMonth() + 1);
                    break;
                case 'Yearly':
                    endDate.setFullYear(start.getFullYear() + 1);
                    break;
                default:
                    break;
            }

            if (!isNaN(endDate.getTime())) {
                const formattedDate = endDate.toISOString().split('T')[0];
                setPromoDetails(prev => ({
                    ...prev,
                    validUntil: formattedDate
                }));
            }
        }
    }, [promoDetails.startDate, promoDetails.durationType]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPromoDetails(prevDetails => ({
            ...prevDetails,
            [name]: value
        }));
    };

    const handleCategorySelect = (e) => {
        const value = e.target.value;
        if (value === 'Other') {
            setIsOtherCategory(true);
            setPromoDetails(prev => ({ ...prev, category: '' }));
        } else {
            setIsOtherCategory(false);
            setPromoDetails(prev => ({ ...prev, category: value }));
        }
    };

    // Handle Image Selection
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const handleSubmit = async () => {
        if (!promoDetails.code || !promoDetails.description || !promoDetails.category || 
            !promoDetails.discountValue || !promoDetails.startDate || !promoDetails.usageLimit) {
            alert('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('code', promoDetails.code);
            formData.append('description', promoDetails.description);
            formData.append('category', promoDetails.category);
            formData.append('discountType', promoDetails.discountType);
            formData.append('discountValue', promoDetails.discountValue);
            formData.append('durationType', promoDetails.durationType);
            formData.append('startDate', promoDetails.startDate);
            formData.append('validUntil', promoDetails.validUntil);
            formData.append('usageLimit', promoDetails.usageLimit);

            // ✅ REMOVED: existingImagePublicId (not needed for ADD)
            
            if (imageFile) {
                formData.append('image', imageFile);
            }

            // User Data for Logs
            const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
            const activeUser = adminData.email || adminData.username || adminData.user || 'Unknown User';
            const activeId = adminData.id || adminData._id || "";

            formData.append("userEmail", activeUser);
            formData.append("adminId", activeId);

            // ✅ FIXED: Changed to localhost
            const response = await fetch('http://localhost:5000/api/promos/add', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                alert(`✅ Promo Code ${promoDetails.code} added successfully!`);
                
                // ✅ CLEAR DRAFT ON SUCCESS
                await clearDraft();

                // Reset Form
                setPromoDetails({
                    code: '',
                    discount: '',
                    validUntil: '',
                    description: '',
                    category: '',
                    discountType: 'Fixed Amount (Peso)',
                    discountValue: '',
                    durationType: 'Weekly',
                    startDate: '',
                    usageLimit: '' 
                });
                setImageFile(null);
                setImagePreview(null);
                setIsOtherCategory(false);
            } else {
                alert(`❌ Error adding promo: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('❌ Network Error:', error);
            alert('Failed to connect to the server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = async () => {
        if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
            // ✅ CLEAR DRAFT ON CANCEL
            await clearDraft();

            setPromoDetails({
                code: '',
                discount: '',
                validUntil: '',
                description: '',
                category: '',
                discountType: 'Fixed Amount (Peso)',
                discountValue: '',
                durationType: 'Weekly',
                startDate: '',
                usageLimit: ''
            });
            setImageFile(null);
            setImagePreview(null);
            setIsOtherCategory(false);
        }
    };

    return (
        <div className="promo-page">
            
            {/* ✅ RESTORE DRAFT MODAL */}
            <RestoreDraftModal
                isOpen={showRestoreModal}
                onRestore={handleRestoreDraft}
                onDiscard={handleDiscardDraft}
                draftInfo={draftInfo}
            />

            <Sidebar 
                isCollapsed={isSidebarCollapsed} 
                toggleSidebar={toggleSidebar} 
            />
            <main className={`promo-main ${isSidebarCollapsed ? "promo-main--collapsed" : ""}`}>
                <div className="promo-container">
                    <header className="promo-header">
                        <div className="promo-header-content">
                            <h1 className="promo-title">PROMO CODE</h1>
                            <p className="promo-subtitle">Create a new promotional code for your packages</p>
                        </div>
                    </header>

                    <div className="promo-grid">
                        <div className="promo-left">
                            <section className="promo-section">
                                <h2 className="promo-section-title">PROMO DETAILS</h2>
                                <div className="promo-fields">
                                    
                                    {/* IMAGE UPLOAD FIELD */}
                                    <div className="promo-field promo-field--full">
                                        <label>Promo Image (Optional)</label>
                                        <div style={{ border: '2px dashed #e2e8f0', borderRadius: '8px', padding: '20px', textAlign: 'center', background: '#f8fafc' }}>
                                            {imagePreview ? (
                                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                                    <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} />
                                                    <button 
                                                        onClick={removeImage}
                                                        type="button"
                                                        style={{
                                                            position: 'absolute', top: '-10px', right: '-10px',
                                                            background: 'red', color: 'white', border: 'none',
                                                            borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer',
                                                            zIndex: 10
                                                        }}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        onChange={handleImageChange}
                                                        id="promo-image-upload"
                                                        style={{ display: 'none' }}
                                                    />
                                                    <label htmlFor="promo-image-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#64748b', pointerEvents: 'auto' }}>
                                                        <Upload size={24} />
                                                        <span>Click to Upload Image</span>
                                                    </label>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="promo-field promo-field--full">
                                        <label>Promo Code Name</label>
                                        <input
                                            type="text"
                                            name="code"
                                            value={promoDetails.code}
                                            onChange={handleChange}
                                            placeholder="e.g., SUMMER2025"
                                            style={{ textTransform: 'uppercase', letterSpacing: '1px' }}
                                        />
                                    </div>

                                    <div className="promo-field promo-field--full">
                                        <label>Description</label>
                                        <textarea
                                            name="description"
                                            value={promoDetails.description}
                                            onChange={handleChange}
                                            placeholder="Briefly describe the promo's terms and conditions"
                                            rows="4"
                                        ></textarea>
                                    </div>

                                    <div className="promo-field promo-field--full">
                                        <label>Apply to Category</label>
                                        <select
                                            name="categorySelect"
                                            value={isOtherCategory ? 'Other' : promoDetails.category}
                                            onChange={handleCategorySelect}
                                        >
                                            <option value="" disabled>Select Category</option>
                                            <option value="Barkada">Barkada Package</option>
                                            <option value="Tour Only">Tour Only</option>
                                            <option value="Package (Land)">Package (Land)</option>
                                            <option value="Full Package (Airfare)">Full Package (Airfare)</option>
                                            <option value="Other" style={{fontWeight: 'bold', color: '#FF8C42'}}>+ Other (Custom)</option>
                                        </select>

                                        {isOtherCategory && (
                                            <input
                                                type="text"
                                                name="category"
                                                value={promoDetails.category}
                                                onChange={handleChange}
                                                placeholder="Type your custom category here..."
                                                className="promo-input-custom"
                                                autoFocus
                                            />
                                        )}
                                    </div>

                                    <div className="promo-field">
                                        <label>Discount Type</label>
                                        <select
                                            name="discountType"
                                            value={promoDetails.discountType}
                                            onChange={handleChange}
                                        >
                                            <option value="Fixed Amount (Peso)">Fixed Amount (Peso)</option>
                                            <option value="Percentage">Percentage (%)</option>
                                        </select>
                                    </div>

                                    <div className="promo-field">
                                        <label>Discount Value</label>
                                        <input
                                            type="number"
                                            name="discountValue"
                                            value={promoDetails.discountValue}
                                            onChange={handleChange}
                                            placeholder={promoDetails.discountType === 'Percentage' ? 'Enter %' : 'Enter amount'}
                                            min="1"
                                            max={promoDetails.discountType === 'Percentage' ? '100' : undefined}
                                        />
                                    </div>

                                    <div className="promo-field">
                                        <label>Usage Limit</label>
                                        <input
                                            type="number"
                                            name="usageLimit"
                                            value={promoDetails.usageLimit}
                                            onChange={handleChange}
                                            placeholder="Leave empty for unlimited"
                                            min="1"
                                        />
                                        <small style={{fontSize: '11px', color: '#64748b', marginTop: '4px'}}>
                                            Maximum number of users who can avail this promo
                                        </small>
                                    </div>

                                    <div className="promo-field">
                                        <label>Duration Type</label>
                                        <select
                                            name="durationType"
                                            value={promoDetails.durationType}
                                            onChange={handleChange}
                                        >
                                            <option value="Weekly">Weekly (7 Days)</option>
                                            <option value="Monthly">Monthly (1 Month)</option>
                                            <option value="Yearly">Yearly (1 Year)</option>
                                        </select>
                                    </div>

                                    <div className="promo-field">
                                        <label>Start Date</label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            value={promoDetails.startDate}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="promo-field">
                                        <label>End Date (Auto-Calculated)</label>
                                        <input
                                            type="date"
                                            name="validUntil"
                                            value={promoDetails.validUntil}
                                            readOnly
                                            style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                                        />
                                    </div>
                                </div>
                            </section>
                        </div>

                        <aside className="promo-right">
                            <div className="promo-preview">
                                <span className="promo-preview-label">PREVIEW</span>
                                {/* Preview Card */}
                                <div className="promo-card">
                                    {/* Image Preview inside card if available */}
                                    {imagePreview && (
                                        <div style={{ height: '140px', overflow: 'hidden' }}>
                                            <img src={imagePreview} alt="Promo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    )}
                                    
                                    <div className="promo-card-header" style={imagePreview ? { paddingTop: '10px', paddingBottom: '10px' } : {}}>
                                        <div className="promo-card-icon">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" strokeLinecap="round" strokeLinejoin="round"/>
                                                <line x1="7" y1="7" x2="7.01" y2="7" strokeLinecap="round"/>
                                            </svg>
                                        </div>
                                        <span className="promo-card-discount">
                                            {promoDetails.discountValue ? (
                                                promoDetails.discountType === 'Percentage' 
                                                    ? `${promoDetails.discountValue}%` 
                                                    : `₱${promoDetails.discountValue}`
                                            ) : '--'}
                                        </span>
                                    </div>
                                    <div className="promo-card-body">
                                        <span className="promo-card-code">
                                            {promoDetails.code || 'PROMOCODE'}
                                        </span>
                                        {promoDetails.category && (
                                            <div className="promo-card-category">
                                                {promoDetails.category}
                                            </div>
                                        )}
                                        <p className="promo-card-desc">
                                            {promoDetails.description || 'Promo description will appear here'}
                                        </p>
                                        <div className="promo-card-validity">
                                            <span>
                                                Valid: {promoDetails.startDate || '--'} to {promoDetails.validUntil || '--'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* BUTTONS ACTION */}
                                <div className="promo-actions">
                                    <button 
                                        type="button" 
                                        className="promo-btn promo-btn--cancel" 
                                        onClick={handleCancel}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="button" 
                                        className="promo-btn promo-btn--submit"
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Creating...' : 'Create'}
                                    </button>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AddPromo;
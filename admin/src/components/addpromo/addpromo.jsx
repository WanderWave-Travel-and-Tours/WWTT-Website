import React, { useState, useEffect } from 'react';
import './addpromo.css';
import Sidebar from '../sidebar/sidebar';
import { Upload, X } from 'lucide-react'; 

// ✅ Imports for Draft Functionality
import useAutoDraft from '../../hooks/useAutoDraft';
import RestoreDraftModal from '../../components/RestoreDraftModal/RestoreDraftModal';

// ✅ Imports for Toast and Reference logic
import { useToast } from "../toast/ToastManager";

// ✅ Import Custom Confirmation Modal (Following EditVisa.jsx pattern)
import CustomConfirmModal from "../../components/confirmationModal/CustomConfirmModal";

const AddPromo = () => {
    const toast = useToast();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    
    // ✅ Confirmation Modal State Config
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => {},
        type: "primary"
    });

    // ✅ Helper function to trigger the custom confirmation modal
    const askConfirmation = (title, message, onConfirm, type = "primary") => {
        setConfirmConfig({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                onConfirm();
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
            },
            type
        });
    };

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

    // ✅ NEW: Target Packages State
    const [packageSearch, setPackageSearch] = useState('');
    const [packageResults, setPackageResults] = useState([]);
    const [selectedPackages, setSelectedPackages] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showPackageDropdown, setShowPackageDropdown] = useState(false);

    // ✅ NEW: Search packages function
    const searchPackages = async (searchTerm) => {
        if (!searchTerm.trim()) {
            setPackageResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(`https://wanderwaveph-backend.onrender.com/api/promos/search-packages?search=${encodeURIComponent(searchTerm)}`);
            if (response.ok) {
                const data = await response.json();
                // Filter out already selected packages
                const filteredData = data.filter(
                    pkg => !selectedPackages.find(selected => selected._id === pkg._id)
                );
                setPackageResults(filteredData);
            }
        } catch (error) {
            console.error('Error searching packages:', error);
            toast.error('Failed to search packages');
        } finally {
            setIsSearching(false);
        }
    };

    // ✅ NEW: Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (packageSearch) {
                searchPackages(packageSearch);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [packageSearch]);

    // ✅ NEW: Add package to selected list
    const handleSelectPackage = (pkg) => {
        if (!selectedPackages.find(p => p._id === pkg._id)) {
            setSelectedPackages([...selectedPackages, pkg]);
            setPackageSearch('');
            setPackageResults([]);
            setShowPackageDropdown(false);
        }
    };

    // ✅ NEW: Remove package from selected list
    const handleRemovePackage = (pkgId) => {
        setSelectedPackages(selectedPackages.filter(p => p._id !== pkgId));
    };

    // ✅ NEW: Click outside handler to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.package-search-container')) {
                setShowPackageDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // =========================================================
    // ✅ AUTO-DRAFT LOGIC START
    // =========================================================

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

    const [draftPayload, setDraftPayload] = useState(null);

    useEffect(() => {
        const updateDraft = async () => {
            const isFormEmpty = 
                !promoDetails.code &&
                !promoDetails.description &&
                !promoDetails.category &&
                !promoDetails.discountValue &&
                !promoDetails.startDate &&
                !promoDetails.usageLimit &&
                promoDetails.durationType === 'Weekly' && 
                selectedPackages.length === 0 &&
                !imageFile;

            if (isFormEmpty) {
                setDraftPayload(null); 
                return;
            }

            let imageBase64 = null;
            let imageMeta = null;

            if (imageFile) {
                try {
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
                isOtherCategory,
                selectedPackages, // ✅ Include selected packages in draft
                image: imageBase64, 
                imageMeta: imageMeta
            });
        };

        const timeoutId = setTimeout(() => {
            updateDraft();
        }, 500); 

        return () => clearTimeout(timeoutId);
    }, [promoDetails, isOtherCategory, selectedPackages, imageFile]);

    const restoreDraftData = async (data) => {
        if (!data) return;

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

        // ✅ Restore selected packages
        if (data.selectedPackages && Array.isArray(data.selectedPackages)) {
            setSelectedPackages(data.selectedPackages);
        }

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

    const { 
        clearDraft, 
        hasDraft, 
        restoreDraft, 
        discardDraft,
        draftInfo 
    } = useAutoDraft({
        draftKey: 'addPromo',
        data: draftPayload,
        onRestore: restoreDraftData
    });

    // =========================================================
    // ✅ AUTO-DRAFT LOGIC END
    // =========================================================

    useEffect(() => {
        if (promoDetails.startDate && promoDetails.durationType) {
            const startDate = new Date(promoDetails.startDate);
            let endDate;

            switch (promoDetails.durationType) {
                case 'Weekly':
                    endDate = new Date(startDate);
                    endDate.setDate(startDate.getDate() + 7);
                    break;
                case 'Monthly':
                    endDate = new Date(startDate);
                    endDate.setMonth(startDate.getMonth() + 1);
                    break;
                case 'Yearly':
                    endDate = new Date(startDate);
                    endDate.setFullYear(startDate.getFullYear() + 1);
                    break;
                default:
                    endDate = startDate;
            }

            const formattedEndDate = endDate.toISOString().split('T')[0];
            setPromoDetails(prev => ({ ...prev, validUntil: formattedEndDate }));
        }
    }, [promoDetails.startDate, promoDetails.durationType]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'category') {
            if (value === 'Other') {
                setIsOtherCategory(true);
                setPromoDetails(prev => ({ ...prev, category: '' }));
                return;
            } else {
                setIsOtherCategory(false);
            }
        }

        if (name === 'discountValue') {
            const numValue = Number(value);
            if (promoDetails.discountType === 'Percentage' && numValue > 100) {
                return;
            }
        }

        setPromoDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size must be less than 5MB');
                return;
            }

            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        document.getElementById('promo-image-upload').value = '';
    };

    const handleCancel = () => {
        askConfirmation(
            "Cancel Promo Creation?",
            "All your progress will be lost. This action cannot be undone.",
            () => {
                clearDraft();
                window.location.href = '/promo';
            },
            "danger"
        );
    };

    const handleSubmit = async () => {
        if (!promoDetails.code) {
            toast.error('Promo code is required');
            return;
        }

        if (!promoDetails.description) {
            toast.error('Description is required');
            return;
        }

        if (!promoDetails.category) {
            toast.error('Category is required');
            return;
        }

        if (!promoDetails.discountValue || promoDetails.discountValue <= 0) {
            toast.error('Discount value must be greater than 0');
            return;
        }

        if (!promoDetails.startDate) {
            toast.error('Start date is required');
            return;
        }

        if (!promoDetails.usageLimit || promoDetails.usageLimit <= 0) {
            toast.error('Usage limit must be greater than 0');
            return;
        }

        if (!imageFile) {
            toast.error('Promo image is required');
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('code', promoDetails.code.toUpperCase());
            formData.append('description', promoDetails.description);
            formData.append('category', promoDetails.category);
            formData.append('discountType', promoDetails.discountType);
            formData.append('discountValue', promoDetails.discountValue);
            formData.append('durationType', promoDetails.durationType);
            formData.append('startDate', promoDetails.startDate);
            formData.append('validUntil', promoDetails.validUntil);
            formData.append('usageLimit', promoDetails.usageLimit);
            formData.append('image', imageFile);

            // ✅ Add target packages as JSON string
            formData.append('targetPackages', JSON.stringify(selectedPackages.map(pkg => pkg._id)));

            const adminData = JSON.parse(localStorage.getItem('adminData'));
            if (adminData) {
                formData.append('userEmail', adminData.email || '');
                formData.append('adminId', adminData.id || '');
            }

            const response = await fetch('https://wanderwaveph-backend.onrender.com/api/promos/add', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok && data.status === 'ok') {
                clearDraft();
                toast.success('Promo created successfully!');
                setTimeout(() => {
                    window.location.href = '/add-promo';
                }, 1500);
            } else {
                toast.error(data.message || 'Failed to create promo');
            }
        } catch (error) {
            console.error('Error creating promo:', error);
            toast.error('An error occurred while creating the promo');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="promo-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            
            {/* ✅ Draft Restore Modal */}
            {hasDraft && (
                <RestoreDraftModal
                    draftInfo={draftInfo}
                    onRestore={restoreDraft}
                    onDiscard={discardDraft}
                />
            )}

            {/* ✅ Custom Confirmation Modal */}
            <CustomConfirmModal
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                type={confirmConfig.type}
            />

            <main className={`promo-main ${isSidebarCollapsed ? 'promo-main--collapsed' : ''}`}>
                <div className="promo-container">
                    <header className="promo-header">
                        <div className="promo-header-content">
                            <h1 className="promo-title">Add New Promo</h1>
                            <p className="promo-subtitle">Create promotional codes for your packages</p>
                        </div>
                    </header>

                    <div className="promo-grid">
                        <div className="promo-left">
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

                            <section className="promo-section">
                                <h2 className="promo-section-title">Promo Details</h2>
                                <div className="promo-fields">
                                    <div className="promo-field promo-field--full">
                                        <label>Promo Code Name</label>
                                        <input
                                            type="text"
                                            name="code"
                                            value={promoDetails.code}
                                            onChange={handleChange}
                                            placeholder="e.g., SUMMER2025"
                                            maxLength="20"
                                            style={{ textTransform: 'uppercase' }}
                                        />
                                    </div>

                                    {/* ✅ NEW: Target Packages Field */}
                                    <div className="promo-field promo-field--full">
                                        <label>Target Packages (Optional)</label>
                                        <div className="package-search-container">
                                            <input
                                                type="text"
                                                value={packageSearch}
                                                onChange={(e) => {
                                                    setPackageSearch(e.target.value);
                                                    setShowPackageDropdown(true);
                                                }}
                                                onFocus={() => setShowPackageDropdown(true)}
                                                placeholder="Search packages by title or destination..."
                                                className="package-search-input"
                                            />
                                            
                                            {showPackageDropdown && packageSearch && (
                                                <div className="package-dropdown">
                                                    {isSearching ? (
                                                        <div className="package-dropdown-item package-dropdown-loading">
                                                            Searching...
                                                        </div>
                                                    ) : packageResults.length > 0 ? (
                                                        packageResults.map(pkg => (
                                                            <div
                                                                key={pkg._id}
                                                                className="package-dropdown-item"
                                                                onClick={() => handleSelectPackage(pkg)}
                                                            >
                                                                <div className="package-item-title">{pkg.title}</div>
                                                                <div className="package-item-meta">
                                                                    {pkg.destination} • {pkg.category} • ₱{pkg.price?.toLocaleString()}
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="package-dropdown-item package-dropdown-empty">
                                                            No packages found
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* ✅ Selected Packages Display */}
                                        {selectedPackages.length > 0 && (
                                            <div className="selected-packages">
                                                {selectedPackages.map(pkg => (
                                                    <div key={pkg._id} className="package-chip">
                                                        <span className="package-chip-text">{pkg.title}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemovePackage(pkg._id)}
                                                            className="package-chip-remove"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <small style={{fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block'}}>
                                            Leave empty to apply promo to all packages, or select specific packages
                                        </small>
                                    </div>

                                    <div className="promo-field promo-field--full">
                                        <label>Description</label>
                                        <textarea
                                            name="description"
                                            value={promoDetails.description}
                                            onChange={handleChange}
                                            placeholder="e.g., Get 20% off on all summer packages"
                                            rows="3"
                                        />
                                    </div>

                                    <div className="promo-field">
                                        <label>Category</label>
                                        <select
                                            name="category"
                                            value={isOtherCategory ? 'Other' : promoDetails.category}
                                            onChange={handleChange}
                                        >
                                            <option value="">Select Category</option>
                                            <option value="Barkada">Barkada</option>
                                            <option value="Tour">Tour Only</option>
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
                                <div className="promo-card">
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
                                        
                                        {/* ✅ Show targeted packages count in preview */}
                                        {selectedPackages.length > 0 && (
                                            <div style={{
                                                fontSize: '11px',
                                                color: '#FF8C42',
                                                background: 'rgba(255, 140, 66, 0.1)',
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                marginBottom: '12px',
                                                fontWeight: '600'
                                            }}>
                                                📦 Valid for {selectedPackages.length} selected package{selectedPackages.length > 1 ? 's' : ''}
                                            </div>
                                        )}
                                        
                                        <div className="promo-card-validity">
                                            <span>
                                                Valid: {promoDetails.startDate || '--'} to {promoDetails.validUntil || '--'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

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
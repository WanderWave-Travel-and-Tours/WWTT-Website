import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Upload, X } from 'lucide-react';
import Sidebar from '../sidebar/sidebar'; 
import './EditPromo.css'; 

// ✅ Imports for Draft Functionality
import useAutoDraft from '../../hooks/useAutoDraft';
import RestoreDraftModal from '../../components/RestoreDraftModal/RestoreDraftModal';

// 🔥 HELPER FUNCTION - GET ADMIN DATA (Activity Logs) 🔥
const getAdminData = () => {
    try {
        const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
        return {
            userEmail: adminData.email || adminData.username || 'Unknown Admin',
            adminId: adminData._id || adminData.id || null
        };
    } catch (error) {
        console.error('❌ Error getting admin data:', error);
        return { userEmail: 'Unknown Admin', adminId: null };
    }
};

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
        // ✅ UPDATED: Replaced discountValue with localPrice and internationalPrice
        localPrice: '',
        internationalPrice: '',
        startDate: '',
        validUntil: '',
        description: '',
        durationType: 'Weekly' // Default
    });

    // ✅ Store original data to track changes for Activity Logs
    const [originalData, setOriginalData] = useState(null);

    // Image Handling
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [currentImage, setCurrentImage] = useState(null);
    
    // ✅ Store original image public ID for deletion
    const [existingImagePublicId, setExistingImagePublicId] = useState('');

    // ✅ NEW: Target Packages State
    const [packageSearch, setPackageSearch] = useState('');
    const [packageResults, setPackageResults] = useState([]);
    const [selectedPackages, setSelectedPackages] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showPackageDropdown, setShowPackageDropdown] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    // ✅ NEW: Search packages function
    const searchPackages = async (searchTerm) => {
        if (!searchTerm.trim()) {
            setPackageResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(`/api/promos/search-packages?search=${encodeURIComponent(searchTerm)}`);
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
    }, [packageSearch, selectedPackages]);

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
            if (isLoading) {
                setDraftPayload(null);
                return;
            }

            // ✅ UPDATED: Check localPrice and internationalPrice instead of discountValue
            const isFormEmpty = 
                !formData.code && 
                !formData.category && 
                !formData.localPrice && 
                !formData.internationalPrice && 
                !formData.startDate && 
                !formData.validUntil && 
                !formData.description && 
                !imageFile &&
                selectedPackages.length === 0;

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
                ...formData,
                image: imageBase64,
                imageMeta: imageMeta,
                selectedPackages: selectedPackages,
                originalId: id
            });
        };

        const timeoutId = setTimeout(() => {
            updateDraft();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [formData, imageFile, selectedPackages, isLoading, id]);

    const restoreDraftData = async (data) => {
        if (!data) return;
        
        if (data.originalId && data.originalId !== id) {
            console.warn("Draft found but belongs to a different promo ID. Ignoring.");
            return;
        }

        // ✅ UPDATED: Restore localPrice and internationalPrice from draft
        setFormData({
            code: data.code || '',
            category: data.category || '',
            discountType: data.discountType || 'Percentage',
            localPrice: data.localPrice || '',
            internationalPrice: data.internationalPrice || '',
            startDate: data.startDate || '',
            validUntil: data.validUntil || '',
            description: data.description || '',
            durationType: data.durationType || 'Weekly'
        });

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
        module: `edit-promo-${id}`,
        formData: draftPayload,
        setFormData: restoreDraftData,
        imagePreview: imagePreview, 
        setImagePreview: setImagePreview 
    });

    // =========================================================
    // ✅ AUTO-DRAFT LOGIC END
    // =========================================================

    useEffect(() => {
        fetchPromoData();
    }, [id]);

    const fetchPromoData = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/promos/${id}`);
            if (response.ok) {
                const data = await response.json();
                
                // ✅ FIXED: Correctly map nested pricing sub-document from backend
                // Backend stores: { pricing: { local: Number, international: Number } }
                const localPrice = data.pricing?.local !== undefined && data.pricing?.local !== null
                    ? data.pricing.local
                    : (data.localPrice ?? '');
                const internationalPrice = data.pricing?.international !== undefined && data.pricing?.international !== null
                    ? data.pricing.international
                    : (data.internationalPrice ?? '');

                const formattedData = {
                    code: data.code || '',
                    category: data.category || '',
                    discountType: data.discountType || 'Percentage',
                    localPrice: String(localPrice),
                    internationalPrice: String(internationalPrice),
                    startDate: formatDateForInput(data.startDate),
                    validUntil: formatDateForInput(data.validUntil),
                    description: data.description || '',
                    durationType: data.durationType || 'Weekly'
                };

                setFormData(formattedData);
                setOriginalData(formattedData);

                // ✅ Set selected packages if they exist
                if (data.targetPackages && Array.isArray(data.targetPackages)) {
                    setSelectedPackages(data.targetPackages);
                }

                if (data.image) {
                    setCurrentImage(data.image);
                }

                if (data.imagePublicId) {
                    setExistingImagePublicId(data.imagePublicId);
                }
            }
        } catch (error) {
            console.error('Error fetching promo:', error);
            alert('Failed to load promo data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // ✅ Validate localPrice and internationalPrice for Percentage cap
        if (name === 'localPrice' || name === 'internationalPrice') {
            const numValue = Number(value);
            if (formData.discountType === 'Percentage' && numValue > 100) {
                return;
            }
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

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
        setCurrentImage(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // ✅ UPDATED: At least one of localPrice or internationalPrice is required (not both)
        if (!formData.code || !formData.category) {
            alert('Please fill in all required fields (Code, Category)');
            return;
        }

        if (!formData.localPrice && !formData.internationalPrice) {
            alert('Please enter at least one price — Local Price or International Price.');
            return;
        }

        if (formData.localPrice && Number(formData.localPrice) <= 0) {
            alert('Local price must be greater than 0');
            return;
        }

        if (formData.internationalPrice && Number(formData.internationalPrice) <= 0) {
            alert('International price must be greater than 0');
            return;
        }

        setSubmitting(true);

        try {
            const formDataToSend = new FormData();
            
            Object.keys(formData).forEach(key => {
                formDataToSend.append(key, formData[key]);
            });

            if (imageFile) {
                formDataToSend.append('image', imageFile);
            }

            if (existingImagePublicId) {
                formDataToSend.append('existingImagePublicId', existingImagePublicId);
            }

            // ✅ Add target packages as JSON string
            if (selectedPackages.length > 0) {
                const packageIds = selectedPackages.map(pkg => pkg._id);
                formDataToSend.append('targetPackages', JSON.stringify(packageIds));
            } else {
                formDataToSend.append('targetPackages', JSON.stringify([]));
            }

            // ✅ Detect which fields changed (for Activity Logging)
            const changes = [];
            
            if (originalData) {
                Object.keys(formData).forEach(key => {
                    if (formData[key] !== originalData[key]) {
                        changes.push(key);
                    }
                });
            }
            
            if (imageFile) {
                changes.push('image');
            }

            // ✅ Check if target packages changed
            const originalPackageIds = originalData?.targetPackages?.map(p => p._id).sort() || [];
            const currentPackageIds = selectedPackages.map(p => p._id).sort();
            if (JSON.stringify(originalPackageIds) !== JSON.stringify(currentPackageIds)) {
                changes.push('targetPackages');
            }

            if (changes.length > 0) {
                formDataToSend.append('changes', JSON.stringify(changes));
            }

            const { userEmail, adminId } = getAdminData();
            formDataToSend.append('userEmail', userEmail);
            if (adminId) {
                formDataToSend.append('adminId', adminId);
            }

            const response = await fetch(`/api/promos/${id}`, {
                method: 'PUT',
                body: formDataToSend
            });

            if (response.ok) {
                await clearDraft();
                alert('Promo updated successfully!');
                navigate('/view-promos');
            } else {
                const errorData = await response.json();
                alert(`Failed to update promo: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error updating promo:', error);
            alert('An error occurred while updating the promo');
        } finally {
            setSubmitting(false);
        }
    };

    // ✅ NEW: Derived visibility flags for price fields based on fetched data.
    // If only one price type has data, hide the other field entirely.
    // If neither has data (both empty/zero), show both so admin can still fill them in.
    const _hasLocalData = originalData
        ? (originalData.localPrice !== '' && originalData.localPrice !== null && originalData.localPrice !== undefined && Number(originalData.localPrice) > 0)
        : true;
    const _hasIntlData = originalData
        ? (originalData.internationalPrice !== '' && originalData.internationalPrice !== null && originalData.internationalPrice !== undefined && Number(originalData.internationalPrice) > 0)
        : true;
    const _neitherHasData = !_hasLocalData && !_hasIntlData;
    const showLocalField  = _hasLocalData  || _neitherHasData;
    const showIntlField   = _hasIntlData   || _neitherHasData;

    if (isLoading) {
        return (
            <div className="epr-page">
                <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
                <main className={`epr-main ${isSidebarCollapsed ? 'epr-main--collapsed' : ''}`}>
                    <div className="epr-loading">
                        <div className="epr-spinner"></div>
                        <p style={{ marginTop: '16px', color: '#64748b' }}>Loading promo data...</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="epr-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            
            {/* ✅ Restore Draft Modal */}
            <RestoreDraftModal
                isOpen={hasDraft}
                onRestore={restoreDraft}
                onDiscard={discardDraft}
                draftInfo={draftInfo}
            />

            <main className={`epr-main ${isSidebarCollapsed ? 'epr-main--collapsed' : ''}`}>
                <div className="epr-container">
                    <header className="epr-header">
                        <div className="epr-header-content">
                            <button 
                                className="epr-back-btn" 
                                onClick={() => navigate('/view-promos')}
                            >
                                <ArrowLeft size={18} /> Back to Promos
                            </button>
                            <h1 className="epr-title">Edit Promo</h1>
                            <p className="epr-subtitle">Modify promotional voucher details</p>
                        </div>
                    </header>

                    <form onSubmit={handleSubmit} className="epr-form">
                        
                        {/* Image Section */}
                        <div className="epr-section">
                            <h2 className="epr-section-title">Promo Image</h2>

                            <input 
                                type="file" 
                                accept="image/jpeg,image/png,image/webp" 
                                onChange={handleImageChange}
                                id="edit-promo-image"
                                style={{ display: 'none' }}
                            />

                            {(imagePreview || currentImage) ? (
                                /* ── Has image: full-width banner with hover overlay ── */
                                <label htmlFor="edit-promo-image" className="epr-img-banner">
                                    <img
                                        src={imagePreview || currentImage}
                                        alt="Promo"
                                        className="epr-img-banner-img"
                                        onError={(e) => e.target.style.display = 'none'}
                                    />
                                    <div className="epr-img-banner-overlay">
                                        <Upload size={22} />
                                        <span>Click to change image</span>
                                    </div>
                                    {imagePreview && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); removeImage(); }}
                                            className="epr-img-banner-remove"
                                            title="Remove image"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </label>
                            ) : (
                                /* ── No image: upload zone ── */
                                <label htmlFor="edit-promo-image" className="epr-img-upload-zone">
                                    <div className="epr-img-upload-icon-ring">
                                        <Upload size={26} />
                                    </div>
                                    <span className="epr-img-upload-title">Click to Upload Poster</span>
                                    <span className="epr-img-upload-sub">JPG, PNG or WEBP &nbsp;·&nbsp; Max 5MB</span>
                                </label>
                            )}
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

                        {/* ✅ UPDATED: Value & Pricing Section (replaces Value & Discount) */}
                        <div className="epr-section">
                            <h2 className="epr-section-title">Value & Pricing</h2>
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
                                            Percentage (%)
                                        </label>
                                        <label className={`epr-radio-label ${formData.discountType === 'Fixed Amount (Peso)' || formData.discountType === 'Fixed Amount' ? 'active' : ''}`}>
                                            <input 
                                                type="radio" 
                                                name="discountType" 
                                                value="Fixed Amount (Peso)"
                                                checked={formData.discountType === 'Fixed Amount (Peso)' || formData.discountType === 'Fixed Amount'}
                                                onChange={handleChange}
                                            />
                                            Fixed Amount (₱)
                                        </label>
                                    </div>
                                </div>

                                {/* ✅ UPDATED: Local Price field — optional if international is filled */}
                                {showLocalField && (
                                <div className="epr-form-group">
                                    <label className="epr-label">🇵🇭 Local Price <span style={{fontWeight:400, color:'#94a3b8'}}>(optional if intl. is filled)</span></label>
                                    <input 
                                        type="number" 
                                        name="localPrice"
                                        value={formData.localPrice}
                                        onChange={handleChange}
                                        min="0"
                                        className="epr-input"
                                        placeholder={formData.discountType === 'Percentage' ? 'e.g. 10 (max 100)' : 'e.g. 500'}
                                    />
                                </div>
                                )}

                                {/* ✅ UPDATED: International Price field — optional if local is filled */}
                                {showIntlField && (
                                <div className="epr-form-group">
                                    <label className="epr-label">🌐 International Price <span style={{fontWeight:400, color:'#94a3b8'}}>(optional if local is filled)</span></label>
                                    <input 
                                        type="number" 
                                        name="internationalPrice"
                                        value={formData.internationalPrice}
                                        onChange={handleChange}
                                        min="0"
                                        className="epr-input"
                                        placeholder={formData.discountType === 'Percentage' ? 'e.g. 15 (max 100)' : 'e.g. 800'}
                                    />
                                </div>
                                )}
                            </div>
                        </div>

                        {/* ✅ NEW: Target Packages Section */}
                        <div className="epr-section">
                            <h2 className="epr-section-title">Target Packages (Optional)</h2>
                            <div className="epr-form-grid">
                                <div className="epr-form-group epr-form-group--full">
                                    <label className="epr-label">Search & Select Packages</label>
                                    <small style={{fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '8px'}}>
                                        Leave empty to apply promo to all packages
                                    </small>
                                    
                                    <div className="package-search-container">
                                        <input
                                            type="text"
                                            className="package-search-input"
                                            placeholder="Search by package title or destination..."
                                            value={packageSearch}
                                            onChange={(e) => {
                                                setPackageSearch(e.target.value);
                                                setShowPackageDropdown(true);
                                            }}
                                            onFocus={() => setShowPackageDropdown(true)}
                                        />
                                        
                                        {showPackageDropdown && (packageSearch.trim() !== '' || packageResults.length > 0) && (
                                            <div className="package-dropdown">
                                                {isSearching ? (
                                                    <div className="package-dropdown-loading">Searching...</div>
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
                                                ) : packageSearch.trim() !== '' ? (
                                                    <div className="package-dropdown-empty">No packages found</div>
                                                ) : null}
                                            </div>
                                        )}
                                    </div>

                                    {selectedPackages.length > 0 && (
                                        <div className="selected-packages">
                                            {selectedPackages.map(pkg => (
                                                <div key={pkg._id} className="package-chip">
                                                    <span className="package-chip-text">
                                                        {pkg.title} - {pkg.destination}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="package-chip-remove"
                                                        onClick={() => handleRemovePackage(pkg._id)}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
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
                                onClick={async () => {
                                    await clearDraft(); // Clear draft on cancel
                                    navigate('/view-promos');
                                }}
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
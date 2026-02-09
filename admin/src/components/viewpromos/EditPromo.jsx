import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Percent, DollarSign, Upload, X } from 'lucide-react';
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
        discountValue: '',
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
            const response = await fetch(`https://wanderwaveph.onrender.com/api/promos/search-packages?search=${encodeURIComponent(searchTerm)}`);
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

            const isFormEmpty = 
                !formData.code && 
                !formData.category && 
                !formData.discountValue && 
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

        setFormData({
            code: data.code || '',
            category: data.category || '',
            discountType: data.discountType || 'Percentage',
            discountValue: data.discountValue || '',
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
            const response = await fetch(`https://wanderwaveph.onrender.com/api/promos/${id}`);
            if (response.ok) {
                const data = await response.json();
                
                const formattedData = {
                    code: data.code || '',
                    category: data.category || '',
                    discountType: data.discountType || 'Percentage',
                    discountValue: data.discountValue || '',
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
        
        if (!formData.code || !formData.category || !formData.discountValue) {
            alert('Please fill in all required fields');
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

            const response = await fetch(`https://wanderwaveph.onrender.com/api/promos/${id}`, {
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
                            <div className="epr-form-group">
                                <label className="epr-label">Upload New Image (Replaces current)</label>
                                <div style={{ border: '2px dashed #e2e8f0', borderRadius: '10px', padding: '20px', textAlign: 'center', background: '#f8fafc' }}>
                                    {imagePreview ? (
                                        <div style={{ position: 'relative', display: 'inline-block' }}>
                                            <p style={{fontSize: '12px', color:'#64748b', marginBottom: '8px'}}>New Image Selected:</p>
                                            <img src={imagePreview} alt="New Preview" style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                            <button 
                                                type="button"
                                                onClick={removeImage}
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
                                                        src={currentImage} // Assuming Cloudinary URL is stored as full path
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
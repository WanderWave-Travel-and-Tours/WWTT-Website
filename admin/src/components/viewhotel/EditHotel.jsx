import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Upload, Image as ImageIcon, MapPin, DollarSign, Users, X, Plus, HelpCircle } from 'lucide-react';
import Sidebar from '../sidebar/sidebar'; 
import './EditHotel.css';

// ✅ Imports for Draft and Toast Functionality
import useAutoDraft from '../../hooks/useAutoDraft';
import RestoreDraftModal from '../../components/RestoreDraftModal/RestoreDraftModal';
import { useToast } from "../toast/ToastManager"; 

// 🔥 CUSTOM CONFIRM MODAL COMPONENT (Reference from EditVisa)
const CustomConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, type = "primary" }) => {
  if (!isOpen) return null;
  return (
    <div className="arc-confirm-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 11000
    }}>
      <div className="arc-confirm-modal" style={{
        backgroundColor: 'white', padding: '2rem', borderRadius: '12px',
        maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <HelpCircle size={48} color={type === 'danger' ? '#ef4444' : '#3b82f6'} style={{ margin: '0 auto' }} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', color: '#1e293b' }}>{title}</h3>
        <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.5' }}>{message}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button 
            onClick={onCancel}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: '6px', border: '1px solid #e2e8f0',
              backgroundColor: 'white', cursor: 'pointer', fontWeight: '500'
            }}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none',
              backgroundColor: type === 'danger' ? '#ef4444' : '#3b82f6',
              color: 'white', cursor: 'pointer', fontWeight: '500'
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const EditHotel = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast(); // ✅ Initialize Toast

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    
    // State for Destinations list
    const [destinations, setDestinations] = useState([]);

    const API_BASE_URL = 'https://wanderwaveph-backend.onrender.com';

    // ✅ Confirmation Modal State
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => {},
        type: "primary"
    });

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

    // --- HELPER: Image URL Builder ---
    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http') || imagePath.startsWith('data:')) return imagePath;
        
        let cleanPath = imagePath.replace(/\\/g, '/');
        if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);
        
        if (cleanPath.startsWith('uploads/')) return `${API_BASE_URL}/${cleanPath}`;
        return `${API_BASE_URL}/uploads/${cleanPath}`;
    };

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        city: '', 
        country: 'Philippines',
        description: '',
        price: '',
        priceUnit: 'per night',
        maxCapacity: '',
        featured: false
    });

    const [amenities, setAmenities] = useState({
        wifi: false, parking: false, pool: false, gym: false,
        restaurant: false, spa: false, airConditioning: false,
        roomService: false, laundry: false, bar: false
    });

    // 🔥 FIXED: Image States - store original path instead of full URL
    const [mainImageFile, setMainImageFile] = useState(null);
    const [mainImagePreview, setMainImagePreview] = useState("");
    const [existingGallery, setExistingGallery] = useState([]); 
    const [newGalleryFiles, setNewGalleryFiles] = useState([]); 
    const [deletedImages, setDeletedImages] = useState([]);

    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

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
                !formData.name && 
                !formData.location && 
                !formData.city && 
                !formData.price && 
                !formData.maxCapacity && 
                !mainImageFile;

            if (isFormEmpty) {
                setDraftPayload(null);
                return;
            }

            let mainImageBase64 = null;
            let mainImageMeta = null;

            if (mainImageFile) {
                try {
                    if (mainImageFile.size < 3 * 1024 * 1024) { 
                        mainImageBase64 = await fileToBase64(mainImageFile);
                        mainImageMeta = { name: mainImageFile.name, type: mainImageFile.type };
                    }
                } catch (err) {
                    console.warn("Main image too large for draft, saving text only.");
                }
            }

            setDraftPayload({
                ...formData,
                amenities,
                mainImage: mainImageBase64,
                mainImageMeta: mainImageMeta,
                originalId: id 
            });
        };

        const timeoutId = setTimeout(() => {
            updateDraft();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [formData, amenities, mainImageFile, isLoading, id]);

    const restoreDraftData = async (data) => {
        if (!data) return;
        if (data.originalId && data.originalId !== id) {
            console.warn("Draft found but belongs to a different hotel ID. Ignoring.");
            return;
        }

        setFormData({
            name: data.name || '',
            location: data.location || '',
            city: data.city || '',
            country: data.country || 'Philippines',
            description: data.description || '',
            price: data.price || '',
            priceUnit: data.priceUnit || 'per night',
            maxCapacity: data.maxCapacity || '',
            featured: data.featured || false
        });

        if (data.amenities) setAmenities(data.amenities);

        if (data.mainImage && data.mainImageMeta) {
            try {
                const restoredFile = await base64ToFile(data.mainImage, data.mainImageMeta.name, data.mainImageMeta.type);
                setMainImageFile(restoredFile);
                setMainImagePreview(URL.createObjectURL(restoredFile));
            } catch (err) {
                console.error("Failed to restore main image:", err);
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
        module: `edit-hotel-${id}`,
        formData: draftPayload,
        setFormData: restoreDraftData,
        imagePreview: mainImagePreview, 
        autoRestore: false 
    });

    const [showRestoreModal, setShowRestoreModal] = useState(false);

    useEffect(() => {
        if (hasDraft && !isLoading) {
            setShowRestoreModal(true);
        }
    }, [hasDraft, isLoading]);

    const handleRestoreDraft = () => {
        restoreDraft();
        setShowRestoreModal(false);
        toast.info("Draft restored successfully.");
    };

    const handleDiscardDraft = async () => {
        await discardDraft();
        setShowRestoreModal(false);
        toast.info("Draft discarded.");
    };

    // =========================================================
    // ✅ AUTO-DRAFT LOGIC END
    // =========================================================

    // --- FETCH DATA ---
    useEffect(() => {
        const loadData = async () => {
            try {
                const destResponse = await fetch(`${API_BASE_URL}/api/packages/all`);
                const destData = await destResponse.json();
                
                if (destData.status === 'ok' && Array.isArray(destData.data)) {
                    const uniqueDestinations = [...new Set(
                        destData.data.map(pkg => pkg.destination).filter(dest => dest && dest.trim() !== '')
                    )];
                    setDestinations(uniqueDestinations);
                }

                const response = await fetch(`${API_BASE_URL}/api/hotels/${id}`);
                if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
                
                const result = await response.json();
                const data = result.data || result;
                
                setFormData({
                    name: data.name || '',
                    location: data.location || '',
                    city: data.city || '', 
                    country: data.country || 'Philippines',
                    description: data.description || '',
                    price: data.price || '',
                    priceUnit: data.priceUnit || 'per night',
                    maxCapacity: data.maxCapacity || '',
                    featured: data.featured || false
                });

                if (data.amenities) setAmenities(prev => ({ ...prev, ...data.amenities }));
                if (data.mainImage) setMainImagePreview(getImageUrl(data.mainImage));

                // 🔥 FIXED: Store both original path and display URL
                if (data.images && Array.isArray(data.images)) {
                    const formattedGallery = data.images.map(img => {
                        const originalPath = typeof img === 'string' ? img : img.url;
                        return {
                            id: img._id || img,
                            url: getImageUrl(originalPath),
                            originalPath: originalPath // Store original path
                        };
                    });
                    setExistingGallery(formattedGallery);
                }

            } catch (err) {
                console.error("Load Error:", err);
                setError(err.message);
                toast.error("Failed to load hotel details.");
            } finally {
                setIsLoading(false);
            }
        };

        if (id) loadData();
    }, [id, toast]);

    // --- HANDLERS ---
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleAmenityChange = (key) => {
        setAmenities(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleMainImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setMainImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setMainImagePreview(reader.result);
            reader.readAsDataURL(file);
            toast.info(`Selected main cover: ${file.name}`);
        }
    };

    const handleGalleryUpload = (e) => {
        const files = Array.from(e.target.files);
        const newFilesWithPreview = files.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            id: Math.random().toString(36).substr(2, 9)
        }));
        setNewGalleryFiles(prev => [...prev, ...newFilesWithPreview]);
        toast.info(`Added ${files.length} photos to gallery.`);
    };

    // 🔥 FIXED: Store original path in deletedImages
    const removeExistingImage = (imgId) => {
        const imageToDelete = existingGallery.find(img => img.id === imgId);
        if (imageToDelete) {
            setDeletedImages(prev => [...prev, imageToDelete.originalPath]);
            console.log('Marking for deletion:', imageToDelete.originalPath); // Debug log
        }
        setExistingGallery(prev => prev.filter(img => img.id !== imgId));
        toast.warning("Photo marked for deletion.");
    };

    const removeNewImage = (tempId) => {
        setNewGalleryFiles(prev => prev.filter(img => img.id !== tempId));
        toast.info("Upload cancelled for this photo.");
    };

    // ✅ Confirmation before Save
    const handleSaveConfirmation = (e) => {
        e.preventDefault();
        askConfirmation(
            "Save Changes",
            "Are you sure you want to update this hotel's information?",
            () => performSubmit()
        );
    };

    // 🔥 FIXED: Send correct data format to backend
    const performSubmit = async () => {
        setSubmitting(true);
        try {
            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => formDataToSend.append(key, formData[key]));
            Object.keys(amenities).forEach(key => formDataToSend.append(`amenities[${key}]`, amenities[key]));
            
            if (mainImageFile) formDataToSend.append("mainImage", mainImageFile);
            newGalleryFiles.forEach(item => formDataToSend.append("galleryImages", item.file));
            
            // 🔥 FIXED: Send original paths for both deleted and existing images
            console.log('Deleted images:', deletedImages); // Debug log
            formDataToSend.append("deletedImages", JSON.stringify(deletedImages));
            
            const remainingImages = existingGallery.map(img => img.originalPath);
            console.log('Remaining images:', remainingImages); // Debug log
            formDataToSend.append("existingImages", JSON.stringify(remainingImages));

            const response = await fetch(`${API_BASE_URL}/api/hotels/update/${id}`, {
                method: 'PUT',
                body: formDataToSend,
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to update hotel');
            }

            toast.success("Hotel updated successfully!");
            await clearDraft();
            navigate('/view-hotels'); 
        } catch (err) {
            console.error(err);
            toast.error(`Update failed: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    // ✅ Confirmation before Cancel/Back
    const handleBackClick = () => {
        askConfirmation(
            "Discard Changes",
            "You have unsaved changes. Are you sure you want to go back?",
            async () => {
                await clearDraft();
                navigate('/view-hotels');
            },
            "danger"
        );
    };

    if (isLoading) return <div className="eho-page"><div className="eho-loading"><div className="eho-spinner"></div><p>Loading...</p></div></div>;
    if (error) return <div className="eho-page"><div className="eho-container error-container"><h2>Error</h2><p>{error}</p><button className="eho-btn eho-btn--cancel" onClick={() => navigate('/view-hotels')}>Back</button></div></div>;

    return (
        <div className="eho-page">
            
            {/* ✅ RESTORE DRAFT MODAL */}
            <RestoreDraftModal
                isOpen={showRestoreModal}
                onRestore={handleRestoreDraft}
                onDiscard={handleDiscardDraft}
                draftInfo={draftInfo}
            />

            {/* ✅ CUSTOM CONFIRMATION MODAL */}
            <CustomConfirmModal 
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                type={confirmConfig.type}
                onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
            />

            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            <main className={`eho-main ${isSidebarCollapsed ? "eho-main--collapsed" : ""}`}>
                <div className="eho-container">
                    <header className="eho-header">
                        <div className="eho-header-content">
                            <button className="eho-back-btn" type="button" onClick={handleBackClick}><ArrowLeft size={18} /> Back to Hotels</button>
                            <h1 className="eho-title">EDIT HOTEL</h1>
                            <p className="eho-subtitle">Update property details, pricing, and gallery</p>
                        </div>
                    </header>

                    <form onSubmit={handleSaveConfirmation} className="eho-form">
                        
                        {/* 1. Main Cover Image */}
                        <div className="eho-section">
                            <h2 className="eho-section-title">Main Cover Image</h2>
                            <div className="eho-upload-area">
                                <input type="file" id="mainImageUpload" className="eho-file-input" accept="image/*" onChange={handleMainImageChange} />
                                <label htmlFor="mainImageUpload" className="eho-upload-label">
                                    {mainImagePreview ? (
                                        <div className="eho-image-preview">
                                            <img src={mainImagePreview} alt="Preview" onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/800x400?text=Image+Not+Found"; }} />
                                            <div className="eho-image-overlay"><Upload size={32} /><span>Change Main Cover</span></div>
                                        </div>
                                    ) : (
                                        <div className="eho-upload-placeholder"><ImageIcon size={48} /><span>Click to upload cover photo</span></div>
                                    )}
                                </label>
                            </div>
                        </div>

                        {/* 2. Gallery Images */}
                        <div className="eho-section">
                            <h2 className="eho-section-title">Gallery Images</h2>
                            <div className="eho-gallery-grid">
                                <label className="eho-add-box">
                                    <input type="file" multiple accept="image/*" onChange={handleGalleryUpload} hidden />
                                    <Plus size={24} /><span>Add Photos</span>
                                </label>
                                {existingGallery.map((img, idx) => (
                                    <div key={img.id || idx} className="eho-gallery-item">
                                        <img src={img.url} alt="Gallery" onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/150?text=Error"; }} />
                                        <button type="button" className="eho-remove-btn" onClick={() => removeExistingImage(img.id)}><X size={14} /></button>
                                        <span className="eho-badge-existing">Saved</span>
                                    </div>
                                ))}
                                {newGalleryFiles.map((item) => (
                                    <div key={item.id} className="eho-gallery-item eho-new-upload">
                                        <img src={item.preview} alt="New Upload" />
                                        <button type="button" className="eho-remove-btn" onClick={() => removeNewImage(item.id)}><X size={14} /></button>
                                        <span className="eho-badge-new">New</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3. Property Details */}
                        <div className="eho-section">
                            <h2 className="eho-section-title">Property Details</h2>
                            <div className="eho-form-grid">
                                <div className="eho-form-group">
                                    <label className="eho-label">Hotel Name *</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="eho-input" />
                                </div>
                                
                                <div className="eho-form-group">
                                    <label className="eho-label">Destination / City *</label>
                                    <select 
                                        name="city" 
                                        value={formData.city} 
                                        onChange={handleInputChange} 
                                        required 
                                        className="eho-select"
                                    >
                                        <option value="">Select Destination</option>
                                        {destinations.map((dest, index) => (
                                            <option key={index} value={dest}>{dest}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="eho-form-group eho-form-group--full">
                                    <label className="eho-label">Full Location / Address *</label>
                                    <div style={{position: 'relative'}}>
                                        <input type="text" name="location" value={formData.location} onChange={handleInputChange} required className="eho-input" style={{paddingLeft: '40px'}} />
                                        <MapPin size={18} style={{position: 'absolute', left: '12px', top: '14px', color: '#94a3b8'}}/>
                                    </div>
                                </div>
                                <div className="eho-form-group eho-form-group--full">
                                    <label className="eho-label">Description</label>
                                    <textarea name="description" value={formData.description} onChange={handleInputChange} className="eho-textarea" rows="5"></textarea>
                                </div>
                            </div>
                        </div>

                        {/* 4. Pricing */}
                        <div className="eho-section">
                            <h2 className="eho-section-title">Pricing & Capacity</h2>
                            <div className="eho-form-grid-3">
                                <div className="eho-form-group">
                                    <label className="eho-label">Base Price (PHP) *</label>
                                    <div style={{position: 'relative'}}>
                                        <input type="number" name="price" value={formData.price} onChange={handleInputChange} required className="eho-input" min="0" style={{paddingLeft: '36px'}} />
                                        <DollarSign size={16} style={{position: 'absolute', left: '12px', top: '15px', color: '#94a3b8'}}/>
                                    </div>
                                </div>
                                <div className="eho-form-group">
                                    <label className="eho-label">Price Unit</label>
                                    <select name="priceUnit" value={formData.priceUnit} onChange={handleInputChange} className="eho-select">
                                        <option value="per night">Per Night</option>
                                        <option value="per day">Per Day</option>
                                    </select>
                                </div>
                                <div className="eho-form-group">
                                    <label className="eho-label">Max Capacity</label>
                                    <div style={{position: 'relative'}}>
                                        <input type="number" name="maxCapacity" value={formData.maxCapacity} onChange={handleInputChange} className="eho-input" min="1" style={{paddingLeft: '36px'}} />
                                        <Users size={16} style={{position: 'absolute', left: '12px', top: '15px', color: '#94a3b8'}}/>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 5. Amenities */}
                        <div className="eho-section">
                            <h2 className="eho-section-title">Amenities</h2>
                            <div className="eho-amenities-grid">
                                {Object.keys(amenities).map((key) => (
                                    <label key={key} className="eho-checkbox-wrapper">
                                        <input type="checkbox" checked={amenities[key]} onChange={() => handleAmenityChange(key)} className="eho-checkbox" />
                                        <span className="eho-checkbox-label" style={{textTransform: 'capitalize'}}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="eho-form-actions">
                            <button 
                                type="button" 
                                className="eho-btn eho-btn--cancel" 
                                onClick={handleBackClick} 
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="eho-btn eho-btn--submit" disabled={submitting}>{submitting ? 'Updating...' : <><Save size={18} /> Save Changes</>}</button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default EditHotel;
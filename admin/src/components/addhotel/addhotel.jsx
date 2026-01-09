import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle } from "lucide-react";
import Sidebar from '../sidebar/sidebar';
import HotelImageUpload from './HotelImageUpload';
import HotelDetails from './HotelDetails';
import HotelAmenities from './HotelAmenities';
import HotelGallery from './HotelGallery';
import HotelPreview from './HotelPreview';
import { useToast } from '../toast/ToastManager';
import './addhotel.css';
 
// ✅ Imports needed for Draft functionality
import useAutoDraft from '../../hooks/useAutoDraft';
import RestoreDraftModal from '../../components/RestoreDraftModal/RestoreDraftModal';
 
const API_BASE_URL = 'https://wanderwaveph-backend.onrender.com';
 
// ✅ Custom Confirmation Modal Component
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
 
const AddHotel = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);
 
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
 
  // --- STATE MANAGEMENT ---
  const [hotelDetails, setHotelDetails] = useState({
    name: '',
    destination: '',
    price: '',
    maxCapacity: 4,
    amenities: {
      wifi: false, parking: false, pool: false, gym: false, restaurant: false,
      spa: false, airConditioning: false, roomService: false, laundry: false, bar: false
    }
  });
 
  const [destinations, setDestinations] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [type, setType] = useState("Budget");
  const [loading, setLoading] = useState(true);
 
  // =========================================================
  // ✅ VALIDATION LOGIC START
  // =========================================================
 
  // Helper para sa Image Validation (JPG, JPEG, PNG, WebP)
  const isValidImage = (file) => {
    const allowedExtensions = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return allowedExtensions.includes(file.type);
  };
 
const handleSetFile = (selectedFile) => {
    if (selectedFile) {
        if (!isValidImage(selectedFile)) {
            toast.error('Invalid image format. Please use JPG, JPEG, PNG, or WebP.', '❌ File Error');
            return;
        }
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
        toast.success(`Main image "${selectedFile.name}" uploaded successfully!`, '✅ Image Added');
    }
};
 
  // Custom setGalleryFiles handler with validation
const handleSetGalleryFiles = (filesOrUpdater) => {
    if (typeof filesOrUpdater === 'function') {
        setGalleryFiles(prev => {
            const updated = filesOrUpdater(prev);
            const lastAdded = updated[updated.length - 1];
            if (lastAdded && lastAdded.file && !isValidImage(lastAdded.file)) {
                toast.error('Invalid gallery image format. Only JPG, JPEG, PNG, and WebP are allowed.', '❌ File Error');
                return prev;
            }
            // ✅ TANGGALIN YUNG TOAST DITO
            return updated;
        });
    } else {
        const allValid = filesOrUpdater.every(f => isValidImage(f.file));
        if (!allValid) {
            toast.error('Some files were rejected. Please use JPG, JPEG, PNG, or WebP.', '❌ File Error');
            setGalleryFiles(filesOrUpdater.filter(f => isValidImage(f.file)));
        } else {
            setGalleryFiles(filesOrUpdater);
            // ✅ TOAST DITO NA LANG PARA ISANG BESES LANG
            if (filesOrUpdater.length > 0) {
                toast.success('Gallery image added successfully!', '✅ Added');
            }
        }
    }
};
 
 const updateField = (field, value) => {
    if (field === 'price' || field === 'maxCapacity') {
        const digitsOnly = value.replace(/\D/g, '');
       
        if (digitsOnly.length <= 6) {
            setHotelDetails(prev => ({ ...prev, [field]: digitsOnly }));
        } else {
            toast.warning('Maximum of 6 digits only for this field.', '⚠️ Limit Reached');
        }
    } else {
        setHotelDetails(prev => ({ ...prev, [field]: value }));
    }
};
 
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
        !hotelDetails.name &&
        !hotelDetails.destination &&
        !hotelDetails.price &&
        hotelDetails.maxCapacity === 4 &&
        type === "Budget" &&
        !file &&
        galleryFiles.length === 0;
 
      if (isFormEmpty) {
        setDraftPayload(null);
        return;
      }
 
      let mainImageBase64 = null;
      let mainImageMeta = null;
 
      if (file) {
        try {
          if (file.size < 3 * 1024 * 1024) {
            mainImageBase64 = await fileToBase64(file);
            mainImageMeta = { name: file.name, type: file.type };
          }
        } catch (err) {
          console.warn("Main image too large for draft.");
        }
      }
 
      setDraftPayload({
        ...hotelDetails,
        selectedRoomType: type,
        mainImage: mainImageBase64,
        mainImageMeta: mainImageMeta
      });
    };
 
    const timeoutId = setTimeout(() => {
      updateDraft();
    }, 500);
 
    return () => clearTimeout(timeoutId);
  }, [hotelDetails, type, file, galleryFiles]);
 
  const restoreDraftData = async (data) => {
    if (!data) return;
    const { selectedRoomType, mainImage, mainImageMeta, ...rest } = data;
    if (selectedRoomType) setType(selectedRoomType);
    setHotelDetails(rest);
    if (mainImage && mainImageMeta) {
      try {
        const restoredFile = await base64ToFile(mainImage, mainImageMeta.name, mainImageMeta.type);
        setFile(restoredFile);
        setPreviewUrl(URL.createObjectURL(restoredFile));
      } catch (err) {
        console.error("Failed to restore main image:", err);
      }
    }
  };
 
  const { clearDraft, hasDraft, restoreDraft, discardDraft, draftInfo } = useAutoDraft({
    module: 'add-hotel',
    formData: draftPayload,
    setFormData: restoreDraftData,
    imagePreview: previewUrl,
    autoRestore: false
  });
 
  const [showRestoreModal, setShowRestoreModal] = useState(false);
 
  useEffect(() => {
    if (hasDraft) setShowRestoreModal(true);
  }, [hasDraft]);
 
const handleRestoreDraft = () => {
    restoreDraft();
    setShowRestoreModal(false);
    toast.success('Your hotel draft has been restored successfully!', '✅ Draft Restored', 3000);
};
 
  // =========================================================
  // ✅ DATA FETCHING & EVENT HANDLERS
  // =========================================================
 
  useEffect(() => {
    fetchDestinations();
  }, []);
 
  const fetchDestinations = async () => {
    try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/packages/all`);
        const data = await response.json();
        if (data.status === 'ok' && Array.isArray(data.data)) {
            const uniqueDestinations = [...new Set(
                data.data.map(pkg => pkg.destination).filter(dest => dest && dest.trim() !== '')
            )];
            setDestinations(uniqueDestinations);
        }
    } catch (error) {
        toast.error('Failed to load destinations. Please check your connection.', '❌ Connection Error');
    } finally {
        setLoading(false);
    }
};
 
  const handleAmenityChange = (amenityId) => {
    setHotelDetails(prev => ({
      ...prev,
      amenities: { ...prev.amenities, [amenityId]: !prev.amenities[amenityId] }
    }));
  };
 
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => resolve(fileReader.result);
      fileReader.onerror = (error) => reject(error);
    });
  };
 
const handleSubmit = (e) => {
    e.preventDefault();
   
    if (!hotelDetails.name || !hotelDetails.destination || !hotelDetails.price) {
        toast.error('Please fill in all required fields (Name, Destination, Price).', '⚠️ Validation Error');
        window.scrollTo(0, 0);
        return;
    }

    if (Number(hotelDetails.price) < 1) {
        toast.error('Price must be at least ₱1.', '⚠️ Validation Error');
        return;
    }

    toast.success('All fields validated successfully!', '✅ Ready to Publish', 2000);

    askConfirmation(
        "Publish Hotel",
        `Are you sure you want to add "${hotelDetails.name}" to the catalog?`,
        () => performSubmit()
    );
};
 
const performSubmit = async () => {
    setIsSubmitting(true);
    
    toast.info('Publishing hotel to catalog...', '📤 Please Wait', 2000);
    
    try {
        let mainImageBase64 = '';
        if (file) mainImageBase64 = await convertToBase64(file);

        const galleryImagesBase64 = [];
        for (const item of galleryFiles) {
            const base64 = await convertToBase64(item.file);
            galleryImagesBase64.push({ url: base64, caption: item.caption || '' });
        }

        const cityName = hotelDetails.destination.split(',')[0].trim();
        const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
        const activeUser = adminData.email || adminData.username || adminData.user || 'Unknown User';
        const activeId = adminData.id || adminData._id || "";

        const hotelPayload = {
            name: hotelDetails.name,
            location: hotelDetails.destination,
            city: cityName,
            description: `${type} accommodation in ${hotelDetails.destination}`,
            price: Number(hotelDetails.price),
            maxCapacity: Number(hotelDetails.maxCapacity) || 4,
            amenities: hotelDetails.amenities,
            mainImage: mainImageBase64,
            images: galleryImagesBase64,
            featured: false,
            isActive: true,
            roomTypes: [{
                type: type,
                capacity: Number(hotelDetails.maxCapacity) || 4,
                price: Number(hotelDetails.price),
                available: 5,
                description: `Standard ${type} room`
            }],
            userEmail: activeUser,
            adminId: activeId
        };

        const response = await fetch(`${API_BASE_URL}/api/hotels`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(hotelPayload)
        });

        const data = await response.json();

        if (data.success) {
            toast.success(
                `"${hotelDetails.name}" has been added to your catalog successfully!`,
                '✅ Hotel Published',
                5000
            );
            window.scrollTo(0, 0);
            await clearDraft();
            
            toast.info('Form cleared and ready for new hotel entry.', '🔄 Ready', 3000);
            resetForm();
        } else {
            const errorMessage = data.message || 'Unknown error occurred';
            toast.error(
                `Failed to save hotel: ${errorMessage}`,
                '❌ Save Failed',
                5000
            );
        }
    } catch (err) {
        console.error('❌ Network Error:', err);
        toast.error(
            `Unable to connect to server: ${err.message}. Please check if backend is running.`,
            '❌ Connection Error',
            6000
        );
    } finally {
        setIsSubmitting(false);
    }
};
 
  const resetForm = () => {
    setHotelDetails({
      name: '', destination: '', price: '', maxCapacity: 4,
      amenities: {
        wifi: false, parking: false, pool: false, gym: false, restaurant: false,
        spa: false, airConditioning: false, roomService: false, laundry: false, bar: false
      }
    });
    setFile(null); setPreviewUrl(null); setGalleryFiles([]); setType("Budget");
  };
 
const handleCancel = () => {
    askConfirmation(
        "Discard Changes",
        "Are you sure you want to cancel? All unsaved changes and drafts will be lost.",
        async () => {
            await clearDraft();
            toast.info('Action cancelled. Redirecting to hotel list...', '❌ Cancelled');
            navigate('/view-hotels');
        },
        "danger"
    );
};
 
  return (
    <div className="atour-page">
      <RestoreDraftModal
        isOpen={showRestoreModal}
        onRestore={handleRestoreDraft}
        onDiscard={async () => { await discardDraft(); setShowRestoreModal(false); }}
        draftInfo={draftInfo}
      />
 
      <CustomConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
 
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      <main className={`atour-main ${isSidebarCollapsed ? 'atour-collapsed' : ''}`}>
        <div className="atour-container">
          <header className="atour-header">
            <div className="atour-header-content">
              <h1 className="atour-title">NEW HOTEL</h1>
              <p className="atour-subtitle">Register a new accommodation partner to your catalog</p>
            </div>
          </header>
 
          <form onSubmit={handleSubmit}>
            <div className="atour-grid">
              <div className="atour-left">
                <HotelImageUpload
                  file={file}
                  setFile={handleSetFile}
                  previewUrl={previewUrl}
                  setPreviewUrl={setPreviewUrl}
                />
 
                <HotelDetails
                  hotelDetails={hotelDetails}
                  updateField={updateField}
                  type={type}
                  setType={setType}
                  destinations={destinations}
                  loading={loading}
                  fetchDestinations={fetchDestinations}
                />
 
                <HotelGallery
                  galleryFiles={galleryFiles}
                  setGalleryFiles={handleSetGalleryFiles}
                />
 
                <HotelAmenities
                  amenities={hotelDetails.amenities}
                  handleAmenityChange={handleAmenityChange}
                />
              </div>
 
              <aside className="atour-right">
                <HotelPreview
                  hotelDetails={hotelDetails}
                  previewUrl={previewUrl}
                  type={type}
                />
                <div className="atour-actions">
                  <button type="button" className="atour-btn atour-btn--cancel" onClick={handleCancel} disabled={isSubmitting}>
                    Cancel
                  </button>
                  <button type="submit" className="atour-btn atour-btn--submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Publishing...' : 'Publish Hotel'}
                  </button>
                </div>
              </aside>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
 
export default AddHotel;
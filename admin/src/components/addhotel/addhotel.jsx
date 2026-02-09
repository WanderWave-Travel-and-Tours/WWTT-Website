import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../sidebar/sidebar';
import HotelImageUpload from './HotelImageUpload';
import HotelDetails from './HotelDetails';
import HotelAmenities from './HotelAmenities';
import HotelGallery from './HotelGallery';
import HotelPreview from './HotelPreview';
import { useToast } from '../toast/ToastManager';
import CustomConfirmModal from "../../components/confirmationModal/CustomConfirmModal";
import './addhotel.css';
 
// ✅ Imports needed for Draft functionality
import useAutoDraft from '../../hooks/useAutoDraft';
import RestoreDraftModal from '../../components/RestoreDraftModal/RestoreDraftModal';
 
const API_BASE_URL = 'https://wanderwaveph.onrender.com';
 
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
  // ✅ VALIDATION LOGIC
  // =========================================================
 
  const isValidImage = (file) => {
    const allowedExtensions = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return allowedExtensions.includes(file.type);
  };
 
  const handleSetFile = (selectedFile) => {
    if (selectedFile) {
        if (!isValidImage(selectedFile)) {
            toast.error('Invalid image format. Please use JPG, JPEG, PNG, or WebP.', 'File Error');
            return;
        }
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
        toast.success(`Main image "${selectedFile.name}" uploaded successfully!`, 'Image Added');
    }
  };
 
  const handleSetGalleryFiles = (filesOrUpdater) => {
    if (typeof filesOrUpdater === 'function') {
        setGalleryFiles(prev => {
            const updated = filesOrUpdater(prev);
            const lastAdded = updated[updated.length - 1];
            if (lastAdded && lastAdded.file && !isValidImage(lastAdded.file)) {
                toast.error('Invalid gallery image format. Only JPG, JPEG, PNG, and WebP are allowed.', 'File Error');
                return prev;
            }
            return updated;
        });
    } else {
        const allValid = filesOrUpdater.every(f => isValidImage(f.file));
        if (!allValid) {
            toast.error('Some files were rejected. Please use JPG, JPEG, PNG, or WebP.', 'File Error');
            setGalleryFiles(filesOrUpdater.filter(f => isValidImage(f.file)));
        } else {
            setGalleryFiles(filesOrUpdater);
            if (filesOrUpdater.length > 0) {
                toast.success('Gallery image added successfully!', 'Added');
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
            toast.warning('Maximum of 6 digits only for this field.', 'Limit Reached');
        }
    } else {
        setHotelDetails(prev => ({ ...prev, [field]: value }));
    }
  };
 
  // =========================================================
  // ✅ AUTO-DRAFT LOGIC
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
    toast.success('Your hotel draft has been restored successfully!', 'Draft Restored', 3000);
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
        toast.error('Failed to load destinations. Please check your connection.', 'Connection Error');
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
 
  const handleSubmit = (e) => {
    e.preventDefault();
   
    if (!hotelDetails.name || !hotelDetails.destination || !hotelDetails.price) {
        toast.error('Please fill in all required fields (Name, Destination, Price).', 'Validation Error');
        window.scrollTo(0, 0);
        return;
    }

    if (Number(hotelDetails.price) < 1) {
        toast.error('Price must be at least 1.', 'Validation Error');
        return;
    }

    // Success validation toast without emoji
    toast.success('All fields validated successfully!', 'Ready to Publish', 2000);

    askConfirmation(
        "Publish Hotel",
        `Are you sure you want to add "${hotelDetails.name}" to the catalog?`,
        () => performSubmit(),
        "primary"
    );
  };
 
  const performSubmit = async () => {
    setIsSubmitting(true);
    toast.info('Publishing hotel to catalog...', 'Please Wait', 2000);
    
    try {
        const formData = new FormData();
        formData.append('name', hotelDetails.name);
        formData.append('location', hotelDetails.destination);
        
        const cityName = hotelDetails.destination.split(',')[0].trim();
        formData.append('city', cityName);
        formData.append('description', `${type} accommodation in ${hotelDetails.destination}`);
        formData.append('price', Number(hotelDetails.price));
        formData.append('maxCapacity', Number(hotelDetails.maxCapacity) || 4);
        formData.append('amenities', JSON.stringify(hotelDetails.amenities));
        
        if (file) formData.append('mainImage', file);
        
        for (const item of galleryFiles) {
            formData.append('galleryImages', item.file);
        }
        
        formData.append('featured', false);
        formData.append('isActive', true);
        
        const roomTypesData = [{
            type: type,
            capacity: Number(hotelDetails.maxCapacity) || 4,
            price: Number(hotelDetails.price),
            available: 5,
            description: `Standard ${type} room`
        }];
        formData.append('roomTypes', JSON.stringify(roomTypesData));
        
        const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
        formData.append('userEmail', adminData.email || adminData.username || 'Unknown User');
        formData.append('adminId', adminData.id || adminData._id || "");

        const response = await fetch(`${API_BASE_URL}/api/hotels`, {
            method: 'POST',
            body: formData 
        });

        const data = await response.json();

        if (data.success) {
            toast.success(`"${hotelDetails.name}" has been added successfully!`, 'Hotel Published', 5000);
            window.scrollTo(0, 0);
            await clearDraft();
            resetForm();
        } else {
            toast.error(`Failed to save hotel: ${data.message || 'Unknown error'}`, 'Save Failed');
        }
    } catch (err) {
        toast.error(`Unable to connect to server: ${err.message}`, 'Connection Error');
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
            toast.info('Action cancelled. Redirecting to hotel list...', 'Cancelled');
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
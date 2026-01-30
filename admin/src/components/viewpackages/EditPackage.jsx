import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, X, Plus, Trash2, Save } from "lucide-react"; 
import Sidebar from "../sidebar/sidebar";
import "./editpackage.css";

// ✅ Imports for Draft Functionality
import useAutoDraft from '../../hooks/useAutoDraft';
import RestoreDraftModal from '../../components/RestoreDraftModal/RestoreDraftModal';

// ✅ NEW: Toast and Confirmation Modal Imports
import { useToast } from '../../components/toast/ToastManager';
import CustomConfirmModal from "../../components/confirmationModal/CustomConfirmModal";

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

const EditPackage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const packageId = id;
  const toast = useToast(); // ✅ Toast hook

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ✅ NEW: Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'primary',
    onConfirm: () => {}
  });

  // Form state with markupType
  const [formData, setFormData] = useState({
    title: "",
    destination: "",
    sellerPrice: "",
    markupType: "fixed", // ✅ NEW: Default to fixed
    markup: "",
    duration: "",
    category: "Local",
    existingImage: "",
    existingImagePublicId: "" 
  });

  const [originalData, setOriginalData] = useState(null);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [inclusions, setInclusions] = useState([""]);
  const [itinerary, setItinerary] = useState([
    { day: 1, title: "", activities: [""] },
  ]);

  const API_BASE_URL = "https://wanderwaveph-backend.onrender.com/api/packages";

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  // ✅ Helper function to open confirmation modal
  const openConfirmModal = (title, message, onConfirm, type = 'primary') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      type,
      onConfirm
    });
  };

  // ✅ Helper function to close confirmation modal
  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      title: '',
      message: '',
      type: 'primary',
      onConfirm: () => {}
    });
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
      if (loading) {
        setDraftPayload(null);
        return;
      }

      const isFormEmpty = 
        !formData.title && 
        !formData.destination && 
        !formData.sellerPrice && 
        !formData.markup && 
        !formData.duration && 
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
        ...formData,
        inclusions,
        itinerary,
        image: imageBase64, 
        imageMeta: imageMeta,
        originalId: packageId 
      });
    };

    const timeoutId = setTimeout(() => {
      updateDraft();
    }, 500); 

    return () => clearTimeout(timeoutId);
  }, [formData, inclusions, itinerary, imageFile, loading, packageId]);

  const restoreDraftData = async (data) => {
    if (!data) return;
    
    if (data.originalId && data.originalId !== packageId) {
      console.warn("Draft found but belongs to a different package ID. Ignoring.");
      return;
    }

    setFormData({
      title: data.title || "",
      destination: data.destination || "",
      sellerPrice: data.sellerPrice || "",
      markupType: data.markupType || "fixed", // ✅ Restore markupType
      markup: data.markup || "",
      duration: data.duration || "",
      category: data.category || "Local",
      existingImage: data.existingImage || "",
      existingImagePublicId: data.existingImagePublicId || ""
    });

    if (data.inclusions) setInclusions(data.inclusions);
    if (data.itinerary) setItinerary(data.itinerary);

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
    module: `edit-package-${packageId}`, 
    formData: draftPayload,
    setFormData: restoreDraftData,
    imagePreview: imagePreview, 
    autoRestore: false 
  });

  const [showRestoreModal, setShowRestoreModal] = useState(false);

  useEffect(() => {
    if (hasDraft && !loading) {
      setShowRestoreModal(true);
    }
  }, [hasDraft, loading]);

  const handleRestoreDraft = () => {
    restoreDraft();
    setShowRestoreModal(false);
  };

  const handleDiscardDraft = async () => {
    await discardDraft(); 
    setShowRestoreModal(false);
  };

  // =========================================================
  // ✅ AUTO-DRAFT LOGIC END
  // =========================================================

  useEffect(() => {
    if (!packageId) {
      console.error("No package ID provided");
      navigate("/view-packages");
      return;
    }

    const fetchPackageData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/${packageId}`);
        const result = await response.json();

        if (result.status === "ok") {
          const pkg = result.data;
          
          let sellerPriceValue = 0;
          let markupValue = 0;
          
          if (pkg.sellerPrice !== undefined && pkg.sellerPrice !== null) {
            sellerPriceValue = pkg.sellerPrice;
            markupValue = pkg.markup !== undefined && pkg.markup !== null ? pkg.markup : 0;
          } else if (pkg.price !== undefined && pkg.price !== null) {
            sellerPriceValue = pkg.price;
            markupValue = 0;
          }

          const currentInclusions = pkg.inclusions && pkg.inclusions.length > 0 ? pkg.inclusions : [""];
          const currentItinerary = pkg.itinerary && pkg.itinerary.length > 0 ? pkg.itinerary : [{ day: 1, title: "", activities: [""] }];
          
          setOriginalData({
            title: pkg.title || "",
            destination: pkg.destination || "",
            sellerPrice: sellerPriceValue,
            markupType: pkg.markupType || "fixed", // ✅ Store original markupType
            markup: markupValue,
            duration: pkg.duration || "",
            category: pkg.category || "Local",
            inclusions: currentInclusions,
            itinerary: currentItinerary
          });

          setFormData({
            title: pkg.title || "",
            destination: pkg.destination || "",
            sellerPrice: sellerPriceValue,
            markupType: pkg.markupType || "fixed", // ✅ Load markupType from database
            markup: markupValue,
            duration: pkg.duration || "",
            category: pkg.category || "Local",
            existingImage: pkg.image || "",
            existingImagePublicId: pkg.imagePublicId || ""
          });

          setInclusions(currentInclusions);
          setItinerary(currentItinerary);

          if (pkg.image) {
            const imgUrl = pkg.image.startsWith('http') ? pkg.image : `https://wanderwaveph-backend.onrender.com/uploads/${pkg.image}`;
            setImagePreview(imgUrl);
          }
        } else {
          console.error("Error in response:", result.error);
          toast.error("Failed to load package data: " + result.error);
          navigate("/view-packages");
        }
      } catch (err) {
        console.error("Error fetching package:", err);
        toast.error("Failed to load package data. Please try again.");
        navigate("/view-packages");
      } finally {
        setLoading(false);
      }
    };

    fetchPackageData();
  }, [packageId, navigate, toast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const handleInclusionChange = (index, value) => {
    const newInclusions = [...inclusions];
    newInclusions[index] = value;
    setInclusions(newInclusions);
  };

  const handleInclusionPaste = (index, e) => {
    const pastedText = e.clipboardData.getData("text");
    const lines = pastedText.split(/\r?\n/).filter((line) => line.trim());

    if (lines.length > 1) {
      e.preventDefault();
      const cleanedLines = lines.map((line) => {
        return line.replace(/^[✓✔️☑️•\-\s]+/, "").trim();
      });

      const newInclusions = [...inclusions];
      
      newInclusions[index] = cleanedLines[0];

      let currentIndex = index;
      cleanedLines.slice(1).forEach((line) => {
        newInclusions.splice(++currentIndex, 0, line);
      });

      setInclusions(newInclusions);
    }
  };

  const addInclusion = () => {
    setInclusions([...inclusions, ""]);
  };

  const removeInclusion = (index) => {
    if (inclusions.length > 1) {
      setInclusions(inclusions.filter((_, i) => i !== index));
    }
  };

  const handleItineraryChange = (index, field, value) => {
    const newItinerary = [...itinerary];
    newItinerary[index][field] = value;
    setItinerary(newItinerary);
  };

  const handleActivityChange = (itineraryIndex, activityIndex, value) => {
    const newItinerary = [...itinerary];
    newItinerary[itineraryIndex].activities[activityIndex] = value;
    setItinerary(newItinerary);
  };

  const handleActivityPaste = (dayIndex, actIndex, e) => {
    const pastedText = e.clipboardData.getData("text");
    const lines = pastedText.split(/\r?\n/).filter((line) => line.trim());

    if (lines.length > 1) {
      e.preventDefault();
      const cleanedLines = lines.map((line) => {
        return line.replace(/^[✓✔️☑️•\-\s]+/, "").trim();
      });

      const updatedItinerary = [...itinerary];
      
      updatedItinerary[dayIndex].activities[actIndex] = cleanedLines[0];

      let currentActIndex = actIndex;
      cleanedLines.slice(1).forEach((line) => {
        updatedItinerary[dayIndex].activities.splice(++currentActIndex, 0, line);
      });

      setItinerary(updatedItinerary);
    }
  };

  const addActivity = (itineraryIndex) => {
    const newItinerary = [...itinerary];
    newItinerary[itineraryIndex].activities.push("");
    setItinerary(newItinerary);
  };

  const removeActivity = (itineraryIndex, activityIndex) => {
    const newItinerary = [...itinerary];
    if (newItinerary[itineraryIndex].activities.length > 1) {
      newItinerary[itineraryIndex].activities = newItinerary[
        itineraryIndex
      ].activities.filter((_, i) => i !== activityIndex);
      setItinerary(newItinerary);
    }
  };

  const addItineraryDay = () => {
    setItinerary([
      ...itinerary,
      { day: itinerary.length + 1, title: "", activities: [""] },
    ]);
  };

  const removeItineraryDay = (index) => {
    if (itinerary.length > 1) {
      const newItinerary = itinerary.filter((_, i) => i !== index);
      newItinerary.forEach((item, i) => {
        item.day = i + 1;
      });
      setItinerary(newItinerary);
    }
  };

  // ✅ NEW: Calculate selling price based on markup type
  const calculateSellingPrice = () => {
    const sellerPrice = parseFloat(formData.sellerPrice) || 0;
    const markup = parseFloat(formData.markup) || 0;

    if (formData.markupType === 'percentage') {
      const markupAmount = (sellerPrice * markup) / 100;
      return sellerPrice + markupAmount;
    } else {
      return sellerPrice + markup;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.destination ||
      !formData.sellerPrice ||
      !formData.duration
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    const { userEmail, adminId } = getAdminData();

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("destination", formData.destination);
      formDataToSend.append("sellerPrice", formData.sellerPrice);
      formDataToSend.append("markupType", formData.markupType); // ✅ Send markupType
      formDataToSend.append("markup", formData.markup || 0);
      formDataToSend.append("duration", formData.duration);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("existingImage", formData.existingImage);
      if (formData.existingImagePublicId) {
          formDataToSend.append("existingImagePublicId", formData.existingImagePublicId);
      }

      const filteredInclusions = inclusions.filter((inc) => inc.trim() !== "");
      formDataToSend.append("inclusions", JSON.stringify(filteredInclusions));

      const filteredItinerary = itinerary
        .map((day) => ({
          day: day.day,
          title: day.title,
          activities: day.activities.filter((act) => act.trim() !== ""),
        }))
        .filter((day) => day.title.trim() !== "");
      formDataToSend.append("itinerary", JSON.stringify(filteredItinerary));

      if (imageFile) {
        formDataToSend.append("image", imageFile);
      }

      formDataToSend.append("userEmail", userEmail);
      formDataToSend.append("adminId", adminId);

      let changes = [];
            
      const trackChange = (label, oldVal, newVal) => {
          const cleanOld = String(oldVal || "").trim();
          const cleanNew = String(newVal || "").trim();
          if (cleanOld !== cleanNew) {
              changes.push(`${label} changed from "${cleanOld}" to "${cleanNew}"`);
          }
      };

      if (originalData) {
          trackChange("Title", originalData.title, formData.title);
          trackChange("Destination", originalData.destination, formData.destination);
          trackChange("Seller Price", originalData.sellerPrice, formData.sellerPrice);
          trackChange("Markup Type", originalData.markupType, formData.markupType); // ✅ Track markupType change
          trackChange("Markup", originalData.markup, formData.markup);
          trackChange("Duration", originalData.duration, formData.duration);
          trackChange("Category", originalData.category, formData.category);

          if (JSON.stringify(originalData.inclusions) !== JSON.stringify(filteredInclusions)) {
             changes.push("Package inclusions were updated.");
          }

          if (JSON.stringify(originalData.itinerary) !== JSON.stringify(filteredItinerary)) {
             changes.push("Package itinerary was updated.");
          }

          if (imageFile) {
              changes.push("Package image was replaced.");
          }
      }

      if (changes.length > 0) {
          formDataToSend.append('changes', JSON.stringify(changes));
      }

      const response = await fetch(`${API_BASE_URL}/edit/${packageId}`, {
        method: "PUT",
        body: formDataToSend,
      });

      const result = await response.json();

      if (result.status === "ok") {
        toast.success("Package updated successfully!");
        await clearDraft();
        navigate("/view-packages");
      } else {
        toast.error("Failed to update package: " + (result.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error updating package:", err);
      toast.error("Error updating package. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ NEW: Handle Cancel with Confirmation
  const handleCancel = () => {
    openConfirmModal(
      'Cancel Editing',
      'Are you sure you want to cancel? Any unsaved changes will be lost.',
      async () => {
        await clearDraft();
        navigate("/view-packages");
        closeConfirmModal();
      },
      'danger'
    );
  };

  if (loading) {
    return (
      <div className="epa-page">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
        />
        <main
          className={`epa-main ${
            isSidebarCollapsed ? "epa-main--collapsed" : ""
          }`}
        >
          <div className="epa-loading">
            <div className="epa-spinner"></div>
            <p>Loading package data...</p>
          </div>
        </main>
      </div>
    );
  }

  const calculatedPrice = calculateSellingPrice();

  return (
    <div className="epa-page">
      
      {/* ✅ Confirmation Modal */}
      <CustomConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
      />

      <RestoreDraftModal
        isOpen={showRestoreModal}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
        draftInfo={draftInfo}
      />

      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      <main
        className={`epa-main ${isSidebarCollapsed ? "epa-main--collapsed" : ""}`}
      >
        <div className="epa-container">
          <div className="epa-header">
            <button className="epa-back-btn" onClick={() => navigate("/view-packages")}>
              <ArrowLeft size={20} /> Back to Packages
            </button>
            <h1 className="epa-title">Edit Package</h1>
          </div>

          <form className="epa-form" onSubmit={handleSubmit}>
            {/* Image Upload */}
            <div className="epa-section">
              <h2 className="epa-section-title">Package Image</h2>
              <div className="epa-image-upload">
                <input
                  type="file"
                  id="image-upload"
                  className="epa-file-input"
                  onChange={handleImageChange}
                  accept="image/*"
                />
                <label htmlFor="image-upload" className="epa-upload-label">
                  <Upload size={24} />
                  <span>Choose Image</span>
                </label>
                {imagePreview && (
                  <div className="epa-image-preview">
                    <img src={imagePreview} alt="Preview" />
                  </div>
                )}
              </div>
            </div>

            {/* Basic Information */}
            <div className="epa-section">
              <h2 className="epa-section-title">Basic Information</h2>
              <div className="epa-form-grid">
                <div className="epa-form-group">
                  <label className="epa-label">Package Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="epa-input"
                    placeholder="e.g., Boracay Beach Getaway"
                    required
                  />
                </div>

                <div className="epa-form-group">
                  <label className="epa-label">Destination *</label>
                  <input
                    type="text"
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                    className="epa-input"
                    placeholder="e.g., Boracay, Philippines"
                    required
                  />
                </div>

                <div className="epa-form-group">
                  <label className="epa-label">Duration *</label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="epa-input"
                    placeholder="e.g., 3 Days 2 Nights"
                    required
                  />
                </div>

                <div className="epa-form-group">
                  <label className="epa-label">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="epa-input"
                    required
                  >
                    <option value="Local">Local</option>
                    <option value="International">International</option>
                    <option value="International Tour">
                      International Tour
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="epa-section">
              <h2 className="epa-section-title">Pricing</h2>
              <div className="epa-form-grid">
                <div className="epa-form-group">
                  <label className="epa-label">Seller Price (₱) *</label>
                  <input
                    type="number"
                    name="sellerPrice"
                    value={formData.sellerPrice}
                    onChange={handleInputChange}
                    className="epa-input"
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </div>

                {/* ✅ NEW: Markup Type Dropdown */}
                <div className="epa-form-group">
                  <label className="epa-label">Markup Type</label>
                  <select
                    name="markupType"
                    value={formData.markupType}
                    onChange={handleInputChange}
                    className="epa-input"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₱)</option>
                  </select>
                </div>

                {/* ✅ UPDATED: Markup input with dynamic placeholder */}
                <div className="epa-form-group">
                  <label className="epa-label">
                    Markup {formData.markupType === 'percentage' ? '(%)' : '(₱)'}
                  </label>
                  <input
                    type="number"
                    name="markup"
                    value={formData.markup}
                    onChange={handleInputChange}
                    className="epa-input"
                    placeholder={formData.markupType === 'percentage' ? '0%' : '₱0.00'}
                    step="0.01"
                  />
                </div>

                {/* ✅ UPDATED: Final Price now uses calculated value */}
                <div className="epa-form-group">
                  <label className="epa-label">Final Price (₱)</label>
                  <input
                    type="text"
                    value={`₱${calculatedPrice.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}`}
                    className="epa-input epa-input--readonly"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Inclusions */}
            <div className="epa-section">
              <div className="epa-section-header">
                <h2 className="epa-section-title">Package Inclusions</h2>
                <button
                  type="button"
                  className="epa-add-btn"
                  onClick={addInclusion}
                >
                  <Plus size={16} /> Add Inclusion
                </button>
              </div>
              <div className="epa-list-items">
                {inclusions.map((inclusion, index) => (
                  <div key={index} className="epa-list-item">
                    <input
                      type="text"
                      value={inclusion}
                      onChange={(e) =>
                        handleInclusionChange(index, e.target.value)
                      }
                      onPaste={(e) => handleInclusionPaste(index, e)}
                      className="epa-input"
                      placeholder="Enter inclusion"
                    />
                    {inclusions.length > 1 && (
                      <button
                        type="button"
                        className="epa-remove-btn"
                        onClick={() => removeInclusion(index)}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Itinerary */}
            <div className="epa-section">
              <div className="epa-section-header">
                <h2 className="epa-section-title">Itinerary</h2>
                <button
                  type="button"
                  className="epa-add-btn"
                  onClick={addItineraryDay}
                >
                  <Plus size={16} /> Add Day
                </button>
              </div>
              <div className="epa-itinerary-list">
                {itinerary.map((day, dayIndex) => (
                  <div key={dayIndex} className="epa-itinerary-day">
                    <div className="epa-itinerary-day-header">
                      <h3 className="epa-day-title">Day {day.day}</h3>
                      {itinerary.length > 1 && (
                        <button
                          type="button"
                          className="epa-remove-day-btn"
                          onClick={() => removeItineraryDay(dayIndex)}
                        >
                          <Trash2 size={16} /> Remove Day
                        </button>
                      )}
                    </div>
                    <div className="epa-form-group">
                      <label className="epa-label">Day Title</label>
                      <input
                        type="text"
                        value={day.title}
                        onChange={(e) =>
                          handleItineraryChange(
                            dayIndex,
                            "title",
                            e.target.value
                          )
                        }
                        className="epa-input"
                        placeholder="Enter day title"
                      />
                    </div>
                    <div className="epa-activities">
                      <div className="epa-activities-header">
                        <label className="epa-label">Activities</label>
                        <button
                          type="button"
                          className="epa-add-activity-btn"
                          onClick={() => addActivity(dayIndex)}
                        >
                          <Plus size={14} /> Add Activity
                        </button>
                      </div>
                      {day.activities.map((activity, actIndex) => (
                        <div key={actIndex} className="epa-list-item">
                          <input
                            type="text"
                            value={activity}
                            onChange={(e) =>
                              handleActivityChange(
                                dayIndex,
                                actIndex,
                                e.target.value
                              )
                            }
                            onPaste={(e) => handleActivityPaste(dayIndex, actIndex, e)}
                            className="epa-input"
                            placeholder="Enter activity"
                          />
                          {day.activities.length > 1 && (
                            <button
                              type="button"
                              className="epa-remove-btn"
                              onClick={() => removeActivity(dayIndex, actIndex)}
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="epa-form-actions">
              <button
                type="button"
                className="epa-btn epa-btn--cancel"
                onClick={handleCancel}
                disabled={submitting}
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="epa-btn epa-btn--submit"
                disabled={submitting}
              >
                {submitting ? (
                    'UPDATING...' 
                ) : (
                    <>
                        <Save size={18} /> UPDATE PACKAGE
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

export default EditPackage;
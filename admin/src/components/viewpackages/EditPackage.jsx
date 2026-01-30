import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, X, Plus, Trash2, Save } from "lucide-react"; 
import Sidebar from "../sidebar/sidebar";
import "./editpackage.css";

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

const EditPackage = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get ID from URL params
  const packageId = id;

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    destination: "",
    tourType: "private",  
    pax: "",             
    minPax: "",          
    sellerPrice: "",
    markup: "",
    // ✅ NEW: Markup Type added
    markupType: "flat", 
    duration: "",
    category: "Local",
    existingImage: "",
    existingImagePublicId: "" 
  });

  // ✅ Store original data to track changes for Activity Logs
  const [originalData, setOriginalData] = useState(null);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [inclusions, setInclusions] = useState([""]);
  const [itinerary, setItinerary] = useState([
    { day: 1, title: "", activities: [""] },
  ]);

  const API_BASE_URL = "https://wanderwaveph-backend.onrender.com/api/packages";

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
      tourType: data.tourType || "private",
      pax: data.pax || "",
      minPax: data.minPax || "",
      sellerPrice: data.sellerPrice || "",
      markup: data.markup || "",
      // ✅ NEW: Restore markupType
      markupType: data.markupType || "flat",
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
            tourType: pkg.tourType || "private",
            pax: pkg.pax || "",
            minPax: pkg.minPax || "",
            sellerPrice: sellerPriceValue,
            markup: markupValue,
            // ✅ NEW: Capture original markupType
            markupType: pkg.markupType || "flat",
            duration: pkg.duration || "",
            category: pkg.category || "Local",
            inclusions: currentInclusions,
            itinerary: currentItinerary
          });

          setFormData({
            title: pkg.title || "",
            destination: pkg.destination || "",
            tourType: pkg.tourType || "private",
            pax: pkg.pax || "",
            minPax: pkg.minPax || "",
            sellerPrice: sellerPriceValue,
            markup: markupValue,
            // ✅ NEW: Set markupType
            markupType: pkg.markupType || "flat",
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
          alert("Failed to load package data: " + result.error);
          navigate("/view-packages");
        }
      } catch (err) {
        console.error("Error fetching package:", err);
        alert("Failed to load package data. Please try again.");
        navigate("/view-packages");
      } finally {
        setLoading(false);
      }
    };

    fetchPackageData();
  }, [packageId, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ NEW: Dynamic Price Calculation (same logic as EditTour)
  const calculatedPrice = useMemo(() => {
    const price = parseFloat(formData.sellerPrice) || 0;
    const markupVal = parseFloat(formData.markup) || 0;
    
    if (formData.markupType === 'percentage') {
      return price + (price * (markupVal / 100));
    }
    return price + markupVal;
  }, [formData.sellerPrice, formData.markup, formData.markupType]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.destination ||
      !formData.sellerPrice ||
      !formData.duration
    ) {
      alert("Please fill in all required fields");
      return;
    }

    if (formData.tourType === 'private' && (!formData.pax || parseInt(formData.pax) < 1)) {
      alert("Pax is required for private tours and must be at least 1");
      return;
    }

    if (formData.tourType === 'joiners' && (!formData.minPax || parseInt(formData.minPax) < 1)) {
      alert("Minimum pax is required for joiner tours and must be at least 1");
      return;
    }

    setSubmitting(true);

    const { userEmail, adminId } = getAdminData();

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("destination", formData.destination);
      
      formDataToSend.append("tourType", formData.tourType);
      if (formData.tourType === 'private') {
        formDataToSend.append("pax", formData.pax);
      } else if (formData.tourType === 'joiners') {
        formDataToSend.append("minPax", formData.minPax);
      }

      formDataToSend.append("sellerPrice", formData.sellerPrice);
      formDataToSend.append("markup", formData.markup || 0);
      // ✅ NEW: Send markupType to backend
      formDataToSend.append("markupType", formData.markupType);

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
          trackChange("Tour Type", originalData.tourType, formData.tourType);
          
          if (formData.tourType === 'private') {
            trackChange("Pax", originalData.pax, formData.pax);
          } else if (formData.tourType === 'joiners') {
            trackChange("Minimum Pax", originalData.minPax, formData.minPax);
          }

          trackChange("Seller Price", originalData.sellerPrice, formData.sellerPrice);
          trackChange("Markup", originalData.markup, formData.markup);
          // ✅ NEW: Track markupType change
          trackChange("Markup Type", originalData.markupType, formData.markupType);
          
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
        alert("Package updated successfully!");
        await clearDraft();
        navigate("/view-packages");
      } else {
        alert("Failed to update package: " + (result.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error updating package:", err);
      alert("Error updating package. Please try again.");
    } finally {
      setSubmitting(false);
    }
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

  return (
    <div className="epa-page">
      
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
            <div className="epa-header-content">
              <button
                className="epa-back-btn"
                onClick={() => navigate("/view-packages")}
              >
                <ArrowLeft size={20} />
                Back to Packages
              </button>
              <h1 className="epa-title">Edit Package</h1>
              <p className="epa-subtitle">
                Update package information and details
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="epa-form">

            {/* Image Upload */}
            <div className="epa-section">
              <h2 className="epa-section-title">Package Image</h2>
              <div className="epa-upload-area">
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="epa-file-input"
                />
                <label htmlFor="image-upload" className="epa-upload-label">
                  {imagePreview ? (
                    <div className="epa-image-preview">
                      <img src={imagePreview} alt="Preview" />
                      <div className="epa-image-overlay">
                        <Upload size={24} />
                        <span>Click to change image</span>
                      </div>
                    </div>
                  ) : (
                    <div className="epa-upload-placeholder">
                      <Upload size={48} />
                      <span>Click to upload image</span>
                    </div>
                  )}
                </label>
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
                    placeholder="Enter package title"
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
                    placeholder="Enter destination"
                    required
                  />
                </div>

                {/* Tour Type Selection */}
                <div className="epa-form-group">
                  <label className="epa-label">Tour Type *</label>
                  <select
                    name="tourType"
                    value={formData.tourType}
                    onChange={handleInputChange}
                    className="epa-input"
                    required
                  >
                    <option value="private">Private</option>
                    <option value="joiners">Joiners</option>
                  </select>
                </div>

                {/* Show pax field only for private tours */}
                {formData.tourType === 'private' && (
                  <div className="epa-form-group">
                    <label className="epa-label">Pax *</label>
                    <input
                      type="number"
                      name="pax"
                      value={formData.pax}
                      onChange={handleInputChange}
                      className="epa-input"
                      placeholder="e.g., 2"
                      min="1"
                      required={formData.tourType === 'private'}
                    />
                  </div>
                )}

                {/* Show minPax field only for joiners */}
                {formData.tourType === 'joiners' && (
                  <div className="epa-form-group">
                    <label className="epa-label">Minimum Pax *</label>
                    <input
                      type="number"
                      name="minPax"
                      value={formData.minPax}
                      onChange={handleInputChange}
                      className="epa-input"
                      placeholder="e.g., 4"
                      min="1"
                      required={formData.tourType === 'joiners'}
                    />
                  </div>
                )}

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
                    <option value="flat">Flat Amount (₱)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>

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
                    placeholder={formData.markupType === 'percentage' ? "e.g., 10" : "0.00"}
                    step="0.01"
                  />
                </div>

                <div className="epa-form-group">
                  <label className="epa-label">Final Price (₱)</label>
                  <input
                    type="text"
                    value={`₱${calculatedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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
                onClick={async () => {
                    await clearDraft(); 
                    navigate("/view-packages");
                }}
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
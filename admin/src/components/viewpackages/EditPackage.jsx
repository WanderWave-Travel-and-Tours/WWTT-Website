import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, X, Plus, Trash2 } from "lucide-react";
import Sidebar from "../sidebar/sidebar";
import "./editpackage.css";

// ✅ Imports for Draft Functionality
import useAutoDraft from '../../hooks/useAutoDraft';
import RestoreDraftModal from '../../components/RestoreDraftModal/RestoreDraftModal';

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
    sellerPrice: "",
    markup: "",
    duration: "",
    category: "Local",
    existingImage: "",
  });

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
      // 🛑 FIX: Don't save draft if data is still loading or form is empty
      if (loading) {
        setDraftPayload(null);
        return;
      }

      // Check if form is effectively empty/default
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
        ...formData,
        inclusions,
        itinerary,
        image: imageBase64, // Saved as Base64 string
        imageMeta: imageMeta,
        originalId: packageId // Store ID to ensure we only restore draft for THIS package
      });
    };

    const timeoutId = setTimeout(() => {
      updateDraft();
    }, 500); // Debounce

    return () => clearTimeout(timeoutId);
  }, [formData, inclusions, itinerary, imageFile, loading, packageId]);

  // 4. Restore Function
  const restoreDraftData = async (data) => {
    if (!data) return;
    
    // Safety check: Ensure the draft belongs to the package we are currently editing
    if (data.originalId && data.originalId !== packageId) {
      console.warn("Draft found but belongs to a different package ID. Ignoring.");
      return;
    }

    setFormData({
      title: data.title || "",
      destination: data.destination || "",
      sellerPrice: data.sellerPrice || "",
      markup: data.markup || "",
      duration: data.duration || "",
      category: data.category || "Local",
      existingImage: data.existingImage || ""
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

  // 5. Initialize Hook
  const { 
    clearDraft, 
    hasDraft, 
    restoreDraft, 
    discardDraft,
    draftInfo 
  } = useAutoDraft({
    module: `edit-package-${packageId}`, // Unique ID per package to avoid conflicts
    formData: draftPayload,
    setFormData: restoreDraftData,
    imagePreview: imagePreview, 
    autoRestore: false // Manual via modal
  });

  // 6. Modal State
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  useEffect(() => {
    // Only show modal if we have a draft AND we are done loading the original data
    if (hasDraft && !loading) {
      setShowRestoreModal(true);
    }
  }, [hasDraft, loading]);

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

  // Fetch package data
  useEffect(() => {
    if (!packageId) {
      console.error("No package ID provided");
      navigate("/view-packages");
      return;
    }

    const fetchPackageData = async () => {
      try {
        console.log("Fetching package with ID:", packageId);
        const response = await fetch(`${API_BASE_URL}/${packageId}`);
        const result = await response.json();

        console.log("API Response:", result);

        if (result.status === "ok") {
          const pkg = result.data;
          
          // Handle price fields properly - support both old and new formats
          let sellerPriceValue = 0;
          let markupValue = 0;
          
          if (pkg.sellerPrice !== undefined && pkg.sellerPrice !== null) {
            // New format with sellerPrice and markup
            sellerPriceValue = pkg.sellerPrice;
            markupValue = pkg.markup !== undefined && pkg.markup !== null ? pkg.markup : 0;
          } else if (pkg.price !== undefined && pkg.price !== null) {
            // Old format with only price - treat entire price as seller price
            sellerPriceValue = pkg.price;
            markupValue = 0;
          }
          
          // Only update state if we haven't restored a draft yet
          // (Or you can choose to overwrite state and let the draft modal override it later)
          setFormData({
            title: pkg.title || "",
            destination: pkg.destination || "",
            sellerPrice: sellerPriceValue,
            markup: markupValue,
            duration: pkg.duration || "",
            category: pkg.category || "Local",
            existingImage: pkg.image || "",
          });

          setInclusions(
            pkg.inclusions && pkg.inclusions.length > 0 ? pkg.inclusions : [""]
          );
          setItinerary(
            pkg.itinerary && pkg.itinerary.length > 0
              ? pkg.itinerary
              : [{ day: 1, title: "", activities: [""] }]
          );

          if (pkg.image) {
            setImagePreview(`https://wanderwaveph-backend.onrender.com/uploads/${pkg.image}`);
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

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle image upload
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

  // Inclusions handlers
  const handleInclusionChange = (index, value) => {
    const newInclusions = [...inclusions];
    newInclusions[index] = value;
    setInclusions(newInclusions);
  };

  const addInclusion = () => {
    setInclusions([...inclusions, ""]);
  };

  const removeInclusion = (index) => {
    if (inclusions.length > 1) {
      setInclusions(inclusions.filter((_, i) => i !== index));
    }
  };

  // Itinerary handlers
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
      // Renumber days
      newItinerary.forEach((item, i) => {
        item.day = i + 1;
      });
      setItinerary(newItinerary);
    }
  };

  // Submit handler
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

    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("destination", formData.destination);
      formDataToSend.append("sellerPrice", formData.sellerPrice);
      formDataToSend.append("markup", formData.markup || 0);
      formDataToSend.append("duration", formData.duration);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("existingImage", formData.existingImage);

      // Filter empty inclusions
      const filteredInclusions = inclusions.filter((inc) => inc.trim() !== "");
      formDataToSend.append("inclusions", JSON.stringify(filteredInclusions));

      // Filter empty itinerary
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

      console.log("Submitting update for package ID:", packageId);

      const response = await fetch(`${API_BASE_URL}/edit/${packageId}`, {
        method: "PUT",
        body: formDataToSend,
      });

      const result = await response.json();

      console.log("Update response:", result);

      if (result.status === "ok") {
        alert("Package updated successfully!");
        
        // ✅ CLEAR DRAFT ON SUCCESS
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
      <div className="ep-page">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
        />
        <main
          className={`ep-main ${
            isSidebarCollapsed ? "ep-main--collapsed" : ""
          }`}
        >
          <div className="ep-loading">
            <div className="ep-spinner"></div>
            <p>Loading package data...</p>
          </div>
        </main>
      </div>
    );
  }

  const calculatedPrice =
    (parseFloat(formData.sellerPrice) || 0) +
    (parseFloat(formData.markup) || 0);

  return (
    <div className="ep-page">
      
      {/* ✅ RESTORE DRAFT MODAL */}
      <RestoreDraftModal
        isOpen={showRestoreModal}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
        draftInfo={draftInfo}
      />

      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      <main
        className={`ep-main ${isSidebarCollapsed ? "ep-main--collapsed" : ""}`}
      >
        <div className="ep-container">
          <div className="ep-header">
            <div className="ep-header-content">
              <button
                className="ep-back-btn"
                onClick={() => navigate("/view-packages")}
              >
                <ArrowLeft size={20} />
                Back to Packages
              </button>
              <h1 className="ep-title">Edit Package</h1>
              <p className="ep-subtitle">
                Update package information and details
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="ep-form">

            {/* Image Upload */}
            <div className="ep-section">
              <h2 className="ep-section-title">Package Image</h2>
              <div className="ep-upload-area">
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="ep-file-input"
                />
                <label htmlFor="image-upload" className="ep-upload-label">
                  {imagePreview ? (
                    <div className="ep-image-preview">
                      <img src={imagePreview} alt="Preview" />
                      <div className="ep-image-overlay">
                        <Upload size={24} />
                        <span>Click to change image</span>
                      </div>
                    </div>
                  ) : (
                    <div className="ep-upload-placeholder">
                      <Upload size={48} />
                      <span>Click to upload image</span>
                    </div>
                  )}
                </label>
              </div>
            </div>
            
            {/* Basic Information */}
            <div className="ep-section">
              <h2 className="ep-section-title">Basic Information</h2>
              <div className="ep-form-grid">
                <div className="ep-form-group">
                  <label className="ep-label">Package Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="ep-input"
                    placeholder="Enter package title"
                    required
                  />
                </div>

                <div className="ep-form-group">
                  <label className="ep-label">Destination *</label>
                  <input
                    type="text"
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                    className="ep-input"
                    placeholder="Enter destination"
                    required
                  />
                </div>

                <div className="ep-form-group">
                  <label className="ep-label">Duration *</label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="ep-input"
                    placeholder="e.g., 3 Days 2 Nights"
                    required
                  />
                </div>

                <div className="ep-form-group">
                  <label className="ep-label">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="ep-input"
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
            <div className="ep-section">
              <h2 className="ep-section-title">Pricing</h2>
              <div className="ep-form-grid">
                <div className="ep-form-group">
                  <label className="ep-label">Seller Price (₱) *</label>
                  <input
                    type="number"
                    name="sellerPrice"
                    value={formData.sellerPrice}
                    onChange={handleInputChange}
                    className="ep-input"
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </div>

                <div className="ep-form-group">
                  <label className="ep-label">Markup (₱)</label>
                  <input
                    type="number"
                    name="markup"
                    value={formData.markup}
                    onChange={handleInputChange}
                    className="ep-input"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <div className="ep-form-group">
                  <label className="ep-label">Final Price (₱)</label>
                  <input
                    type="text"
                    value={`₱${calculatedPrice.toLocaleString()}`}
                    className="ep-input ep-input--readonly"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Inclusions */}
            <div className="ep-section">
              <div className="ep-section-header">
                <h2 className="ep-section-title">Package Inclusions</h2>
                <button
                  type="button"
                  className="ep-add-btn"
                  onClick={addInclusion}
                >
                  <Plus size={16} /> Add Inclusion
                </button>
              </div>
              <div className="ep-list-items">
                {inclusions.map((inclusion, index) => (
                  <div key={index} className="ep-list-item">
                    <input
                      type="text"
                      value={inclusion}
                      onChange={(e) =>
                        handleInclusionChange(index, e.target.value)
                      }
                      className="ep-input"
                      placeholder="Enter inclusion"
                    />
                    {inclusions.length > 1 && (
                      <button
                        type="button"
                        className="ep-remove-btn"
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
            <div className="ep-section">
              <div className="ep-section-header">
                <h2 className="ep-section-title">Itinerary</h2>
                <button
                  type="button"
                  className="ep-add-btn"
                  onClick={addItineraryDay}
                >
                  <Plus size={16} /> Add Day
                </button>
              </div>
              <div className="ep-itinerary-list">
                {itinerary.map((day, dayIndex) => (
                  <div key={dayIndex} className="ep-itinerary-day">
                    <div className="ep-itinerary-day-header">
                      <h3 className="ep-day-title">Day {day.day}</h3>
                      {itinerary.length > 1 && (
                        <button
                          type="button"
                          className="ep-remove-day-btn"
                          onClick={() => removeItineraryDay(dayIndex)}
                        >
                          <Trash2 size={16} /> Remove Day
                        </button>
                      )}
                    </div>
                    <div className="ep-form-group">
                      <label className="ep-label">Day Title</label>
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
                        className="ep-input"
                        placeholder="Enter day title"
                      />
                    </div>
                    <div className="ep-activities">
                      <div className="ep-activities-header">
                        <label className="ep-label">Activities</label>
                        <button
                          type="button"
                          className="ep-add-activity-btn"
                          onClick={() => addActivity(dayIndex)}
                        >
                          <Plus size={14} /> Add Activity
                        </button>
                      </div>
                      {day.activities.map((activity, actIndex) => (
                        <div key={actIndex} className="ep-list-item">
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
                            className="ep-input"
                            placeholder="Enter activity"
                          />
                          {day.activities.length > 1 && (
                            <button
                              type="button"
                              className="ep-remove-btn"
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
            <div className="ep-form-actions">
              <button
                type="button"
                className="ep-btn ep-btn--cancel"
                onClick={async () => {
                    await clearDraft(); // Clear draft on cancel
                    navigate("/view-packages");
                }}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ep-btn ep-btn--submit"
                disabled={submitting}
              >
                {submitting ? "Updating..." : "Update Package"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EditPackage;
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, X, Plus, Trash2 } from "lucide-react";
import Sidebar from "../sidebar/sidebar";
import "./EditTour.css";

// ✅ Imports for Draft Functionality
import useAutoDraft from '../../hooks/useAutoDraft';
import RestoreDraftModal from '../../components/RestoreDraftModal/RestoreDraftModal';

const EditTour = () => {
  const navigate = useNavigate();
  const { id: tourId } = useParams();

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

  const API_BASE_URL = "http://localhost:5000/api/tours";

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  // Calculate final price
  const calculatedPrice =
    parseFloat(formData.sellerPrice || 0) + parseFloat(formData.markup || 0);

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
        originalId: tourId // Store ID to ensure we only restore draft for THIS tour
      });
    };

    const timeoutId = setTimeout(() => {
      updateDraft();
    }, 500); // Debounce

    return () => clearTimeout(timeoutId);
  }, [formData, inclusions, itinerary, imageFile, loading, tourId]);

  // 4. Restore Function
  const restoreDraftData = async (data) => {
    if (!data) return;
    
    // Safety check: Ensure the draft belongs to the tour we are currently editing
    if (data.originalId && data.originalId !== tourId) {
      console.warn("Draft found but belongs to a different tour ID. Ignoring.");
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
    module: `edit-tour-${tourId}`, // Unique ID per tour to avoid conflicts
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

  // Fetch tour data
  useEffect(() => {
    if (!tourId) {
      navigate("/view-tours");
      return;
    }

    const fetchTourData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/${tourId}`);
        const result = await response.json();

        if (result.status === "ok") {
          const tour = result.data;
          
          // Handle price fields properly - support both old and new formats
          let sellerPriceValue = 0;
          let markupValue = 0;
          
          if (tour.sellerPrice !== undefined && tour.sellerPrice !== null) {
            // New format with sellerPrice and markup
            sellerPriceValue = tour.sellerPrice;
            markupValue = tour.markup !== undefined && tour.markup !== null ? tour.markup : 0;
          } else if (tour.price !== undefined && tour.price !== null) {
            // Old format with only price - treat entire price as seller price
            sellerPriceValue = tour.price;
            markupValue = 0;
          }
          
          // Only update state if we haven't restored a draft yet
          setFormData({
            title: tour.title || "",
            destination: tour.destination || "",
            sellerPrice: sellerPriceValue,
            markup: markupValue,
            duration: tour.duration || "",
            category: tour.category || "Local",
            existingImage: tour.image || "",
          });

          setInclusions(
            tour.inclusions && tour.inclusions.length > 0 ? tour.inclusions : [""]
          );
          setItinerary(
            tour.itinerary && tour.itinerary.length > 0
              ? tour.itinerary
              : [{ day: 1, title: "", activities: [""] }]
          );

          if (tour.image) {
            setImagePreview(`http://localhost:5000/uploads/${tour.image}`);
          }
        }
      } catch (err) {
        console.error("Error fetching tour:", err);
        alert("Failed to load tour data");
      } finally {
        setLoading(false);
      }
    };

    fetchTourData();
  }, [tourId, navigate]);

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

      const response = await fetch(`${API_BASE_URL}/update/${tourId}`, {
        method: "PUT",
        body: formDataToSend,
      });

      const result = await response.json();

      if (result.status === "ok") {
        alert("✅ Tour updated successfully!");
        
        // ✅ CLEAR DRAFT ON SUCCESS
        await clearDraft();
        
        navigate("/view-tours");
      } else {
        alert(`❌ Error: ${result.message || "Failed to update tour"}`);
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("❌ Error connecting to server");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="et-page">
        <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
        <main className={`et-main ${isSidebarCollapsed ? "et-main--collapsed" : ""}`}>
          <div className="et-loading">
            <div className="et-spinner"></div>
            <p>Loading tour data...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="et-page">
      
      {/* ✅ RESTORE DRAFT MODAL */}
      <RestoreDraftModal
        isOpen={showRestoreModal}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
        draftInfo={draftInfo}
      />

      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      <main className={`et-main ${isSidebarCollapsed ? "et-main--collapsed" : ""}`}>
        <div className="et-container">
          {/* Header */}
          <header className="et-header">
            <div className="et-header-content">
              <button className="et-back-btn" onClick={() => navigate("/view-tours")}>
                <ArrowLeft size={18} />
                Back to Tours
              </button>
              <h1 className="et-title">EDIT TOUR</h1>
              <p className="et-subtitle">Modify tour package details and information</p>
            </div>
          </header>

          {/* Form */}
          <form className="et-form" onSubmit={handleSubmit}>
            {/* Image Upload */}
            <div className="et-section">
              <h2 className="et-section-title">Tour Image</h2>
              <div className="et-upload-area">
                <input
                  type="file"
                  id="tourImageUpload"
                  className="et-file-input"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <label htmlFor="tourImageUpload" className="et-upload-label">
                  {imagePreview ? (
                    <div className="et-image-preview">
                      <img src={imagePreview} alt="Preview" />
                      <div className="et-image-overlay">
                        <Upload size={32} />
                        <span>Click to change image</span>
                      </div>
                    </div>
                  ) : (
                    <div className="et-upload-placeholder">
                      <Upload size={48} />
                      <span>Click to upload tour image</span>
                      <p>Recommended: 1200x800px, max 5MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Basic Information */}
            <div className="et-section">
              <h2 className="et-section-title">Basic Information</h2>
              <div className="et-form-grid">
                <div className="et-form-group et-form-group--full">
                  <label className="et-label">Tour Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="et-input"
                    placeholder="e.g., Amazing Boracay Experience"
                    required
                  />
                </div>

                <div className="et-form-group">
                  <label className="et-label">Destination *</label>
                  <input
                    type="text"
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                    className="et-input"
                    placeholder="e.g., Boracay, Philippines"
                    required
                  />
                </div>

                <div className="et-form-group">
                  <label className="et-label">Duration *</label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="et-input"
                    placeholder="e.g., 3 Days 2 Nights"
                    required
                  />
                </div>

                <div className="et-form-group">
                  <label className="et-label">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="et-input"
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
            <div className="et-section">
              <h2 className="et-section-title">Pricing</h2>
              <div className="et-form-grid">
                <div className="et-form-group">
                  <label className="et-label">Seller Price (₱) *</label>
                  <input
                    type="number"
                    name="sellerPrice"
                    value={formData.sellerPrice}
                    onChange={handleInputChange}
                    className="et-input"
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </div>

                <div className="et-form-group">
                  <label className="et-label">Markup (₱)</label>
                  <input
                    type="number"
                    name="markup"
                    value={formData.markup}
                    onChange={handleInputChange}
                    className="et-input"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <div className="et-form-group">
                  <label className="et-label">Final Price (₱)</label>
                  <input
                    type="text"
                    value={`₱${calculatedPrice.toLocaleString()}`}
                    className="et-input et-input--readonly"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Inclusions */}
            <div className="et-section">
              <div className="et-section-header">
                <h2 className="et-section-title">Tour Inclusions</h2>
                <button
                  type="button"
                  className="et-add-btn"
                  onClick={addInclusion}
                >
                  <Plus size={16} /> Add Inclusion
                </button>
              </div>
              <div className="et-list-items">
                {inclusions.map((inclusion, index) => (
                  <div key={index} className="et-list-item">
                    <input
                      type="text"
                      value={inclusion}
                      onChange={(e) =>
                        handleInclusionChange(index, e.target.value)
                      }
                      className="et-input"
                      placeholder="Enter inclusion"
                    />
                    {inclusions.length > 1 && (
                      <button
                        type="button"
                        className="et-remove-btn"
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
            <div className="et-section">
              <div className="et-section-header">
                <h2 className="et-section-title">Itinerary</h2>
                <button
                  type="button"
                  className="et-add-btn"
                  onClick={addItineraryDay}
                >
                  <Plus size={16} /> Add Day
                </button>
              </div>
              <div className="et-itinerary-list">
                {itinerary.map((day, dayIndex) => (
                  <div key={dayIndex} className="et-itinerary-day">
                    <div className="et-itinerary-day-header">
                      <h3 className="et-day-title">Day {day.day}</h3>
                      {itinerary.length > 1 && (
                        <button
                          type="button"
                          className="et-remove-day-btn"
                          onClick={() => removeItineraryDay(dayIndex)}
                        >
                          <Trash2 size={16} /> Remove Day
                        </button>
                      )}
                    </div>
                    <div className="et-form-group">
                      <label className="et-label">Day Title</label>
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
                        className="et-input"
                        placeholder="Enter day title"
                      />
                    </div>
                    <div className="et-activities">
                      <div className="et-activities-header">
                        <label className="et-label">Activities</label>
                        <button
                          type="button"
                          className="et-add-activity-btn"
                          onClick={() => addActivity(dayIndex)}
                        >
                          <Plus size={14} /> Add Activity
                        </button>
                      </div>
                      {day.activities.map((activity, actIndex) => (
                        <div key={actIndex} className="et-list-item">
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
                            className="et-input"
                            placeholder="Enter activity"
                          />
                          {day.activities.length > 1 && (
                            <button
                              type="button"
                              className="et-remove-btn"
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
            <div className="et-form-actions">
              <button
                type="button"
                className="et-btn et-btn--cancel"
                onClick={async () => {
                    await clearDraft(); // Clear draft on cancel
                    navigate("/view-tours");
                }}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="et-btn et-btn--submit"
                disabled={submitting}
              >
                {submitting ? "Updating..." : "Update Tour"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EditTour;
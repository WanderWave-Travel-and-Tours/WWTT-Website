import React, { useState, useEffect } from "react";
import {
  Upload,
  Trash2,
  ImageIcon,
  Info,
  Loader2,
} from "lucide-react";
import Sidebar from "../sidebar/sidebar";
import { useToast } from "../toast/ToastManager"; 
import CustomConfirmModal from "../confirmationModal/CustomConfirmModal";
import "./addimage.css";

const AddImage = () => {
  const toast = useToast(); 
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "primary",
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Function para mag-trigger ng modal
  const askConfirmation = (title, message, onConfirm, type = "primary") => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
      type,
    });
  };

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error(
          "Please upload a valid image file (JPG, PNG, WebP).",
          "❌ Invalid File"
        );
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      toast.success(
        `Image "${file.name}" selected successfully!`,
        "Image Selected"
      );
    }
  };

  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    toast.info('Image selection cleared.', 'Removed');
  };

  const handleCancelClick = () => {
    if (!imageFile) return;
    askConfirmation(
      "Discard Selection",
      "Are you sure you want to remove the selected image?",
      () => {
        removeImage();
      },
      "danger"
    );
  };

  const handleSubmitClick = () => {
    if (!imageFile) {
      toast.warning('Please select an image to upload.', 'Missing File');
      return;
    }

    toast.info('Validating image...', 'Processing', 1500);

    askConfirmation(
      "Upload Confirmation",
      `Are you sure you want to upload "${imageFile.name}" to the gallery?`,
      () => performSubmit()
    );
  };

  const performSubmit = async () => {
    setIsSubmitting(true);
    
    toast.info('Uploading image to gallery...', 'Please Wait', 2000);

    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('title', imageFile.name);

    try {
      const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
      const activeUser = adminData.email || adminData.username || adminData.user || 'Unknown User';
      const activeId = adminData.id || adminData._id || "";

      formData.append("userEmail", activeUser);
      formData.append("adminId", activeId);
      
      console.log("Uploading Image as:", activeUser); 
    } catch (err) {
      console.error("Error parsing admin data:", err);
    }

    try {
      const response = await fetch('http://localhost:5000/api/images/add', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `Image "${imageFile.name}" uploaded successfully to gallery!`,
          'Upload Success',
          5000
        );
        
        // Gamit ang neutral toast para sa transition
        toast.neutral('Ready for next upload.', 'Ready', 3000);
        
        // Reset state after success
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImageFile(null);
        setImagePreview(null);
      } else {
        const errorMessage = data.message || 'Unknown error occurred';
        toast.error(
          `Failed to upload: ${errorMessage}`,
          'Upload Error',
          5000
        );
      }
    } catch (error) {
      console.error('Upload Error:', error);
      toast.error(
        `Unable to connect to server: ${error.message}. Make sure the backend is running.`,
        'Connection Error',
        6000
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ai-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

      <main className={`ai-main ${isSidebarCollapsed ? "ai-main--collapsed" : ""}`}>
        <div className="ai-container">
          <header className="ai-header">
            <div className="ai-header-content">
              <h1 className="ai-title">GALLERY UPLOAD</h1>
              <p className="ai-subtitle">
                Manage and expand your website's visual assets
              </p>
            </div>
          </header>

          <div className="ai-grid">
            <div className="ai-left">
              <section className="ai-section">
                <h2 className="ai-section-title">IMAGE UPLOAD</h2>

                {!imagePreview ? (
                  <div className="ai-upload-zone-container">
                    <input
                      type="file"
                      id="gallery-upload"
                      accept="image/*"
                      onChange={handleImageChange}
                      hidden
                    />
                    <label htmlFor="gallery-upload" className="ai-upload-label-poster">
                      <div className="ai-upload-icon-box">
                        <Upload size={32} />
                      </div>
                      <p style={{ fontWeight: "700", color: "#1e293b", margin: "0" }}>
                        Click to select image
                      </p>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        JPG, PNG or WebP allowed
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="ai-upload-preview-box">
                    <img src={imagePreview} alt="Preview" />
                    <div className="ai-upload-actions">
                      <label className="ai-upload-change-btn">
                        <input
                          type="file"
                          onChange={handleImageChange}
                          accept="image/*"
                          hidden
                        />
                        Change
                      </label>
                      <button
                        type="button"
                        className="ai-upload-remove-btn"
                        onClick={handleCancelClick}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </section>

              <section className="ai-section">
                <h2 className="ai-section-title">FILE INFORMATION</h2>
                <div className="ai-info-box">
                  <div className="ai-info-item">
                    <Info size={16} />
                    <span>Images uploaded here will be visible in the public gallery.</span>
                  </div>
                  <div className="ai-info-item">
                    <Info size={16} />
                    <span>Recommended resolution: 1920x1080 for best quality.</span>
                  </div>
                </div>
              </section>
            </div>

            <aside className="ai-right">
              <div className="ai-preview-card">
                <span className="ai-preview-label">LIVE PREVIEW</span>

                <div className="ai-card-mock">
                  <div className="ai-card-img-wrapper">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" />
                    ) : (
                      <div className="ai-card-placeholder">
                        <ImageIcon size={48} />
                      </div>
                    )}
                  </div>
                  <div className="ai-card-body">
                    <h4 className="ai-card-filename">
                      {imageFile ? imageFile.name : "No image selected"}
                    </h4>
                    <span className="ai-card-tag">Gallery Asset</span>
                  </div>
                </div>

                <div className="ai-stats">
                  <div className="ai-stat">
                    <strong>Type</strong>
                    <span>
                      {imageFile ? imageFile.type.split("/")[1].toUpperCase() : "--"}
                    </span>
                  </div>
                  <div className="ai-stat">
                    <strong>Size</strong>
                    <span>
                      {imageFile ? (imageFile.size / 1024 / 1024).toFixed(2) + " MB" : "--"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="ai-actions-group">
                <button
                  className="ai-btn-cancel"
                  onClick={handleCancelClick}
                  disabled={!imageFile || isSubmitting}
                >
                  Cancel
                </button>
                <button
                  className="ai-btn-submit-styled"
                  onClick={handleSubmitClick}
                  disabled={isSubmitting || !imageFile}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="ai-spinner" size={18} /> Uploading...
                    </>
                  ) : (
                    "Upload"
                  )}
                </button>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <CustomConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default AddImage;
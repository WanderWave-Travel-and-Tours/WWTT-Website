import React from "react";
import {
  X,
  MapPin,
  Clock,
  Tag,
  CreditCard,
  Edit,
  Trash2,
  CheckCircle,
  Image as ImageIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./PackageDetailModal.css";

const PackageDetailModal = ({
  showModal,
  selectedPackage,
  setShowModal,
  handleArchive,
}) => {
  const navigate = useNavigate();

  if (!showModal || !selectedPackage) return null;

  const closeModal = () => setShowModal(false);

  // Helper function: PRIORITY - Database first, then Cloudinary
  const getImageUrl = (image) => {
    if (!image) return "https://via.placeholder.com/800x400?text=No+Image";
    
    // If already a full URL (Cloudinary), use it
    if (image.startsWith("http")) {
      return image;
    }
    
    // DEFAULT: Try database/uploads folder first
    return `http://localhost:5000/uploads/${image}`;
  };

  // Smart error handler: If database fails, try Cloudinary
  const handleImageError = (e) => {
    e.target.onerror = null; // Prevent infinite loop
    
    // If imagePublicId exists, construct Cloudinary URL
    if (selectedPackage.imagePublicId && selectedPackage.imagePublicId.trim() !== '') {
      const cloudinaryUrl = `https://res.cloudinary.com/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'dg0cmujxy'}/image/upload/${selectedPackage.imagePublicId}`;
      console.log(`📸 Fallback to Cloudinary: ${cloudinaryUrl}`);
      e.target.src = cloudinaryUrl;
    } else {
      // No Cloudinary backup, show placeholder
      console.log(`⚠️ No image found for: ${selectedPackage.title}`);
      e.target.src = "https://via.placeholder.com/800x400?text=No+Image";
    }
  };

  return (
    <div className="tdm-overlay" onClick={closeModal}>
      <div className="tdm-content" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="tdm-header">
          <div className="tdm-header-left">
            <h2 className="tdm-main-title">Package Details</h2>
            <div className="tdm-ref-tag">
              REF: #{selectedPackage._id.slice(-8).toUpperCase()}
            </div>
          </div>
          <div className="tdm-header-right">
            <div className="tdm-status-pill active">
              <CheckCircle size={16} />
              <div className="tdm-status-text">
                <span className="tdm-status-label">ACTIVE</span>
                <span className="tdm-status-subtext">Visible to customers</span>
              </div>
            </div>
            <button className="tdm-close-x" onClick={closeModal}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="tdm-body">
          {/* MEDIA SECTION */}
          <div className="tdm-section-card dashed-border">
            <div className="tdm-processing-bar">
              <CheckCircle size={18} className="tdm-icon-green" />
              <span>Package Media & Assets</span>
            </div>

            <div className="tdm-image-box">
              <img
                src={getImageUrl(selectedPackage.image)}
                className="tdm-customer-image"
                alt={selectedPackage.destination}
                onError={handleImageError}
              />
              <div className="tdm-image-info">
                <div className="tdm-file-pill">
                  <ImageIcon size={14} className="tdm-icon-green" />
                  <span>
                    {selectedPackage.image
                      ? selectedPackage.image.split(/[/\\]/).pop()
                      : "package_image.jpg"}
                  </span>
                </div>
                <button
                  className="tdm-view-link"
                  onClick={() =>
                    window.open(getImageUrl(selectedPackage.image), "_blank")
                  }
                >
                  View Full Image
                </button>
              </div>
            </div>
          </div>

          {/* INFO GRID */}
          <div className="tdm-section-card">
            <h3 className="tdm-section-title">PACKAGE INFORMATION</h3>
            <div className="tdm-info-grid">
              <div className="tdm-info-box">
                <div className="tdm-box-icon blue">
                  <MapPin size={18} />
                </div>
                <div className="tdm-box-content">
                  <label>DESTINATION</label>
                  <p>{selectedPackage.destination}</p>
                </div>
              </div>
              <div className="tdm-info-box">
                <div className="tdm-box-icon yellow">
                  <Clock size={18} />
                </div>
                <div className="tdm-box-content">
                  <label>DURATION</label>
                  <p>{selectedPackage.duration}</p>
                </div>
              </div>
              <div className="tdm-info-box">
                <div className="tdm-box-icon green">
                  <Tag size={18} />
                </div>
                <div className="tdm-box-content">
                  <label>CATEGORY</label>
                  <p>{selectedPackage.category}</p>
                </div>
              </div>
              <div className="tdm-info-box">
                <div className="tdm-box-icon orange">
                  <CreditCard size={18} />
                </div>
                <div className="tdm-box-content">
                  <label>PRICE</label>
                  <p className="tdm-amount-text">
                    ₱{selectedPackage.price.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="tdm-footer">
          <button
            className="tdm-btn-edit"
            onClick={() => navigate(`/edit-package/${selectedPackage._id}`)}
          >
            <Edit size={16} /> Edit
          </button>
          <button
            className="tdm-btn-danger"
            onClick={() => {
              handleArchive(selectedPackage._id);
              closeModal();
            }}
          >
            <Trash2 size={16} /> Archive
          </button>
        </div>
      </div>
    </div>
  );
};

export default PackageDetailModal;
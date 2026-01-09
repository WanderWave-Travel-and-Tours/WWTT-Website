import React, { useState, useEffect } from "react";
import Sidebar from "../sidebar/sidebar";
import "./editservice.css";
import { useParams, useNavigate } from "react-router-dom";
import {
  Briefcase,
  Plane,
  BookOpen,
  Hotel,
  FileText,
  Calendar,
  Ship,
  HeartHandshake,
  ShieldCheck,
  ArrowLeft,
  Upload,
  Save,
} from "lucide-react";

const API_BASE_URL = "https://wanderwaveph-backend.onrender.com/api/services";

const EditService = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Standard categories list
  const STANDARD_CATEGORIES = ['TRAVEL', 'DOCUMENTATION', 'FINANCIAL'];

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    otherCategory: "", // Added state for the custom input
    price: "",
    description: "",
    icon: "Briefcase",
    order: 0,
    status: "Active",
  });

  const [currentImage, setCurrentImage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const iconOptions = [
    "Briefcase",
    "Plane",
    "BookOpen",
    "Hotel",
    "FileText",
    "Calendar",
    "Ship",
    "HeartHandshake",
    "ShieldCheck",
  ];

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        const result = await response.json();

        if (response.ok && result.success) {
          const data = result.data;

          // LOGIC: Check if the category from DB is one of the standard ones
          // If NOT standard, set dropdown to 'OTHER' and put value in 'otherCategory'
          let categoryState = "";
          let otherCategoryState = "";

          if (STANDARD_CATEGORIES.includes(data.category)) {
            categoryState = data.category;
          } else {
            categoryState = "OTHER";
            otherCategoryState = data.category;
          }

          setFormData({
            title: data.title,
            category: categoryState,
            otherCategory: otherCategoryState, 
            price: data.price,
            description: data.description || "",
            icon: data.icon || "Briefcase",
            order: data.order || 0,
            status: data.isActive ? "Active" : "Inactive",
          });

          const imgUrl = data.image.startsWith("http")
            ? data.image
            : `https://wanderwaveph-backend.onrender.com/uploads/${data.image}`;
          setCurrentImage(imgUrl);
        } else {
          setError("Service not found.");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Network error.");
      } finally {
        setLoading(false);
      }
    };

    fetchServiceDetails();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = new FormData();
      data.append("title", formData.title);
      
      // LOGIC: If 'OTHER' is selected, send the text from 'otherCategory' input
      // Otherwise, send the selected dropdown value
      const finalCategory = formData.category === "OTHER" 
        ? formData.otherCategory 
        : formData.category;

      data.append("category", finalCategory);
      data.append("price", formData.price);
      data.append("description", formData.description);
      data.append("icon", formData.icon);
      data.append("order", formData.order);
      data.append("isActive", formData.status === "Active");

      if (imageFile) {
        data.append("image", imageFile);
      }

      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "PUT",
        body: data,
      });

      if (response.ok) {
        alert("Service updated successfully!");
        navigate("/view-services");
      } else {
        alert("Failed to update.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const getIconComponent = (iconName) => {
    const icons = {
      Briefcase,
      Plane,
      BookOpen,
      Hotel,
      FileText,
      Calendar,
      Ship,
      HeartHandshake,
      ShieldCheck,
    };
    const Icon = icons[iconName] || Briefcase;
    return <Icon size={20} />;
  };

  if (loading) {
    return (
      <div className="editservice-page">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
        />
        <main
          className={`editservice-main ${
            isSidebarCollapsed ? "editservice-main--collapsed" : ""
          }`}
        >
          <div className="editservice-loading">
            <div className="editservice-spinner"></div>
            <p>Loading service details...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="editservice-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

      <main
        className={`editservice-main ${
          isSidebarCollapsed ? "editservice-main--collapsed" : ""
        }`}
      >
        <div className="editservice-container">
          <header className="editservice-header">
            <div className="editservice-header-content">
              <button
                className="editservice-back-btn"
                type="button"
                onClick={() => navigate("/view-services")}
              >
                <ArrowLeft size={18} />
                Back to Services
              </button>
              <h1 className="editservice-title">EDIT SERVICE</h1>
              <div className="editservice-subtitle">
                Update visual assets and service details
              </div>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="editservice-form">
            {/* SECTION 1: VISUALS */}
            <div className="editservice-section">
              <h2 className="editservice-section-title">SERVICE VISUALS</h2>

              <div className="editservice-form-grid">
                {/* Image Upload */}
                <div className="editservice-form-group editservice-form-group--full">
                  <label className="editservice-label">Service Image</label>
                  <div className="editservice-upload-area">
                    <input
                      type="file"
                      id="serviceImageUpload"
                      className="editservice-file-input"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    <label
                      htmlFor="serviceImageUpload"
                      className="editservice-upload-label"
                    >
                      <div className="editservice-image-preview">
                        <img
                          src={imagePreview || currentImage}
                          alt="Service Preview"
                        />
                        <div className="editservice-image-overlay">
                          <Upload size={32} />
                          <span>Click to change image</span>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Icon Selector */}
                <div className="editservice-form-group editservice-form-group--full">
                  <label className="editservice-label">Display Icon</label>
                  <div className="editservice-icon-grid">
                    {iconOptions.map((iconName) => (
                      <div
                        key={iconName}
                        className={`editservice-icon-option ${
                          formData.icon === iconName ? "selected" : ""
                        }`}
                        onClick={() =>
                          setFormData({ ...formData, icon: iconName })
                        }
                      >
                        {getIconComponent(iconName)}
                        <span>{iconName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: DETAILS */}
            <div className="editservice-section">
              <h2 className="editservice-section-title">SERVICE INFORMATION</h2>

              <div className="editservice-form-grid">
                {/* Title */}
                <div className="editservice-form-group">
                  <label className="editservice-label">Service Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="editservice-input"
                    placeholder="e.g. Flight Booking"
                  />
                </div>

                {/* Status */}
                <div className="editservice-form-group">
                  <label className="editservice-label">Status *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="editservice-select"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Coming Soon (Inactive)</option>
                  </select>
                </div>

                {/* Category */}
                <div className="editservice-form-group">
                  <label className="editservice-label">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="editservice-select"
                  >
                    <option value="" disabled>
                      Select a category
                    </option>
                    <option value="TRAVEL">TRAVEL</option>
                    <option value="DOCUMENTATION">DOCUMENTATION</option>
                    <option value="FINANCIAL">FINANCIAL</option>
                    <option value="OTHER">OTHER</option>
                  </select>

                  {/* CUSTOM CATEGORY INPUT */}
                  {formData.category === "OTHER" && (
                    <div className="other-input-container" style={{ marginTop: '10px' }}>
                      <input
                        type="text"
                        name="otherCategory"
                        value={formData.otherCategory} // Added value binding
                        placeholder="Please specify category"
                        onChange={handleChange}
                        required={formData.category === "OTHER"} // Required only if OTHER is selected
                        className="editservice-input other-input"
                      />
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="editservice-form-group">
                  <label className="editservice-label">Price (₱)</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    className="editservice-input"
                    placeholder="0.00"
                  />
                </div>

                {/* Order */}
                <div className="editservice-form-group">
                  <label className="editservice-label">Display Order</label>
                  <input
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleChange}
                    className="editservice-input"
                    placeholder="0"
                  />
                </div>

                {/* Description */}
                <div className="editservice-form-group editservice-form-group--full">
                  <label className="editservice-label">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="5"
                    className="editservice-textarea"
                    placeholder="Describe the service..."
                  ></textarea>
                </div>
              </div>
            </div>

            {/* STICKY FOOTER ACTIONS */}
            <div className="editservice-form-actions">
              <button
                type="button"
                className="editservice-btn editservice-btn--cancel"
                onClick={() => navigate("/view-services")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="editservice-btn editservice-btn--submit"
                disabled={submitting}
              >
                {submitting ? (
                  "Saving..."
                ) : (
                  <>
                    <Save size={18} /> Update Service
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

export default EditService;
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, X, FileText, User, MessageSquare, DollarSign } from "lucide-react";
import Sidebar from "../../sidebar/sidebar"; 
import { useToast } from "../../toast/ToastManager"; 
import "./EditCenomar.css"; 

const EditCenomar = () => {
  const navigate = useNavigate();
  const { id: cenomarId } = useParams();
  const toast = useToast(); 

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // HARDCODED DROPDOWN OPTIONS
  const cenomarOptions = [
    { label: "CENOMAR - ₱150", value: "CENOMAR - ₱150", price: 150 },
    { label: "cenomar - ₱100", value: "cenomar - ₱100", price: 100 }
  ];

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    contactNumber: "",
    address: "",
    estimatedPrice: "",
    message: "",
    serviceName: "",
    cenomarDocument: "",
    existingImage: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const API_BASE_URL = "http://localhost:5000/api/inquiries"; 

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  useEffect(() => {
    const fetchCenomarDetails = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/${cenomarId}`);
        const result = await res.json();
        
        if (result.success && result.data) {
          const data = result.data;
          
          setFormData({
            fullName: data.fullName || "",
            email: data.email || "",
            contactNumber: data.contactNumber || "",
            address: data.address || "",
            estimatedPrice: data.estimatedPrice || "",
            message: data.message || "",
            serviceName: data.serviceName || "",
            cenomarDocument: data.cenomarDocument || "",
            existingImage: data.evidenceName || "", 
          });

          if (data.evidenceName) {
            setImagePreview(`http://localhost:5000/uploads/${data.evidenceName}`);
          }
        } else {
            console.error("Data not found:", result.message);
            toast.error("Could not find the requested record.", "Data Error");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error("Failed to fetch data from the server.", "Connection Error");
      } finally {
        setLoading(false);
      }
    };

    if (cenomarId) fetchCenomarDetails();
  }, [cenomarId, toast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Contact Number typing validation
    if (name === "contactNumber") {
      const regex = /^\+?[0-9]*$/;
      if (!regex.test(value)) {
        toast.warning("Only numbers and '+' sign (at the beginning) are allowed.", "Invalid Format");
        return;
      }
    }

    // Dropdown Price Mapping Logic
    if (name === "cenomarDocument") {
      const selectedOption = cenomarOptions.find(opt => opt.value === value);
      if (selectedOption) {
        setFormData(prev => ({
          ...prev,
          cenomarDocument: value,
          estimatedPrice: selectedOption.price // Automatic update ng presyo base sa pinili
        }));
        return;
      }
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/webp", "image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file format. Only WebP, PNG, JPEG, and JPG are allowed.", "Invalid File Type");
      e.target.value = ""; 
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    toast.info("Image selected successfully.");
  };

  const handleRemoveImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImagePreview("");
    setImageFile(null);
    const fileInput = document.getElementById("cenomar-img");
    if (fileInput) fileInput.value = "";
    toast.warning("Image has been removed.");
  };

  const validateContactNumber = (number) => {
    const digitsOnly = number.replace(/\+/g, "");
    if (digitsOnly.length < 8) {
      toast.error("Contact number must be at least 8 digits long.", "Validation Error");
      return false;
    }
    if (digitsOnly.length > 20) {
      toast.error("Contact number cannot exceed 20 digits.", "Validation Error");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateContactNumber(formData.contactNumber)) {
      return; 
    }

    setSubmitting(true);

    const data = new FormData();
    data.append("fullName", formData.fullName);
    data.append("email", formData.email);
    data.append("contactNumber", formData.contactNumber);
    data.append("address", formData.address);
    data.append("estimatedPrice", formData.estimatedPrice);
    data.append("message", formData.message);
    data.append("serviceName", formData.serviceName);
    data.append("cenomarDocument", formData.cenomarDocument);

    if (imageFile) {
      data.append("evidence", imageFile); 
    }

    try {
      const res = await fetch(`${API_BASE_URL}/update/${cenomarId}`, {
        method: "PUT",
        body: data,
      });
      const result = await res.json();
      if (result.success) {
        toast.success("CENOMAR Request updated successfully!");
        setTimeout(() => {
            navigate("/services/cenomar");
        }, 2000);
      } else {
        toast.error(result.message || "Failed to update the record.", "Update Failed");
      }
    } catch (err) {
      toast.error("Connection failed. Please check your server.", "Server Error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="et-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      <main className={`et-main ${isSidebarCollapsed ? "et-main--collapsed" : ""}`}>
        <div className="et-loading">
          <div className="et-spinner"></div>
          <p>Loading CENOMAR inquiry details...</p>
        </div>
      </main>
    </div>
  );

  return (
    <div className="et-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      <main className={`et-main ${isSidebarCollapsed ? "et-main--collapsed" : ""}`}>
        <div className="et-container">
          
          <header className="et-header">
            <div className="et-header-content">
              <button className="et-back-btn" onClick={() => navigate(-1)}>
                <ArrowLeft size={18} /> Back to Requests
              </button>
              <h1 className="et-title">EDIT CENOMAR REQUEST</h1>
              <p className="et-subtitle">Review and update the information provided by the client</p>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="et-form">
            <div className="et-section">
              <h2 className="et-section-title">CENOMAR DOCUMENT IMAGE</h2>
              <div className="et-upload-area">
                <input
                  type="file"
                  id="cenomar-img"
                  className="et-file-input"
                  accept=".webp,.png,.jpeg,.jpg"
                  onChange={handleImageChange}
                />
                <label htmlFor="cenomar-img" className="et-upload-label">
                  {imagePreview ? (
                    <div className="et-image-preview">
                      <img src={imagePreview} alt="CENOMAR Document" />
                      <div className="et-image-overlay">
                        <Upload size={32} />
                        <span>Click to change image</span>
                      </div>
                      <button 
                        type="button" 
                        className="et-remove-img-btn" 
                        onClick={handleRemoveImage}
                      >
                        <X size={16} /> Remove
                      </button>
                    </div>
                  ) : (
                    <div className="et-upload-placeholder">
                      <Upload size={48} />
                      <span>No Document Image Uploaded</span>
                      <p>WebP, PNG, JPEG, JPG only</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="et-section">
              <h2 className="et-section-title"><User size={18} /> Client Information</h2>
              <div className="et-form-grid">
                <div className="et-form-group et-form-group--full">
                  <label className="et-label">Full Name</label>
                  <input 
                    type="text" 
                    name="fullName" 
                    value={formData.fullName} 
                    onChange={handleInputChange} 
                    className="et-input" 
                    placeholder="Enter full name" 
                    required 
                  />
                </div>
                <div className="et-form-group">
                  <label className="et-label">Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                    className="et-input" 
                    placeholder="example@mail.com" 
                    required 
                  />
                </div>
                <div className="et-form-group">
                  <label className="et-label">Contact Number</label>
                  <input 
                    type="text" 
                    name="contactNumber" 
                    value={formData.contactNumber} 
                    onChange={handleInputChange} 
                    className="et-input" 
                    placeholder="e.g. +639123456789" 
                    required
                  />
                </div>
                <div className="et-form-group et-form-group--full">
                  <label className="et-label">Address</label>
                  <input 
                    type="text" 
                    name="address" 
                    value={formData.address} 
                    onChange={handleInputChange} 
                    className="et-input" 
                    placeholder="Complete address" 
                  />
                </div>
              </div>
            </div>

            <div className="et-section">
              <h2 className="et-section-title"><FileText size={18} /> Document Details</h2>
              <div className="et-form-grid">
                <div className="et-form-group">
                  <label className="et-label">Service Name</label>
                  <input 
                    type="text" 
                    name="serviceName" 
                    value={formData.serviceName} 
                    onChange={handleInputChange} 
                    className="et-input" 
                  />
                </div>
                <div className="et-form-group">
                  <label className="et-label">CENOMAR Document Name (Select Type)</label>
                  <select 
                    name="cenomarDocument" 
                    value={formData.cenomarDocument} 
                    onChange={handleInputChange} 
                    className="et-input"
                    required
                  >
                    <option value="" disabled>Select CENOMAR Type</option>
                    {cenomarOptions.map((option, index) => (
                      <option key={index} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

              </div>
            </div>

            <div className="et-section">
              <h2 className="et-section-title"><MessageSquare size={18} /> Client Message / Admin Notes</h2>
              <div className="et-form-group et-form-group--full">
                <textarea 
                  name="message" 
                  value={formData.message} 
                  onChange={handleInputChange} 
                  className="et-input" 
                  rows="5" 
                  placeholder="Add administrative notes or specific client requests..." 
                  style={{ resize: "vertical", minHeight: "120px" }} 
                />
              </div>
            </div>

            <div className="et-form-actions">
              <button 
                type="button" 
                className="et-btn et-btn--cancel" 
                onClick={() => navigate(-1)}
                disabled={submitting}
              >
                CANCEL
              </button>
              <button 
                type="submit" 
                className="et-btn et-btn--submit" 
                disabled={submitting}
              >
                {submitting ? "SAVING..." : "UPDATE REQUEST"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EditCenomar;
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, X, FileText, User, MessageSquare, DollarSign } from "lucide-react";
import Sidebar from "../../sidebar/sidebar"; 
import { useToast } from "../../toast/ToastManager"; 
import "./EditPSA.css"; 

const EditPSA = () => {
  const navigate = useNavigate();
  const { id: psaId } = useParams();
  const toast = useToast(); 

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    contactNumber: "",
    address: "",
    estimatedPrice: "",
    message: "",
    serviceName: "PSA Request", // Pre-filled default value
    psaDocument: "PSA Document", // Pre-filled default value
    existingImage: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const API_BASE_URL = "https://wanderwaveph-backend.onrender.com/api/inquiries"; 

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  useEffect(() => {
    const fetchPSADetails = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/${psaId}`);
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
            // Pinapanatili ang value galing sa DB, kung wala ay gagamit ng default
            serviceName: data.serviceName || "PSA Request",
            psaDocument: data.psaDocument || "PSA Document",
            existingImage: data.evidenceName || "", 
          });

          if (data.evidenceName) {
            setImagePreview(`https://wanderwaveph-backend.onrender.com/uploads/${data.evidenceName}`);
          }
        } else {
            toast.error("Hindi mahanap ang requested record.", "Data Error");
        }
      } catch (err) {
        toast.error("Failed to fetch data from the server.", "Connection Error");
      } finally {
        setLoading(false);
      }
    };

    if (psaId) fetchPSADetails();
  }, [psaId, toast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // VALIDATION PARA SA ESTIMATED PRICE
    if (name === "estimatedPrice") {
      // 1. Bawal ang negative sign (-)
      if (value.includes("-")) return;

      // 2. Max 5 digits lang (kasama decimal point if meron)
      // Kung integer part ay lumampas sa 5 characters, stop.
      const mainValue = value.split('.')[0];
      if (mainValue.length > 5) {
        toast.warning("Hanggang 5 digits lamang ang pwedeng i-input.", "Limit Reached");
        return;
      }
    }

    // Contact Number validation gaya sa Cenomar
    if (name === "contactNumber") {
      const regex = /^\+?[0-9]*$/;
      if (!regex.test(value)) return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/webp", "image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid format. WebP, PNG, JPEG, at JPG lamang.", "Invalid File Type");
      e.target.value = ""; 
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (e) => {
    e.preventDefault();
    setImagePreview("");
    setImageFile(null);
    const fileInput = document.getElementById("psa-img");
    if (fileInput) fileInput.value = "";
    toast.info("Image removed.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // FINAL VALIDATIONS
    if (parseFloat(formData.estimatedPrice) < 100) {
      toast.error("Ang minimum na Estimated Price ay 100.", "Validation Error");
      return;
    }

    if (formData.contactNumber.replace(/\+/g, "").length < 8) {
      toast.error("Masyadong maikli ang contact number.", "Validation Error");
      return;
    }

    setSubmitting(true);
    const data = new FormData();
    Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
    });

    if (imageFile) {
      data.append("evidence", imageFile); 
    }

    try {
      const res = await fetch(`${API_BASE_URL}/update/${psaId}`, {
        method: "PUT",
        body: data,
      });
      const result = await res.json();
      if (result.success) {
        toast.success("PSA Request updated successfully!");
        setTimeout(() => navigate("/services/psa"), 2000);
      } else {
        toast.error(result.message || "Failed to update.");
      }
    } catch (err) {
      toast.error("Connection failed.", "Server Error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="et-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      <main className={`et-main ${isSidebarCollapsed ? "et-main--collapsed" : ""}`}>
        <div className="et-loading"><div className="et-spinner"></div></div>
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
                <ArrowLeft size={18} /> Back
              </button>
              <h1 className="et-title">EDIT PSA REQUEST</h1>
              <p className="et-subtitle">Update PSA inquiry details and documentation</p>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="et-form">
            <div className="et-section">
              <h2 className="et-section-title">PSA DOCUMENT IMAGE</h2>
              <div className="et-upload-area">
                <input type="file" id="psa-img" className="et-file-input" accept="image/*" onChange={handleImageChange} />
                <label htmlFor="psa-img" className="et-upload-label">
                  {imagePreview ? (
                    <div className="et-image-preview">
                      <img src={imagePreview} alt="PSA" />
                      <div className="et-image-overlay"><Upload size={32} /><span>Change Image</span></div>
                      <button type="button" className="et-remove-img-btn" onClick={handleRemoveImage}><X size={16} /> Remove</button>
                    </div>
                  ) : (
                    <div className="et-upload-placeholder">
                      <Upload size={48} />
                      <span>No Image Uploaded</span>
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
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="et-input" required />
                </div>
                <div className="et-form-group">
                  <label className="et-label">Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="et-input" required />
                </div>
                <div className="et-form-group">
                  <label className="et-label">Contact Number</label>
                  <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} className="et-input" required />
                </div>
                <div className="et-form-group et-form-group--full">
                  <label className="et-label">Address</label>
                  <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="et-input" />
                </div>
              </div>
            </div>

            <div className="et-section">
              <h2 className="et-section-title"><FileText size={18} /> Document Details</h2>
              <div className="et-form-grid">
                <div className="et-form-group">
                  <label className="et-label">Service Name</label>
                  <input type="text" name="serviceName" value={formData.serviceName} onChange={handleInputChange} className="et-input" />
                </div>
                <div className="et-form-group">
                  <label className="et-label">PSA Document Name</label>
                  <input type="text" name="psaDocument" value={formData.psaDocument} onChange={handleInputChange} className="et-input" required />
                </div>
                <div className="et-form-group et-form-group--full">
                  <label className="et-label"><DollarSign size={14} /> Estimated Price (PHP)</label>
                  <input 
                    type="number" 
                    name="estimatedPrice" 
                    value={formData.estimatedPrice} 
                    onChange={handleInputChange} 
                    className="et-input" 
                    step="0.01"
                    min="100"
                    placeholder="Min. 100"
                    required
                  />
                  <small style={{color: "#64748b", fontSize: "11px"}}>* Min: 100 | Max: 5 digits | Dot (.) allowed for centavos</small>
                </div>
              </div>
            </div>

            <div className="et-section">
              <h2 className="et-section-title"><MessageSquare size={18} /> Message / Notes</h2>
              <div className="et-form-group et-form-group--full">
                <textarea name="message" value={formData.message} onChange={handleInputChange} className="et-input" rows="4" style={{ resize: "vertical" }} />
              </div>
            </div>

            <div className="et-form-actions">
              <button type="button" className="et-btn et-btn--cancel" onClick={() => navigate(-1)} disabled={submitting}>CANCEL</button>
              <button type="submit" className="et-btn et-btn--submit" disabled={submitting}>{submitting ? "SAVING..." : "UPDATE REQUEST"}</button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EditPSA;
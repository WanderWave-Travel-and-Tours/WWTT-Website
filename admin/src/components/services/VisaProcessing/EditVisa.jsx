import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, X, FileText, User, MessageSquare} from "lucide-react";
import Sidebar from "../../sidebar/sidebar"; 
import "./EditVisa.css"; 

const EditVisa = () => {
  const navigate = useNavigate();
  const { id: visaId } = useParams();

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
    serviceName: "",
    visaDocument: "",
    existingImage: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const API_BASE_URL = "http://localhost:5000/api/inquiries"; 

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  useEffect(() => {
    const fetchVisaDetails = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/${visaId}`);
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
            visaDocument: data.visaDocument || "",
            existingImage: data.evidenceName || "", 
          });

          if (data.evidenceName) {
            setImagePreview(`http://localhost:5000/uploads/${data.evidenceName}`);
          }
        } else {
            console.error("Hindi mahanap ang data:", result.message);
        }
      } catch (err) {
        console.error("Error sa pag-fetch ng VISA data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (visaId) fetchVisaDetails();
  }, [visaId]);

  const handleInputChange = (e) => {
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

    const data = new FormData();
    data.append("fullName", formData.fullName);
    data.append("email", formData.email);
    data.append("contactNumber", formData.contactNumber);
    data.append("address", formData.address);
    data.append("estimatedPrice", formData.estimatedPrice);
    data.append("message", formData.message);
    data.append("serviceName", formData.serviceName);
    data.append("visaDocument", formData.visaDocument);

    if (imageFile) {
      data.append("evidence", imageFile); 
    }

    try {
      const res = await fetch(`${API_BASE_URL}/update/${visaId}`, {
        method: "PUT",
        body: data,
      });
      const result = await res.json();
      if (result.success) {
        alert("✅ VISA Request Updated Successfully!");
        navigate("/services/visa");
      } else {
        alert("❌ Error: " + result.message);
      }
    } catch (err) {
      alert("❌ Server Error: Connection Failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="et-page">
      <div className="et-loading">
        <div className="spinner"></div>
        <p>Hinahanap ang kasalukuyang data ng VISA...</p>
      </div>
    </div>
  );

  return (
    <div className="et-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      <main className={`et-main ${isSidebarCollapsed ? "et-main--collapsed" : ""}`}>
        <div className="et-container">
          
          {/* UPDATED HEADER SECTION */}
          <header className="et-header">
            <div className="et-header-content">
              <button className="et-back-btn" onClick={() => navigate(-1)}>
                <ArrowLeft size={20} />
                Back to Packages
              </button>
              <h1 className="et-title">Edit Visa</h1>
              <p className="et-subtitle">
                Update Visa information and details
              </p>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="et-form">
            <div className="et-grid-layout">
              
              <div className="et-form-left">
                <section className="et-section">
                  <div className="et-section-header">
                    <User size={20} className="et-section-icon" />
                    <h3>Impormasyon ng Client</h3>
                  </div>
                  <div className="et-fields-grid">
                    <div className="et-input-group full-width">
                      <label>Full Name</label>
                      <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="et-input" required />
                    </div>
                    <div className="et-input-group">
                      <label>Email Address</label>
                      <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="et-input" required />
                    </div>
                    <div className="et-input-group">
                      <label>Contact Number</label>
                      <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} className="et-input" />
                    </div>
                    <div className="et-input-group full-width">
                      <label>Address</label>
                      <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="et-input" />
                    </div>
                  </div>
                </section>

                <section className="et-section">
                  <div className="et-section-header">
                    <FileText size={20} className="et-section-icon" />
                    <h3>Detalye ng Dokumento</h3>
                  </div>
                  <div className="et-fields-grid">
                    <div className="et-input-group">
                      <label>Service Name</label>
                      <input type="text" name="serviceName" value={formData.serviceName} onChange={handleInputChange} className="et-input" />
                    </div>
                    <div className="et-input-group">
                      <label>VISA Document</label>
                      <input type="text" name="visaDocument" value={formData.visaDocument} onChange={handleInputChange} className="et-input" />
                    </div>
                    <div className="et-input-group full-width">
                      <label>Estimated Price (PHP)</label>
                      <input type="number" name="estimatedPrice" value={formData.estimatedPrice} onChange={handleInputChange} className="et-input" />
                    </div>
                  </div>
                </section>

                <section className="et-section">
                    <div className="et-section-header">
                        <MessageSquare size={20} className="et-section-icon" />
                        <h3>Client Message / Admin Notes</h3>
                    </div>
                    <textarea name="message" value={formData.message} onChange={handleInputChange} className="et-textarea" rows="4" />
                </section>
              </div>

              <div className="et-form-right">
                <div className="et-sticky-sidebar">
                  <section className="et-section et-upload-section">
                    <h3 className="et-upload-title">Evidence / Image</h3>
                    <div className="et-image-upload-container">
                      {imagePreview ? (
                        <div className="et-image-preview">
                          <img src={imagePreview} alt="Preview" />
                          <div className="et-image-overlay" onClick={() => document.getElementById('visa-img').click()}>
                             <Upload size={20} />
                             <span>Palitan ang Image</span>
                          </div>
                          <button type="button" className="et-remove-img" onClick={() => {setImagePreview(""); setImageFile(null);}}>
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <label className="et-upload-placeholder">
                          <Upload size={32} />
                          <span>I-upload ang Evidence</span>
                          <input type="file" id="visa-img" onChange={handleImageChange} accept="image/*" hidden />
                        </label>
                      )}
                      <input type="file" id="visa-img" onChange={handleImageChange} accept="image/*" hidden />
                    </div>
                  </section>

                  <div className="et-form-actions">
                    <button type="button" className="et-btn et-btn--cancel" onClick={() => navigate(-1)}>Cancel</button>
                    <button type="submit" className="et-btn et-btn--submit" disabled={submitting}>
                      {submitting ? "Sinasave..." : "I-update ang Request"}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EditVisa;
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, Upload, X, FileText, User, 
  MessageSquare, DollarSign, MapPin, HelpCircle, Briefcase, Eye, Trash2
} from "lucide-react";
import axios from "axios"; 
import Sidebar from "../../sidebar/sidebar"; 
import { useToast } from "../../toast/ToastManager"; 
import "./EditPSA.css"; 

// 🔥🔥🔥 HELPER FUNCTION - GET ADMIN DATA (Para sa Activity Logs) 🔥🔥🔥
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

// Reusable Confirm Modal
const CustomConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, type = "primary" }) => {
  if (!isOpen) return null;
  return (
    <div className="arc-confirm-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 11000
    }}>
      <div className="arc-confirm-modal" style={{
        backgroundColor: 'white', padding: '2rem', borderRadius: '12px',
        maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <HelpCircle size={48} color={type === 'danger' ? '#ef4444' : '#3b82f6'} style={{ margin: '0 auto' }} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', color: '#1e293b' }}>{title}</h3>
        <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.5' }}>{message}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button 
            onClick={onCancel}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: '6px', border: '1px solid #e2e8f0',
              backgroundColor: 'white', cursor: 'pointer', fontWeight: '500'
            }}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none',
              backgroundColor: type === 'danger' ? '#ef4444' : '#3b82f6',
              color: 'white', cursor: 'pointer', fontWeight: '500'
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// FileRow Component
const FileRow = ({ label, field, onChange, onView, hasExisting, currentFile }) => (
    <div className="et-file-row">
      <div className="et-file-info">
        <span className="et-file-label">{label}</span>
        <span className="et-file-status">
          {currentFile ? `New file: ${currentFile.name}` : (hasExisting ? "Previously uploaded" : "No file attached")} 
        </span>
      </div>
      <div className="et-file-actions">
        {(hasExisting || currentFile) && (
          <button type="button" className="et-view-btn" onClick={onView} title="View file">
            <Eye size={14} /> View
          </button>
        )}
        <label className="et-file-upload-btn">
          <Upload size={14} /> Upload
          <input 
            type="file" 
            accept=".docx,.pdf,.png,.webp,.jpg,.jpeg"
            onChange={(e) => onChange(e, field)} 
            hidden 
          />
        </label>
      </div>
    </div>
  );

const EditPSA = () => {
  const navigate = useNavigate();
  const { id: psaId } = useParams();
  const toast = useToast(); 

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "primary"
  });

  const [formData, setFormData] = useState({
    givenName: "",
    lastName: "",
    email: "",
    contactNumber: "",
    address: "",
    estimatedPrice: "",
    message: "",
    serviceName: "PSA Request",
    psaDocument: "PSA Document",
  });

  const [files, setFiles] = useState({});
  const [existingFiles, setExistingFiles] = useState({});

  const API_BASE_URL = "http://localhost:5000/api/inquiries"; 
  const FILE_BASE_URL = "http://localhost:5000";

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const askConfirmation = (title, message, onConfirm, type = "primary") => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      },
      type
    });
  };

  useEffect(() => {
    const fetchPSADetails = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/${psaId}`);
        const result = res.data;
        
        if (result.success && result.data) {
          const data = result.data;
          const nameParts = data.fullName ? data.fullName.split(" ") : ["", ""];
          const lName = nameParts.length > 1 ? nameParts.pop() : "";
          const gName = nameParts.join(" ");

          setFormData({
            givenName: data.givenName || gName || "",
            lastName: data.lastName || lName || "",
            email: data.email || "",
            contactNumber: data.contactNumber || "",
            address: data.address || "",
            estimatedPrice: data.estimatedPrice || "",
            message: data.adminRemarks || data.message || "",
            serviceName: data.serviceName || "PSA Request",
            psaDocument: data.psaDocument || "PSA Document",
          });

          if (data.evidenceUrl) {
            setExistingFiles({ requirement: data.evidenceUrl });
          } else if (data.deliveredDocuments && data.deliveredDocuments.length > 0) {
            const foundDoc = data.deliveredDocuments.find(doc => 
              doc.fileName.toLowerCase().includes("requirement") || 
              doc.fileName.toLowerCase().includes("evidence")
            ) || data.deliveredDocuments[0];
            
            setExistingFiles({ requirement: foundDoc.fileUrl });
          }
        } else {
            toast.error("Requested record not found.", "Data Error");
        }
      } catch (err) {
        toast.error("Failed to fetch data from the server.", "Connection Error");
      } finally {
        setLoading(false);
      }
    };

    if (psaId) fetchPSADetails();
  }, [psaId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "givenName" || name === "lastName") {
      const nameRegex = /^[a-zA-Z\sñÑ]*$/; 
      if (!nameRegex.test(value)) return;
    }

    if (name === "estimatedPrice") {
      if (value.includes("-")) return;
      const mainValue = value.split('.')[0];
      if (mainValue.length > 5) {
        toast.warning("Input limit reached. Maximum of 5 digits allowed.", "Limit Reached");
        return;
      }
    }

    if (name === "contactNumber") {
      const regex = /^\+?[0-9]*$/;
      if (!regex.test(value)) return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      const allowedExtensions = ['docx', 'pdf', 'png', 'webp', 'jpg', 'jpeg'];
      const fileExtension = file.name.split('.').pop().toLowerCase();

      if (!allowedExtensions.includes(fileExtension)) {
        toast.error("Invalid format. Please upload only DOCX, PDF, PNG, WEBP, or JPG/JPEG.", "File Type Error");
        return;
      }

      askConfirmation(
        "Upload Confirmation",
        `Are you sure you want to upload "${file.name}" for ${fieldName}?`,
        () => {
          setFiles((prev) => ({ ...prev, [fieldName]: file }));
          toast.info(`Successfully prepared: ${file.name}`, "Document Selected");
        }
      );
    }
  };

  const handleViewFile = (fieldKey) => {
    if (files[fieldKey]) {
      const blobUrl = URL.createObjectURL(files[fieldKey]);
      setPreviewFile({ url: blobUrl, name: files[fieldKey].name, fieldKey, isNew: true });
      return;
    }
    const url = existingFiles[fieldKey];
    if (url) {
      const finalUrl = url.startsWith('http') ? url : `${FILE_BASE_URL}${url}`;
      setPreviewFile({ url: finalUrl, name: url, fieldKey, isNew: false });
    } else {
      toast.warning("No document available for this specific field.", "Preview Unavailable");
    }
  };

  const handleDeleteFile = (fieldKey) => {
    askConfirmation(
      "Remove File",
      "Are you sure you want to remove this file?",
      () => {
        if (files[fieldKey]) {
          setFiles((prev) => {
            const newFiles = { ...prev };
            delete newFiles[fieldKey];
            return newFiles;
          });
        } else {
          setExistingFiles((prev) => {
            const newExisting = { ...prev };
            delete newExisting[fieldKey];
            return newExisting;
          });
        }
        setPreviewFile(null);
        toast.success("Document removed from selection.", "File Removed");
      },
      "danger"
    );
  };

  const handleDiscard = () => {
    askConfirmation(
      "Discard Changes",
      "Are you sure you want to discard your changes? All unsaved updates will be lost.",
      () => navigate(-1)
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const strictEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/;
    
    if (!strictEmailRegex.test(formData.email)) {
      toast.error("Please enter a valid email format (e.g., user@email.com).", "Invalid Email");
      return;
    }

    if (parseFloat(formData.estimatedPrice) < 100) {
      toast.error("Minimum Estimated Price is 100.", "Validation Error");
      return;
    }

    askConfirmation(
      "Save Changes",
      "Are you sure you want to update this PSA request?",
      () => performSubmit()
    );
  };

const performSubmit = async () => {
    setSubmitting(true);
    const { userEmail, adminId } = getAdminData(); 
    const data = new FormData();
    
    const fullName = `${formData.givenName} ${formData.lastName}`.trim();
    
    Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
    });
    data.append("fullName", fullName);
    data.append("userEmail", userEmail); 
    data.append("adminId", adminId);

    // 1. Kunin ang Admin Info mula sa localStorage para sa logs
    const adminData = JSON.parse(localStorage.getItem('adminUser')) || {};
    const adminEmail = adminData.email || "Unknown Admin";
    const adminName = adminData.username || "Admin";

    try {
      const res = await axios.put(`${API_BASE_URL}/update/${psaId}`, data);
      
      if (res.data.success) {
        toast.success("PSA Request updated successfully!", "Success");
        navigate("/services/psa");
      } else {
        toast.error(res.data.message || "Failed to update record.", "Error");
      }
    } catch (err) {
      console.error("Submit Error:", err);
      toast.error("Server connection failed. Please try again.", "Connection Error");
    } finally {
      setSubmitting(false);
    }
  };

  const renderPreviewContent = () => {
    if (!previewFile) return null;
    const { url, name } = previewFile;
    const isImage = /\.(jpeg|jpg|gif|png|webp)$/i.test(name) || url.startsWith('blob:');
    const isPdf = name.toLowerCase().endsWith('.pdf');

    if (isImage && !isPdf) {
      return <img src={url} alt="File Preview" className="preview-media-full" style={{ width: '100%', borderRadius: '8px' }} />;
    } else if (isPdf) {
      return <iframe src={url} title="PDF Preview" className="preview-iframe-full" width="100%" height="500px" style={{ border: 'none' }} />;
    } else {
      return (
        <div style={{textAlign: 'center', padding: '40px'}}>
          <FileText size={64} style={{margin: '0 auto 15px', color: '#64748b'}} />
          <p style={{ fontWeight: '500' }}>Preview not available for this format.</p>
          <a href={url} target="_blank" rel="noreferrer" download className="et-view-btn" style={{ display: 'inline-block', marginTop: '10px' }}>Download to View</a>
        </div>
      );
    }
  };

  if (loading) return <div className="et-loading">Loading PSA Form...</div>;

  return (
    <div className="et-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      <main className={`et-main ${isSidebarCollapsed ? "et-main--collapsed" : ""}`}>
        <div className="et-container">
          
          <header className="et-header">
            <div className="et-header-content">
              <button className="et-back-btn" onClick={handleDiscard}>
                <ArrowLeft size={20} /> Back
              </button>
              <h1 className="et-title">EDIT PSA REQUEST</h1>
              <p className="et-subtitle">Update PSA inquiry details and documentation</p>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="et-form">
            <div className="et-grid-layout">
              <div className="et-form-left">
                
                <section className="et-section">
                  <div className="et-section-header">
                    <User size={22} className="et-section-icon" />
                    <h3>Client Information</h3>
                  </div>
                  <div className="et-fields-grid">
                    <div className="et-input-group">
                      <label>Given Name</label>
                      <input type="text" name="givenName" value={formData.givenName} onChange={handleInputChange} className="et-input" placeholder="Letters only" required />
                    </div>
                    <div className="et-input-group">
                      <label>Last Name</label>
                      <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="et-input" placeholder="Letters only" required />
                    </div>
                    <div className="et-input-group">
                      <label>Email</label>
                      <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="et-input" placeholder="example@email.com" required />
                    </div>
                    <div className="et-input-group">
                      <label>Contact No.</label>
                      <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} className="et-input" required />
                    </div>
                  </div>
                </section>

                <section className="et-section">
                  <div className="et-section-header">
                    <Briefcase size={22} className="et-section-icon" />
                    <h3>Service Details</h3>
                  </div>
                  <div className="et-fields-grid">
                    <div className="et-input-group full-width">
                      <label>PSA Document Type</label>
                      <input type="text" name="psaDocument" value={formData.psaDocument} onChange={handleInputChange} className="et-input" required />
                    </div>
                  </div>
                </section>

                <section className="et-section">
                  <div className="et-section-header">
                    <Upload size={22} className="et-section-icon" />
                    <h3>ATTACHMENTS</h3>
                  </div>
                  <div className="et-file-grid-internal">
                    <FileRow 
                        label="Requirement Document (ID/Form)" 
                        field="requirement" 
                        onChange={handleFileChange} 
                        onView={() => handleViewFile('requirement')} 
                        hasExisting={!!existingFiles['requirement']} 
                        currentFile={files['requirement']} 
                    />
                  </div>
                </section>
              </div>

              <div className="et-form-right">
                <div className="et-sticky-sidebar">
                  <section className="et-section">
                    <div className="et-section-header">
                      <DollarSign size={20} className="et-section-icon" />
                      <h3>Financials & Notes</h3>
                    </div>
                    <div className="et-input-group">
                        <label>Estimated Price (PHP)</label>
                        <div className="et-input-with-icon">
                            <span className="input-currency-symbol">₱</span>
                            <input 
                              type="number" 
                              name="estimatedPrice" 
                              value={formData.estimatedPrice} 
                              onChange={handleInputChange} 
                              className="et-input currency-padding" 
                              step="0.01"
                              min="100"
                              required
                            />
                        </div>
                    </div>
                    <div className="et-input-group" style={{ marginTop: "15px" }}>
                       <label>Admin Remarks</label>
                       <textarea name="message" value={formData.message} onChange={handleInputChange} className="et-textarea" rows="4" placeholder="Internal notes..." />
                    </div>
                  </section>
                  
                  <div className="et-form-actions">
                    <button type="submit" className="et-btn et-btn--submit" disabled={submitting}>
                      {submitting ? "SAVING..." : "UPDATE REQUEST"}
                    </button>
                    <button type="button" className="et-btn et-btn--cancel" onClick={handleDiscard}>DISCARD</button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>

      {previewFile && (
        <div className="et-modal-overlay" onClick={() => setPreviewFile(null)}>
          <div className="et-modal-preview-wrapper" onClick={e => e.stopPropagation()}>
            <div className="et-modal-preview-header">
              <span className="preview-filename">{previewFile.name.split('/').pop()}</span>
              <button className="preview-close-btn" onClick={() => setPreviewFile(null)}><X size={24} /></button>
            </div>
            <div className="et-modal-preview-body">
              {renderPreviewContent()}
            </div>
            <div className="et-modal-preview-footer">
              <div className="footer-actions-right">
                <button className="preview-delete-btn" onClick={() => handleDeleteFile(previewFile.fieldKey)}>
                  <Trash2 size={18} /> Delete File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CustomConfirmModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default EditPSA;
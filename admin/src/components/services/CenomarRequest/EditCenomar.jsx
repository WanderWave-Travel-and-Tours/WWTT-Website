import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, Upload, X, FileText, User, MessageSquare, 
  DollarSign, Eye, Trash2, HelpCircle, Briefcase
} from "lucide-react";
import axios from "axios"; // Added for better integration
import Sidebar from "../../sidebar/sidebar"; 
import { useToast } from "../../toast/ToastManager"; 
import "./EditCenomar.css"; 

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

// Reusable Confirm Modal (Patterned after EditPSA)
const CustomConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, type = "primary" }) => {
  if (!isOpen) return null;
  return (
    <div className="ec-confirm-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 11000
    }}>
      <div className="ec-confirm-modal" style={{
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

// FileRow Component (Patterned after EditPSA)
const FileRow = ({ label, field, onChange, onView, hasExisting, currentFile }) => (
    <div className="ec-file-row">
      <div className="ec-file-info">
        <span className="ec-file-label">{label}</span>
        <span className="ec-file-status">
          {currentFile ? `New file: ${currentFile.name}` : (hasExisting ? "Previously uploaded" : "No file attached")} 
        </span>
      </div>
      <div className="ec-file-actions">
        {(hasExisting || currentFile) && (
          <button type="button" className="ec-view-btn" onClick={() => onView(field)} title="View file">
            <Eye size={14} /> View
          </button>
        )}
        <label className="ec-file-upload-btn">
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

const EditCenomar = () => {
  const navigate = useNavigate();
  const { id: cenomarId } = useParams();
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
    estimatedPrice: "",
    message: "",
    serviceName: "CENOMAR Request",
    cenomarDocument: "",
  });

  const [files, setFiles] = useState({});
  const [existingFiles, setExistingFiles] = useState({});
  const [originalData, setOriginalData] = useState(null); 

  const API_BASE_URL = "https://wanderwaveph-backend.onrender.com/api/inquiries"; 
  const FILE_BASE_URL = "https://wanderwaveph-backend.onrender.com";

  const cenomarOptions = [
    { label: "CENOMAR - ₱150", value: "CENOMAR - ₱150", price: 150 },
    { label: "cenomar - ₱100", value: "cenomar - ₱100", price: 100 }
  ];

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
    const fetchCenomarDetails = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/${cenomarId}`);
        const result = await res.json();
        
        if (result.success && result.data) {
          const data = result.data;
          setOriginalData(data); 

          const nameParts = data.fullName ? data.fullName.split(" ") : ["", ""];
          const lName = nameParts.length > 1 ? nameParts.pop() : "";
          const gName = nameParts.join(" ");

          setFormData({
            givenName: data.givenName || gName || "",
            lastName: data.lastName || lName || "",
            email: data.email || "",
            contactNumber: data.contactNumber || "",
            estimatedPrice: data.estimatedPrice || "",
            message: data.adminRemarks || data.message || "",
            serviceName: data.serviceName || "CENOMAR Request",
            cenomarDocument: data.cenomarDocument || "",
          });

          if (data.evidenceUrl) {
            setExistingFiles({ requirement: data.evidenceUrl });
          } else if (data.evidenceName) {
            setExistingFiles({ requirement: `/uploads/${data.evidenceName}` });
          } else if (data.deliveredDocuments && data.deliveredDocuments.length > 0) {
            const foundDoc = data.deliveredDocuments.find(doc => 
                doc.fileName.toLowerCase().includes("requirement") || 
                doc.fileName.toLowerCase().includes("evidence") ||
                doc.fileName.toLowerCase().includes("cenomar")
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

    if (cenomarId) fetchCenomarDetails();
  }, [cenomarId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "givenName" || name === "lastName") {
      const nameRegex = /^[a-zA-Z\sñÑ]*$/; 
      if (!nameRegex.test(value)) return;
    }

    if (name === "contactNumber") {
      let val = value.replace(/[^0-9+]/g, ""); 
      if (val.includes("+")) {
        if (val.indexOf("+") !== 0) {
          val = val.replace(/\+/g, ""); 
        } else {
          const rest = val.substring(1).replace(/\+/g, "");
          val = "+" + rest;
        }
      }
      if (val.length > 20) return; 
      setFormData((prev) => ({ ...prev, [name]: val }));
      return;
    }

    if (name === "cenomarDocument") {
        const selectedOption = cenomarOptions.find(opt => opt.value === value);
        if (selectedOption) {
          setFormData(prev => ({
            ...prev,
            cenomarDocument: value,
            estimatedPrice: selectedOption.price
          }));
          return;
        }
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
        `Are you sure you want to upload "${file.name}"? This will replace any existing document.`,
        () => {
          setFiles((prev) => ({ ...prev, [fieldName]: file }));
          // Clear existing file reference so the UI and Preview switch to the NEW file
          setExistingFiles((prev) => {
              const updated = { ...prev };
              delete updated[fieldName];
              return updated;
          });
          toast.info(`Successfully prepared: ${file.name}`, "Document Selected");
        }
      );
    }
  };

  const handleViewFile = (fieldKey) => {
    if (files[fieldKey]) {
      const blobUrl = URL.createObjectURL(files[fieldKey]);
      setPreviewFile({ 
          url: blobUrl, 
          name: files[fieldKey].name, 
          fieldKey: fieldKey, 
          isNew: true 
      });
      return;
    }
    
    const url = existingFiles[fieldKey];
    if (url) {
      const finalUrl = url.startsWith('http') ? url : `${FILE_BASE_URL}${url}`;
      setPreviewFile({ 
          url: finalUrl, 
          name: url.split('/').pop(), 
          fieldKey: fieldKey, 
          isNew: false 
      });
    } else {
      toast.warning("No document available for preview.", "Preview Unavailable");
    }
  };

  const handleDeleteFile = (fieldKey) => {
    askConfirmation(
      "Remove File",
      "Are you sure you want to remove this file? You need to save changes to make this permanent.",
      () => {
        setFiles((prev) => {
          const newFiles = { ...prev };
          delete newFiles[fieldKey];
          return newFiles;
        });
        
        setExistingFiles((prev) => {
          const newExisting = { ...prev };
          delete newExisting[fieldKey];
          return newExisting;
        });
        
        setPreviewFile(null);
        toast.success("Document removed from view.", "File Removed");
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
      toast.error("Please enter a valid email format ending with .com", "Invalid Email");
      return;
    }

    const digitsOnly = formData.contactNumber.replace(/\+/g, "");
    if (digitsOnly.length < 8) {
      toast.error("Contact number must have at least 8 digits.", "Validation Error");
      return;
    }

    askConfirmation(
      "Save Changes",
      "Are you sure you want to update this CENOMAR request?",
      () => performSubmit()
    );
  };

const performSubmit = async () => {
    setSubmitting(true);
    const { userEmail, adminId } = getAdminData(); // Get current admin info
    const data = new FormData();
    const fullName = `${formData.givenName} ${formData.lastName}`.trim();
    
    // I-append ang lahat ng nasa formData
    Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
    });

    data.append("fullName", fullName);
    data.append("userEmail", userEmail); // For Activity Log
    data.append("adminId", adminId);     // For Activity Log

    // 🔥 FIX: Idagdag ang inquiryType para sa tamang module mapping sa backend
    data.append("inquiryType", "CENOMAR");

    // Backend usually expects 'evidence' for the requirement file
    if (files.requirement) {
      data.append("evidence", files.requirement); 
    }
    
    // 🔥 FIX: I-append ang listahan ng existing files na HINDI binura
    const remainingFiles = [];
    if (existingFiles.requirement) {
        remainingFiles.push("requirement");
    }
    data.append("existingFiles", JSON.stringify(remainingFiles));

    data.append("hasExistingEvidence", existingFiles.requirement ? "true" : "false");

    let changes = [];
    const trackChange = (label, oldVal, newVal) => {
      if (String(oldVal || "").trim() !== String(newVal || "").trim()) {
        changes.push(`${label} changed from "${oldVal || 'None'}" to "${newVal}"`);
      }
    };

    if (originalData) {
      trackChange("First Name", originalData.givenName, formData.givenName);
      trackChange("Last Name", originalData.lastName, formData.lastName);
      trackChange("Email", originalData.email, formData.email);
      trackChange("Contact Number", originalData.contactNumber, formData.contactNumber);
      trackChange("Service Type", originalData.cenomarDocument, formData.cenomarDocument);
      trackChange("Admin Remarks", originalData.adminRemarks || originalData.message, formData.message);
      
      if (files.requirement) {
        changes.push(`Uploaded new attachment: ${files.requirement.name}`);
      } else if (!existingFiles.requirement && (originalData.evidenceName || originalData.evidenceUrl)) {
        changes.push(`Removed existing attachment.`);
      }
    }

    // Isama ang activity log changes sa request body
    // Note: Sa backend updateInquiry controller, gagamitin ang field na ito sa details
    data.append("changes", JSON.stringify(changes));

    try {
      // Changed to axios for consistency with logs implementation
      const res = await axios.put(`${API_BASE_URL}/update/${cenomarId}`, data);
      
      if (res.data.success) {
        toast.success("CENOMAR Request updated successfully!", "Success");
        navigate("/services/cenomar");
      } else {
        toast.error(res.data.message || "Failed to update record.", "Error");
      }
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("Server connection failed. Please check your network.", "Connection Error");
    } finally {
      setSubmitting(false);
    }
  };

  const renderPreviewContent = () => {
    if (!previewFile) return null;
    const { url, name } = previewFile;
    const isImage = name.match(/\.(jpeg|jpg|gif|png|webp)$/i) || url.startsWith('blob:');
    const isPdf = name.toLowerCase().endsWith('.pdf');

    if (isImage && !isPdf) {
      return <img src={url} alt="File Preview" style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', display: 'block', margin: '0 auto' }} />;
    } else if (isPdf) {
      return <iframe src={url} title="PDF Preview" style={{ width: '100%', height: '70vh', border: 'none' }} />;
    } else {
      return (
        <div style={{textAlign: 'center', padding: '40px'}}>
          <FileText size={64} style={{margin: '0 auto 20px', color: '#64748b'}} />
          <p>Preview not available for this format.</p>
          <a href={url} download={name} className="ec-view-btn" style={{marginTop: '15px', display: 'inline-block'}}>Download to View</a>
        </div>
      );
    }
  };

  if (loading) return <div className="ec-loading">Loading CENOMAR Form...</div>;

  return (
    <div className="ec-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      <main className={`ec-main ${isSidebarCollapsed ? "ec-main--collapsed" : ""}`}>
        <div className="ec-container">
          
          <header className="ec-header">
            <div className="ec-header-content">
              <button className="ec-back-btn" onClick={handleDiscard}>
                <ArrowLeft size={20} /> Back
              </button>
              <h1 className="ec-title">EDIT CENOMAR REQUEST</h1>
              <p className="ec-subtitle">Update details and documentation</p>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="ec-form">
            <div className="ec-grid-layout">
              <div className="ec-form-left">
                
                <section className="ec-section">
                  <div className="ec-section-header">
                    <User size={22} className="ec-section-icon" />
                    <h3>Client Information</h3>
                  </div>
                  <div className="ec-fields-grid">
                    <div className="ec-input-group">
                      <label>Given Name</label>
                      <input type="text" name="givenName" value={formData.givenName} onChange={handleInputChange} className="ec-input" placeholder="Letters only" required />
                    </div>
                    <div className="ec-input-group">
                      <label>Last Name</label>
                      <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="ec-input" placeholder="Letters only" required />
                    </div>
                    <div className="ec-input-group">
                      <label>Email</label>
                      <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="ec-input" placeholder="user@email.com" required />
                    </div>
                    <div className="ec-input-group">
                      <label>Contact No.</label>
                      <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} className="ec-input" placeholder="+63..." required />
                    </div>
                  </div>
                </section>

                <section className="ec-section">
                  <div className="ec-section-header">
                    <Briefcase size={22} className="ec-section-icon" />
                    <h3>Service Details</h3>
                  </div>
                  <div className="ec-fields-grid">
                    <div className="ec-input-group ec-full-width">
                      <label>CENOMAR Service *</label>
                      <select name="cenomarDocument" value={formData.cenomarDocument} onChange={handleInputChange} className="ec-input" required>
                        <option value="" disabled>Select Service Type</option>
                        {cenomarOptions.map((opt, i) => (
                          <option key={i} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>

                <section className="ec-section">
                  <div className="ec-section-header">
                    <Upload size={22} className="ec-section-icon" />
                    <h3>ATTACHMENTS</h3>
                  </div>
                  <div className="ec-file-grid-internal">
                    <FileRow 
                        label="Requirement Document (ID/Form)" 
                        field="requirement" 
                        onChange={handleFileChange} 
                        onView={handleViewFile} 
                        hasExisting={!!existingFiles['requirement']} 
                        currentFile={files['requirement']} 
                    />
                  </div>
                </section>
              </div>

              <div className="ec-form-right">
                <div className="ec-sticky-sidebar">
                  <section className="ec-section">
                    <div className="ec-section-header">
                      <DollarSign size={20} className="ec-section-icon" />
                      <h3>Billing & Notes</h3>
                    </div>
                    <div className="ec-input-group">
                        <label>Estimated Price (PHP)</label>
                        <input type="text" name="estimatedPrice" value={formData.estimatedPrice} readOnly className="ec-input" style={{ background: '#f8fafc' }} />
                    </div>
                    <div className="ec-input-group" style={{ marginTop: "15px" }}>
                        <label>Admin Remarks</label>
                        <textarea name="message" value={formData.message} onChange={handleInputChange} className="ec-textarea" rows="4" placeholder="Internal notes..." />
                    </div>
                  </section>
                  
                  <div className="ec-form-actions">
                    <button type="submit" className="ec-btn ec-btn--submit" disabled={submitting}>
                      {submitting ? "SAVING..." : "UPDATE REQUEST"}
                    </button>
                    <button type="button" className="ec-btn ec-btn--cancel" onClick={handleDiscard}>DISCARD</button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>

      {previewFile && (
        <div className="ec-modal-overlay" onClick={() => setPreviewFile(null)}>
          <div className="ec-modal-preview-wrapper" onClick={e => e.stopPropagation()}>
            <div className="ec-modal-preview-header">
              <span className="ec-preview-filename">{previewFile.name}</span>
              <button className="ec-preview-close-btn" onClick={() => setPreviewFile(null)}><X size={24} /></button>
            </div>
            <div className="ec-modal-preview-body">{renderPreviewContent()}</div>
            <div className="ec-modal-preview-footer">
              <div className="ec-footer-actions-right">
                <button className="ec-preview-delete-btn" onClick={() => handleDeleteFile(previewFile.fieldKey)}>
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

export default EditCenomar;
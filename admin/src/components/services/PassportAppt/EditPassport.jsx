import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, Upload, X, FileText, User, 
  DollarSign, Eye, Trash2, HelpCircle, Briefcase
} from "lucide-react";
import axios from "axios"; // Gamitin ang axios para mas consistent
import Sidebar from "../../sidebar/sidebar"; 
import { useToast } from "../../toast/ToastManager"; 
import "./EditPassport.css"; 

// 🔥🔥🔥 HELPER FUNCTION - GET ADMIN DATA (For Activity Logs) 🔥🔥🔥
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

const CustomConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, type = "primary" }) => {
  if (!isOpen) return null;
  return (
    <div className="et-confirm-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 15000 // Higher than preview modal
    }}>
      <div className="et-confirm-modal" style={{
        backgroundColor: 'white', padding: '2rem', borderRadius: '12px',
        maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <HelpCircle size={48} color={type === 'danger' ? '#ef4444' : '#3b82f6'} style={{ margin: '0 auto' }} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', color: '#1e293b' }}>{title}</h3>
        <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.5' }}>{message}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={onCancel} style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none', backgroundColor: type === 'danger' ? '#ef4444' : '#3b82f6', color: 'white', cursor: 'pointer' }}>Confirm</button>
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
        <button type="button" className="et-view-btn" onClick={() => onView(field)} title="View file">
          <Eye size={14} /> View
        </button>
      )}
      <label className="et-file-upload-btn">
        <Upload size={14} /> Upload
        <input type="file" accept=".docx,.pdf,.png,.webp,.jpg,.jpeg" onChange={(e) => onChange(e, field)} hidden />
      </label>
    </div>
  </div>
);

const EditPassport = () => {
  const navigate = useNavigate();
  const { id: passportId } = useParams();
  const toast = useToast(); 

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [originalData, setOriginalData] = useState(null); // Added for comparison

  // Options from PassportApplicationModal
  const passportOptions = [
    "New Application",
    "Renewal",
    "Lost Passport Replacement",
  ];

  const processingOptions = [
    "Regular Processing",
    "Expedited Processing"
  ];

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false, title: "", message: "", onConfirm: () => {}, type: "primary"
  });

  const [formData, setFormData] = useState({
    givenName: "",
    lastName: "",
    email: "",
    contactNumber: "",
    serviceName: "",      // Mapping to Processing Type
    estimatedPrice: "",
    message: "",
    passportDocument: ""  // UI mapping para sa Application Type dropdown
  });

  const [files, setFiles] = useState({});
  const [existingFiles, setExistingFiles] = useState({});

  const API_BASE_URL = "http://localhost:5000/api/inquiries"; 
  const FILE_BASE_URL = "http://localhost:5000";

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const askConfirmation = (title, message, onConfirm, type = "primary") => {
    setConfirmConfig({
      isOpen: true, title, message, type,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  useEffect(() => {
    const fetchPassportDetails = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/${passportId}`);
        const result = res.data;
        
        if (result.success && result.data) {
          const data = result.data;
          
          // Split full name if givenName/lastName are not explicitly separate in DB
          const nameParts = data.fullName ? data.fullName.split(" ") : ["", ""];
          const lName = nameParts.length > 1 ? nameParts.pop() : "";
          const gName = nameParts.join(" ");

          const fetchedAppType = data.passportDetails?.applicationType || "";
          const fetchedProcType = data.passportDetails?.processingType || data.serviceName || "";

          setFormData({
            givenName: data.givenName || gName || "",
            lastName: data.lastName || lName || "",
            email: data.email || "",
            contactNumber: data.contactNumber || "",
            passportDocument: fetchedAppType, 
            serviceName: fetchedProcType, 
            estimatedPrice: data.estimatedPrice || "",
            message: data.adminRemarks || "",
          });

          // Check for existing documents
          if (data.evidenceUrl) {
            setExistingFiles({ requirement: data.evidenceUrl });
          }
        }
      } catch (err) {
        toast.error("Failed to fetch data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (passportId) fetchPassportDetails();
  }, [passportId, toast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "givenName" || name === "lastName") {
      const nameRegex = /^[a-zA-Z\sñÑ]*$/; 
      if (!nameRegex.test(value)) return; 
    }

    if (name === "contactNumber") {
      let val = value.replace(/[^0-9+]/g, ""); 
      if (val.includes("+") && val.indexOf("+") !== 0) val = val.replace(/\+/g, ""); 
      if (val.length > 20) return;
      setFormData(prev => ({ ...prev, [name]: val }));
      return;
    }

    if (name === "estimatedPrice") {
      const val = value.replace(/[^0-9]/g, ""); 
      if (val.length > 7) return;
      setFormData(prev => ({ ...prev, [name]: val }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setFiles((prev) => ({ ...prev, [fieldName]: file }));
      setExistingFiles((prev) => {
        const updated = { ...prev };
        delete updated[fieldName];
        return updated;
      });
    }
  };

  const handleViewFile = (fieldKey) => {
    if (files[fieldKey]) {
      const url = URL.createObjectURL(files[fieldKey]);
      setPreviewFile({ url, name: files[fieldKey].name, fieldKey, isNew: true });
    } else if (existingFiles[fieldKey]) {
      const url = existingFiles[fieldKey];
      const fullUrl = url.startsWith('http') ? url : `${FILE_BASE_URL}${url}`;
      setPreviewFile({ url: fullUrl, name: url.split('/').pop(), fieldKey, isNew: false });
    }
  };

  const handleDeleteFile = (fieldKey) => {
    askConfirmation("Delete Confirmation", "Are you sure you want to delete this file? Changes will be saved once you click Update.", () => {
      setFiles(prev => {
        const updated = { ...prev };
        delete updated[fieldKey];
        return updated;
      });
      setExistingFiles(prev => {
        const updated = { ...prev };
        delete updated[fieldKey];
        return updated;
      });
      setPreviewFile(null);
      toast.info("File removed from list.");
    }, "danger");
  };

  const handleDiscard = () => {
    askConfirmation(
      "Discard Changes",
      "Are you sure you want to discard your changes? All unsaved updates will be lost.",
      () => navigate(-1),
      "danger"
    );
  };

  const performSubmit = async () => {
    // Basic Validations
    if (!formData.email.toLowerCase().endsWith(".com")) {
      toast.error("Email must end with .com");
      return;
    }

    const digitCount = formData.contactNumber.replace(/[^0-9]/g, "").length;
    if (digitCount < 8) {
      toast.error("Contact number must have at least 8 digits.");
      return;
    }

    setSubmitting(true);
    
    // 🔥 GET ADMIN DATA FOR LOGS
    const { userEmail, adminId } = getAdminData();

    const data = new FormData();
    const combinedFullName = `${formData.givenName} ${formData.lastName}`.trim();
    
    // Standard Inquiry Fields
    data.append("fullName", combinedFullName);
    data.append("email", formData.email);
    data.append("contactNumber", formData.contactNumber);
    data.append("estimatedPrice", formData.estimatedPrice);
    data.append("message", formData.message); // This will map to adminRemarks or message
    
    // Passport Specific Details
    const passportDetails = {
        applicationType: formData.applicationType,
        dfaLocation: "Updated via Admin"
    };
    data.append("passportDetails", JSON.stringify(passportDetails));

    // 🔥 LOGGING DATA
    data.append("userEmail", userEmail);
    data.append("adminId", adminId);

    // File Handling
    if (files.requirement) {
        data.append("walkInDoc", files.requirement);
    }

      // Existing Submit Logic
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== undefined && formData[key] !== null) {
          data.append(key, formData[key]);
        }
      });

      data.append("applicationType", formData.passportDocument);
      const combinedName = `${formData.givenName || ""} ${formData.lastName || ""}`.trim();
      data.append("fullName", combinedName);

      if (files.requirement) {
        data.append("requirement", files.requirement);
      }

      const remainingUrls = Object.values(existingFiles).filter(url => !!url);
      data.append("existingFiles", JSON.stringify(remainingUrls));
      data.append("adminEmail", adminEmail);

      const response = await fetch(`${API_BASE_URL}/update/${passportId}`, {
        method: "PUT",
        body: data,
      });

      const result = await response.json();

    try {
      const res = await axios.put(`${API_BASE_URL}/update/${passportId}`, data, {
          headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success) {
        toast.success("Passport record updated successfully!");
        navigate("/services/passport");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Error updating record.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    askConfirmation("Save Changes", "Confirm updates to this Passport request?", () => performSubmit());
  };

  const renderPreviewContent = () => {
    if (!previewFile) return null;
    const { url, name } = previewFile;
    const isImage = name.match(/\.(jpeg|jpg|gif|png|webp)$/i);
    const isPdf = name.toLowerCase().endsWith('.pdf');

    if (isImage && !isPdf) {
      return <img src={url} alt="Preview" className="preview-media-full" />;
    } else if (isPdf) {
      return <iframe src={url} title="PDF Preview" style={{ width: '100%', height: '100%', border: 'none' }} />;
    } else {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <FileText size={64} style={{ margin: '0 auto 20px', color: '#64748b' }} />
          <p style={{fontSize: '16px', color: '#1e293b'}}>Preview not available for this file format.</p>
          <a href={url} download className="et-view-btn" style={{ display: 'inline-flex', marginTop: '15px', padding: '10px 20px' }}>
            Download to View
          </a>
        </div>
      );
    }
  };

  if (loading) return (
    <div className="et-loading-container">
        <div className="et-loader"></div>
        <p>Fetching passport details...</p>
    </div>
  );

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
              <h1 className="et-title">EDIT PASSPORT REQUEST</h1>
              <p className="et-subtitle">Ref No: #{passportId.slice(-6).toUpperCase()}</p>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="et-form">
            <div className="et-grid-layout">
              <div className="et-form-left">
                {/* CLIENT INFO SECTION */}
                <section className="et-section">
                  <div className="et-section-header"><User size={22} /> <h3>Client Information</h3> </div>
                  <div className="et-fields-grid">
                    <div className="et-input-group"> 
                        <label>Given Name</label> 
                        <input type="text" name="givenName" value={formData.givenName} onChange={handleInputChange} className="et-input" required /> 
                    </div>
                    <div className="et-input-group"> 
                        <label>Last Name</label> 
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="et-input" required /> 
                    </div>
                    <div className="et-input-group"> 
                        <label>Email</label> 
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="et-input" required /> 
                    </div>
                    <div className="et-input-group"> 
                        <label>Contact No</label> 
                        <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} className="et-input" required /> 
                    </div>
                  </div>
                </section>

                {/* SERVICE DETAILS SECTION */}
                <section className="et-section">
                  <div className="et-section-header"><Briefcase size={22} /> <h3>Service Details</h3> </div>
                  <div className="et-fields-grid">
                    <div className="et-input-group">
                      <label>Application Type</label>
                      <select 
                        name="passportDocument" 
                        value={formData.passportDocument} 
                        onChange={handleInputChange} 
                        className="et-input"
                        required
                      >
                        <option value="">Select Application Type</option>
                        {passportOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>

                {/* ATTACHMENTS SECTION */}
                <section className="et-section">
                  <div className="et-section-header"><Upload size={22} /> <h3>Attachments</h3> </div>
                  <FileRow 
                    label="Requirement Document" 
                    field="requirement" 
                    onChange={handleFileChange} 
                    onView={() => handleViewFile('requirement')} 
                    hasExisting={!!existingFiles['requirement']} 
                    currentFile={files['requirement']} 
                  />
                  <p className="et-hint-text">Supported formats: PDF, JPG, PNG, DOCX (Max 5MB)</p>
                </section>
              </div>

              {/* --- Billing & Notes --- */}
              <div className="et-form-right">
                <div className="et-sticky-sidebar">
                  {/* BILLING SECTION */}
                  <section className="et-section">
                    <div className="et-section-header"> <DollarSign size={20} /> <h3>Billing & Notes</h3> </div>
                    <div className="et-input-group"> 
                        <label>Estimated Price (PHP)</label> 
                        <div className="et-price-input-wrapper">
                            <span className="et-currency-prefix">₱</span>
                            <input type="text" name="estimatedPrice" value={formData.estimatedPrice} onChange={handleInputChange} className="et-input et-price-input" placeholder="0.00" /> 
                        </div>
                    </div>
                    <div className="et-input-group" style={{marginTop: '20px'}}> 
                        <label>Admin Remarks / Internal Notes</label> 
                        <textarea name="message" value={formData.message} onChange={handleInputChange} className="et-textarea" rows="6" placeholder="Add notes about this request..." /> 
                    </div>
                  </section>

                  {/* FORM ACTIONS */}
                  <div className="et-form-actions">
                    <button type="submit" className="et-btn et-btn--submit" disabled={submitting}> 
                        {submitting ? "SAVING UPDATES..." : "UPDATE REQUEST"} 
                    </button>
                    <button type="button" className="et-btn et-btn--cancel" onClick={handleDiscard}>
                        DISCARD CHANGES
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* FILE PREVIEW MODAL */}
      {previewFile && (
        <div className="et-modal-overlay" onClick={() => setPreviewFile(null)}>
          <div className="et-modal-preview-wrapper" onClick={e => e.stopPropagation()}>
            <div className="et-modal-preview-header">
              <span className="et-preview-filename">{previewFile.name.split('/').pop()}</span>
              <button className="et-close-preview" onClick={() => setPreviewFile(null)}><X size={24} /></button>
            </div>
            <div className="et-modal-preview-body">
                {renderPreviewContent()}
            </div>
            <div className="et-modal-preview-footer">
                <button className="et-delete-file-btn" onClick={() => handleDeleteFile(previewFile.fieldKey)}>
                  <Trash2 size={18} /> Remove File
                </button>
                <button className="et-close-btn-simple" onClick={() => setPreviewFile(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG */}
      <CustomConfirmModal 
        isOpen={confirmConfig.isOpen} 
        title={confirmConfig.title} 
        message={confirmConfig.message} 
        type={confirmConfig.type} 
        onConfirm={confirmConfig.onConfirm} 
        onCancel={() => setConfirmConfig({isOpen: false})} 
      />
    </div>
  );
};

export default EditPassport;
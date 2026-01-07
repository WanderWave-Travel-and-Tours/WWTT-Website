import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, Upload, X, FileText, User, 
  DollarSign, Eye, Trash2, HelpCircle, Briefcase
} from "lucide-react";
import Sidebar from "../../sidebar/sidebar"; 
import { useToast } from "../../toast/ToastManager"; 
import "./EditPassport.css"; 

// Reusable Confirm Modal - Updated z-index to 15000 to appear on top of preview
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
  const LOGS_API_URL = "http://localhost:5000/api/activity-logs"; // Logs endpoint

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
        const res = await fetch(`${API_BASE_URL}/${passportId}`);
        const result = await res.json();
        
        if (result.success && result.data) {
          const data = result.data;
          setOriginalData(data); // Store for change tracking
          
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

          if (data.deliveredDocuments && data.deliveredDocuments.length > 0) {
            setExistingFiles({ requirement: data.deliveredDocuments[0].fileUrl });
          } else if (data.evidenceUrl) {
            setExistingFiles({ requirement: data.evidenceUrl });
          }
        }
      } catch (err) {
        toast.error("Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };

    if (passportId) fetchPassportDetails();
  }, [passportId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
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

  const handleSubmit = (e) => {
    e.preventDefault();
    askConfirmation("Save Changes", "Confirm updates to this passport request?", () => performSubmit());
  };

  const performSubmit = async () => {
    setSubmitting(true);
    
    // Get Admin info for logging
    const adminData = JSON.parse(localStorage.getItem('adminUser')) || JSON.parse(localStorage.getItem('user')) || {};
    const adminEmail = adminData.email || "Unknown Admin";
    const adminName = adminData.username || adminData.firstName || "Admin";

    try {
      const data = new FormData();

      // Comparison Logic for Activity Logs
      let changes = [];
      const trackChange = (label, oldVal, newVal) => {
        const normOld = oldVal ? String(oldVal).trim() : "None";
        const normNew = newVal ? String(newVal).trim() : "None";
        if (normOld !== normNew) {
          changes.push(`${label}: "${normOld}" → "${normNew}"`);
        }
      };

      if (originalData) {
        trackChange("Given Name", originalData.givenName, formData.givenName);
        trackChange("Last Name", originalData.lastName, formData.lastName);
        trackChange("Email", originalData.email, formData.email);
        trackChange("Contact", originalData.contactNumber, formData.contactNumber);
        trackChange("Application Type", originalData.passportDetails?.applicationType, formData.passportDocument);
        trackChange("Price", originalData.estimatedPrice, formData.estimatedPrice);
        trackChange("Remarks", originalData.adminRemarks, formData.message);
      }

      if (files.requirement) {
        changes.push(`Uploaded new document: ${files.requirement.name}`);
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

      if (result.success) {
        // CREATE ACTIVITY LOG (Same as EditPSA process)
        if (changes.length > 0) {
          try {
            await fetch(LOGS_API_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: 'UPDATE',
                module: 'Passports',
                entity: 'Passport Inquiry',
                entityId: passportId,
                user: adminName,
                severity: 'SUCCESS',
                description: `Admin (${adminEmail}) updated passport request for ${combinedName}`,
                details: {
                  adminEmail,
                  targetName: combinedName,
                  changes: changes,
                  affectedRecords: 1
                }
              }),
            });
          } catch (logErr) {
            console.error("Logging failed:", logErr);
          }
        }

        toast.success("Changes saved successfully!");
        navigate("/services/passport"); 
      } else {
        toast.error(result.message || "Failed to update inquiry.");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("An error occurred while saving.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderPreviewContent = () => {
    if (!previewFile) return null;
    const { url, name } = previewFile;
    const isImage = name.match(/\.(jpeg|jpg|gif|png|webp)$/i);
    const isPdf = name.toLowerCase().endsWith('.pdf');

    if (isImage) return <img src={url} alt="Preview" style={{ maxWidth: '100%', maxHeight: '70vh', display: 'block', margin: '0 auto' }} />;
    if (isPdf) return <iframe src={url} title="PDF" style={{ width: '100%', height: '70vh', border: 'none' }} />;
    return <div style={{textAlign: 'center', padding: '20px'}}>Preview not available.</div>;
  };

  if (loading) return <div className="et-loading">Loading...</div>;

  return (
    <div className="et-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      <main className={`et-main ${isSidebarCollapsed ? "et-main--collapsed" : ""}`}>
        <div className="et-container">
          <header className="et-header">
            <div className="et-header-content">
              <button className="et-back-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /> Back</button>
              <h1 className="et-title">EDIT PASSPORT REQUEST</h1>
              <p className="et-subtitle">Update application details and documentation</p>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="et-form">
            <div className="et-grid-layout">
              <div className="et-form-left">
                {/* --- Client Information Section --- */}
                <section className="et-section">
                  <div className="et-section-header"><User size={22} /> <h3>Client Information</h3> </div>
                  <div className="et-fields-grid">
                    <div className="et-input-group"> <label>Given Name</label> <input type="text" name="givenName" value={formData.givenName} onChange={handleInputChange} className="et-input" required /> </div>
                    <div className="et-input-group"> <label>Last Name</label> <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="et-input" required /> </div>
                    <div className="et-input-group"> <label>Email</label> <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="et-input" required /> </div>
                    <div className="et-input-group"> <label>Contact No</label> <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} className="et-input" required /> </div>
                  </div>
                </section>

                {/* --- Service Details --- */}
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

                {/* --- Attachments Section --- */}
                <section className="et-section">
                  <div className="et-section-header"><Upload size={22} /> <h3>Attachments</h3> </div>
                  <FileRow 
                    label="Requirement Document" 
                    field="requirement" 
                    onChange={handleFileChange} 
                    onView={handleViewFile} 
                    hasExisting={!!existingFiles['requirement']} 
                    currentFile={files['requirement']} 
                  />
                </section>
              </div>

              {/* --- Billing & Notes --- */}
              <div className="et-form-right">
                <div className="et-sticky-sidebar">
                  <section className="et-section">
                    <div className="et-section-header"> <DollarSign size={20} /> <h3>Billing & Notes</h3> </div>
                    <div className="et-input-group"> <label>Estimated Price (PHP)</label> <input type="number" name="estimatedPrice" value={formData.estimatedPrice} onChange={handleInputChange} className="et-input" /> </div>
                    <div className="et-input-group" style={{marginTop: '15px'}}> <label>Admin Remarks</label> <textarea name="message" value={formData.message} onChange={handleInputChange} className="et-textarea" rows="4" placeholder="Enter notes or updates for the client..." /> </div>
                  </section>
                  <div className="et-form-actions">
                    <button type="submit" className="et-btn et-btn--submit" disabled={submitting}> {submitting ? "SAVING..." : "UPDATE CHANGES"} </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* --- PREVIEW MODAL --- */}
      {previewFile && (
        <div className="et-modal-overlay" onClick={() => setPreviewFile(null)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 12000
        }}>
          <div className="et-modal-preview-wrapper" onClick={e => e.stopPropagation()} style={{
            backgroundColor: 'white', width: '85%', maxWidth: '1000px', borderRadius: '12px', overflow: 'hidden'
          }}>
            <div className="et-modal-preview-header" style={{ padding: '1rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '600' }}>{previewFile.name}</span>
              <button onClick={() => setPreviewFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <div className="et-modal-preview-body" style={{ padding: '20px', minHeight: '400px', overflowY: 'auto' }}>
              {renderPreviewContent()}
            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRM MODAL --- */}
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
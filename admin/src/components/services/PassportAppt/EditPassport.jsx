import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, Upload, X, User, 
  DollarSign, Eye, HelpCircle, Briefcase, Trash2, FileText
} from "lucide-react";
import Sidebar from "../../sidebar/sidebar"; 
import { useToast } from "../../toast/ToastManager"; 
import "./EditPassport.css"; 

const CustomConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, type = "primary" }) => {
  if (!isOpen) return null;
  return (
    <div className="et-confirm-overlay">
      <div className="et-confirm-modal">
        <div style={{ marginBottom: '1rem' }}>
          <HelpCircle size={48} color={type === 'danger' ? '#ef4444' : '#3b82f6'} style={{ margin: '0 auto' }} />
        </div>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="et-confirm-buttons">
          <button onClick={onCancel} className="et-confirm-btn-cancel">Cancel</button>
          <button onClick={onConfirm} className={`et-confirm-btn-confirm ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

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

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false, title: "", message: "", onConfirm: () => {}, type: "primary"
  });

  const [formData, setFormData] = useState({
    givenName: "",
    lastName: "",
    email: "",
    contactNumber: "",
    applicationType: "", 
    estimatedPrice: "",
    message: "",
  });

  const [files, setFiles] = useState({});
  const [existingFiles, setExistingFiles] = useState({});

  const API_BASE_URL = "https://wanderwaveph-backend.onrender.com/api/inquiries"; 
  const FILE_BASE_URL = "https://wanderwaveph-backend.onrender.com";

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const askConfirmation = (title, message, onConfirm, type = "primary") => {
    setConfirmConfig({
      isOpen: true, title: title, message: message, type: type,
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
          const nameParts = data.fullName ? data.fullName.split(" ") : ["", ""];
          const lName = nameParts.length > 1 ? nameParts.pop() : "";
          const gName = nameParts.join(" ");

          setFormData({
            givenName: data.givenName || gName || "",
            lastName: data.lastName || lName || "",
            email: data.email || "",
            contactNumber: data.contactNumber || "",
            applicationType: data.passportDetails?.applicationType || "", 
            estimatedPrice: data.estimatedPrice || "",
            message: data.adminRemarks || data.message || "",
          });

          if (data.evidenceUrl) {
            setExistingFiles({ requirement: data.evidenceUrl });
          } else if (data.deliveredDocuments && data.deliveredDocuments.length > 0) {
            const foundDoc = data.deliveredDocuments.find(doc => 
                doc.fileName.toLowerCase().includes("walkindoc") || 
                doc.fileName.toLowerCase().includes("requirement")
            );
            if (foundDoc) setExistingFiles({ requirement: foundDoc.fileUrl });
          }
        }
      } catch (err) {
        toast.error("Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };

    if (passportId) fetchPassportDetails();
  }, [passportId, API_BASE_URL, toast]); // Fixed dependency array

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "givenName" || name === "lastName") {
      const nameRegex = /^[a-zA-Z\sñÑ]*$/; 
      if (!nameRegex.test(value)) return; 
    }

    if (name === "contactNumber") {
      let val = value.replace(/[^0-9+]/g, ""); 
      if (val.includes("+") && val.indexOf("+") !== 0) {
        val = val.replace(/\+/g, ""); 
      }
      if (val.length > 20) return;
      setFormData(prev => ({ ...prev, [name]: val }));
      return;
    }

    if (name === "estimatedPrice") {
      const val = value.replace(/[^0-9]/g, ""); 
      if (val.length > 6) return;
      setFormData(prev => ({ ...prev, [name]: val }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      askConfirmation(
        "Upload Confirmation",
        `Are you sure you want to upload "${file.name}"?`,
        () => {
          setFiles((prev) => ({ ...prev, [fieldName]: file }));
          toast.info("File prepared for upload.");
        }
      );
    }
  };

  const handleViewFile = (fieldKey) => {
    if (files[fieldKey]) {
      setPreviewFile({ url: URL.createObjectURL(files[fieldKey]), name: files[fieldKey].name, fieldKey, isNew: true });
    } else if (existingFiles[fieldKey]) {
      const url = existingFiles[fieldKey];
      setPreviewFile({ url: url.startsWith('http') ? url : `${FILE_BASE_URL}${url}`, name: url, fieldKey, isNew: false });
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
        toast.success("File removed.");
      },
      "danger"
    );
  };

  // ADDED: Confirmation logic for Back and Discard buttons
  const handleDiscard = () => {
    askConfirmation(
      "Discard Changes",
      "Are you sure you want to discard your changes? All unsaved updates will be lost.",
      () => navigate(-1),
      "danger"
    );
  };

  const performSubmit = async () => {
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
    const data = new FormData();
    const combinedFullName = `${formData.givenName} ${formData.lastName}`.trim();
    
    data.append("fullName", combinedFullName);
    data.append("email", formData.email);
    data.append("contactNumber", formData.contactNumber);
    data.append("passportDocument", formData.applicationType); 
    data.append("estimatedPrice", formData.estimatedPrice);
    data.append("message", formData.message);

    if (files.requirement) data.append("walkInDoc", files.requirement);

    data.append("existingFiles", JSON.stringify(Object.keys(existingFiles)));
    data.append("hasExistingEvidence", existingFiles.requirement ? "true" : "false");

    try {
      const res = await fetch(`${API_BASE_URL}/update/${passportId}`, { method: "PUT", body: data });
      const result = await res.json();
      if (result.success) {
        toast.success("Updated successfully!");
        navigate("/services/passport");
      }
    } catch (error) {
      toast.error("Error updating record.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    askConfirmation("Save Changes", "Update this Passport request?", () => performSubmit());
  };

  const renderPreviewContent = () => {
    if (!previewFile) return null;
    const { url, name } = previewFile;
    const isImage = name.match(/\.(jpeg|jpg|gif|png|webp)$/i) || url.startsWith('blob:');
    const isPdf = name.toLowerCase().endsWith('.pdf');

    if (isImage && !isPdf) {
      return <img src={url} alt="Preview" className="preview-media-full" />;
    } else if (isPdf) {
      return <iframe src={url} title="PDF Preview" style={{ width: '100%', height: '100%', border: 'none' }} />;
    } else {
      return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <FileText size={48} style={{ margin: '0 auto 10px', color: '#64748b' }} />
          <p>Preview not available for this format.</p>
          <a href={url} download className="et-view-btn" style={{ display: 'inline-flex', marginTop: '10px' }}>Download to View</a>
        </div>
      );
    }
  };

  if (loading) return <div className="et-loading">Loading...</div>;

  return (
    <div className="et-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      <main className={`et-main ${isSidebarCollapsed ? "et-main--collapsed" : ""}`}>
        <div className="et-container">
          <header className="et-header">
            <div className="et-header-content">
              {/* BACK BUTTON WITH CONFIRMATION */}
              <button className="et-back-btn" onClick={handleDiscard}>
                <ArrowLeft size={20} /> Back
              </button>
              <h1 className="et-title">EDIT PASSPORT REQUEST</h1>
              <p className="et-subtitle">Update application details and documentation</p>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="et-form">
            <div className="et-grid-layout">
              <div className="et-form-left">
                <section className="et-section">
                  <div className="et-section-header"><User size={22} /> <h3>Client Information</h3> </div>
                  <div className="et-fields-grid">
                    <div className="et-input-group"> <label>Given Name</label> <input type="text" name="givenName" value={formData.givenName} onChange={handleInputChange} className="et-input" required /> </div>
                    <div className="et-input-group"> <label>Last Name</label> <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="et-input" required /> </div>
                    <div className="et-input-group"> <label>Email</label> <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="et-input" required /> </div>
                    <div className="et-input-group"> <label>Contact No</label> <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} className="et-input" required /> </div>
                  </div>
                </section>

                <section className="et-section">
                  <div className="et-section-header"><Briefcase size={22} /> <h3>Service Details</h3> </div>
                  <div className="et-fields-grid">
                    <div className="et-input-group full-width">
                      <label>Application Type</label>
                      <select 
                        name="applicationType" 
                        value={formData.applicationType} 
                        onChange={handleInputChange} 
                        className="et-input" 
                        required
                      >
                        <option value="" disabled>Select Application Type</option>
                        <option value="NEW">New Application</option>
                        <option value="RENEWAL">Renewal</option>
                        <option value="LOST">Lost Passport</option>
                      </select>
                    </div>
                  </div>
                </section>

                <section className="et-section">
                  <div className="et-section-header"><Upload size={22} /> <h3>Attachments</h3> </div>
                  <FileRow label="Requirement Document" field="requirement" onChange={handleFileChange} onView={() => handleViewFile('requirement')} hasExisting={!!existingFiles['requirement']} currentFile={files['requirement']} />
                </section>
              </div>

              <div className="et-form-right">
                <div className="et-sticky-sidebar">
                  <section className="et-section">
                    <div className="et-section-header"> <DollarSign size={20} /> <h3>Billing & Notes</h3> </div>
                    <div className="et-input-group"> <label>Estimated Price (PHP)</label> <input type="text" name="estimatedPrice" value={formData.estimatedPrice} onChange={handleInputChange} className="et-input" /> </div>
                    <div className="et-input-group" style={{marginTop: '15px'}}> <label>Admin Remarks</label> <textarea name="message" value={formData.message} onChange={handleInputChange} className="et-textarea" rows="4" /> </div>
                  </section>
                  <div className="et-form-actions">
                    <button type="submit" className="et-btn et-btn--submit" disabled={submitting}> {submitting ? "SAVING..." : "UPDATE REQUEST"} </button>
                    {/* DISCARD BUTTON WITH CONFIRMATION */}
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
              <span style={{ fontWeight: 600, color: '#1e293b' }}>{previewFile.name.split('/').pop()}</span>
              <button onClick={() => setPreviewFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <div className="et-modal-preview-body" style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
                {renderPreviewContent()}
            </div>
            <div className="et-modal-preview-footer" style={{ padding: '15px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', background: 'white' }}>
                <button className="et-view-btn" style={{ color: '#ef4444', borderColor: '#fecaca', background: '#fef2f2' }} onClick={() => handleDeleteFile(previewFile.fieldKey)}>
                  <Trash2 size={16} style={{ marginRight: '6px' }} /> Remove File
                </button>
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
        onCancel={() => setConfirmConfig({isOpen: false})} 
      />
    </div>
  );
};

export default EditPassport;
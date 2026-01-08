import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, Upload, X, FileText, User, MessageSquare, 
  Calendar, DollarSign, Briefcase, Eye, Globe, Building2, 
  GraduationCap, Users, ClipboardList, Trash2, HelpCircle,
  ChevronDown, ChevronUp
} from "lucide-react";
import Sidebar from "../../sidebar/sidebar"; 
import { useToast } from "../../toast/ToastManager"; 
import "./EditVisa.css"; 

// 🔥🔥🔥 HELPER FUNCTION - GET ADMIN DATA 🔥🔥🔥
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

const EditVisa = () => {
  const navigate = useNavigate();
  const { id: visaId } = useParams();
  const toast = useToast(); 

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [showMore, setShowMore] = useState(false);

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
    otherNames: "",
    travelDate: "",
    lengthOfStay: "",
    visaType: "", 
    message: "", 
    estimatedPrice: ""
  });

  const [files, setFiles] = useState({});
  const [existingFiles, setExistingFiles] = useState({});

  const API_BASE_URL = "http://localhost:5000/api/inquiries"; 
  const FILE_BASE_URL = "http://localhost:5000";

  const todayObj = new Date();
  const tomorrowObj = new Date(todayObj);
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const minTravelDate = tomorrowObj.toISOString().split("T")[0];

  const maxDateObj = new Date(todayObj);
  maxDateObj.setFullYear(maxDateObj.getFullYear() + 1);
  const maxTravelDate = maxDateObj.toISOString().split("T")[0];

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
    const fetchVisaDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/${visaId}`);
        const result = await res.json();
        
        if (result.success && result.data) {
          const d = result.data;

          const formatForInput = (dateValue) => {
            if (!dateValue) return "";
            const date = new Date(dateValue);
            return isNaN(date.getTime()) ? "" : date.toISOString().split('T')[0];
          };

          let cleanMessage = d.adminRemarks || d.message || "";
          let existingTravelDate = formatForInput(d.travelDate);
          let existingStay = d.lengthOfStay || "";

          setFormData({
            givenName: d.givenName || d.fullName?.split(' ')[0] || "",
            lastName: d.lastName || d.fullName?.split(' ').slice(1).join(' ') || "",
            email: d.email || "",
            contactNumber: d.contactNumber || "",
            otherNames: d.otherNames || "",
            travelDate: existingTravelDate, 
            lengthOfStay: existingStay, 
            visaType: d.serviceName || "",
            message: cleanMessage, 
            estimatedPrice: d.estimatedPrice || ""
          });

          if (d.deliveredDocuments) {
            const fileMap = {};
            d.deliveredDocuments.forEach(doc => {
              const fieldKey = doc.fileName.split(' - ')[0].trim(); 
              fileMap[fieldKey] = doc.fileUrl;
            });
            setExistingFiles(fileMap);
          }
        }
      } catch (err) {
        console.error("Fetch Error:", err);
        toast.error("Failed to load visa details.");
      } finally {
        setLoading(false);
      }
    };
    if (visaId) fetchVisaDetails();
  }, [visaId, API_BASE_URL, toast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setFiles(prevFiles => ({ ...prevFiles, [fieldName]: file }));
      toast.info(`Selected: ${file.name}`);
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
      setPreviewFile({ url: `${FILE_BASE_URL}${url}`, name: url, fieldKey, isNew: false });
    } else {
      toast.warning("No document available.");
    }
  };

  const handleDeleteFile = (fieldKey) => {
    setFiles(prevFiles => {
      const newFiles = { ...prevFiles };
      delete newFiles[fieldKey];
      return newFiles;
    });
    setExistingFiles(prevExisting => {
      const newExisting = { ...prevExisting };
      delete newExisting[fieldKey];
      return newExisting;
    });
    setPreviewFile(null);
    toast.success("File removed.");
  };

  const handleDiscard = () => {
    askConfirmation(
      "Discard Changes",
      "Are you sure you want to discard your changes?",
      () => navigate(-1)
    );
  };

  const handleSaveConfirmation = (e) => {
    e.preventDefault();
    askConfirmation(
      "Save Changes",
      "Are you sure you want to save all updates?",
      () => performSubmit()
    );
  };

  const performSubmit = async () => {
    try {
      setSubmitting(true);
      const { userEmail, adminId } = getAdminData();
      
      const data = new FormData();
      
      // ✅ LOGIC FROM AIRLINE/PSA: Pass necessary fields correctly
      data.append('fullName', `${formData.givenName} ${formData.lastName}`.trim());
      data.append('email', formData.email);
      data.append('contactNumber', formData.contactNumber);
      data.append('serviceName', formData.visaType);
      data.append('estimatedPrice', formData.estimatedPrice);
      data.append('message', formData.message); // Admin Notes
      data.append('travelDate', formData.travelDate);
      data.append('lengthOfStay', formData.lengthOfStay);
      data.append('userEmail', userEmail);
      data.append('adminId', adminId);

      // Handle Existing Files (para hindi mabura yung hindi pinalitan)
      data.append('existingFiles', JSON.stringify(Object.keys(existingFiles)));

      // Handle New Files
      Object.keys(files).forEach(key => {
        if (files[key]) {
          data.append(key, files[key]);
        }
      });

      const res = await fetch(`${API_BASE_URL}/update/${visaId}`, {
        method: "PUT",
        body: data,
      });

      const result = await res.json();

      if (result.success) {
        toast.success("Visa application updated successfully!");
        navigate("/services/visa");
      } else {
        toast.error(result.message || "Update failed");
      }
    } catch (err) {
      console.error("Submit Error:", err);
      toast.error("An error occurred during update.");
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
      return <img src={url} alt="File Preview" className="preview-media-full" />;
    } else {
      return <iframe src={url} title="Document Preview" className="preview-iframe-full" />;
    }
  };

  if (loading) return <div className="et-loading">Loading Visa Form...</div>;

  return (
    <div className="et-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      <main className={`et-main ${isSidebarCollapsed ? "et-main--collapsed" : ""}`}>
        <div className="et-container">
          <header className="et-header">
            <div className="et-header-content">
              <button className="et-back-btn" type="button" onClick={handleDiscard}>
                <ArrowLeft size={20} /> Back
              </button>
              <h1 className="et-title">Edit Visa Application</h1>
              <p className="et-subtitle">Update applicant details and requirements</p>
            </div>
          </header>

          <form onSubmit={handleSaveConfirmation} className="et-form">
            <div className="et-grid-layout">
              <div className="et-form-left">
                <section className="et-section">
                  <div className="et-section-header">
                    <Calendar size={22} className="et-section-icon" />
                    <h3>Application Details</h3>
                  </div>
                  <div className="et-fields-grid">
                    <div className="et-input-group">
                      <label>Travel Date</label>
                      <input 
                        type="date" 
                        name="travelDate" 
                        value={formData.travelDate} 
                        onChange={handleInputChange} 
                        min={minTravelDate}
                        max={maxTravelDate}
                        className="et-input" 
                        required
                      />
                    </div>
                    <div className="et-input-group">
                      <label>Length of Stay (Days)</label>
                      <input 
                        type="text" 
                        name="lengthOfStay" 
                        value={formData.lengthOfStay} 
                        onChange={handleInputChange} 
                        className="et-input" 
                        placeholder="e.g. 15"
                        required
                      />
                    </div>
                  </div>
                </section>

                <section className="et-section">
                  <div className="et-section-header">
                    <Globe size={22} className="et-section-icon" />
                    <h3>Visa Request</h3>
                  </div>
                  <div className="et-input-group full-width">
                    <label>Visa Type</label>
                    <input type="text" name="visaType" value={formData.visaType} onChange={handleInputChange} className="et-input" />
                  </div>
                </section>

                <section className="et-section">
                  <div className="et-section-header">
                    <User size={22} className="et-section-icon" />
                    <h3>Client Information</h3>
                  </div>
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
                      <label>Email Address</label>
                      <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="et-input" required />
                    </div>
                    <div className="et-input-group">
                      <label>Contact Number</label>
                      <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} className="et-input" required />
                    </div>
                    <div className="et-input-group full-width">
                      <label>Other Names (Optional)</label>
                      <input type="text" name="otherNames" value={formData.otherNames} onChange={handleInputChange} className="et-input" />
                    </div>
                  </div>
                </section>

                <section className="et-section">
                  <div className="et-section-header">
                    <FileText size={22} className="et-section-icon" />
                    <h3>Primary Requirements</h3>
                  </div>
                  <div className="et-file-grid-internal">
                    <FileRow label="Passport" field="passport" onChange={handleFileChange} onView={() => handleViewFile('passport')} hasExisting={!!existingFiles['passport']} currentFile={files['passport']} />
                    <FileRow label="Photo" field="photo" onChange={handleFileChange} onView={() => handleViewFile('photo')} hasExisting={!!existingFiles['photo']} currentFile={files['photo']} />
                    <FileRow label="Accomplished Application Form" field="appForm" onChange={handleFileChange} onView={() => handleViewFile('appForm')} hasExisting={!!existingFiles['appForm']} currentFile={files['appForm']} />
                    <FileRow label="PSA Marriage Certificate" field="psaMarriage" onChange={handleFileChange} onView={() => handleViewFile('psaMarriage')} hasExisting={!!existingFiles['psaMarriage']} currentFile={files['psaMarriage']} />
                    <FileRow label="PSA Birth Certificate" field="psaBirth" onChange={handleFileChange} onView={() => handleViewFile('psaBirth')} hasExisting={!!existingFiles['psaBirth']} currentFile={files['psaBirth']} />
                    <FileRow label="Baptismal / Form 137" field="baptismal" onChange={handleFileChange} onView={() => handleViewFile('baptismal')} hasExisting={!!existingFiles['baptismal']} currentFile={files['baptismal']} />
                    <FileRow label="Daily Schedule" field="schedule" onChange={handleFileChange} onView={() => handleViewFile('schedule')} hasExisting={!!existingFiles['schedule']} currentFile={files['schedule']} />
                  </div>
                </section>

                <div className="et-show-more-container">
                    <button type="button" className="et-show-more-btn" onClick={() => setShowMore(!showMore)}>
                      {showMore ? (
                        <><ChevronUp size={18} /> Show Less Requirements</>
                      ) : (
                        <><ChevronDown size={18} /> Show More Requirements</>
                      )}
                    </button>
                </div>

                {showMore && (
                  <div className="et-extra-requirements-wrapper">
                    <section className="et-section animate-fade-in">
                      <div className="et-section-header">
                        <Briefcase size={22} className="et-section-icon" />
                        <h3>If Employed</h3>
                      </div>
                      <div className="et-file-grid-internal">
                        <FileRow label="Original Signed COE" field="coe" onChange={handleFileChange} onView={() => handleViewFile('coe')} hasExisting={!!existingFiles['coe']} currentFile={files['coe']} />
                        <FileRow label="Company ID" field="companyId" onChange={handleFileChange} onView={() => handleViewFile('companyId')} hasExisting={!!existingFiles['companyId']} currentFile={files['companyId']} />
                        <FileRow label="PRC/IBP Card" field="prcId" onChange={handleFileChange} onView={() => handleViewFile('prcId')} hasExisting={!!existingFiles['prcId']} currentFile={files['prcId']} />
                      </div>
                    </section>

                    <section className="et-section animate-fade-in">
                      <div className="et-section-header">
                        <Building2 size={22} className="et-section-icon" />
                        <h3>If Business Owner</h3>
                      </div>
                      <div className="et-file-grid-internal">
                        <FileRow label="DTI or SEC Permit" field="dtiSec" onChange={handleFileChange} onView={() => handleViewFile('dtiSec')} hasExisting={!!existingFiles['dtiSec']} currentFile={files['dtiSec']} />
                        <FileRow label="BIR company registration" field="birReg" onChange={handleFileChange} onView={() => handleViewFile('birReg')} hasExisting={!!existingFiles['birReg']} currentFile={files['birReg']} />
                        <FileRow label="Business Permit" field="businessPermit" onChange={handleFileChange} onView={() => handleViewFile('businessPermit')} hasExisting={!!existingFiles['businessPermit']} currentFile={files['businessPermit']} />
                      </div>
                    </section>

                    <section className="et-section animate-fade-in">
                      <div className="et-section-header">
                        <GraduationCap size={22} className="et-section-icon" />
                        <h3>If Student</h3>
                      </div>
                      <div className="et-file-grid-internal">
                        <FileRow label="School Certificate" field="schoolCert" onChange={handleFileChange} onView={() => handleViewFile('schoolCert')} hasExisting={!!existingFiles['schoolCert']} currentFile={files['schoolCert']} />
                        <FileRow label="School ID" field="schoolId" onChange={handleFileChange} onView={() => handleViewFile('schoolId')} hasExisting={!!existingFiles['schoolId']} currentFile={files['schoolId']} />
                      </div>
                    </section>
                  </div>
                )}
              </div>

              <div className="et-form-right">
                <div className="et-sticky-sidebar">
                  <section className="et-section">
                    <div className="et-section-header">
                      <MessageSquare size={20} className="et-section-icon" />
                      <h3>Admin Remarks</h3>
                    </div>
                    <div className="et-input-group">
                       <textarea name="message" value={formData.message} onChange={handleInputChange} className="et-textarea" rows="5" placeholder="Notes..." />
                    </div>
                  </section>
                  <div className="et-form-actions">
                    <button type="submit" className="et-btn et-btn--submit" disabled={submitting}>
                      {submitting ? "Updating..." : "Save Changes"}
                    </button>
                    <button type="button" className="et-btn et-btn--cancel" onClick={handleDiscard}>Discard</button>
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
            <div className="et-modal-preview-body">{renderPreviewContent()}</div>
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

export default EditVisa;
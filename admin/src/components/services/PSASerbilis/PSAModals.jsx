import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  X, CreditCard, CheckCircle, Upload, Send, FileText, Edit, Trash2,
  Plus, Save, ListPlus, ChevronDown, PlusCircle, Download, AlertCircle,
  Clock, User, Mail, DollarSign, Calendar, Package, TrendingUp, HelpCircle
} from "lucide-react";
import { useToast } from "../../toast/ToastManager"; // Inimport ang Toast Manager
import "./PSAModals.css";

// --- HELPER FUNCTIONS ---
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
};

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};

// ==========================================
// 0. CUSTOM CONFIRMATION MODAL (Based on EditVisa.jsx)
// ==========================================
const CustomConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, type = "primary" }) => {
  if (!isOpen) return null;
  return (
    <div className="ev-confirm-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 11000
    }}>
      <div className="ev-confirm-modal" style={{
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
              padding: '0.5rem 1.25rem', borderRadius: '6px', border: '1px solid #e2e880',
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

// ==========================================
// 1. PSA INQUIRY DETAILS MODAL
// ==========================================
export const PSAInquiryModal = ({
  inquiry, documents = [], onClose, onUpdateStatus, onRequestPayment,
  onConfirmPayment, showDeliverDocs, setShowDeliverDocs, deliveryFiles = [],
  setDeliveryFiles, handleDeliverDocuments, setShowContactRemarks,
}) => {
  const navigate = useNavigate();
  const toast = useToast(); // Hook para sa notification

  // Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "primary"
  });

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

  if (!inquiry) return null;

  const handleDeliverDocsSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    askConfirmation(
      "Confirm Delivery",
      "Are you sure you want to send these documents to the user? This will mark the request for completion.",
      () => {
        if (handleDeliverDocuments) {
          handleDeliverDocuments(e);
          toast.success("Documents sent to user successfully!");
        }
      }
    );
  };

  const wrapStatusUpdate = (id, status, label) => {
    const isDestructive = status === "CANCELLED";
    askConfirmation(
      `Update Status to ${label}`,
      `Are you sure you want to change the status of this request to ${label}?`,
      () => {
        onUpdateStatus(id, status);
        toast.info(`Status updated to ${label}`);
      },
      isDestructive ? "danger" : "primary"
    );
  };

  const getStatusConfig = (status) => {
    const configs = {
      PENDING: { color: "slate", icon: Clock, label: "Pending Review", description: "Request received" },
      CONTACTED: { color: "amber", icon: AlertCircle, label: "Action Required", description: "Issue reported to user" },
      PAYMENT_PENDING: { color: "amber", icon: CreditCard, label: "Waiting Payment", description: "Invoice sent" },
      PAID: { color: "blue", icon: CreditCard, label: "Payment Submitted", description: "Verify proof of payment" },
      CONFIRMED: { color: "green", icon: CheckCircle, label: "Processing", description: "Payment verified" },
      COMPLETED: { color: "success", icon: CheckCircle, label: "Completed", description: "Documents released" },
      CANCELLED: { color: "red", icon: X, label: "Cancelled", description: "Request terminated" },
    };
    return configs[status] || configs.PENDING;
  };

  const statusConfig = getStatusConfig(inquiry.status);
  const StatusIcon = statusConfig.icon;

  return (
    <>
      <div className="psam-overlay" onClick={onClose}>
        <div className="psam-modal psam-modal-lg" onClick={(e) => e.stopPropagation()}>
          
          {/* HEADER */}
          <div className="psam-header">
            <div className="psam-header-content">
              <div className="psam-title-group">
                <h2 className="psam-title">PSA Request Details</h2>
                <div className="psam-meta">
                  <span className="psam-ref">REF: #{inquiry._id.slice(-8).toUpperCase()}</span>
                  <span className="psam-divider">•</span>
                  <span className="psam-date">{formatDate(inquiry.createdAt)}</span>
                </div>
              </div>
              <div className={`psam-status-badge psam-status-${statusConfig.color}`}>
                <div className="psam-status-icon"><StatusIcon size={16} /></div>
                <div className="psam-status-content">
                  <span className="psam-status-label">{statusConfig.label}</span>
                  <span className="psam-status-desc">{statusConfig.description}</span>
                </div>
              </div>
            </div>
            <div className="psam-header-actions" style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="psam-edit-btn" 
                onClick={() => navigate(`/edit-psa/${inquiry._id}`)}
                title="Edit Full Details"
                style={{
                  background: '#f1f5f9', border: 'none', padding: '8px',
                  borderRadius: '8px', cursor: 'pointer', color: '#3b82f6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <Edit size={20} />
              </button>
              <button className="psam-close-btn" onClick={onClose} aria-label="Close modal">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* BODY */}
          <div className="psam-body">
            {/* ALERTS */}
            {inquiry.status === "PAID" && (
              <div className="psam-alert psam-alert-warning">
                <div className="psam-alert-icon"><CreditCard size={22} /></div>
                <div className="psam-alert-content">
                  <h4 className="psam-alert-title">Payment Verification Required</h4>
                  <p className="psam-alert-desc">The user has submitted a payment receipt. Please verify the amount and details.</p>
                </div>
                <button className="psam-btn psam-btn-success psam-btn-sm" onClick={() => {
                  askConfirmation("Confirm Payment", "Have you verified the payment receipt and amount?", () => {
                    onConfirmPayment();
                    toast.success("Payment confirmed!");
                  });
                }}>
                  <CheckCircle size={16} /><span>Confirm Payment</span>
                </button>
              </div>
            )}

            {inquiry.status === "CONFIRMED" && (
              <div className="psam-alert psam-alert-info">
                <div className="psam-alert-icon"><Upload size={22} /></div>
                <div className="psam-alert-content">
                  <h4 className="psam-alert-title">Processing Complete?</h4>
                  <p className="psam-alert-desc">If you have retrieved the PSA documents, upload them here to complete the order.</p>
                </div>
                {!showDeliverDocs && (
                  <button className="psam-btn psam-btn-primary psam-btn-sm" onClick={() => setShowDeliverDocs(true)}>
                    <Upload size={16} /><span>Upload & Deliver</span>
                  </button>
                )}
              </div>
            )}

            {/* UPLOAD ZONE */}
            {showDeliverDocs && (
              <div className="psam-upload-zone">
                <div className="psam-upload-header">
                  <div className="psam-upload-icon"><Upload size={20} /></div>
                  <div className="psam-upload-text">
                    <h4>Upload PSA Electronic Copies</h4>
                    <p>Select scanned PDF or Images (max 10MB)</p>
                  </div>
                </div>

                <div className="psam-upload-wrapper">
                  <input
                    type="file" multiple accept=".pdf,.jpg,.png,.jpeg"
                    onChange={(e) => {
                      setDeliveryFiles(Array.from(e.target.files));
                      toast.info(`${e.target.files.length} file(s) selected`);
                    }}
                    className="psam-hidden-input" id="psa-delivery-files"
                  />
                  <label htmlFor="psa-delivery-files" className="psam-upload-label">
                    <Package size={24} /><span>Click to browse or drag files here</span>
                  </label>
                </div>

                {deliveryFiles.length > 0 && (
                  <div className="psam-file-list">
                    <div className="psam-file-header"><span>{deliveryFiles.length} file{deliveryFiles.length > 1 ? "s" : ""} selected</span></div>
                    {deliveryFiles.map((file, idx) => (
                      <div key={idx} className="psam-file-item">
                        <div className="psam-file-icon"><FileText size={18} /></div>
                        <div className="psam-file-info">
                          <span className="psam-file-name">{file.name}</span>
                          <span className="psam-file-size">{formatFileSize(file.size)}</span>
                        </div>
                        <button className="psam-file-remove" onClick={() => {
                          setDeliveryFiles(deliveryFiles.filter((_, i) => i !== idx));
                          toast.warning("File removed from selection");
                        }}>
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="psam-upload-actions">
                  <button className="psam-btn psam-btn-ghost" onClick={() => setShowDeliverDocs(false)}>Cancel</button>
                  <button className="psam-btn psam-btn-primary" onClick={handleDeliverDocsSubmit} disabled={deliveryFiles.length === 0}>
                    <Send size={16} /><span>Send to User</span>
                  </button>
                </div>
              </div>
            )}

            {/* CLIENT INFO CARD */}
            <div className="psam-card">
              <div className="psam-card-header">
                <h3 className="psam-card-title">Client Information</h3>
              </div>
              <div className="psam-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="psam-info-item">
                  <div className="psam-info-icon"><User size={18} /></div>
                  <div className="psam-info-content">
                    <label className="psam-info-label">Full Name</label>
                    <span className="psam-info-value">{inquiry.fullName}</span>
                  </div>
                </div>
                <div className="psam-info-item">
                  <div className="psam-info-icon"><Mail size={18} /></div>
                  <div className="psam-info-content">
                    <label className="psam-info-label">Email Address</label>
                    <span className="psam-info-value">{inquiry.email}</span>
                  </div>
                </div>
                <div className="psam-info-item">
                  <div className="psam-info-icon"><DollarSign size={18} /></div>
                  <div className="psam-info-content">
                    <label className="psam-info-label">Total Amount</label>
                    <span className="psam-info-value psam-val-amount">₱{(inquiry.estimatedPrice || 0).toLocaleString()}</span>
                  </div>
                </div>
                <div className="psam-info-item">
                  <div className="psam-info-icon"><FileText size={18} /></div>
                  <div className="psam-info-content">
                    <label className="psam-info-label">Document Type</label>
                    <span className="psam-info-value">{inquiry.psaDocument || inquiry.serviceName}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* REQUEST MESSAGE */}
            <div className="psam-card">
              <div className="psam-card-header">
                <h3 className="psam-card-title">Request Message</h3>
              </div>
              <div className="psam-message-box">
                {inquiry.message || <span className="psam-msg-empty">No message provided by the user.</span>}
              </div>
            </div>

            {/* SUBMITTED DOCUMENTS */}
            <div className="psam-card">
              <div className="psam-card-header">
                <h3 className="psam-card-title">Submitted Documents</h3>
                <span className="psam-badge psam-badge-amber">{documents.length} {documents.length === 1 ? "file" : "files"}</span>
              </div>
              {documents.length === 0 ? (
                <div className="psam-empty">
                  <div className="psam-empty-icon"><FileText size={48} /></div>
                  <h4 className="psam-empty-title">No Requirements Yet</h4>
                  <p className="psam-empty-desc">User hasn't uploaded any Requirements for this request.</p>
                </div>
              ) : (
                <div className="psam-doc-list">
                  {documents.map((doc) => (
                    <div key={doc._id} className="psam-doc-item">
                      <div className="psam-doc-icon"><FileText size={20} /></div>
                      <div className="psam-doc-info">
                        <span className="psam-doc-name">{doc.originalName}</span>
                        <span className="psam-doc-meta">{formatFileSize(doc.fileSize)} • Uploaded {formatDate(doc.uploadedAt)}</span>
                      </div>
                      <a href={`https://wanderwaveph-backend.onrender.com${doc.fileUrl}`} target="_blank" rel="noopener noreferrer" className="psam-btn psam-btn-ghost psam-btn-sm">
                        <TrendingUp size={14} /> View
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ACTIONS */}
            <div className="psam-card">
              <div className="psam-card-header">
                <h3 className="psam-card-title">Quick Actions</h3>
              </div>
              <div className="psam-action-grid">
                <button className="psam-action-btn psam-action-primary" style={{ backgroundColor: '#eff6ff', color: '#3b82f6', border: '1px solid #dbeafe' }} onClick={() => navigate(`/edit-psa/${inquiry._id}`)}>
                  <div className="psam-action-icon"><Edit size={18} /></div>
                  <div className="psam-action-content">
                    <span className="psam-action-label">Edit Info</span>
                    <span className="psam-action-desc">Update form data</span>
                  </div>
                </button>

                <button className="psam-action-btn psam-action-secondary" onClick={() => wrapStatusUpdate(inquiry._id, "PENDING", "Pending")}>
                  <div className="psam-action-icon"><Clock size={18} /></div>
                  <div className="psam-action-content">
                    <span className="psam-action-label">Set Pending</span>
                    <span className="psam-action-desc">Return to review</span>
                  </div>
                </button>

                <button className="psam-action-btn psam-action-warning" onClick={() => setShowContactRemarks(true)}>
                  <div className="psam-action-icon"><AlertCircle size={18} /></div>
                  <div className="psam-action-content">
                    <span className="psam-action-label">Report Issue</span>
                    <span className="psam-action-desc">Contact user</span>
                  </div>
                </button>

                <button className="psam-action-btn psam-action-primary" onClick={() => {
                   askConfirmation("Request Payment", "Send a payment request and invoice to the user?", () => {
                     onRequestPayment();
                     toast.info("Payment request sent.");
                   });
                }}>
                  <div className="psam-action-icon"><CreditCard size={18} /></div>
                  <div className="psam-action-content">
                    <span className="psam-action-label">Request Payment</span>
                    <span className="psam-action-desc">Send invoice</span>
                  </div>
                </button>

                <button className="psam-action-btn psam-action-success" onClick={() => wrapStatusUpdate(inquiry._id, "COMPLETED", "Completed")}>
                  <div className="psam-action-icon"><CheckCircle size={18} /></div>
                  <div className="psam-action-content">
                    <span className="psam-action-label">Mark Complete</span>
                    <span className="psam-action-desc">Finish request</span>
                  </div>
                </button>

                <button className="psam-action-btn psam-action-danger" onClick={() => wrapStatusUpdate(inquiry._id, "CANCELLED", "Cancelled")}>
                  <div className="psam-action-icon"><X size={18} /></div>
                  <div className="psam-action-content">
                    <span className="psam-action-label">Cancel Request</span>
                    <span className="psam-action-desc">Terminate process</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* FOOTER BUTTONS */}
          <div className="cnm-footer" style={{ justifyContent: 'flex-end', gap: '12px', padding: '20px 24px', borderTop: '1px solid #f1f5f9' }}>
            <button 
                className="cnm-btn" 
                style={{ 
                  backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #dbeafe',
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
                  borderRadius: '8px', fontWeight: '600'
                }}
                onClick={() => navigate(`/EditPSA/${inquiry._id}`)}
            >
              <Edit size={18} /> <span>Edit PSA</span>
            </button>
            <button className="cnm-btn cnm-btn-ghost" onClick={onClose} style={{ border: '1px solid #e2e8f0', padding: '10px 24px', borderRadius: '8px' }}>
              Close
            </button>
          </div>
        </div>
      </div>

      <CustomConfirmModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
};

// ==========================================
// 2. PSA CONTACT REMARKS MODAL
// ==========================================
export const PSAContactRemarksModal = ({ remarks, setRemarks, setEvidence, onSubmit, onClose }) => {
  const toast = useToast();
  
  const handleRemarksSubmit = () => {
    if (!remarks.trim()) {
      toast.error("Please enter your remarks.");
      return;
    }
    onSubmit();
    toast.success("Issue report sent to user.");
  };

  return (
    <div className="psam-overlay">
      <div className="psam-modal psam-modal-sm">
        <div className="psam-header">
          <div className="psam-header-content">
            <div className="psam-title-group">
              <h2 className="psam-title">Report Issue / Remarks</h2>
              <div className="psam-meta">
                <span className="psam-subtitle">Notify user about issues with their PSA Request</span>
              </div>
            </div>
          </div>
          <button className="psam-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="psam-body">
          <div className="psam-form-group">
            <label className="psam-form-label">Remarks for User <span className="psam-label-req">*</span></label>
            <textarea
              className="psam-input" value={remarks} onChange={(e) => setRemarks(e.target.value)}
              placeholder="Describe the issue (e.g., Blurred ID, Wrong Spelling)..." rows="6"
            />
            <span className="psam-hint">{remarks.length} / 500 characters</span>
          </div>

          <div className="psam-form-group">
            <label className="psam-form-label">Attach Evidence (Optional)</label>
            <div className="psam-file-wrapper">
              <input
                type="file" className="psam-hidden-input" id="psa-evidence-file"
                onChange={(e) => {
                  setEvidence(e.target.files[0]);
                  if(e.target.files[0]) toast.info(`Attached: ${e.target.files[0].name}`);
                }} 
                accept=".pdf,.jpg,.png,.jpeg"
              />
              <label htmlFor="psa-evidence-file" className="psam-file-btn">
                <Upload size={18} /><span>Choose file</span>
              </label>
            </div>
            <span className="psam-hint">PDF, JPG, or PNG (max 5MB)</span>
          </div>

          <button className="psam-btn psam-btn-primary psam-btn-block" onClick={handleRemarksSubmit} disabled={!remarks.trim()}>
            <Send size={16} /><span>Send Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. PSA SERVICE LIST MODAL
// ==========================================
export const PSAServiceListModal = ({ services, onAdd, onEdit, onDelete, onClose }) => {
  const toast = useToast();
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  const askConfirmation = (title, message, onConfirm) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDelete = (id) => {
    askConfirmation(
      "Delete Service",
      "Are you sure you want to delete this PSA service? This action cannot be undone.",
      () => {
        onDelete(id);
        toast.success("Service deleted successfully.");
      }
    );
  };

  return (
    <>
      <div className="psam-overlay" onClick={onClose}>
        <div className="psam-modal psam-modal-xl" onClick={(e) => e.stopPropagation()}>
          <div className="psam-header">
            <div className="psam-header-content">
              <div className="psam-title-group">
                <h2 className="psam-title">Manage PSA Services</h2>
                <div className="psam-meta">
                  <span className="psam-subtitle">{services.length} document type{services.length !== 1 ? "s" : ""} available</span>
                </div>
              </div>
            </div>
            <button className="psam-close-btn" onClick={onClose} aria-label="Close modal">
              <X size={20} />
            </button>
          </div>

          <div className="psam-body">
            <button className="psam-btn psam-btn-primary psam-btn-block psam-btn-add" onClick={onAdd}>
              <Plus size={20} /><span>Add New Document Service</span>
            </button>

            {services.length === 0 ? (
              <div className="psam-empty">
                <div className="psam-empty-icon"><FileText size={48} /></div>
                <h4 className="psam-empty-title">No Services Yet</h4>
                <p className="psam-empty-desc">Create your first PSA service (e.g. Birth Certificate) to get started.</p>
              </div>
            ) : (
              <div className="psam-service-grid">
                {services.map((service) => (
                  <div key={service.id || service._id} className="psam-service-card">
                    <div className="psam-service-head">
                      <div className="psam-service-icon"><FileText size={28} /></div>
                      <div className="psam-service-price">₱{service.price}</div>
                    </div>
                    <div className="psam-service-body">
                      <h4 className="psam-service-title">{service.documentType}</h4>
                      {service.desc && <p className="psam-service-desc">{service.desc}</p>}
                    </div>
                    <div className="psam-service-foot">
                      <button className="psam-btn psam-btn-ghost psam-btn-sm psam-btn-text" onClick={() => onEdit(service)}>
                        <Edit size={16} /><span>Edit</span>
                      </button>
                      <button className="psam-btn psam-btn-danger psam-btn-ghost psam-btn-sm psam-btn-text" onClick={() => handleDelete(service.id || service._id)}>
                        <Trash2 size={16} /><span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <CustomConfirmModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type="danger"
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
};

// ==========================================
// 4. PSA SERVICE EDITOR MODAL
// ==========================================
export const PSAServiceEditorModal = ({
  isEditorOpen, form, setForm, requirements, steps, downloads, accordionState,
  toggleAccordion, addCategory, removeCategory, handleCategoryTitleChange,
  addRequirement, removeRequirement, handleLabelChange, addStep, removeStep,
  handleStepChange, handleDirectFileUpload, removeDownloadForm, onSave, onClose,
}) => {
  const toast = useToast();
  const [isConfirmingSave, setIsConfirmingSave] = useState(false);

  const handlePriceChange = (e) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^0-9]/g, '');
    const priceRegex = /^(?:[1-9]\d{0,5}|0)$/;
    
    if (numericValue === "") {
        setForm({ ...form, price: "" });
        return;
    }
    if (priceRegex.test(numericValue)) {
      setForm({ ...form, price: numericValue });
    }
  };

  const handleSaveAttempt = () => {
    if (!form.documentType || !form.price) {
      toast.error("Document Type and Price are required.");
      return;
    }
    setIsConfirmingSave(true);
  };

  const executeSave = () => {
    onSave();
    toast.success("Service configuration saved!");
    setIsConfirmingSave(false);
  };

  return (
    <>
      <div className="psam-overlay">
        <div className="psam-modal psam-modal-xl">
          <div className="psam-header">
            <div className="psam-header-content">
              <div className="psam-title-group">
                <h2 className="psam-title">{isEditorOpen ? "Edit PSA Service" : "Create New PSA Service"}</h2>
                <div className="psam-meta"><span className="psam-subtitle">Configure pricing, requirements, and processing steps</span></div>
              </div>
            </div>
            <button className="psam-close-btn" onClick={onClose} aria-label="Close modal">
              <X size={20} />
            </button>
          </div>

          <div className="psam-body">
            <div className="psam-form-section">
              <h3 className="psam-section-title"><span className="psam-section-icon">📋</span> Basic Information</h3>
              <div className="psam-form-row">
                <div className="psam-form-group">
                  <label className="psam-form-label">Document Type <span className="psam-label-req">*</span></label>
                  <input
                    type="text" className="psam-input" value={form.documentType}
                    onChange={(e) => setForm({ ...form, documentType: e.target.value })}
                    placeholder="e.g., Birth Certificate, CENOMAR"
                  />
                </div>
                <div className="psam-form-group">
                  <label className="psam-form-label">Price (PHP) <span className="psam-label-req">*</span></label>
                  <input
                    type="text" className="psam-input" value={form.price}
                    onChange={handlePriceChange} placeholder="0.00" maxLength="6" 
                  />
                </div>
              </div>
              <div className="psam-form-group">
                <label className="psam-form-label">Description</label>
                <textarea
                  className="psam-input" value={form.desc}
                  onChange={(e) => setForm({ ...form, desc: e.target.value })}
                  placeholder="Brief description of this service..." rows="3"
                />
              </div>
            </div>

            <div className="psam-accordion">
              <button className={`psam-acc-header ${accordionState.requirements ? "active" : ""}`} onClick={() => toggleAccordion("requirements")}>
                <div className="psam-acc-title">
                  <ListPlus size={20} /><span>Requirements</span><span className="psam-acc-badge">{requirements.length}</span>
                </div>
                <ChevronDown size={20} className={`psam-acc-icon ${accordionState.requirements ? "rotate" : ""}`} />
              </button>
              {accordionState.requirements && (
                <div className="psam-acc-content">
                  {requirements.map((category) => (
                    <div key={category.id} className="psam-req-category">
                      <div className="psam-cat-header">
                        <input
                          type="text" className="psam-cat-input" placeholder="Category Title"
                          value={category.title} onChange={(e) => handleCategoryTitleChange(category.id, e.target.value)}
                        />
                        <button className="psam-btn psam-btn-danger psam-btn-ghost psam-btn-sm psam-btn-icon" onClick={() => {
                          removeCategory(category.id);
                          toast.info("Category removed");
                        }}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <div className="psam-req-list">
                        {category.items.map((item) => (
                          <div key={item.id} className="psam-req-item">
                            <CheckCircle size={16} className="psam-req-icon" />
                            <input
                              type="text" className="psam-req-input" placeholder="Requirement item..."
                              value={item.label} onChange={(e) => handleLabelChange(category.id, item.id, e.target.value)}
                            />
                            <button className="psam-btn psam-btn-ghost psam-btn-sm psam-btn-icon" onClick={() => removeRequirement(category.id, item.id)}>
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                        <button className="psam-btn psam-btn-ghost psam-btn-sm" onClick={() => addRequirement(category.id)}>
                          <PlusCircle size={16} /><span>Add Item</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  <button className="psam-btn psam-btn-outline psam-btn-block" onClick={addCategory}>
                    <Plus size={18} /><span>Add Category</span>
                  </button>
                </div>
              )}
            </div>

            <div className="psam-accordion">
              <button className={`psam-acc-header ${accordionState.stepsProcess ? "active" : ""}`} onClick={() => toggleAccordion("stepsProcess")}>
                <div className="psam-acc-title">
                  <ListPlus size={20} /><span>Process Steps</span><span className="psam-acc-badge">{steps.length}</span>
                </div>
                <ChevronDown size={20} className={`psam-acc-icon ${accordionState.stepsProcess ? "rotate" : ""}`} />
              </button>
              {accordionState.stepsProcess && (
                <div className="psam-acc-content">
                  {steps.map((step, index) => (
                    <div key={step.id} className="psam-step-item">
                      <span className="psam-step-num">Step {index + 1}</span>
                      <input
                        type="text" className="psam-step-input" placeholder="Describe this step..."
                        value={step.label} onChange={(e) => handleStepChange(step.id, e.target.value)}
                      />
                      <button className="psam-btn psam-btn-ghost psam-btn-sm psam-btn-icon" onClick={() => removeStep(step.id)}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  <button className="psam-btn psam-btn-ghost psam-btn-sm" onClick={addStep}>
                    <Plus size={16} /><span>Add Step</span>
                  </button>
                </div>
              )}
            </div>

            <div className="psam-accordion">
              <button className={`psam-acc-header ${accordionState.downloadForms ? "active" : ""}`} onClick={() => toggleAccordion("downloadForms")}>
                <div className="psam-acc-title">
                  <Download size={20} /><span>Downloadable Forms</span><span className="psam-acc-badge">{downloads.length}</span>
                </div>
                <ChevronDown size={20} className={`psam-acc-icon ${accordionState.downloadForms ? "rotate" : ""}`} />
              </button>
              {accordionState.downloadForms && (
                <div className="psam-acc-content">
                  {downloads.map((file) => (
                    <div key={file.id} className="psam-dl-item">
                      <FileText size={20} className="psam-dl-icon" />
                      <span className="psam-dl-name">{file.name}</span>
                      <button className="psam-btn psam-btn-danger psam-btn-ghost psam-btn-sm" onClick={() => {
                        removeDownloadForm(file.id);
                        toast.warning("Form removed");
                      }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <label className="psam-upload-btn-lg">
                    <input type="file" hidden onChange={(e) => {
                      handleDirectFileUpload(e);
                      toast.info("Form uploaded");
                    }} />
                    <Upload size={18} /><span>Upload Form</span>
                  </label>
                </div>
              )}
            </div>
          </div>
          
          {/* Editor Footer Action */}
          <div className="psam-body" style={{ borderTop: '1px solid #f1f5f9', padding: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
             <button className="psam-btn psam-btn-ghost" onClick={onClose}>Discard</button>
             <button className="psam-btn psam-btn-primary" onClick={handleSaveAttempt}>
               <Save size={18} /> <span>Save Service</span>
             </button>
          </div>
        </div>
      </div>

      <CustomConfirmModal 
        isOpen={isConfirmingSave}
        title="Save Service Settings"
        message="Are you sure you want to save these changes to the PSA service configuration?"
        onConfirm={executeSave}
        onCancel={() => setIsConfirmingSave(false)}
      />
    </>
  );
};
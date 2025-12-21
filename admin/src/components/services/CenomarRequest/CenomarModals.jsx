import React from "react";
import {
  X, CreditCard, CheckCircle, Upload, Send, FileText, Edit, Trash2,
  Plus, Save, ListPlus, ChevronDown, PlusCircle, Download, AlertCircle,
  Clock, User, Mail, DollarSign, Calendar, Package, TrendingUp,
} from "lucide-react";
import "./CenomarModals.css";

// --- HELPER FUNCTIONS ---
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
};

const formatFileSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};

// ==========================================
// 1. INQUIRY DETAILS MODAL
// ==========================================
export const InquiryModal = ({
  inquiry, documents = [], onClose, onUpdateStatus, onRequestPayment,
  onConfirmPayment, showDeliverDocs, setShowDeliverDocs, deliveryFiles = [],
  setDeliveryFiles, handleDeliverDocuments, setShowContactRemarks,
}) => {
  if (!inquiry) return null;

  const handleDeliverDocsSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (handleDeliverDocuments) handleDeliverDocuments(e);
  };

  const getStatusConfig = (status) => {
    const configs = {
      PENDING: { color: "slate", icon: Clock, label: "Pending Review", description: "Awaiting initial review" },
      CONTACTED: { color: "amber", icon: AlertCircle, label: "Action Required", description: "User needs to respond" },
      PAYMENT_PENDING: { color: "amber", icon: CreditCard, label: "Waiting Payment", description: "Invoice sent to user" },
      PAID: { color: "blue", icon: CreditCard, label: "Payment Submitted", description: "Verify payment proof" },
      CONFIRMED: { color: "green", icon: CheckCircle, label: "Payment Confirmed", description: "Ready for processing" },
      COMPLETED: { color: "success", icon: CheckCircle, label: "Completed", description: "Documents delivered" },
      CANCELLED: { color: "red", icon: X, label: "Cancelled", description: "Request was cancelled" },
    };
    return configs[status] || configs.PENDING;
  };

  const statusConfig = getStatusConfig(inquiry.status);
  const StatusIcon = statusConfig.icon;

  // --- [FIXED] FILTERING LOGIC ---
  // 1. Check muna kung nasa 'deliveredDocuments' field ng inquiry (Style ng User Side)
  // 2. Kung wala, fallback sa pag-filter ng documents list (Backup)
  
  let finalSentDocs = [];

  if (inquiry.deliveredDocuments && inquiry.deliveredDocuments.length > 0) {
    // Priority: Gamitin ang data na nasa inquiry object mismo (gaya ng User Side)
    finalSentDocs = inquiry.deliveredDocuments;
  } else {
    // Fallback: Filter mula sa general documents list
    finalSentDocs = documents.filter(doc => 
      doc.uploader === 'ADMIN' || 
      doc.category === 'DELIVERABLE' || 
      doc.isAdminUpload === true
    );
  }

  // Filter Client Documents (Exclude anything that looks like an Admin Doc)
  // Note: Since we are prioritizing deliveredDocuments for admin view, 
  // we strictly filter documents prop for client uploads.
  const clientDocs = documents.filter(doc => 
    !doc.uploader || doc.uploader === 'USER' || doc.category === 'REQUIREMENT'
  );

  return (
    <div className="cnm-overlay" onClick={onClose}>
      <div className="cnm-modal cnm-modal-lg" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="cnm-header">
          <div className="cnm-header-content">
            <div className="cnm-title-group">
              <h2 className="cnm-title">Request Details</h2>
              <div className="cnm-meta">
                <span className="cnm-ref">REF: #{inquiry._id.slice(-8).toUpperCase()}</span>
                <span className="cnm-divider">•</span>
                <span className="cnm-date">{formatDate(inquiry.createdAt)}</span>
              </div>
            </div>
            <div className={`cnm-status-badge cnm-status-${statusConfig.color}`}>
              <div className="cnm-status-icon"><StatusIcon size={16} /></div>
              <div className="cnm-status-content">
                <span className="cnm-status-label">{statusConfig.label}</span>
                <span className="cnm-status-desc">{statusConfig.description}</span>
              </div>
            </div>
          </div>
          <button className="cnm-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="cnm-body">
          
          {/* ALERTS */}
          {inquiry.status === "PAID" && (
            <div className="cnm-alert cnm-alert-warning">
              <div className="cnm-alert-icon"><CreditCard size={22} /></div>
              <div className="cnm-alert-content">
                <h4 className="cnm-alert-title">Payment Verification Required</h4>
                <p className="cnm-alert-desc">The user has submitted payment proof. Please review.</p>
              </div>
              <button className="cnm-btn cnm-btn-success cnm-btn-sm" onClick={onConfirmPayment}>
                <CheckCircle size={16} /><span>Confirm Payment</span>
              </button>
            </div>
          )}

          {inquiry.status === "CONFIRMED" && !showDeliverDocs && finalSentDocs.length === 0 && (
            <div className="cnm-alert cnm-alert-info">
              <div className="cnm-alert-icon"><Upload size={22} /></div>
              <div className="cnm-alert-content">
                <h4 className="cnm-alert-title">Ready for Document Delivery</h4>
                <p className="cnm-alert-desc">Payment confirmed. Upload the final CENOMAR documents now.</p>
              </div>
              <button className="cnm-btn cnm-btn-primary cnm-btn-sm" onClick={() => setShowDeliverDocs(true)}>
                <Upload size={16} /><span>Upload Documents</span>
              </button>
            </div>
          )}

          {/* === [UPDATED] DELIVERY / ADMIN UPLOAD ZONE === */}
          {(showDeliverDocs || inquiry.status === 'COMPLETED' || finalSentDocs.length > 0) && (
            <div className="cnm-upload-zone" style={{ 
              borderColor: inquiry.status === 'COMPLETED' ? '#22c55e' : '#cbd5e1',
              backgroundColor: inquiry.status === 'COMPLETED' ? '#f0fdf4' : undefined
            }}>
              <div className="cnm-upload-header">
                <div className="cnm-upload-icon" style={{ background: inquiry.status === 'COMPLETED' ? '#22c55e' : undefined }}>
                  {inquiry.status === 'COMPLETED' ? <CheckCircle size={20} color="white"/> : <Upload size={20} color="white"/>}
                </div>
                <div className="cnm-upload-text">
                  <h4>{inquiry.status === 'COMPLETED' ? 'Processing Complete' : 'Upload Final Documents'}</h4>
                  <p>
                    {inquiry.status === 'COMPLETED' 
                      ? 'The following documents have been sent to the user:' 
                      : 'If you have retrieved the documents, upload them here to complete the order.'}
                  </p>
                </div>
              </div>

              {/* === [FIXED LIST] DISPLAY SENT FILES === */}
              {finalSentDocs.length > 0 && (
                <div className="cnm-file-list" style={{ marginBottom: '20px' }}>
                  <div className="cnm-file-header" style={{ color: '#16a34a' }}><span>Sent to User (Stored)</span></div>
                  {finalSentDocs.map((doc, idx) => (
                    <div key={doc._id || idx} className="cnm-file-item" style={{ 
                      borderColor: '#86efac', 
                      background: 'white',
                      boxShadow: '0 2px 5px rgba(22, 163, 74, 0.05)'
                    }}>
                      <div className="cnm-file-icon" style={{ color: '#16a34a', background: '#dcfce7' }}>
                        <FileText size={18} />
                      </div>
                      <div className="cnm-file-info">
                        {/* Support both fileName (from inquiry array) and originalName (from docs array) */}
                        <span className="cnm-file-name" style={{fontWeight:'700', color: '#15803d'}}>
                          {doc.fileName || doc.originalName}
                        </span>
                        <span className="cnm-file-size" style={{color:'#16a34a'}}>
                           Sent • {formatDate(doc.uploadedAt)}
                        </span>
                      </div>
                      <a 
                        href={`https://wanderwaveph-backend.onrender.com0${doc.fileUrl}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="cnm-btn cnm-btn-ghost cnm-btn-sm" 
                        style={{color:'#16a34a'}}
                      >
                        <TrendingUp size={14} /> View
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* UPLOAD INPUT BOX */}
              <div className="cnm-upload-wrapper">
                <input
                  type="file" multiple accept=".pdf,.jpg,.png,.jpeg"
                  onChange={(e) => setDeliveryFiles(Array.from(e.target.files))}
                  className="cnm-hidden-input" id="delivery-files"
                />
                <label htmlFor="delivery-files" className="cnm-upload-label" style={{ background: 'white', borderStyle: 'dashed' }}>
                  <Package size={24} />
                  <span>
                    {inquiry.status === 'COMPLETED' 
                      ? 'Click to send ADDITIONAL files' 
                      : 'Click to browse or drag files here'}
                  </span>
                </label>
              </div>

              {/* PENDING UPLOADS (Ready to Send) */}
              {deliveryFiles.length > 0 && (
                <div className="cnm-file-list">
                  <div className="cnm-file-header"><span>Ready to Send ({deliveryFiles.length})</span></div>
                  {deliveryFiles.map((file, idx) => (
                    <div key={idx} className="cnm-file-item" style={{ borderStyle: 'dashed' }}>
                      <div className="cnm-file-icon"><FileText size={18} /></div>
                      <div className="cnm-file-info">
                        <span className="cnm-file-name">{file.name}</span>
                        <span className="cnm-file-size">{formatFileSize(file.size)}</span>
                      </div>
                      <button className="cnm-file-remove" onClick={() => setDeliveryFiles(deliveryFiles.filter((_, i) => i !== idx))}>
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* BUTTONS */}
              {deliveryFiles.length > 0 && (
                <div className="cnm-upload-actions">
                  <button className="cnm-btn cnm-btn-ghost" onClick={() => { setDeliveryFiles([]); if(inquiry.status !== 'COMPLETED') setShowDeliverDocs(false); }}>
                    Cancel
                  </button>
                  <button className="cnm-btn cnm-btn-primary" onClick={handleDeliverDocsSubmit}>
                    <Send size={16} /><span>{inquiry.status === 'COMPLETED' ? 'Send Additional' : 'Send & Complete'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* CLIENT INFORMATION */}
          <div className="cnm-card">
            <div className="cnm-card-header">
              <h3 className="cnm-card-title">Client Information</h3>
            </div>
            <div className="cnm-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="cnm-info-item">
                <div className="cnm-info-icon"><User size={18} /></div>
                <div className="cnm-info-content">
                  <label className="cnm-info-label">Full Name</label>
                  <span className="cnm-info-value">{inquiry.fullName}</span>
                </div>
              </div>
              <div className="cnm-info-item">
                <div className="cnm-info-icon"><Mail size={18} /></div>
                <div className="cnm-info-content">
                  <label className="cnm-info-label">Email Address</label>
                  <span className="cnm-info-value">{inquiry.email}</span>
                </div>
              </div>
              <div className="cnm-info-item">
                <div className="cnm-info-icon"><DollarSign size={18} /></div>
                <div className="cnm-info-content">
                  <label className="cnm-info-label">Amount</label>
                  <span className="cnm-info-value cnm-val-amount">₱{(inquiry.estimatedPrice || 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="cnm-info-item">
                <div className="cnm-info-icon"><Calendar size={18} /></div>
                <div className="cnm-info-content">
                  <label className="cnm-info-label">Submitted</label>
                  <span className="cnm-info-value">{formatDate(inquiry.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* REQUEST MESSAGE */}
          <div className="cnm-card">
            <div className="cnm-card-header">
              <h3 className="cnm-card-title">Request Message</h3>
            </div>
            <div className="cnm-message-box">
              {inquiry.message || <span className="cnm-msg-empty">No message provided by the user.</span>}
            </div>
          </div>

          {/* SUBMITTED DOCUMENTS (CLIENT) */}
          <div className="cnm-card">
            <div className="cnm-card-header">
              <h3 className="cnm-card-title">Submitted Documents (Requirements)</h3>
              <span className="cnm-badge cnm-badge-amber">{clientDocs.length} file{clientDocs.length === 1 ? "" : "s"}</span>
            </div>
            {clientDocs.length === 0 ? (
              <div className="cnm-empty">
                <div className="cnm-empty-icon"><FileText size={48} /></div>
                <h4 className="cnm-empty-title">No Requirements Yet</h4>
                <p className="cnm-empty-desc">User hasn't uploaded any documents for this request.</p>
              </div>
            ) : (
              <div className="cnm-doc-list">
                {clientDocs.map((doc) => (
                  <div key={doc._id} className="cnm-doc-item">
                    <div className="cnm-doc-icon"><FileText size={20} /></div>
                    <div className="cnm-doc-info">
                      <span className="cnm-doc-name">{doc.originalName}</span>
                      <span className="cnm-doc-meta">{formatFileSize(doc.fileSize)} • Uploaded {formatDate(doc.uploadedAt)}</span>
                    </div>
                    <a href={`https://wanderwaveph-backend.onrender.com0${doc.fileUrl}`} target="_blank" rel="noopener noreferrer" className="cnm-btn cnm-btn-ghost cnm-btn-sm">
                      <TrendingUp size={14} /> View
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="cnm-card">
            <div className="cnm-card-header">
              <h3 className="cnm-card-title">Quick Actions</h3>
            </div>
            <div className="cnm-action-grid">
              <button className="cnm-action-btn cnm-action-secondary" onClick={() => onUpdateStatus(inquiry._id, "PENDING")}>
                <div className="cnm-action-icon"><Clock size={18} /></div>
                <div className="cnm-action-content">
                  <span className="cnm-action-label">Set Pending</span>
                  <span className="cnm-action-desc">Return to review</span>
                </div>
              </button>

              <button className="cnm-action-btn cnm-action-warning" onClick={() => setShowContactRemarks(true)}>
                <div className="cnm-action-icon"><AlertCircle size={18} /></div>
                <div className="cnm-action-content">
                  <span className="cnm-action-label">Report Issue</span>
                  <span className="cnm-action-desc">Contact user</span>
                </div>
              </button>

              <button className="cnm-action-btn cnm-action-primary" onClick={onRequestPayment}>
                <div className="cnm-action-icon"><CreditCard size={18} /></div>
                <div className="cnm-action-content">
                  <span className="cnm-action-label">Request Payment</span>
                  <span className="cnm-action-desc">Send invoice</span>
                </div>
              </button>

              <button className="cnm-action-btn cnm-action-success" onClick={() => onUpdateStatus(inquiry._id, "COMPLETED")}>
                <div className="cnm-action-icon"><CheckCircle size={18} /></div>
                <div className="cnm-action-content">
                  <span className="cnm-action-label">Mark Complete</span>
                  <span className="cnm-action-desc">Finish request</span>
                </div>
              </button>

              <button className="cnm-action-btn cnm-action-danger" onClick={() => onUpdateStatus(inquiry._id, "CANCELLED")}>
                <div className="cnm-action-icon"><X size={18} /></div>
                <div className="cnm-action-content">
                  <span className="cnm-action-label">Cancel Request</span>
                  <span className="cnm-action-desc">Terminate process</span>
                </div>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// ... (Other components like ContactRemarksModal, etc. stay the same as before) ...
export const ContactRemarksModal = ({ remarks, setRemarks, setEvidence, onSubmit, onClose }) => (
  <div className="cnm-overlay">
    <div className="cnm-modal cnm-modal-sm">
      <div className="cnm-header">
        <div className="cnm-header-content">
          <div className="cnm-title-group">
            <h2 className="cnm-title">Report Issue</h2>
            <div className="cnm-meta">
              <span className="cnm-subtitle">Notify user about required actions or problems</span>
            </div>
          </div>
        </div>
        <button className="cnm-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>
      </div>
      <div className="cnm-body">
        <div className="cnm-form-group">
          <label className="cnm-form-label">Remarks for User <span className="cnm-label-req">*</span></label>
          <textarea
            className="cnm-input" value={remarks} onChange={(e) => setRemarks(e.target.value)}
            placeholder="Describe the issue or action required..." rows="6"
          />
          <span className="cnm-hint">{remarks.length} / 500 characters</span>
        </div>
        <div className="cnm-form-group">
          <label className="cnm-form-label">Attach Evidence (Optional)</label>
          <div className="cnm-file-wrapper">
            <input
              type="file" className="cnm-hidden-input" id="evidence-file"
              onChange={(e) => setEvidence(e.target.files[0])} accept=".pdf,.jpg,.png,.jpeg"
            />
            <label htmlFor="evidence-file" className="cnm-file-btn">
              <Upload size={18} /><span>Choose file</span>
            </label>
          </div>
          <span className="cnm-hint">PDF, JPG, or PNG (max 5MB)</span>
        </div>
        <button className="cnm-btn cnm-btn-primary cnm-btn-block" onClick={onSubmit} disabled={!remarks.trim()}>
          <Send size={16} /><span>Send Report</span>
        </button>
      </div>
    </div>
  </div>
);

export const ServiceListModal = ({ services, onAdd, onEdit, onDelete, onClose }) => (
  <div className="cnm-overlay" onClick={onClose}>
    <div className="cnm-modal cnm-modal-xl" onClick={(e) => e.stopPropagation()}>
      <div className="cnm-header">
        <div className="cnm-header-content">
          <div className="cnm-title-group">
            <h2 className="cnm-title">Manage Services</h2>
            <div className="cnm-meta">
              <span className="cnm-subtitle">{services.length} service{services.length !== 1 ? "s" : ""} available</span>
            </div>
          </div>
        </div>
        <button className="cnm-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>
      </div>
      <div className="cnm-body">
        <button className="cnm-btn cnm-btn-primary cnm-btn-block cnm-btn-add" onClick={onAdd}>
          <Plus size={20} /><span>Add New Service</span>
        </button>
        {services.length === 0 ? (
          <div className="cnm-empty">
            <div className="cnm-empty-icon"><FileText size={48} /></div>
            <h4 className="cnm-empty-title">No Services Yet</h4>
            <p className="cnm-empty-desc">Create your first CENOMAR service to get started.</p>
          </div>
        ) : (
          <div className="cnm-service-grid">
            {services.map((service) => (
              <div key={service.id || service._id} className="cnm-service-card">
                <div className="cnm-service-head">
                  <div className="cnm-service-icon"><FileText size={28} /></div>
                  <div className="cnm-service-price">₱{service.price}</div>
                </div>
                <div className="cnm-service-body">
                  <h4 className="cnm-service-title">{service.documentType}</h4>
                  {service.desc && <p className="cnm-service-desc">{service.desc}</p>}
                </div>
                <div className="cnm-service-foot">
                  <button className="cnm-btn cnm-btn-ghost cnm-btn-sm cnm-btn-text" onClick={() => onEdit(service)}>
                    <Edit size={16} /><span>Edit</span>
                  </button>
                  <button className="cnm-btn cnm-btn-danger cnm-btn-ghost cnm-btn-sm cnm-btn-text" onClick={() => onDelete(service.id || service._id)}>
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
);

export const ServiceEditorModal = ({
  isEditorOpen, form, setForm, requirements, steps, downloads, accordionState,
  toggleAccordion, addCategory, removeCategory, handleCategoryTitleChange,
  addRequirement, removeRequirement, handleLabelChange, addStep, removeStep,
  handleStepChange, handleDirectFileUpload, removeDownloadForm, onSave, onClose,
}) => (
  <div className="cnm-overlay">
    <div className="cnm-modal cnm-modal-xl">
      <div className="cnm-header">
        <div className="cnm-header-content">
          <div className="cnm-title-group">
            <h2 className="cnm-title">{isEditorOpen ? "Edit Service" : "Create New Service"}</h2>
            <div className="cnm-meta"><span className="cnm-subtitle">Configure pricing, requirements, and processing steps</span></div>
          </div>
        </div>
        <button className="cnm-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>
      </div>
      <div className="cnm-body">
        {/* BASIC INFO */}
        <div className="cnm-form-section">
          <h3 className="cnm-section-title"><span className="cnm-section-icon">📋</span> Basic Information</h3>
          <div className="cnm-form-row">
            <div className="cnm-form-group">
              <label className="cnm-form-label">Service Title <span className="cnm-label-req">*</span></label>
              <input
                type="text" className="cnm-input" value={form.documentType}
                onChange={(e) => setForm({ ...form, documentType: e.target.value })}
                placeholder="e.g., CENOMAR (Standard Processing)"
              />
            </div>
            <div className="cnm-form-group">
              <label className="cnm-form-label">Price (PHP) <span className="cnm-label-req">*</span></label>
              <input
                type="number" className="cnm-input" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0.00" min="0" step="0.01"
              />
            </div>
          </div>
          <div className="cnm-form-group">
            <label className="cnm-form-label">Description</label>
            <textarea
              className="cnm-input" value={form.desc}
              onChange={(e) => setForm({ ...form, desc: e.target.value })}
              placeholder="Brief description of this service..." rows="3"
            />
          </div>
        </div>
        {/* REQUIREMENTS */}
        <div className="cnm-accordion">
          <button className={`cnm-acc-header ${accordionState.requirements ? "active" : ""}`} onClick={() => toggleAccordion("requirements")}>
            <div className="cnm-acc-title">
              <ListPlus size={20} /><span>Requirements</span><span className="cnm-acc-badge">{requirements.length}</span>
            </div>
            <ChevronDown size={20} className={`cnm-acc-icon ${accordionState.requirements ? "rotate" : ""}`} />
          </button>
          {accordionState.requirements && (
            <div className="cnm-acc-content">
              {requirements.map((category) => (
                <div key={category.id} className="cnm-req-category">
                  <div className="cnm-cat-header">
                    <input
                      type="text" className="cnm-cat-input" placeholder="Category Title"
                      value={category.title} onChange={(e) => handleCategoryTitleChange(category.id, e.target.value)}
                    />
                    <button className="cnm-btn cnm-btn-danger cnm-btn-ghost cnm-btn-sm cnm-btn-icon" onClick={() => removeCategory(category.id)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="cnm-req-list">
                    {category.items.map((item) => (
                      <div key={item.id} className="cnm-req-item">
                        <CheckCircle size={16} className="cnm-req-icon" />
                        <input
                          type="text" className="cnm-req-input" placeholder="Requirement item..."
                          value={item.label} onChange={(e) => handleLabelChange(category.id, item.id, e.target.value)}
                        />
                        <button className="cnm-btn cnm-btn-ghost cnm-btn-sm cnm-btn-icon" onClick={() => removeRequirement(category.id, item.id)}>
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    <button className="cnm-btn cnm-btn-ghost cnm-btn-sm" onClick={() => addRequirement(category.id)}>
                      <PlusCircle size={16} /><span>Add Item</span>
                    </button>
                  </div>
                </div>
              ))}
              <button className="cnm-btn cnm-btn-outline cnm-btn-block" onClick={addCategory}>
                <Plus size={18} /><span>Add Category</span>
              </button>
            </div>
          )}
        </div>
        {/* STEPS */}
        <div className="cnm-accordion">
          <button className={`cnm-acc-header ${accordionState.stepsProcess ? "active" : ""}`} onClick={() => toggleAccordion("stepsProcess")}>
            <div className="cnm-acc-title">
              <ListPlus size={20} /><span>Process Steps</span><span className="cnm-acc-badge">{steps.length}</span>
            </div>
            <ChevronDown size={20} className={`cnm-acc-icon ${accordionState.stepsProcess ? "rotate" : ""}`} />
          </button>
          {accordionState.stepsProcess && (
            <div className="cnm-acc-content">
              {steps.map((step, index) => (
                <div key={step.id} className="cnm-step-item">
                  <span className="cnm-step-num">Step {index + 1}</span>
                  <input
                    type="text" className="cnm-step-input" placeholder="Describe this step..."
                    value={step.label} onChange={(e) => handleStepChange(step.id, e.target.value)}
                  />
                  <button className="cnm-btn cnm-btn-ghost cnm-btn-sm cnm-btn-icon" onClick={() => removeStep(step.id)}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              <button className="cnm-btn cnm-btn-ghost cnm-btn-sm" onClick={addStep}>
                <Plus size={16} /><span>Add Step</span>
              </button>
            </div>
          )}
        </div>
        {/* DOWNLOADS */}
        <div className="cnm-accordion">
          <button className={`cnm-acc-header ${accordionState.downloadForms ? "active" : ""}`} onClick={() => toggleAccordion("downloadForms")}>
            <div className="cnm-acc-title">
              <Download size={20} /><span>Downloadable Forms</span><span className="cnm-acc-badge">{downloads.length}</span>
            </div>
            <ChevronDown size={20} className={`cnm-acc-icon ${accordionState.downloadForms ? "rotate" : ""}`} />
          </button>
          {accordionState.downloadForms && (
            <div className="cnm-acc-content">
              {downloads.map((file) => (
                <div key={file.id} className="cnm-dl-item">
                  <FileText size={20} className="cnm-dl-icon" />
                  <span className="cnm-dl-name">{file.name}</span>
                  <button className="cnm-btn cnm-btn-danger cnm-btn-ghost cnm-btn-sm" onClick={() => removeDownloadForm(file.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <label className="cnm-upload-btn-lg">
                <input type="file" hidden onChange={handleDirectFileUpload} />
                <Upload size={18} /><span>Upload Form</span>
              </label>
            </div>
          )}
        </div>
      </div>
      <div className="cnm-footer">
        <button className="cnm-btn cnm-btn-ghost" onClick={onClose}>Cancel</button>
        <button className="cnm-btn cnm-btn-primary" onClick={onSave}>
          <Save size={16} /><span>Save Changes</span>
        </button>
      </div>
    </div>
  </div>
);
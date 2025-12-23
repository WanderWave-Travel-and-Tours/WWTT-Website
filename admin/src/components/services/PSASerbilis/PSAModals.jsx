import React from "react";
import {
  X, CreditCard, CheckCircle, Upload, Send, FileText, Edit, Trash2,
  Plus, Save, ListPlus, ChevronDown, PlusCircle, Download, AlertCircle,
  Clock, User, Mail, DollarSign, Calendar, Package, TrendingUp,
} from "lucide-react";
import "./PSAModals.css";

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
// 1. PSA INQUIRY DETAILS MODAL
// ==========================================
export const PSAInquiryModal = ({
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

  // --- FILTERING LOGIC ---
  let finalSentDocs = [];
  if (inquiry.deliveredDocuments && inquiry.deliveredDocuments.length > 0) {
    finalSentDocs = inquiry.deliveredDocuments;
  } else {
    finalSentDocs = documents.filter(doc => 
      doc.uploader === 'ADMIN' || 
      doc.category === 'DELIVERABLE' || 
      doc.isAdminUpload === true
    );
  }

  const clientDocs = documents.filter(doc => 
    !doc.uploader || doc.uploader === 'USER' || doc.category === 'REQUIREMENT'
  );

  return (
    <div className="psam-overlay" onClick={onClose}>
      <div className="psam-modal psam-modal-lg" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="psam-header">
          <div className="psam-header-content">
            <div className="psam-title-group">
              <h2 className="psam-title">Request Details</h2>
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
          <button className="psam-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="psam-body">
          
          {/* ALERTS */}
          {inquiry.status === "PAID" && (
            <div className="psam-alert psam-alert-warning">
              <div className="psam-alert-icon"><CreditCard size={22} /></div>
              <div className="psam-alert-content">
                <h4 className="psam-alert-title">Payment Verification Required</h4>
                <p className="psam-alert-desc">The user has submitted payment proof. Please review.</p>
              </div>
              <button className="psam-btn psam-btn-success psam-btn-sm" onClick={onConfirmPayment}>
                <CheckCircle size={16} /><span>Confirm Payment</span>
              </button>
            </div>
          )}

          {inquiry.status === "CONFIRMED" && !showDeliverDocs && finalSentDocs.length === 0 && (
            <div className="psam-alert psam-alert-info">
              <div className="psam-alert-icon"><Upload size={22} /></div>
              <div className="psam-alert-content">
                <h4 className="psam-alert-title">Ready for Document Delivery</h4>
                <p className="psam-alert-desc">Payment confirmed. Upload the final PSA documents now.</p>
              </div>
              <button className="psam-btn psam-btn-primary psam-btn-sm" onClick={() => setShowDeliverDocs(true)}>
                <Upload size={16} /><span>Upload Documents</span>
              </button>
            </div>
          )}

          {/* UPLOAD ZONE */}
          {(showDeliverDocs || inquiry.status === 'COMPLETED' || finalSentDocs.length > 0) && (
            <div className="psam-upload-zone" style={{ 
              borderColor: inquiry.status === 'COMPLETED' ? '#22c55e' : '#cbd5e1',
              backgroundColor: inquiry.status === 'COMPLETED' ? '#f0fdf4' : undefined
            }}>
              <div className="psam-upload-header">
                <div className="psam-upload-icon" style={{ background: inquiry.status === 'COMPLETED' ? '#22c55e' : undefined }}>
                  {inquiry.status === 'COMPLETED' ? <CheckCircle size={20} color="white"/> : <Upload size={20} color="white"/>}
                </div>
                <div className="psam-upload-text">
                  <h4>{inquiry.status === 'COMPLETED' ? 'Processing Complete' : 'Upload Final Documents'}</h4>
                  <p>
                    {inquiry.status === 'COMPLETED' 
                      ? 'The following documents have been sent to the user:' 
                      : 'If you have retrieved the documents, upload them here to complete the order.'}
                  </p>
                </div>
              </div>

              {/* SENT FILES LIST */}
              {finalSentDocs.length > 0 && (
                <div className="psam-file-list" style={{ marginBottom: '20px' }}>
                  <div className="psam-file-header" style={{ color: '#16a34a' }}><span>Sent to User (Stored)</span></div>
                  {finalSentDocs.map((doc, idx) => (
                    <div key={doc._id || idx} className="psam-file-item" style={{ 
                      borderColor: '#86efac', 
                      background: 'white',
                      boxShadow: '0 2px 5px rgba(22, 163, 74, 0.05)'
                    }}>
                      <div className="psam-file-icon" style={{ color: '#16a34a', background: '#dcfce7' }}>
                        <FileText size={18} />
                      </div>
                      <div className="psam-file-info">
                        <span className="psam-file-name" style={{fontWeight:'700', color: '#15803d'}}>
                          {doc.fileName || doc.originalName}
                        </span>
                        <span className="psam-file-size" style={{color:'#16a34a'}}>
                           Sent • {formatDate(doc.uploadedAt)}
                        </span>
                      </div>
                      <a 
                        href={`http://localhost:5000${doc.fileUrl}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="psam-btn psam-btn-ghost psam-btn-sm" 
                        style={{color:'#16a34a'}}
                      >
                        <TrendingUp size={14} /> View
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* UPLOAD INPUT */}
              <div className="psam-upload-wrapper">
                <input
                  type="file" multiple accept=".pdf,.jpg,.png,.jpeg"
                  onChange={(e) => setDeliveryFiles(Array.from(e.target.files))}
                  className="psam-hidden-input" id="psa-delivery-files"
                />
                <label htmlFor="psa-delivery-files" className="psam-upload-label" style={{ background: 'white', borderStyle: 'dashed' }}>
                  <Package size={24} />
                  <span>
                    {inquiry.status === 'COMPLETED' 
                      ? 'Click to send ADDITIONAL files' 
                      : 'Click to browse or drag files here'}
                  </span>
                </label>
              </div>

              {/* PENDING UPLOADS */}
              {deliveryFiles.length > 0 && (
                <div className="psam-file-list">
                  <div className="psam-file-header"><span>Ready to Send ({deliveryFiles.length})</span></div>
                  {deliveryFiles.map((file, idx) => (
                    <div key={idx} className="psam-file-item" style={{ borderStyle: 'dashed' }}>
                      <div className="psam-file-icon"><FileText size={18} /></div>
                      <div className="psam-file-info">
                        <span className="psam-file-name">{file.name}</span>
                        <span className="psam-file-size">{formatFileSize(file.size)}</span>
                      </div>
                      <button className="psam-file-remove" onClick={() => setDeliveryFiles(deliveryFiles.filter((_, i) => i !== idx))}>
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* BUTTONS */}
              {deliveryFiles.length > 0 && (
                <div className="psam-upload-actions">
                  <button className="psam-btn psam-btn-ghost" onClick={() => { setDeliveryFiles([]); if(inquiry.status !== 'COMPLETED') setShowDeliverDocs(false); }}>
                    Cancel
                  </button>
                  <button className="psam-btn psam-btn-primary" onClick={handleDeliverDocsSubmit}>
                    <Send size={16} /><span>{inquiry.status === 'COMPLETED' ? 'Send Additional' : 'Send & Complete'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* CLIENT INFORMATION */}
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
                  <label className="psam-info-label">Amount</label>
                  <span className="psam-info-value psam-val-amount">₱{(inquiry.estimatedPrice || 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="psam-info-item">
                <div className="psam-info-icon"><Calendar size={18} /></div>
                <div className="psam-info-content">
                  <label className="psam-info-label">Submitted</label>
                  <span className="psam-info-value">{formatDate(inquiry.createdAt)}</span>
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
              <h3 className="psam-card-title">Submitted Documents (Requirements)</h3>
              <span className="psam-badge psam-badge-amber">{clientDocs.length} file{clientDocs.length === 1 ? "" : "s"}</span>
            </div>
            {clientDocs.length === 0 ? (
              <div className="psam-empty">
                <div className="psam-empty-icon"><FileText size={48} /></div>
                <h4 className="psam-empty-title">No Requirements Yet</h4>
                <p className="psam-empty-desc">User hasn't uploaded any documents for this request.</p>
              </div>
            ) : (
              <div className="psam-doc-list">
                {clientDocs.map((doc) => (
                  <div key={doc._id} className="psam-doc-item">
                    <div className="psam-doc-icon"><FileText size={20} /></div>
                    <div className="psam-doc-info">
                      <span className="psam-doc-name">{doc.originalName}</span>
                      <span className="psam-doc-meta">{formatFileSize(doc.fileSize)} • Uploaded {formatDate(doc.uploadedAt)}</span>
                    </div>
                    <a href={`http://localhost:5000${doc.fileUrl}`} target="_blank" rel="noopener noreferrer" className="psam-btn psam-btn-ghost psam-btn-sm">
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
              <button className="psam-action-btn psam-action-secondary" onClick={() => onUpdateStatus(inquiry._id, "PENDING")}>
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

              <button className="psam-action-btn psam-action-primary" onClick={onRequestPayment}>
                <div className="psam-action-icon"><CreditCard size={18} /></div>
                <div className="psam-action-content">
                  <span className="psam-action-label">Request Payment</span>
                  <span className="psam-action-desc">Send invoice</span>
                </div>
              </button>

              <button className="psam-action-btn psam-action-success" onClick={() => onUpdateStatus(inquiry._id, "COMPLETED")}>
                <div className="psam-action-icon"><CheckCircle size={18} /></div>
                <div className="psam-action-content">
                  <span className="psam-action-label">Mark Complete</span>
                  <span className="psam-action-desc">Finish request</span>
                </div>
              </button>

              <button className="psam-action-btn psam-action-danger" onClick={() => onUpdateStatus(inquiry._id, "CANCELLED")}>
                <div className="psam-action-icon"><X size={18} /></div>
                <div className="psam-action-content">
                  <span className="psam-action-label">Cancel Request</span>
                  <span className="psam-action-desc">Terminate process</span>
                </div>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export const PSAContactRemarksModal = ({ remarks, setRemarks, setEvidence, onSubmit, onClose }) => (
  <div className="psam-overlay">
    <div className="psam-modal psam-modal-sm">
      <div className="psam-header">
        <div className="psam-header-content">
          <div className="psam-title-group">
            <h2 className="psam-title">Report Issue</h2>
            <div className="psam-meta">
              <span className="psam-subtitle">Notify user about required actions or problems</span>
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
            placeholder="Describe the issue or action required..." rows="6"
          />
          <span className="psam-hint">{remarks.length} / 500 characters</span>
        </div>
        <div className="psam-form-group">
          <label className="psam-form-label">Attach Evidence (Optional)</label>
          <div className="psam-file-wrapper">
            <input
              type="file" className="psam-hidden-input" id="psa-evidence-file"
              onChange={(e) => setEvidence(e.target.files[0])} accept=".pdf,.jpg,.png,.jpeg"
            />
            <label htmlFor="psa-evidence-file" className="psam-file-btn">
              <Upload size={18} /><span>Choose file</span>
            </label>
          </div>
          <span className="psam-hint">PDF, JPG, or PNG (max 5MB)</span>
        </div>
        <button className="psam-btn psam-btn-primary psam-btn-block" onClick={onSubmit} disabled={!remarks.trim()}>
          <Send size={16} /><span>Send Report</span>
        </button>
      </div>
    </div>
  </div>
);

export const PSAServiceListModal = ({ services, onAdd, onEdit, onDelete, onClose }) => (
  <div className="psam-overlay" onClick={onClose}>
    <div className="psam-modal psam-modal-xl" onClick={(e) => e.stopPropagation()}>
      <div className="psam-header">
        <div className="psam-header-content">
          <div className="psam-title-group">
            <h2 className="psam-title">Manage Services</h2>
            <div className="psam-meta">
              <span className="psam-subtitle">{services.length} service{services.length !== 1 ? "s" : ""} available</span>
            </div>
          </div>
        </div>
        <button className="psam-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>
      </div>
      <div className="psam-body">
        <button className="psam-btn psam-btn-primary psam-btn-block psam-btn-add" onClick={onAdd}>
          <Plus size={20} /><span>Add New Service</span>
        </button>
        {services.length === 0 ? (
          <div className="psam-empty">
            <div className="psam-empty-icon"><FileText size={48} /></div>
            <h4 className="psam-empty-title">No Services Yet</h4>
            <p className="psam-empty-desc">Create your first PSA service to get started.</p>
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
                  <button className="psam-btn psam-btn-danger psam-btn-ghost psam-btn-sm psam-btn-text" onClick={() => onDelete(service.id || service._id)}>
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

export const PSAServiceEditorModal = ({
  isEditorOpen, form, setForm, requirements, steps, downloads, accordionState,
  toggleAccordion, addCategory, removeCategory, handleCategoryTitleChange,
  addRequirement, removeRequirement, handleLabelChange, addStep, removeStep,
  handleStepChange, handleDirectFileUpload, removeDownloadForm, onSave, onClose,
}) => (
  <div className="psam-overlay">
    <div className="psam-modal psam-modal-xl">
      <div className="psam-header">
        <div className="psam-header-content">
          <div className="psam-title-group">
            <h2 className="psam-title">{isEditorOpen ? "Edit Service" : "Create New Service"}</h2>
            <div className="psam-meta"><span className="psam-subtitle">Configure pricing, requirements, and processing steps</span></div>
          </div>
        </div>
        <button className="psam-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>
      </div>
      <div className="psam-body">
        {/* BASIC INFO */}
        <div className="psam-form-section">
          <h3 className="psam-section-title"><span className="psam-section-icon">📋</span> Basic Information</h3>
          <div className="psam-form-row">
            <div className="psam-form-group">
              <label className="psam-form-label">Service Title <span className="psam-label-req">*</span></label>
              <input
                type="text" className="psam-input" value={form.documentType}
                onChange={(e) => setForm({ ...form, documentType: e.target.value })}
                placeholder="e.g., PSA Birth Certificate"
              />
            </div>
            <div className="psam-form-group">
              <label className="psam-form-label">Price (PHP) <span className="psam-label-req">*</span></label>
              <input
                type="number" className="psam-input" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0.00" min="0" step="0.01"
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
        {/* REQUIREMENTS */}
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
                    <button className="psam-btn psam-btn-danger psam-btn-ghost psam-btn-sm psam-btn-icon" onClick={() => removeCategory(category.id)}>
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
        {/* STEPS */}
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
        {/* DOWNLOADS */}
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
                  <button className="psam-btn psam-btn-danger psam-btn-ghost psam-btn-sm" onClick={() => removeDownloadForm(file.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <label className="psam-upload-btn-lg">
                <input type="file" hidden onChange={handleDirectFileUpload} />
                <Upload size={18} /><span>Upload Form</span>
              </label>
            </div>
          )}
        </div>
      </div>
      <div className="psam-footer">
        <button className="psam-btn psam-btn-ghost" onClick={onClose}>Cancel</button>
        <button className="psam-btn psam-btn-primary" onClick={onSave}>
          <Save size={16} /><span>Save Changes</span>
        </button>
      </div>
    </div>
  </div>
);
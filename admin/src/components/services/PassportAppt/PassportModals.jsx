import React from "react";
import {
  X, CreditCard, CheckCircle, Upload, Send, FileText, Edit, Trash2,
  Plus, Save, ListPlus, ChevronDown, PlusCircle, Download, AlertCircle,
  Clock, User, Mail, DollarSign, Calendar, Package, TrendingUp,
} from "lucide-react";
import "./PassportModals.css";

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
// 1. APPOINTMENT VIEW MODAL (NEW DESIGN - MATCHES CENOMAR)
// ==========================================
export const AppointmentViewModal = ({
  appointment, documents = [], onClose, onUpdateStatus, onRequestPayment,
  onConfirmPayment, showDeliverDocs, setShowDeliverDocs, deliveryFiles = [],
  setDeliveryFiles, handleDeliverDocuments, setShowContactRemarks,
}) => {
  if (!appointment) return null;

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

  const statusConfig = getStatusConfig(appointment.status);
  const StatusIcon = statusConfig.icon;

  let finalSentDocs = [];

  if (appointment.deliveredDocuments && appointment.deliveredDocuments.length > 0) {
    finalSentDocs = appointment.deliveredDocuments;
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
    <div className="ppt-overlay" onClick={onClose}>
      <div className="ppt-modal ppt-modal-lg" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="ppt-header">
          <div className="ppt-header-content">
            <div className="ppt-title-group">
              <h2 className="ppt-title">Request Details</h2>
              <div className="ppt-meta">
                <span className="ppt-ref">REF: #{appointment._id.slice(-8).toUpperCase()}</span>
                <span className="ppt-divider">•</span>
                <span className="ppt-date">{formatDate(appointment.createdAt)}</span>
              </div>
            </div>
            <div className={`ppt-status-badge ppt-status-${statusConfig.color}`}>
              <div className="ppt-status-icon"><StatusIcon size={16} /></div>
              <div className="ppt-status-content">
                <span className="ppt-status-label">{statusConfig.label}</span>
                <span className="ppt-status-desc">{statusConfig.description}</span>
              </div>
            </div>
          </div>
          <button className="ppt-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="ppt-body">
          
          {/* ALERTS */}
          {appointment.status === "PAID" && (
            <div className="ppt-alert ppt-alert-warning">
              <div className="ppt-alert-icon"><CreditCard size={22} /></div>
              <div className="ppt-alert-content">
                <h4 className="ppt-alert-title">Payment Verification Required</h4>
                <p className="ppt-alert-desc">The user has submitted payment proof. Please review.</p>
              </div>
              <button className="ppt-btn ppt-btn-success ppt-btn-sm" onClick={onConfirmPayment}>
                <CheckCircle size={16} /><span>Confirm Payment</span>
              </button>
            </div>
          )}

          {appointment.status === "CONFIRMED" && !showDeliverDocs && finalSentDocs.length === 0 && (
            <div className="ppt-alert ppt-alert-info">
              <div className="ppt-alert-icon"><Upload size={22} /></div>
              <div className="ppt-alert-content">
                <h4 className="ppt-alert-title">Ready for Document Delivery</h4>
                <p className="ppt-alert-desc">Payment confirmed. Upload the final Passport documents now.</p>
              </div>
              <button className="ppt-btn ppt-btn-primary ppt-btn-sm" onClick={() => setShowDeliverDocs(true)}>
                <Upload size={16} /><span>Upload Documents</span>
              </button>
            </div>
          )}

          {/* UPLOAD ZONE */}
          {(showDeliverDocs || appointment.status === 'COMPLETED' || finalSentDocs.length > 0) && (
            <div className="ppt-upload-zone" style={{ 
              borderColor: appointment.status === 'COMPLETED' ? '#22c55e' : '#cbd5e1',
              backgroundColor: appointment.status === 'COMPLETED' ? '#f0fdf4' : undefined
            }}>
              <div className="ppt-upload-header">
                <div className="ppt-upload-icon" style={{ background: appointment.status === 'COMPLETED' ? '#22c55e' : undefined }}>
                  {appointment.status === 'COMPLETED' ? <CheckCircle size={20} color="white"/> : <Upload size={20} color="white"/>}
                </div>
                <div className="ppt-upload-text">
                  <h4>{appointment.status === 'COMPLETED' ? 'Processing Complete' : 'Upload Final Documents'}</h4>
                  <p>
                    {appointment.status === 'COMPLETED' 
                      ? 'The following documents have been sent to the user:' 
                      : 'If you have retrieved the documents, upload them here to complete the order.'}
                  </p>
                </div>
              </div>

              {/* SENT FILES LIST */}
              {finalSentDocs.length > 0 && (
                <div className="ppt-file-list" style={{ marginBottom: '20px' }}>
                  <div className="ppt-file-header" style={{ color: '#16a34a' }}><span>Sent to User (Stored)</span></div>
                  {finalSentDocs.map((doc, idx) => (
                    <div key={doc._id || idx} className="ppt-file-item" style={{ 
                      borderColor: '#86efac', 
                      background: 'white',
                      boxShadow: '0 2px 5px rgba(22, 163, 74, 0.05)'
                    }}>
                      <div className="ppt-file-icon" style={{ color: '#16a34a', background: '#dcfce7' }}>
                        <FileText size={18} />
                      </div>
                      <div className="ppt-file-info">
                        <span className="ppt-file-name" style={{fontWeight:'700', color: '#15803d'}}>
                          {doc.fileName || doc.originalName}
                        </span>
                        <span className="ppt-file-size" style={{color:'#16a34a'}}>
                           Sent • {formatDate(doc.uploadedAt)}
                        </span>
                      </div>
                      <a 
                        href={`http://localhost:5000${doc.fileUrl}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="ppt-btn ppt-btn-ghost ppt-btn-sm" 
                        style={{color:'#16a34a'}}
                      >
                        <TrendingUp size={14} /> View
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* INPUT BOX */}
              <div className="ppt-upload-wrapper">
                <input
                  type="file" multiple accept=".pdf,.jpg,.png,.jpeg"
                  onChange={(e) => setDeliveryFiles(Array.from(e.target.files))}
                  className="ppt-hidden-input" id="delivery-files"
                />
                <label htmlFor="delivery-files" className="ppt-upload-label" style={{ background: 'white', borderStyle: 'dashed' }}>
                  <Package size={24} />
                  <span>
                    {appointment.status === 'COMPLETED' 
                      ? 'Click to send ADDITIONAL files' 
                      : 'Click to browse or drag files here'}
                  </span>
                </label>
              </div>

              {/* PENDING UPLOADS */}
              {deliveryFiles.length > 0 && (
                <div className="ppt-file-list">
                  <div className="ppt-file-header"><span>Ready to Send ({deliveryFiles.length})</span></div>
                  {deliveryFiles.map((file, idx) => (
                    <div key={idx} className="ppt-file-item" style={{ borderStyle: 'dashed' }}>
                      <div className="ppt-file-icon"><FileText size={18} /></div>
                      <div className="ppt-file-info">
                        <span className="ppt-file-name">{file.name}</span>
                        <span className="ppt-file-size">{formatFileSize(file.size)}</span>
                      </div>
                      <button className="ppt-file-remove" onClick={() => setDeliveryFiles(deliveryFiles.filter((_, i) => i !== idx))}>
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* BUTTONS */}
              {deliveryFiles.length > 0 && (
                <div className="ppt-upload-actions">
                  <button className="ppt-btn ppt-btn-ghost" onClick={() => { setDeliveryFiles([]); if(appointment.status !== 'COMPLETED') setShowDeliverDocs(false); }}>
                    Cancel
                  </button>
                  <button className="ppt-btn ppt-btn-primary" onClick={handleDeliverDocsSubmit}>
                    <Send size={16} /><span>{appointment.status === 'COMPLETED' ? 'Send Additional' : 'Send & Complete'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* CLIENT INFORMATION */}
          <div className="ppt-card">
            <div className="ppt-card-header">
              <h3 className="ppt-card-title">Client Information</h3>
            </div>
            <div className="ppt-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="ppt-info-item">
                <div className="ppt-info-icon"><User size={18} /></div>
                <div className="ppt-info-content">
                  <label className="ppt-info-label">Full Name</label>
                  <span className="ppt-info-value">{appointment.fullName}</span>
                </div>
              </div>
              <div className="ppt-info-item">
                <div className="ppt-info-icon"><Mail size={18} /></div>
                <div className="ppt-info-content">
                  <label className="ppt-info-label">Email Address</label>
                  <span className="ppt-info-value">{appointment.email}</span>
                </div>
              </div>
              <div className="ppt-info-item">
                <div className="ppt-info-icon"><DollarSign size={18} /></div>
                <div className="ppt-info-content">
                  <label className="ppt-info-label">Amount</label>
                  <span className="ppt-info-value ppt-val-amount">₱{(appointment.estimatedPrice || 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="ppt-info-item">
                <div className="ppt-info-icon"><Calendar size={18} /></div>
                <div className="ppt-info-content">
                  <label className="ppt-info-label">Submitted</label>
                  <span className="ppt-info-value">{formatDate(appointment.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* REQUEST MESSAGE */}
          <div className="ppt-card">
            <div className="ppt-card-header">
              <h3 className="ppt-card-title">Request Message</h3>
            </div>
            <div className="ppt-message-box">
              {appointment.message || <span className="ppt-msg-empty">No message provided by the user.</span>}
            </div>
          </div>

          {/* SUBMITTED DOCUMENTS (CLIENT) */}
          <div className="ppt-card">
            <div className="ppt-card-header">
              <h3 className="ppt-card-title">Submitted Documents (Requirements)</h3>
              <span className="ppt-badge ppt-badge-amber">{clientDocs.length} file{clientDocs.length === 1 ? "" : "s"}</span>
            </div>
            {clientDocs.length === 0 ? (
              <div className="ppt-empty">
                <div className="ppt-empty-icon"><FileText size={48} /></div>
                <h4 className="ppt-empty-title">No Requirements Yet</h4>
                <p className="ppt-empty-desc">User hasn't uploaded any documents for this request.</p>
              </div>
            ) : (
              <div className="ppt-doc-list">
                {clientDocs.map((doc) => (
                  <div key={doc._id} className="ppt-doc-item">
                    <div className="ppt-doc-icon"><FileText size={20} /></div>
                    <div className="ppt-doc-info">
                      <span className="ppt-doc-name">{doc.originalName}</span>
                      <span className="ppt-doc-meta">{formatFileSize(doc.fileSize)} • Uploaded {formatDate(doc.uploadedAt)}</span>
                    </div>
                    <a href={`http://localhost:5000${doc.fileUrl}`} target="_blank" rel="noopener noreferrer" className="ppt-btn ppt-btn-ghost ppt-btn-sm">
                      <TrendingUp size={14} /> View
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="ppt-card">
            <div className="ppt-card-header">
              <h3 className="ppt-card-title">Quick Actions</h3>
            </div>
            <div className="ppt-action-grid">
              <button className="ppt-action-btn ppt-action-secondary" onClick={() => onUpdateStatus(appointment._id, "PENDING")}>
                <div className="ppt-action-icon"><Clock size={18} /></div>
                <div className="ppt-action-content">
                  <span className="ppt-action-label">Set Pending</span>
                  <span className="ppt-action-desc">Return to review</span>
                </div>
              </button>

              <button className="ppt-action-btn ppt-action-warning" onClick={() => setShowContactRemarks(true)}>
                <div className="ppt-action-icon"><AlertCircle size={18} /></div>
                <div className="ppt-action-content">
                  <span className="ppt-action-label">Report Issue</span>
                  <span className="ppt-action-desc">Contact user</span>
                </div>
              </button>

              <button className="ppt-action-btn ppt-action-primary" onClick={onRequestPayment}>
                <div className="ppt-action-icon"><CreditCard size={18} /></div>
                <div className="ppt-action-content">
                  <span className="ppt-action-label">Request Payment</span>
                  <span className="ppt-action-desc">Send invoice</span>
                </div>
              </button>

              <button className="ppt-action-btn ppt-action-success" onClick={() => onUpdateStatus(appointment._id, "COMPLETED")}>
                <div className="ppt-action-icon"><CheckCircle size={18} /></div>
                <div className="ppt-action-content">
                  <span className="ppt-action-label">Mark Complete</span>
                  <span className="ppt-action-desc">Finish request</span>
                </div>
              </button>

              <button className="ppt-action-btn ppt-action-danger" onClick={() => onUpdateStatus(appointment._id, "CANCELLED")}>
                <div className="ppt-action-icon"><X size={18} /></div>
                <div className="ppt-action-content">
                  <span className="ppt-action-label">Cancel Request</span>
                  <span className="ppt-action-desc">Terminate process</span>
                </div>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// ... (Rest of the modals remain the same structure but with ppt- prefixes) ...

export const PassportContactRemarksModal = ({ remarks, setRemarks, setEvidence, onSubmit, onClose }) => (
  <div className="ppt-overlay">
    <div className="ppt-modal ppt-modal-sm">
      <div className="ppt-header">
        <div className="ppt-header-content">
          <div className="ppt-title-group">
            <h2 className="ppt-title">Report Issue</h2>
            <div className="ppt-meta">
              <span className="ppt-subtitle">Notify user about required actions or problems</span>
            </div>
          </div>
        </div>
        <button className="ppt-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>
      </div>
      <div className="ppt-body">
        <div className="ppt-form-group">
          <label className="ppt-form-label">Remarks for User <span className="ppt-label-req">*</span></label>
          <textarea
            className="ppt-input" value={remarks} onChange={(e) => setRemarks(e.target.value)}
            placeholder="Describe the issue or action required..." rows="6"
          />
          <span className="ppt-hint">{remarks.length} / 500 characters</span>
        </div>
        <div className="ppt-form-group">
          <label className="ppt-form-label">Attach Evidence (Optional)</label>
          <div className="ppt-file-wrapper">
            <input
              type="file" className="ppt-hidden-input" id="evidence-file"
              onChange={(e) => setEvidence(e.target.files[0])} accept=".pdf,.jpg,.png,.jpeg"
            />
            <label htmlFor="evidence-file" className="ppt-file-btn">
              <Upload size={18} /><span>Choose file</span>
            </label>
          </div>
          <span className="ppt-hint">PDF, JPG, or PNG (max 5MB)</span>
        </div>
        <button className="ppt-btn ppt-btn-primary ppt-btn-block" onClick={onSubmit} disabled={!remarks.trim()}>
          <Send size={16} /><span>Send Report</span>
        </button>
      </div>
    </div>
  </div>
);

export const PassportServiceListModal = ({ services, onAdd, onEdit, onDelete, onClose }) => (
  <div className="ppt-overlay" onClick={onClose}>
    <div className="ppt-modal ppt-modal-xl" onClick={(e) => e.stopPropagation()}>
      <div className="ppt-header">
        <div className="ppt-header-content">
          <div className="ppt-title-group">
            <h2 className="ppt-title">Manage Services</h2>
            <div className="ppt-meta">
              <span className="ppt-subtitle">{services.length} service{services.length !== 1 ? "s" : ""} available</span>
            </div>
          </div>
        </div>
        <button className="ppt-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>
      </div>
      <div className="ppt-body">
        <button className="ppt-btn ppt-btn-primary ppt-btn-block ppt-btn-add" onClick={onAdd}>
          <Plus size={20} /><span>Add New Service</span>
        </button>
        {services.length === 0 ? (
          <div className="ppt-empty">
            <div className="ppt-empty-icon"><FileText size={48} /></div>
            <h4 className="ppt-empty-title">No Services Yet</h4>
            <p className="ppt-empty-desc">Create your first Passport service to get started.</p>
          </div>
        ) : (
          <div className="ppt-service-grid">
            {services.map((service) => (
              <div key={service.id || service._id} className="ppt-service-card">
                <div className="ppt-service-head">
                  <div className="ppt-service-icon"><FileText size={28} /></div>
                  <div className="ppt-service-price">₱{service.price}</div>
                </div>
                <div className="ppt-service-body">
                  <h4 className="ppt-service-title">{service.documentType}</h4>
                  {service.desc && <p className="ppt-service-desc">{service.desc}</p>}
                </div>
                <div className="ppt-service-foot">
                  <button className="ppt-btn ppt-btn-ghost ppt-btn-sm ppt-btn-text" onClick={() => onEdit(service)}>
                    <Edit size={16} /><span>Edit</span>
                  </button>
                  <button className="ppt-btn ppt-btn-danger ppt-btn-ghost ppt-btn-sm ppt-btn-text" onClick={() => onDelete(service.id || service._id)}>
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

export const PassportServiceEditorModal = ({
  isEditorOpen, form, setForm, requirements, steps, downloads, accordionState,
  toggleAccordion, addCategory, removeCategory, handleCategoryTitleChange,
  addRequirement, removeRequirement, handleLabelChange, addStep, removeStep,
  handleStepChange, handleDirectFileUpload, removeDownloadForm, onSave, onClose,
}) => (
  <div className="ppt-overlay">
    <div className="ppt-modal ppt-modal-xl">
      <div className="ppt-header">
        <div className="ppt-header-content">
          <div className="ppt-title-group">
            <h2 className="ppt-title">{isEditorOpen ? "Edit Service" : "Create New Service"}</h2>
            <div className="ppt-meta"><span className="ppt-subtitle">Configure pricing, requirements, and processing steps</span></div>
          </div>
        </div>
        <button className="ppt-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>
      </div>
      <div className="ppt-body">
        {/* BASIC INFO */}
        <div className="ppt-form-section">
          <h3 className="ppt-section-title"><span className="ppt-section-icon">📋</span> Basic Information</h3>
          <div className="ppt-form-row">
            <div className="ppt-form-group">
              <label className="ppt-form-label">Service Title <span className="ppt-label-req">*</span></label>
              <input
                type="text" className="ppt-input" value={form.documentType}
                onChange={(e) => setForm({ ...form, documentType: e.target.value })}
                placeholder="e.g., New Passport Appointment (Regular)"
              />
            </div>
            <div className="ppt-form-group">
              <label className="ppt-form-label">Price (PHP) <span className="ppt-label-req">*</span></label>
              <input
                type="number" className="ppt-input" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0.00" min="0" step="0.01"
              />
            </div>
          </div>
          <div className="ppt-form-group">
            <label className="ppt-form-label">Description</label>
            <textarea
              className="ppt-input" value={form.desc}
              onChange={(e) => setForm({ ...form, desc: e.target.value })}
              placeholder="Brief description of this service..." rows="3"
            />
          </div>
        </div>
        {/* REQUIREMENTS */}
        <div className="ppt-accordion">
          <button className={`ppt-acc-header ${accordionState.requirements ? "active" : ""}`} onClick={() => toggleAccordion("requirements")}>
            <div className="ppt-acc-title">
              <ListPlus size={20} /><span>Requirements</span><span className="ppt-acc-badge">{requirements.length}</span>
            </div>
            <ChevronDown size={20} className={`ppt-acc-icon ${accordionState.requirements ? "rotate" : ""}`} />
          </button>
          {accordionState.requirements && (
            <div className="ppt-acc-content">
              {requirements.map((category) => (
                <div key={category.id} className="ppt-req-category">
                  <div className="ppt-cat-header">
                    <input
                      type="text" className="ppt-cat-input" placeholder="Category Title"
                      value={category.title} onChange={(e) => handleCategoryTitleChange(category.id, e.target.value)}
                    />
                    <button className="ppt-btn ppt-btn-danger ppt-btn-ghost ppt-btn-sm ppt-btn-icon" onClick={() => removeCategory(category.id)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="ppt-req-list">
                    {category.items.map((item) => (
                      <div key={item.id} className="ppt-req-item">
                        <CheckCircle size={16} className="ppt-req-icon" />
                        <input
                          type="text" className="ppt-req-input" placeholder="Requirement item..."
                          value={item.label} onChange={(e) => handleLabelChange(category.id, item.id, e.target.value)}
                        />
                        <button className="ppt-btn ppt-btn-ghost ppt-btn-sm ppt-btn-icon" onClick={() => removeRequirement(category.id, item.id)}>
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    <button className="ppt-btn ppt-btn-ghost ppt-btn-sm" onClick={() => addRequirement(category.id)}>
                      <PlusCircle size={16} /><span>Add Item</span>
                    </button>
                  </div>
                </div>
              ))}
              <button className="ppt-btn ppt-btn-outline ppt-btn-block" onClick={addCategory}>
                <Plus size={18} /><span>Add Category</span>
              </button>
            </div>
          )}
        </div>
        {/* STEPS */}
        <div className="ppt-accordion">
          <button className={`ppt-acc-header ${accordionState.stepsProcess ? "active" : ""}`} onClick={() => toggleAccordion("stepsProcess")}>
            <div className="ppt-acc-title">
              <ListPlus size={20} /><span>Process Steps</span><span className="ppt-acc-badge">{steps.length}</span>
            </div>
            <ChevronDown size={20} className={`ppt-acc-icon ${accordionState.stepsProcess ? "rotate" : ""}`} />
          </button>
          {accordionState.stepsProcess && (
            <div className="ppt-acc-content">
              {steps.map((step, index) => (
                <div key={step.id} className="ppt-step-item">
                  <span className="ppt-step-num">Step {index + 1}</span>
                  <input
                    type="text" className="ppt-step-input" placeholder="Describe this step..."
                    value={step.label} onChange={(e) => handleStepChange(step.id, e.target.value)}
                  />
                  <button className="ppt-btn ppt-btn-ghost ppt-btn-sm ppt-btn-icon" onClick={() => removeStep(step.id)}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              <button className="ppt-btn ppt-btn-ghost ppt-btn-sm" onClick={addStep}>
                <Plus size={16} /><span>Add Step</span>
              </button>
            </div>
          )}
        </div>
        {/* DOWNLOADS */}
        <div className="ppt-accordion">
          <button className={`ppt-acc-header ${accordionState.downloadForms ? "active" : ""}`} onClick={() => toggleAccordion("downloadForms")}>
            <div className="ppt-acc-title">
              <Download size={20} /><span>Downloadable Forms</span><span className="ppt-acc-badge">{downloads.length}</span>
            </div>
            <ChevronDown size={20} className={`ppt-acc-icon ${accordionState.downloadForms ? "rotate" : ""}`} />
          </button>
          {accordionState.downloadForms && (
            <div className="ppt-acc-content">
              {downloads.map((file) => (
                <div key={file.id} className="ppt-dl-item">
                  <FileText size={20} className="ppt-dl-icon" />
                  <span className="ppt-dl-name">{file.name}</span>
                  <button className="ppt-btn ppt-btn-danger ppt-btn-ghost ppt-btn-sm" onClick={() => removeDownloadForm(file.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <label className="ppt-upload-btn-lg">
                <input type="file" hidden onChange={handleDirectFileUpload} />
                <Upload size={18} /><span>Upload Form</span>
              </label>
            </div>
          )}
        </div>
      </div>
      <div className="ppt-footer">
        <button className="ppt-btn ppt-btn-ghost" onClick={onClose}>Cancel</button>
        <button className="ppt-btn ppt-btn-primary" onClick={onSave}>
          <Save size={16} /><span>Save Changes</span>
        </button>
      </div>
    </div>
  </div>
);
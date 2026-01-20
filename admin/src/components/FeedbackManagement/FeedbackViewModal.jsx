import React from 'react';
import { 
  X, 
  Archive, // Pinalitan ang Trash2 ng Archive
  Calendar, 
  Tag, 
  Monitor, 
  User,
  Star,
  Image as ImageIcon 
} from 'lucide-react';
import './FeedbackViewModal.css';

// Note: Pinalitan ang prop na 'onDelete' ng 'onArchive'
const FeedbackViewModal = ({ show, onClose, feedback, onArchive }) => {
  if (!show || !feedback) return null;

  // Helper para sa kulay ng Rating Box (based sa design mo)
  const getRatingStyle = (rating) => {
    if (rating >= 4) return { bg: '#ecfdf5', border: '#10b981', text: '#047857', label: 'Positive Experience' };
    if (rating === 3) return { bg: '#fffbeb', border: '#f59e0b', text: '#b45309', label: 'Neutral Experience' };
    return { bg: '#fef2f2', border: '#ef4444', text: '#b91c1c', label: 'Needs Attention' };
  };

  const ratingInfo = getRatingStyle(feedback.rating);

  return (
    <div className="fb-modal-overlay" onClick={onClose}>
      <div className="fb-modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="fb-modal-header">
          <div className="fb-header-text">
            <h2>Feedback Details</h2>
            <div className="fb-id-badge">ID: #{feedback._id.slice(-6).toUpperCase()}</div>
          </div>
          <button className="fb-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="fb-modal-body">
          
          {/* STATUS / RATING ALERT BOX */}
          <div 
            className="fb-alert-box"
            style={{ 
              backgroundColor: ratingInfo.bg, 
              borderColor: ratingInfo.border,
              color: ratingInfo.text
            }}
          >
            <div className="fb-alert-header">
              <Star size={18} fill={ratingInfo.text} />
              <span className="fb-alert-title">{ratingInfo.label}</span>
            </div>
            <p className="fb-alert-desc">
              User rated this interaction <strong>{feedback.rating || 0} out of 5 stars</strong>.
            </p>
          </div>

          {/* METADATA GRID */}
          <div className="fb-section-label">TECHNICAL & USER DATA</div>
          <div className="fb-metadata-grid">
            
            {/* Date */}
            <div className="fb-meta-card">
              <div className="fb-meta-icon red">
                <Calendar size={20} />
              </div>
              <div className="fb-meta-content">
                <span className="fb-meta-label">DATE SUBMITTED</span>
                <span className="fb-meta-value">
                  {new Date(feedback.createdAt).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
            </div>

            {/* Category */}
            <div className="fb-meta-card">
              <div className="fb-meta-icon blue">
                <Tag size={20} />
              </div>
              <div className="fb-meta-content">
                <span className="fb-meta-label">CATEGORY</span>
                <span className="fb-meta-value capital">
                  {feedback.category}
                </span>
              </div>
            </div>

            {/* User */}
            <div className="fb-meta-card">
              <div className="fb-meta-icon yellow">
                <User size={20} />
              </div>
              <div className="fb-meta-content">
                <span className="fb-meta-label">SUBMITTED BY</span>
                <span className="fb-meta-value">{feedback.name || 'Anonymous'}</span>
              </div>
            </div>

            {/* Device */}
            <div className="fb-meta-card">
              <div className="fb-meta-icon green">
                <Monitor size={20} />
              </div>
              <div className="fb-meta-content">
                <span className="fb-meta-label">DEVICE / SCREEN</span>
                <span className="fb-meta-value">
                  {feedback.technicalData?.screenSize || 'Unknown'}
                </span>
              </div>
            </div>

          </div>

          {/* MESSAGE SECTION */}
          <div className="fb-section-label">FEEDBACK MESSAGE</div>
          <div className="fb-message-container">
             <p>{feedback.message}</p>
          </div>

          {/* SCREENSHOT PREVIEW */}
          {feedback.screenshot && (
            <div className="fb-screenshot-preview">
               <div className="fb-section-label" style={{marginTop: '16px'}}>
                  <ImageIcon size={14} style={{marginRight: '6px'}}/> 
                  ATTACHMENT
               </div>
               <img src={feedback.screenshot} alt="User Attachment" />
            </div>
          )}

        </div>

        {/* FOOTER - ARCHIVE ACTION */}
        <div className="fb-modal-footer">
          <button className="fb-btn-cancel" onClick={onClose}>
            Close
          </button>
          
          {/* ARCHIVE BUTTON - Calls onArchive with ID */}
          <button 
            className="fb-btn-archive" 
            onClick={() => onArchive(feedback._id)}
          >
            <Archive size={16} />
            Archive Feedback
          </button>
        </div>

      </div>
    </div>
  );
};

export default FeedbackViewModal;
import React, { useState } from 'react';
import { Bug, X, ExternalLink } from 'lucide-react';
import './BugReportWidget.css';

const BUG_REPORT_URL = 'https://api.texionix.telexph.com/report/wanderwave.html';

const BugReportWidget = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleTriggerClick = (e) => {
    e.stopPropagation();

    const isMobile = window.innerWidth <= 640;

    if (isMobile && !isExpanded) {
      setIsExpanded(true);
      return;
    }

    setShowConfirmModal(true);
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
  };

  const handleConfirm = () => {
    window.open(BUG_REPORT_URL, '_blank', 'noopener,noreferrer');
    setShowConfirmModal(false);
    setIsExpanded(false);
  };

  return (
    <>
      <button
        className={`bug-report-trigger-btn ${isExpanded ? 'expanded' : ''}`}
        onClick={handleTriggerClick}
        title="Report a Bug"
      >
        <div className="trigger-icon-wrapper">
          <Bug size={22} />
        </div>
        <span className="trigger-text">Report a Bug</span>
      </button>

      {showConfirmModal && (
        <div className="bug-report-overlay" onClick={handleCancel}>
          <div className="bug-report-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="bug-report-header">
              <div className="header-content">
                <Bug size={24} />
                <div>
                  <h3>Leaving WanderWave</h3>
                  <p>You're about to open our bug report page</p>
                </div>
              </div>
              <button className="close-btn" onClick={handleCancel}>
                <X size={22} />
              </button>
            </div>

            <div className="bug-report-body">
              <p>
                This will open a new tab to our bug report tool so you can describe the issue
                you encountered. Continue?
              </p>
            </div>

            <div className="bug-report-footer">
              <button className="cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
              <button className="confirm-btn" onClick={handleConfirm}>
                <ExternalLink size={18} />
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BugReportWidget;

import React from 'react';
import { FileText, Trash2, X, RefreshCw, Clock } from 'lucide-react';
import './RestoreDraftModal.css';

const RestoreDraftModal = ({ isOpen, onRestore, onDiscard, draftInfo }) => {
    if (!isOpen) return null;

    // Helper to format the time logically
    const formatDate = (timestamp) => {
        if (!timestamp) return 'Unknown date';
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (days === 1) return 'Yesterday';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="rdm-overlay" onClick={onDiscard}>
            <div className="rdm-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="rdm-header">
                    <div className="rdm-header-icon">
                        <FileText size={24} />
                    </div>
                    <div className="rdm-header-text">
                        <h2>Unsaved Draft Found</h2>
                        <p>We found an unsaved post from your previous session. Would you like to restore it?</p>
                    </div>
                    <button className="rdm-close-btn" onClick={onDiscard}>
                        <X size={20} />
                    </button>
                </div>

                {/* Content: Simplified to just the File/Time info */}
                <div className="rdm-content">
                    <div className="rdm-file-card">
                        <div className="rdm-card-icon">
                            <Clock size={24} />
                        </div>
                        <div className="rdm-card-details">
                            <span className="rdm-card-title">
                                Unsaved Changes
                            </span>
                            <span className="rdm-card-meta">
                                Last edited: <strong>{formatDate(draftInfo?.updatedAt)}</strong>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="rdm-footer">
                    <button className="rdm-btn rdm-btn-secondary" onClick={onDiscard}>
                        <Trash2 size={18} />
                        Discard
                    </button>
                    <button className="rdm-btn rdm-btn-primary" onClick={onRestore}>
                        <RefreshCw size={18} />
                        Restore Draft
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RestoreDraftModal;
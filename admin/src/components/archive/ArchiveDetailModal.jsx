import React from 'react';
import { X, Calendar, User, Mail, Archive as ArchiveIcon, RotateCcw, Tag, FileText, Clock } from 'lucide-react';
import './ArchiveDetailModal.css'; 

const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric", hour: '2-digit', minute: '2-digit'
    });
};

export const ArchiveDetailModal = ({ 
    showModal, 
    selectedItem, 
    setShowModal, 
    handleRestore,
    actionLoading,
    RotateCcwIcon,
    retentionDays = 90
}) => {
    if (!showModal || !selectedItem) return null;

    const closeModal = () => setShowModal(false);

    const handleRestoreAndClose = (item) => handleRestore(item);

    const getStatusConfig = (status) => {
        const configs = {
          CANCELLED: { color: "red", icon: RotateCcw, label: "Archived/Cancelled", description: "Item moved to archive" },
          DELETED: { color: "gray", icon: RotateCcw, label: "Archived", description: "Item moved to archive" },
        };
        return configs[status.toUpperCase()] || configs.CANCELLED; 
    };
    const status = (selectedItem.status || 'CANCELLED').toUpperCase();
    const statusConfig = getStatusConfig(status);
    const StatusIcon = statusConfig.icon;
    
    const itemType = selectedItem.type || 'N/A';
    const itemName = selectedItem.itemName || 'No Item Name';
    const itemReference = selectedItem.reference || 'N/A';
    const dateArchived = formatDate(selectedItem.dateArchived);
    const originalStatus = selectedItem.rawData.status || 'N/A';
    const daysRemaining = selectedItem.daysRemaining || 0;

    const archiveMessage = selectedItem.rawData.archiveReason || "No specific reason provided.";

    // Get expiration warning level
    const getExpirationColor = (days) => {
        if (days <= 7) return '#dc2626'; // Red
        if (days <= 30) return '#d97706'; // Orange
        return '#16a34a'; // Green
    };

    return (
        <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="cnm-header-content">
                        <div className="cnm-title-group">
                            <h2 className="cnm-title">Archive Item: {itemName}</h2>
                            <div className="cnm-meta">
                                <span className="cnm-ref">ID: #{selectedItem.id}</span>
                                <span className="cnm-divider">•</span>
                                <span className="cnm-date">Type: {itemType}</span>
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
                    <button className="modal-close" onClick={closeModal} aria-label="Close modal">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="modal-body">
                    {/* EXPIRATION WARNING (if < 30 days) */}
                    {daysRemaining <= 30 && (
                        <div className="cnm-card" style={{
                            background: daysRemaining <= 7 ? '#fef2f2' : '#fef3c7',
                            border: `2px solid ${getExpirationColor(daysRemaining)}`
                        }}>
                            <div className="cnm-card-header">
                                <h3 className="cnm-card-title" style={{color: getExpirationColor(daysRemaining)}}>
                                    <Clock size={16} style={{display: 'inline', marginRight: '8px'}} />
                                    EXPIRATION WARNING
                                </h3>
                            </div>
                            <div className="cnm-message-box" style={{background: 'white'}}>
                                <p style={{margin:0, color: getExpirationColor(daysRemaining), fontWeight: 700}}>
                                    This item will be permanently deleted in <strong>{daysRemaining} days</strong>. 
                                    Restore now to prevent data loss.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* 1. GENERAL ARCHIVE METADATA */}
                    <div className="cnm-card">
                        <div className="cnm-card-header">
                            <h3 className="cnm-card-title">Archive Metadata</h3>
                        </div>
                        <div className="cnm-grid">
                            <div className="cnm-info-item">
                                <div className="cnm-info-icon" style={{background: '#ffe4e6', color: '#dc2626'}}><ArchiveIcon size={18} /></div>
                                <div className="cnm-info-content">
                                    <label className="cnm-info-label">Date Archived</label>
                                    <span className="cnm-info-value">{dateArchived}</span>
                                </div>
                            </div>
                            <div className="cnm-info-item">
                                <div className="cnm-info-icon" style={{background: getExpirationColor(daysRemaining) === '#dc2626' ? '#fef2f2' : '#fef3c7', color: getExpirationColor(daysRemaining)}}><Clock size={18} /></div>
                                <div className="cnm-info-content">
                                    <label className="cnm-info-label">Expires In</label>
                                    <span className="cnm-info-value" style={{color: getExpirationColor(daysRemaining)}}>{daysRemaining} Days</span>
                                </div>
                            </div>
                            <div className="cnm-info-item">
                                <div className="cnm-info-icon" style={{background: '#eff6ff', color: '#2563eb'}}><FileText size={18} /></div>
                                <div className="cnm-info-content">
                                    <label className="cnm-info-label">Original Status</label>
                                    <span className="cnm-info-value cnm-val-original">{originalStatus.toUpperCase()}</span>
                                </div>
                            </div>
                             <div className="cnm-info-item">
                                <div className="cnm-info-icon" style={{background: '#ecfdf5', color: '#10b981'}}><Tag size={18} /></div>
                                <div className="cnm-info-content">
                                    <label className="cnm-info-label">Item Type</label>
                                    <span className="cnm-info-value">{itemType}</span>
                                </div>
                            </div>
                             <div className="cnm-info-item">
                                <div className="cnm-info-icon" style={{background: '#fef3c7', color: '#f59e0b'}}><User size={18} /></div>
                                <div className="cnm-info-content">
                                    <label className="cnm-info-label">Reference ID</label>
                                    <span className="cnm-info-value">{itemReference}</span>
                                </div>
                            </div>
                            <div className="cnm-info-item">
                                <div className="cnm-info-icon" style={{background: '#f3f4f6', color: '#6b7280'}}><ArchiveIcon size={18} /></div>
                                <div className="cnm-info-content">
                                    <label className="cnm-info-label">Retention Period</label>
                                    <span className="cnm-info-value">{retentionDays} Days</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* 2. ARCHIVE REASON / NOTES */}
                    <div className="cnm-card">
                        <div className="cnm-card-header">
                            <h3 className="cnm-card-title">Archive Message/Reason</h3>
                        </div>
                        <div className="cnm-message-box">
                            <p style={{margin:0, color:'#475569'}}>
                                {archiveMessage}
                            </p>
                        </div>
                    </div>

                    {/* 3. FULL RAW DATA (For technical review) */}
                    <div className="cnm-card">
                        <div className="cnm-card-header">
                            <h3 className="cnm-card-title">Full Archived Data (Original Item JSON)</h3>
                        </div>
                        <div className="cnm-message-box" style={{height: '150px', overflowY: 'auto'}}>
                            <pre style={{ margin: 0, fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                {JSON.stringify(selectedItem.rawData, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="modal-footer">
                    <button className="cnm-btn cnm-btn-ghost" onClick={closeModal}>Close</button>
                    
                    {/* Restore Button */}
                    <button 
                        className="cnm-btn cnm-btn-warning"
                        onClick={() => handleRestoreAndClose(selectedItem)}
                        disabled={actionLoading}
                    >
                        <RotateCcwIcon size={16} /> Restore Item
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ArchiveDetailModal;
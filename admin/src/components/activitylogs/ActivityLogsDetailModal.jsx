import React from 'react';
import { X, Calendar, User, Activity, Monitor, AlertCircle, CheckCircle, Info, FileText } from 'lucide-react';
import './ActivityLogsDetailModal.css'; 

export const ActivityLogsDetailModal = ({ 
    showModal, 
    selectedLog, 
    setShowModal, 
    formatDate
}) => {
    if (!showModal || !selectedLog) return null;

    const closeModal = () => setShowModal(false);

    const getSeverityConfig = (severity) => {
        const configs = {
            INFO: { color: "blue", icon: Info, label: "Information", description: "Normal activity log" },
            SUCCESS: { color: "green", icon: CheckCircle, label: "Success", description: "Operation completed successfully" },
            WARNING: { color: "yellow", icon: AlertCircle, label: "Warning", description: "Potential issue detected" },
            ERROR: { color: "red", icon: AlertCircle, label: "Error", description: "Operation failed" },
        };
        return configs[severity.toUpperCase()] || configs.INFO; 
    };

    const severityConfig = getSeverityConfig(selectedLog.severity);
    const SeverityIcon = severityConfig.icon;

    // Check if this is an export action with file details
    const isExportAction = selectedLog.action === 'EXPORT' && 
                          selectedLog.details && 
                          selectedLog.details.fileName;

    return (
        <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="log-header-content">
                        <div className="log-title-group">
                            <h2 className="log-title">Activity Log Details</h2>
                            <div className="log-meta">
                                <span className="log-ref">ID: {selectedLog.id}</span>
                                <span className="log-divider">•</span>
                                <span className="log-date">Log #{selectedLog.logNumber}</span>
                            </div>
                        </div>
                        <div className={`log-severity-badge log-severity-${severityConfig.color}`}>
                            <div className="log-severity-icon"><SeverityIcon size={16} /></div>
                            <div className="log-severity-content">
                                <span className="log-severity-label">{severityConfig.label}</span>
                                <span className="log-severity-desc">{severityConfig.description}</span>
                            </div>
                        </div>
                    </div>
                    <button className="modal-close" onClick={closeModal} aria-label="Close modal">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="modal-body">
                    {/* 1. GENERAL LOG INFORMATION */}
                    <div className="log-card">
                        <div className="log-card-header">
                            <h3 className="log-card-title">General Information</h3>
                        </div>
                        <div className="log-grid">
                            <div className="log-info-item">
                                <div className="log-info-icon" style={{background: '#dbeafe', color: '#1e40af'}}>
                                    <Activity size={18} />
                                </div>
                                <div className="log-info-content">
                                    <label className="log-info-label">Action Type</label>
                                    <span className="log-info-value">{selectedLog.action}</span>
                                </div>
                            </div>
                            
                            <div className="log-info-item">
                                <div className="log-info-icon" style={{background: '#fef3c7', color: '#92400e'}}>
                                    <Monitor size={18} />
                                </div>
                                <div className="log-info-content">
                                    <label className="log-info-label">Module</label>
                                    <span className="log-info-value">{selectedLog.module}</span>
                                </div>
                            </div>
                            
                            <div className="log-info-item">
                                <div className="log-info-icon" style={{background: '#d1fae5', color: '#065f46'}}>
                                    <User size={18} />
                                </div>
                                <div className="log-info-content">
                                    <label className="log-info-label">User</label>
                                    <span className="log-info-value">{selectedLog.user}</span>
                                </div>
                            </div>
                            
                            <div className="log-info-item">
                                <div className="log-info-icon" style={{background: '#e0e7ff', color: '#3730a3'}}>
                                    <Calendar size={18} />
                                </div>
                                <div className="log-info-content">
                                    <label className="log-info-label">Timestamp</label>
                                    <span className="log-info-value">{formatDate(selectedLog.timestamp)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* 2. ACTIVITY DESCRIPTION */}
                    <div className="log-card">
                        <div className="log-card-header">
                            <h3 className="log-card-title">Activity Description</h3>
                        </div>
                        <div className="log-message-box">
                            <p style={{margin:0, color:'#475569'}}>
                                {selectedLog.description}
                            </p>
                        </div>
                    </div>

                    {/* 3. EXPORT DETAILS (if export action) */}
                    {isExportAction && (
                        <div className="log-card" style={{borderColor: '#10b981', borderWidth: '2px'}}>
                            <div className="log-card-header">
                                <h3 className="log-card-title" style={{color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px'}}>
                                    <FileText size={18} />
                                    Export Information
                                </h3>
                            </div>
                            
                            <div className="log-grid">
                                <div className="log-info-item">
                                    <div className="log-info-icon" style={{background: '#d1fae5', color: '#065f46'}}>
                                        <FileText size={18} />
                                    </div>
                                    <div className="log-info-content">
                                        <label className="log-info-label">File Name</label>
                                        <span className="log-info-value" style={{fontSize: '13px', wordBreak: 'break-all'}}>
                                            {selectedLog.details.fileName || 'Dashboard Report'}
                                        </span>
                                    </div>
                                </div>

                                <div className="log-info-item">
                                    <div className="log-info-icon" style={{background: '#dbeafe', color: '#1e40af'}}>
                                        <FileText size={18} />
                                    </div>
                                    <div className="log-info-content">
                                        <label className="log-info-label">Export Format</label>
                                        <span className="log-info-value">
                                            {selectedLog.details.exportFormat || 'PDF'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div style={{marginTop: '16px', padding: '16px', background: '#f0fdf4', borderRadius: '12px', border: '2px dashed #10b981'}}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                                    <div style={{width: '40px', height: '40px', background: '#10b981', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                        <CheckCircle size={20} color="white" />
                                    </div>
                                    <div>
                                        <p style={{margin: 0, fontWeight: 700, fontSize: '14px', color: '#065f46'}}>
                                            Export Completed Successfully
                                        </p>
                                        <p style={{margin: '4px 0 0 0', fontSize: '12px', color: '#059669'}}>
                                            The dashboard report was downloaded to the admin's device
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* FOOTER ACTIONS */}
                <div className="modal-footer">
                    <button className="log-btn log-btn-ghost" onClick={closeModal}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActivityLogsDetailModal;
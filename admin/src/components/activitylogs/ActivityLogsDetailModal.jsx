import React from 'react';
import { X, Calendar, User, Activity, Globe, Monitor, AlertCircle, CheckCircle, Info, Clock } from 'lucide-react';
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

    /**
     * Helper function para makuha ang bilang ng mga nabago.
     * Tinitingnan nito ang 'affectedRecords' mula sa details, o ang length ng 'changes'.
     */
    const getAffectedCount = () => {
        if (!selectedLog.details) return 0;

        // 1. Prioritize ang manual affectedRecords value kung meron (na ise-set natin sa EditPassport/EditPSA)
        if (selectedLog.details.affectedRecords !== undefined && selectedLog.details.affectedRecords !== null) {
            return selectedLog.details.affectedRecords;
        }

        // 2. Fallback sa haba ng 'changes' array
        if (selectedLog.details.changes && Array.isArray(selectedLog.details.changes)) {
            return selectedLog.details.changes.length;
        }

        // 3. Fallback kung ang changes ay isang Object (key-value pairs)
        if (selectedLog.details.changes && typeof selectedLog.details.changes === 'object') {
            return Object.keys(selectedLog.details.changes).length;
        }

        return 0;
    };

    const affectedCount = getAffectedCount();

    return (
        <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="log-header-content">
                        <div className="log-title-group">
                            <h2 className="log-title">Activity Log Details</h2>
                            <div className="log-meta">
                                <span className="log-ref">ID: {selectedLog.id || selectedLog._id}</span>
                                <span className="log-divider">•</span>
                                <span className="log-date">Log #{selectedLog.logNumber || 'N/A'}</span>
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
                                    <span className="log-info-value">{formatDate(selectedLog.timestamp || selectedLog.createdAt)}</span>
                                </div>
                            </div>

                            <div className="log-info-item">
                                <div className="log-info-icon" style={{background: '#fef2f2', color: '#991b1b'}}>
                                    <Globe size={18} />
                                </div>
                                <div className="log-info-content">
                                    <label className="log-info-label">IP Address</label>
                                    <span className="log-info-value">{selectedLog.ipAddress || 'N/A'}</span>
                                </div>
                            </div>

                            <div className="log-info-item">
                                <div className="log-info-icon" style={{background: '#f3e8ff', color: '#6b21a8'}}>
                                    <Clock size={18} />
                                </div>
                                <div className="log-info-content">
                                    <label className="log-info-label">Duration</label>
                                    <span className="log-info-value">{selectedLog.details?.duration || 'N/A'}</span>
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
                            <p style={{margin:0, color:'#475569', marginBottom: (selectedLog.details?.changes && (Array.isArray(selectedLog.details.changes) ? selectedLog.details.changes.length > 0 : Object.keys(selectedLog.details.changes).length > 0)) ? '10px' : '0'}}>
                                {selectedLog.description}
                            </p>
                            
                            {/* Ipinapakita ang listahan ng mga eksaktong nabago kung meron man */}
                            {selectedLog.details?.changes && (
                                <ul style={{ marginTop: '10px', fontSize: '13px', color: '#1e293b', listStyleType: 'none', padding: 0 }}>
                                    {Array.isArray(selectedLog.details.changes) ? (
                                        selectedLog.details.changes.map((change, index) => (
                                            <li key={index} style={{ marginBottom: '6px', paddingLeft: '15px', position: 'relative' }}>
                                                <span style={{ position: 'absolute', left: 0, color: '#3b82f6' }}>•</span> 
                                                {change}
                                            </li>
                                        ))
                                    ) : typeof selectedLog.details.changes === 'object' ? (
                                        Object.entries(selectedLog.details.changes).map(([field, value], index) => (
                                            <li key={index} style={{ marginBottom: '6px', paddingLeft: '15px', position: 'relative' }}>
                                                <span style={{ position: 'absolute', left: 0, color: '#3b82f6' }}>•</span> 
                                                <strong>{field}:</strong> {String(value)}
                                            </li>
                                        ))
                                    ) : null}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* 3. TECHNICAL DETAILS */}
                    <div className="log-card">
                        <div className="log-card-header">
                            <h3 className="log-card-title">Technical Details</h3>
                        </div>
                        <div className="log-grid">
                            <div className="log-info-item">
                                <div className="log-info-icon" style={{background: '#e0f2fe', color: '#0c4a6e'}}>
                                    <Monitor size={18} />
                                </div>
                                <div className="log-info-content">
                                    <label className="log-info-label">HTTP Method</label>
                                    <span className="log-info-value">{selectedLog.details?.method || 'N/A'}</span>
                                </div>
                            </div>
                            
                            <div className="log-info-item">
                                <div className="log-info-icon" style={{background: '#dcfce7', color: '#14532d'}}>
                                    <CheckCircle size={18} />
                                </div>
                                <div className="log-info-content">
                                    <label className="log-info-label">Status Code</label>
                                    <span className="log-info-value">{selectedLog.details?.statusCode || '200'}</span>
                                </div>
                            </div>
                            
                            <div className="log-info-item">
                                <div className="log-info-icon" style={{background: '#fef3c7', color: '#713f12'}}>
                                    <Activity size={18} />
                                </div>
                                <div className="log-info-content">
                                    <label className="log-info-label">Endpoint</label>
                                    <span className="log-info-value" style={{fontSize: '13px'}}>{selectedLog.details?.endpoint || 'N/A'}</span>
                                </div>
                            </div>
                            
                            <div className="log-info-item">
                                <div className="log-info-icon" style={{background: '#ede9fe', color: '#5b21b6'}}>
                                    <Info size={18} />
                                </div>
                                <div className="log-info-content">
                                    <label className="log-info-label">Affected Records</label>
                                    <span className="log-info-value" style={{ fontWeight: '600', color: '#4f46e5' }}>
                                        {/* Dynamic display ng affected fields o records */}
                                        {affectedCount > 1 
                                            ? `${affectedCount} fields modified` 
                                            : affectedCount === 1 
                                                ? "1 field modified"
                                                : "No changes detected"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. USER AGENT */}
                    <div className="log-card">
                        <div className="log-card-header">
                            <h3 className="log-card-title">User Agent Information</h3>
                        </div>
                        <div className="log-message-box" style={{fontSize: '12px', fontFamily: 'monospace'}}>
                            {selectedLog.userAgent}
                        </div>
                    </div>
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
import React from 'react';
import './ActivityLogsTable.css'; 
import { ArrowUpDown, Eye } from 'lucide-react'; 

const ActivityLogsTable = ({ 
    loading, 
    filteredLogsCount, 
    currentLogs, 
    handleViewDetails,
    formatDate,
    sortOrder,
    handleSortToggle,
    startIndex = 0
}) => {

    const getSeverityBadgeClass = (severity) => {
        switch(severity.toLowerCase()) {
            case 'info': return 'badge-info';
            case 'success': return 'badge-success';
            case 'warning': return 'badge-warning';
            case 'error': return 'badge-error';
            default: return 'badge-info';
        }
    }

    const getActionBadgeClass = (action) => {
        switch(action.toLowerCase()) {
            case 'create': return 'badge-action-create';
            case 'update': return 'badge-action-update';
            case 'delete': return 'badge-action-delete';
            case 'login': return 'badge-action-login';
            case 'logout': return 'badge-action-logout';
            default: return 'badge-action-view';
        }
    }

    // Render sort icon with proper rotation based on direction
    const renderSortIcon = () => {
        const rotation = sortOrder === 'desc' ? 'rotate-desc' : 'rotate-asc';
        return <ArrowUpDown size={16} className={`sort-icon ${rotation}`} />;
    };

    if (loading) {
        return (
            <div className="act-table-wrapper">
                <table className="act-table">
                    <thead>
                        <tr>
                            <th style={{ width: '80px' }}>NO.</th>
                            <th>Log ID</th>
                            <th>Action</th>
                            <th>Module</th>
                            <th>User</th>
                            <th>Timestamp</th>
                            <th>Severity</th>
                            <th style={{ textAlign: "right" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colSpan="8" style={{textAlign:'center', padding:'40px', color:'#64748b'}}>
                                Loading activity logs...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    if (filteredLogsCount === 0) {
        return (
            <div className="act-table-wrapper">
                <table className="act-table">
                    <thead>
                        <tr>
                            <th style={{ width: '80px' }}>NO.</th>
                            <th>Log ID</th>
                            <th>Action</th>
                            <th>Module</th>
                            <th>User</th>
                            <th>Timestamp</th>
                            <th>Severity</th>
                            <th style={{ textAlign: "right" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colSpan="8" style={{textAlign:'center', padding:'40px', color:'#64748b'}}>
                                No activity logs found matching filters.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="act-table-wrapper">
            <table className="act-table">
                <thead>
                    <tr>
                        {/* SORTABLE NO. COLUMN */}
                        <th 
                            style={{ width: '80px' }} 
                            className="sortable-header"
                        >
                            <div className="sort-click-area" onClick={handleSortToggle}>
                                NO.
                                {renderSortIcon()}
                            </div>
                        </th>
                        
                        <th>Log ID</th>
                        <th>Action</th>
                        <th>Module</th>
                        <th>User</th>
                        <th>Timestamp</th>
                        <th>Severity</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {currentLogs.map((log, index) => (
                        <tr key={log.id}>
                            <td style={{ fontWeight: "700", color: '#0f172a' }}>
                                {startIndex + index + 1}
                            </td>

                            <td style={{ fontWeight: "700", fontFamily: 'monospace' }}>
                                {log.id}
                            </td>

                            <td>
                                <span className={`act-badge ${getActionBadgeClass(log.action)}`}>
                                    {log.action}
                                </span>
                            </td>

                            <td>
                                <div className="module-cell">
                                    <div className="module-initials-badge">
                                        {log.module.substring(0, 2).toUpperCase()}
                                    </div>
                                    {log.module}
                                </div>
                            </td>
                            
                            <td style={{ fontWeight: "600" }}>
                                {log.user}
                            </td>
                            
                            <td>
                                {formatDate(log.timestamp)}
                            </td>

                            <td>
                                <span className={`act-badge ${getSeverityBadgeClass(log.severity)}`}>
                                    {log.severity}
                                </span>
                            </td>

                            <td style={{ textAlign: "right" }}>
                                <div className="act-action-group">
                                    <button 
                                        className="act-action-btn act-view-btn" 
                                        onClick={() => handleViewDetails(log)}
                                        title="View Details"
                                    >
                                        <Eye size={16} /> View
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ActivityLogsTable;
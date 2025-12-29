import React from 'react';
import './ArchiveTable.css'; 
import { ArrowUpDown, Clock } from 'lucide-react'; 

const ArchiveTable = ({ 
    loading, 
    filteredArchiveItemsCount, 
    currentArchiveItems, 
    handleViewDetails, 
    handleRestore, 
    actionLoading,
    EyeIcon,
    RotateCcwIcon,
    sortDirection,
    handleSort,
    ArrowUpDownIcon = ArrowUpDown
}) => {

    const getStatusBadgeClass = (status) => {
        switch(status.toLowerCase()) {
            case 'cancelled': return 'badge-cancelled';
            default: return 'badge-cancelled';
        }
    }

    // Render sort icon with proper rotation based on direction
    const renderSortIcon = () => {
        const rotation = sortDirection === 'desc' ? 'rotate-desc' : 'rotate-asc';
        return <ArrowUpDownIcon size={16} className={`sort-icon ${rotation}`} />;
    };
    
    // Get expiration badge color based on days remaining
    const getExpirationBadge = (daysRemaining) => {
        if (daysRemaining <= 7) {
            return <span className="arc-badge badge-expiring-soon">{daysRemaining} days</span>;
        } else if (daysRemaining <= 30) {
            return <span className="arc-badge badge-expiring-warning">{daysRemaining} days</span>;
        } else {
            return <span className="arc-badge badge-expiring-normal">{daysRemaining} days</span>;
        }
    };

    // Pinagsama ang table header para sa loading at empty states para hindi paulit-ulit
    const TableHeader = () => (
        <thead>
            <tr>
                {/* SORTABLE NO. COLUMN - Pinakaluma (1) hanggang Pinakabago */}
                <th 
                    style={{ width: '80px', cursor: 'pointer' }} 
                    className="sortable-header"
                    onClick={handleSort}
                >
                    <div className="sort-click-area" style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}>
                        NO.
                        {renderSortIcon()}
                    </div>
                </th>
                <th>Archive ID</th>
                <th>Item Name</th>
                <th>Type</th>
                <th>Reference</th>
                <th>Date Archived</th>
                <th style={{ width: '120px' }}>Expires In</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
        </thead>
    );

    if (loading) {
        return (
            <div className="arc-table-wrapper">
                <table className="arc-table">
                    <TableHeader />
                    <tbody>
                        <tr><td colSpan="9" style={{textAlign:'center', padding:'40px', color:'#64748b'}}>Loading archived items...</td></tr>
                    </tbody>
                </table>
            </div>
        );
    }

    if (filteredArchiveItemsCount === 0) {
        return (
            <div className="arc-table-wrapper">
                <table className="arc-table">
                    <TableHeader />
                    <tbody>
                        <tr><td colSpan="9" style={{textAlign:'center', padding:'40px', color:'#64748b'}}>No archived items found matching filters.</td></tr>
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="arc-table-wrapper">
            <table className="arc-table">
                <TableHeader />
                <tbody>
                    {currentArchiveItems.map((item) => (
                        <tr key={item.mongoId || item.id}>
                            {/* Displaying the computed archiveNumber (Oldest = 1) */}
                            <td style={{ fontWeight: "700", color: '#0f172a', textAlign: 'center' }}>
                                {item.archiveNumber}
                            </td>

                            <td style={{ fontWeight: "700" }}>
                                {item.id}
                            </td>

                            <td>
                                <div className="item-name-cell">{item.itemName}</div>
                            </td>

                            <td>
                                <div className="item-type-cell">
                                    <div className="item-initials-badge">{item.type.substring(0, 2).toUpperCase()}</div>
                                    {item.type}
                                </div>
                            </td>
                            
                            <td>
                                {item.reference}
                            </td>
                            
                            <td>
                                {item.dateArchived}
                            </td>

                            <td>
                                {getExpirationBadge(item.daysRemaining)}
                            </td>

                            <td>
                                <span className={`arc-badge ${getStatusBadgeClass(item.status)}`}>
                                    {item.status}
                                </span>
                            </td>

                            <td style={{ textAlign: "right" }}>
                                <div className="arc-action-group">
                                    <button 
                                        className="arc-action-btn arc-view-btn" 
                                        onClick={() => handleViewDetails(item)}
                                        title="View Details"
                                    >
                                        View
                                    </button>
                                    
                                    <button 
                                        className="arc-action-btn arc-restore-text-btn"
                                        onClick={() => handleRestore(item)}
                                        disabled={actionLoading}
                                        title="Restore Item"
                                    >
                                        <RotateCcwIcon size={14} /> Restore
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

export default ArchiveTable;
import React from 'react';
import { Edit2, Archive } from 'lucide-react';
import './SellerRateTable.css';

const SellerRateTable = ({ loading, rates, onEdit, onArchive }) => {
  
  const TableHeader = () => (
    <thead>
      <tr>
        <th>Destination</th>
        <th>Activity</th>
        <th>Supplier</th>
        <th>Pax</th>
        <th style={{ textAlign: 'right' }}>Supplier Rate</th>
        <th style={{ textAlign: 'center' }}>Markup</th>
        <th style={{ textAlign: 'right' }}>Selling Price</th>
        <th style={{ textAlign: 'center' }}>Status</th>
        <th style={{ textAlign: 'right' }}>Actions</th>
      </tr>
    </thead>
  );

  if (loading) {
    return (
      <div className="sr-table-container">
        <table className="sr-table">
          <TableHeader />
          <tbody>
            <tr>
              <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <div className="sr-spinner"></div>
                <p>Loading rates...</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  if (rates.length === 0) {
    return (
      <div className="sr-table-container">
        <table className="sr-table">
          <TableHeader />
          <tbody>
            <tr>
              <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                No rates found. Add your first rate or import from Excel.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="sr-table-container">
      <table className="sr-table">
        <TableHeader />
        <tbody>
          {rates.map((rate) => (
            <tr key={rate._id}>
              <td>
                <strong>{rate.destination}</strong>
              </td>
              <td>{rate.activity}</td>
              <td style={{ color: '#64748b' }}>{rate.supplierName}</td>
              <td style={{ fontSize: '13px', color: '#64748b' }}>{rate.pax || '-'}</td>
              <td style={{ textAlign: 'right', fontWeight: '600' }}>
                ₱{rate.supplierRate?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td style={{ textAlign: 'center' }}>
                <span className="sr-markup-badge">
                  {rate.markupType === 'percentage' 
                    ? `${rate.markup}%` 
                    : `₱${rate.markup?.toLocaleString()}`
                  }
                </span>
              </td>
              <td style={{ textAlign: 'right', fontWeight: '700', color: '#10b981' }}>
                ₱{rate.sellingPrice?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td style={{ textAlign: 'center' }}>
                <span className={`sr-status-badge ${rate.status}`}>
                  {rate.status}
                </span>
              </td>
              <td style={{ textAlign: 'right' }}>
                <div className="sr-action-group">
                  <button 
                    className="sr-action-btn"
                    onClick={() => onEdit(rate)}
                    title="Edit Rate"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  <button 
                    className="sr-action-btn archive"
                    onClick={() => onArchive(rate._id)}
                    title="Archive Rate"
                  >
                    <Archive size={14} />
                    Archive
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

export default SellerRateTable;
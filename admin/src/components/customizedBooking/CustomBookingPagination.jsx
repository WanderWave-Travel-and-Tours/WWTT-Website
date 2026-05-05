import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './CustomBookingPagination.css';

const CustomBookingPagination = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end   = Math.min(currentPage * itemsPerPage, totalItems);

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 || i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className="cbk-pagination">
      <div className="cbk-pagination-info">
        Showing <strong>{start}</strong>–<strong>{end}</strong> of <strong>{totalItems}</strong> bookings
      </div>
      <div className="cbk-pagination-controls">
        <button
          className="cbk-page-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: '#94a3b8', fontSize: 13 }}>…</span>
          ) : (
            <button
              key={p}
              className={`cbk-page-btn ${currentPage === p ? 'active' : ''}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          )
        )}

        <button
          className="cbk-page-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default CustomBookingPagination;

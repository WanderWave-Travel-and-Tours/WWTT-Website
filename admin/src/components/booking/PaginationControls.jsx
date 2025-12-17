import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react'; 
import './PaginationControls.css'; 

const PaginationControls = ({ 
    totalItems, 
    itemsPerPage, 
    currentPage, 
    onPageChange,
    ChevronLeftIcon = ChevronLeft,
    ChevronRightIcon = ChevronRight
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const [jumpPageInput, setJumpPageInput] = useState('');

  if (totalPages <= 1) return null;

  const handleJump = (e) => {
      e.preventDefault();
      const page = parseInt(jumpPageInput, 10);
      if (page >= 1 && page <= totalPages) {
          onPageChange(page);
          setJumpPageInput('');
      } else {
          alert(`Please enter a page number between 1 and ${totalPages}.`);
      }
  };

  return (
    <nav className="bkm-pagination-nav">
      {/* Showing info - always visible */}
      <div className="bkm-pagination-info">
        <span className="bkm-pagination-showing">
          Showing <strong>{((currentPage - 1) * itemsPerPage) + 1}</strong> to{' '}
          <strong>{Math.min(currentPage * itemsPerPage, totalItems)}</strong> of{' '}
          <strong>{totalItems}</strong> items
        </span>
      </div>

      {/* EMPTY CENTER - page numbers completely removed on large screens */}
      <div className="bkm-pagination-controls bkm-large-only">
        {/* Intentionally empty - no page numbers, no arrows */}
      </div>

      {/* Jump section - arrows visible only on mid & mobile */}
      <div className="bkm-pagination-jump">
        <button
          type="button"
          className="bkm-pagination-btn bkm-jump-arrow bkm-hide-on-large"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="Previous page"
        >
          <ChevronLeftIcon size={18} />
        </button>
        
        <form onSubmit={handleJump} className="bkm-pagination-jump-form">
          <span className="bkm-pagination-jump-label">Page</span>
          <input 
            type="number" 
            value={jumpPageInput}
            onChange={(e) => setJumpPageInput(e.target.value)}
            placeholder={currentPage.toString()}
            min="1" 
            max={totalPages}
            className="bkm-jump-input"
          />
          <span className="bkm-pagination-jump-label">of {totalPages}</span>
        </form>
        
        <button
          type="button"
          className="bkm-pagination-btn bkm-jump-arrow bkm-hide-on-large"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          title="Next page"
        >
          <ChevronRightIcon size={18} />
        </button>
      </div>
    </nav>
  );
};

export default PaginationControls;
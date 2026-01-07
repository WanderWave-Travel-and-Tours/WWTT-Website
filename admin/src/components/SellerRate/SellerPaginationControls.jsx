import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react'; 
import './SellerPaginationControls.css'; 

const SellerPaginationControls = ({ 
    totalItems, 
    itemsPerPage, 
    currentPage, 
    onPageChange
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
    <nav className="sr-pagination-nav">
      {/* Showing info - always visible */}
      <div className="sr-pagination-info">
        <span className="sr-pagination-showing">
          Showing <strong>{((currentPage - 1) * itemsPerPage) + 1}</strong> to{' '}
          <strong>{Math.min(currentPage * itemsPerPage, totalItems)}</strong> of{' '}
          <strong>{totalItems}</strong> items
        </span>
      </div>

      {/* EMPTY CENTER - page numbers completely removed on large screens */}
      <div className="sr-pagination-controls sr-large-only">
        {/* Intentionally empty - no page numbers, no arrows */}
      </div>

      {/* Jump section - arrows visible only on mid & mobile */}
      <div className="sr-pagination-jump">
        <button
          type="button"
          className="sr-pagination-btn sr-jump-arrow sr-hide-on-large"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="Previous page"
        >
          <ChevronLeft size={18} />
        </button>
        
        <form onSubmit={handleJump} className="sr-pagination-jump-form">
          <span className="sr-pagination-jump-label">Page</span>
          <input 
            type="number" 
            value={jumpPageInput}
            onChange={(e) => setJumpPageInput(e.target.value)}
            placeholder={currentPage.toString()}
            min="1" 
            max={totalPages}
            className="sr-jump-input"
          />
          <span className="sr-pagination-jump-label">of {totalPages}</span>
        </form>
        
        <button
          type="button"
          className="sr-pagination-btn sr-jump-arrow sr-hide-on-large"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          title="Next page"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </nav>
  );
};

export default SellerPaginationControls;
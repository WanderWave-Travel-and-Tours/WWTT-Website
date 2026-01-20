import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './FeedbackPagination.css';

const FeedbackPagination = ({ 
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
    <nav className="fb-pagination-nav">
      {/* Showing info */}
      <div className="fb-pagination-info">
        <span className="fb-pagination-showing">
          Showing <strong>{((currentPage - 1) * itemsPerPage) + 1}</strong> to{' '}
          <strong>{Math.min(currentPage * itemsPerPage, totalItems)}</strong> of{' '}
          <strong>{totalItems}</strong> items
        </span>
      </div>

      {/* Empty center on large screens */}
      <div className="fb-pagination-controls fb-large-only">
      </div>

      {/* Jump section */}
      <div className="fb-pagination-jump">
        <button
          type="button"
          className="fb-pagination-btn fb-jump-arrow fb-hide-on-large"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="Previous page"
        >
          <ChevronLeft size={18} />
        </button>
        
        <form onSubmit={handleJump} className="fb-pagination-jump-form">
          <span className="fb-pagination-jump-label">Page</span>
          <input 
            type="number" 
            value={jumpPageInput}
            onChange={(e) => setJumpPageInput(e.target.value)}
            placeholder={currentPage.toString()}
            min="1" 
            max={totalPages}
            className="fb-jump-input"
          />
          <span className="fb-pagination-jump-label">of {totalPages}</span>
        </form>
        
        <button
          type="button"
          className="fb-pagination-btn fb-jump-arrow fb-hide-on-large"
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

export default FeedbackPagination;
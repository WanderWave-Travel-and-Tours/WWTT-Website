import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react'; 
import './PaginationControls.css'; 

const PAGE_SIZE_OPTIONS = [10, 20, 30, 40];

const PaginationControls = ({
    totalItems,
    itemsPerPage,
    currentPage,
    onPageChange,
    onItemsPerPageChange,
    ChevronLeftIcon = ChevronLeft,
    ChevronRightIcon = ChevronRight
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const [jumpPageInput, setJumpPageInput] = useState('');

  if (totalItems === 0) return null;

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
        {totalPages > 1 && (
          <>
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
          </>
        )}

        {onItemsPerPageChange && (
          <div className="bkm-pagination-size-select-wrap">
            <select
              className="bkm-pagination-size-select"
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              title="Rows per page"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size} / page</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </nav>
  );
};

export default PaginationControls;
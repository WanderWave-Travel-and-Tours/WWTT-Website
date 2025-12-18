import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react'; 
import './PromoPagination.css'; 

const PromoPagination = ({ 
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
        <nav className="prp-pagination-nav">
            <div className="prp-pagination-info">
                <span className="prp-pagination-showing">
                    Showing <strong>{((currentPage - 1) * itemsPerPage) + 1}</strong> to{' '}
                    <strong>{Math.min(currentPage * itemsPerPage, totalItems)}</strong> of{' '}
                    <strong>{totalItems}</strong> items
                </span>
            </div>

            <div className="prp-pagination-controls prp-large-only">
                {/* Empty space for large screens */}
            </div>

            <div className="prp-pagination-jump">
                <button
                    type="button"
                    className="prp-pagination-btn prp-jump-arrow prp-hide-on-large"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    title="Previous page"
                >
                    <ChevronLeft size={18} />
                </button>
                
                <form onSubmit={handleJump} className="prp-pagination-jump-form">
                    <span className="prp-pagination-jump-label">Page</span>
                    <input 
                        type="number" 
                        value={jumpPageInput}
                        onChange={(e) => setJumpPageInput(e.target.value)}
                        placeholder={currentPage.toString()}
                        min="1" 
                        max={totalPages}
                        className="prp-jump-input"
                    />
                    <span className="prp-pagination-jump-label">of {totalPages}</span>
                </form>
                
                <button
                    type="button"
                    className="prp-pagination-btn prp-jump-arrow prp-hide-on-large"
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

export default PromoPagination;
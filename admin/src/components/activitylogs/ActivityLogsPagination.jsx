import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react'; 
import './ActivityLogsPagination.css'; 

const ActivityLogsPagination = ({ 
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
        <nav className="act-pagination-nav">
            {/* Showing info - always visible */}
            <div className="act-pagination-info">
                <span className="act-pagination-showing">
                    Showing <strong>{((currentPage - 1) * itemsPerPage) + 1}</strong> to{' '}
                    <strong>{Math.min(currentPage * itemsPerPage, totalItems)}</strong> of{' '}
                    <strong>{totalItems}</strong> logs
                </span>
            </div>

            {/* EMPTY CENTER - page numbers completely removed on large screens */}
            <div className="act-pagination-controls act-large-only">
                {/* Intentionally empty - no page numbers, no arrows */}
            </div>

            {/* Jump section - arrows visible only on mid & mobile */}
            <div className="act-pagination-jump">
                <button
                    type="button"
                    className="act-pagination-btn act-jump-arrow act-hide-on-large"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    title="Previous page"
                >
                    <ChevronLeftIcon size={18} />
                </button>
                
                <form onSubmit={handleJump} className="act-pagination-jump-form">
                    <span className="act-pagination-jump-label">Page</span>
                    <input 
                        type="number" 
                        value={jumpPageInput}
                        onChange={(e) => setJumpPageInput(e.target.value)}
                        placeholder={currentPage.toString()}
                        min="1" 
                        max={totalPages}
                        className="act-jump-input"
                    />
                    <span className="act-pagination-jump-label">of {totalPages}</span>
                </form>
                
                <button
                    type="button"
                    className="act-pagination-btn act-jump-arrow act-hide-on-large"
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

export default ActivityLogsPagination;
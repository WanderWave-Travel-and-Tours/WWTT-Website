import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Userpagination.css';

const UserPagination = ({ 
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

    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    return (
        <nav className="up-pagination-nav">
            <div className="up-pagination-info">
                <span className="up-pagination-showing">
                    Showing <strong>{((currentPage - 1) * itemsPerPage) + 1}</strong> to{' '}
                    <strong>{Math.min(currentPage * itemsPerPage, totalItems)}</strong> of{' '}
                    <strong>{totalItems}</strong> items
                </span>
            </div>

            <div className="up-pagination-controls up-large-only">
                {/* Empty space for large screens */}
            </div>

            <div className="up-pagination-jump">
                <button
                    type="button"
                    className="up-pagination-btn up-jump-arrow up-hide-on-large"
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                    title="Previous page"
                    aria-label="Previous page"
                >
                    <ChevronLeft size={18} />
                </button>
                
                <form onSubmit={handleJump} className="up-pagination-jump-form">
                    <span className="up-pagination-jump-label">Page</span>
                    <input 
                        type="number" 
                        value={jumpPageInput}
                        onChange={(e) => setJumpPageInput(e.target.value)}
                        placeholder={currentPage.toString()}
                        min="1" 
                        max={totalPages}
                        className="up-jump-input"
                    />
                    <span className="up-pagination-jump-label">of {totalPages}</span>
                </form>
                
                <button
                    type="button"
                    className="up-pagination-btn up-jump-arrow up-hide-on-large"
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    title="Next page"
                    aria-label="Next page"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </nav>
    );
};

export default UserPagination;
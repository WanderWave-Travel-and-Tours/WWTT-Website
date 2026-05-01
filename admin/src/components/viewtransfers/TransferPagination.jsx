import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './TransferPagination.css';

const TransferPagination = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const [jumpPageInput, setJumpPageInput] = useState('');

    if (totalPages <= 1) return null;

    const handleJump = (e) => {
        e.preventDefault();
        const page = parseInt(jumpPageInput, 10);
        if (page >= 1 && page <= totalPages) {
            onPageChange(page);
            setJumpPageInput('');
        }
    };

    const handlePrevious = () => {
        if (currentPage > 1) onPageChange(currentPage - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) onPageChange(currentPage + 1);
    };

    return (
        <nav className="txp-pagination-nav">
            <div className="txp-pagination-info">
                <span className="txp-pagination-showing">
                    Showing <strong>{((currentPage - 1) * itemsPerPage) + 1}</strong> to{' '}
                    <strong>{Math.min(currentPage * itemsPerPage, totalItems)}</strong> of{' '}
                    <strong>{totalItems}</strong>
                </span>
            </div>
            <div className="txp-pagination-jump">
                <button
                    className="txp-jump-arrow"
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                >
                    <ChevronLeft size={18} />
                </button>
                <form onSubmit={handleJump} className="txp-pagination-jump-form">
                    <span className="txp-pagination-jump-label">Page</span>
                    <input
                        type="number"
                        value={jumpPageInput}
                        onChange={(e) => setJumpPageInput(e.target.value)}
                        placeholder={currentPage.toString()}
                        className="txp-jump-input"
                        min="1"
                        max={totalPages}
                    />
                    <span className="txp-pagination-jump-label">of {totalPages}</span>
                </form>
                <button
                    className="txp-jump-arrow"
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </nav>
    );
};

export default TransferPagination;

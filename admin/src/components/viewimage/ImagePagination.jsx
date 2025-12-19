import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react'; 
import './ImagePagination.css'; 

const ImagePagination = ({ 
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
        <nav className="ip-pagination-nav">
            <div className="ip-pagination-info">
                <span className="ip-pagination-showing">
                    Showing <strong>{((currentPage - 1) * itemsPerPage) + 1}</strong> to{' '}
                    <strong>{Math.min(currentPage * itemsPerPage, totalItems)}</strong> of{' '}
                    <strong>{totalItems}</strong> images
                </span>
            </div>

            <div className="ip-pagination-controls ip-large-only">
                {/* Empty space for large screens */}
            </div>

            <div className="ip-pagination-jump">
                <button
                    type="button"
                    className="ip-pagination-btn ip-jump-arrow ip-hide-on-large"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    title="Previous page"
                >
                    <ChevronLeft size={18} />
                </button>
                
                <form onSubmit={handleJump} className="ip-pagination-jump-form">
                    <span className="ip-pagination-jump-label">Page</span>
                    <input 
                        type="number" 
                        value={jumpPageInput}
                        onChange={(e) => setJumpPageInput(e.target.value)}
                        placeholder={currentPage.toString()}
                        min="1" 
                        max={totalPages}
                        className="ip-jump-input"
                    />
                    <span className="ip-pagination-jump-label">of {totalPages}</span>
                </form>
                
                <button
                    type="button"
                    className="ip-pagination-btn ip-jump-arrow ip-hide-on-large"
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

export default ImagePagination;
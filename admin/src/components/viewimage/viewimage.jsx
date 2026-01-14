import React, { useState, useEffect } from 'react';
import { Archive, Calendar, Eye, Image as ImageIcon, HelpCircle, X } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import ImageDetailModal from './ImageDetailModal';
import ImagePagination from './ImagePagination';
import ImageFilters from './ImageFilters';
import { useToast } from "../toast/ToastManager"; 
import './viewimage.css';

// --- CUSTOM CONFIRMATION MODAL COMPONENT ---
const CustomConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, type = "primary" }) => {
  if (!isOpen) return null;
  return (
    <div className="arc-confirm-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 11000
    }}>
      <div className="arc-confirm-modal" style={{
        backgroundColor: 'white', padding: '2rem', borderRadius: '12px',
        maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <HelpCircle size={48} color={type === 'danger' ? '#ef4444' : '#3b82f6'} style={{ margin: '0 auto' }} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', color: '#1e293b' }}>{title}</h3>
        <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.5' }}>{message}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button 
            onClick={onCancel}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: '6px', border: '1px solid #e2e8f0',
              backgroundColor: 'white', cursor: 'pointer', fontWeight: '500'
            }}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none',
              backgroundColor: type === 'danger' ? '#ef4444' : '#3b82f6',
              color: 'white', cursor: 'pointer', fontWeight: '500'
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const ViewImage = () => {
    const toast = useToast(); 
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // --- FILTERS STATE ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterFileType, setFilterFileType] = useState('ALL');
    
    // ✅ ADDED: Date Filter State
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    // Confirmation State
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => {},
        type: "primary"
    });

    const fileTypeOptions = ['ALL', 'JPG', 'PNG', 'GIF', 'WEBP', 'SVG'];

    const getFilterClassName = (type) => {
        return filterFileType === type ? 'if-active-navy' : '';
    };

    // Helper function for confirmation
    const askConfirmation = (title, message, onConfirm, type = "primary") => {
        setConfirmConfig({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                onConfirm();
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
            },
            type
        });
    };

    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async () => {
        setLoading(true);
        try {
            const response = await fetch('https://wanderwaveph-backend.onrender.com/api/images');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // FILTER & FORMAT: Process data
            const activeImages = data
                .filter(img => img.isArchive === "No")
                .map(img => {
                    // Safe Date Parsing
                    const dateObj = img.createdAt ? new Date(img.createdAt) : null;
                    const isValidDate = dateObj && !isNaN(dateObj);

                    return {
                        ...img,
                        // ✅ Format for Filtering (YYYY-MM-DD)
                        filterDate: isValidDate ? dateObj.toLocaleDateString('en-CA') : '',
                        // ✅ Format for Display (Jan 25, 2024)
                        displayDateAdded: isValidDate ? dateObj.toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric'
                        }) : 'N/A'
                    };
                });

            setImages(activeImages);
            setCurrentPage(1);
        } catch (error) {
            console.error('❌ Error fetching images:', error);
            toast.error("Failed to load images. Make sure the backend is running.");
        } finally {
            setLoading(false);
        }
    };

    // Updated handleArchive
    const handleArchive = (id, imageName) => {
        askConfirmation(
            "Archive Image",
            `Are you sure you want to archive "${imageName || 'this image'}"?`,
            async () => {
                try {
                    const response = await fetch(`https://wanderwaveph-backend.onrender.com/api/images/${id}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ isArchive: 'Yes' })
                    });
                    
                    if (response.ok) {
                        const updatedImages = images.filter(img => img._id !== id);
                        setImages(updatedImages);
                        toast.success('Image archived successfully');
                        
                        const maxPage = Math.ceil(updatedImages.length / itemsPerPage);
                        if (currentPage > maxPage && maxPage > 0) {
                            setCurrentPage(maxPage);
                        }
                    } else {
                        toast.error('Failed to archive image');
                    }
                } catch (error) {
                    console.error('Error archiving:', error);
                    toast.error('Server error while archiving');
                }
            },
            "danger"
        );
    };

    const handleViewDetails = (image) => {
        setSelectedImage(image);
        setShowDetailModal(true);
    };

    // ✅ ENHANCED FILTER LOGIC
    const filteredImages = images.filter(image => {
        // 1. Search Filter
        const matchesSearch = (image.imageName || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        // 2. File Type Filter
        const fileExtension = (image.imageName?.split('.').pop() || '').toUpperCase();
        const matchesFileType = filterFileType === 'ALL' || fileExtension === filterFileType;
        
        // 3. ✅ Date Range Filter
        let matchesDate = true;
        if (dateStart) {
            matchesDate = matchesDate && image.filterDate >= dateStart;
        }
        if (dateEnd) {
            matchesDate = matchesDate && image.filterDate <= dateEnd;
        }
        
        return matchesSearch && matchesFileType && matchesDate;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentImages = filteredImages.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="vi-page">
            <Sidebar 
                isCollapsed={isSidebarCollapsed} 
                toggleSidebar={toggleSidebar} 
            />
            <main className={`vi-main ${isSidebarCollapsed ? 'vi-main--collapsed' : ''}`}>
                <div className="vi-container">
                    <header className="vi-header">
                        <div className="vi-header-content">
                            <h1 className="vi-title">IMAGE GALLERY</h1>
                            <p className="vi-subtitle">
                                Managing {images.length} active images in your gallery
                            </p>
                        </div>
                        <button className="vi-btn vi-btn--add" onClick={() => window.location.href='/upload-image'}>
                            + Upload New Image
                        </button>
                    </header>

                    {/* ✅ PASSED NEW PROPS TO FILTERS */}
                    <ImageFilters
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        filterFileType={filterFileType}
                        setFilterFileType={setFilterFileType}
                        fileTypeOptions={fileTypeOptions}
                        getFilterClassName={getFilterClassName}
                        dateStart={dateStart}
                        setDateStart={setDateStart}
                        dateEnd={dateEnd}
                        setDateEnd={setDateEnd}
                    />

                    {loading ? (
                        <div className="vi-loading">
                            <div className="vi-spinner"></div>
                            <p>Loading images from database...</p>
                        </div>
                    ) : images.length === 0 ? (
                        <div className="vi-empty">
                            <span className="vi-empty-icon">🖼️</span>
                            <h3>No active images</h3>
                            <p>All images are archived or none have been uploaded yet.</p>
                        </div>
                    ) : filteredImages.length === 0 ? (
                        <div className="vi-empty">
                            <span className="vi-empty-icon">🔍</span>
                            <h3>No images found</h3>
                            <p>Try adjusting your search criteria</p>
                        </div>
                    ) : (
                        <>
                            <div className="vi-table-wrapper">
                                <table className="vi-table">
                                    <thead>
                                        <tr>
                                            <th>PREVIEW</th>
                                            <th>FILE NAME</th>
                                            <th>FILE TYPE</th>
                                            {/* ✅ UPDATED COLUMN HEADER */}
                                            <th>UPLOAD DATE</th>
                                            <th>ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentImages.map((image) => (
                                            <tr key={image._id}>
                                                <td>
                                                    <div className="vi-image-preview">
                                                        <img 
                                                            src={image.imageUrl} 
                                                            alt={image.imageName || 'Gallery image'}
                                                            onError={(e) => {
                                                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EImage not found%3C/text%3E%3C/svg%3E';
                                                            }}
                                                        />
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="vi-image-name">{image.imageName || 'Untitled'}</span>
                                                </td>
                                                <td>
                                                    <span className="vi-file-type">
                                                        <ImageIcon size={12} />
                                                        {image.imageName?.split('.').pop()?.toUpperCase() || 'IMAGE'}
                                                    </span>
                                                </td>
                                                {/* ✅ DATE ADDED DISPLAY */}
                                                <td>
                                                    <div className="vi-date-added">
                                                        <Calendar size={14} />
                                                        <span>{image.displayDateAdded}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="vi-actions">
                                                        <button 
                                                            className="vi-action-btn vi-action-btn--view"
                                                            onClick={() => handleViewDetails(image)}
                                                            title="View Details"
                                                        >
                                                            <Eye size={16} />
                                                            <span>View</span>
                                                        </button>
                                                        <button 
                                                            className="vi-action-btn vi-action-btn--archive"
                                                            onClick={() => handleArchive(image._id, image.imageName)}
                                                            title="Archive Image"
                                                        >
                                                            <Archive size={16} />
                                                            <span>Archive</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            <ImagePagination
                                totalItems={filteredImages.length}
                                itemsPerPage={itemsPerPage}
                                currentPage={currentPage}
                                onPageChange={setCurrentPage}
                            />
                        </>
                    )}
                </div>
            </main>

            {showDetailModal && selectedImage && (
                <ImageDetailModal
                    showModal={showDetailModal}
                    selectedImage={selectedImage}
                    setShowModal={setShowDetailModal}
                    handleArchive={handleArchive}
                />
            )}

            {/* --- CUSTOM CONFIRMATION MODAL RENDER --- */}
            <CustomConfirmModal 
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                type={confirmConfig.type}
                onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default ViewImage;
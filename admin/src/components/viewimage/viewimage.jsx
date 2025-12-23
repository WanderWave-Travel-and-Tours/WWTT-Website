import React, { useState, useEffect } from 'react';
import { Archive, Calendar, Eye, Image as ImageIcon } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import ImageDetailModal from './ImageDetailModal';
import ImagePagination from './ImagePagination';
import ImageFilters from './ImageFilters';
import './viewimage.css';

const ViewImage = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterFileType, setFilterFileType] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    const fileTypeOptions = ['ALL', 'JPG', 'PNG', 'GIF', 'WEBP', 'SVG'];

    const getFilterClassName = (type) => {
        return filterFileType === type ? 'if-active-navy' : '';
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
            console.log('📸 Fetched images:', data);
            
            // FILTER: I-set lamang sa state ang mga images na "No" ang isArchive status
            const activeImages = data.filter(img => img.isArchive === "No");
            setImages(activeImages);
            
            setCurrentPage(1);
        } catch (error) {
            console.error('❌ Error fetching images:', error);
            alert('Failed to load images. Make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    // UPDATED: Ang function na ito ay nagpapalit na ngayon ng isArchive status sa "Yes"
    const handleArchive = async (id, imageName) => {
        if (window.confirm(`Are you sure you want to archive "${imageName || 'this image'}"?`)) {
            try {
                // Gagamit tayo ng PATCH/PUT para i-update ang field sa database
                const response = await fetch(`https://wanderwaveph-backend.onrender.com/api/images/${id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ isArchive: 'Yes' })
                });
                
                if (response.ok) {
                    // I-remove sa UI state ang image dahil "Yes" na ang status nito
                    const updatedImages = images.filter(img => img._id !== id);
                    setImages(updatedImages);
                    alert('Image archived successfully');
                    
                    const maxPage = Math.ceil(updatedImages.length / itemsPerPage);
                    if (currentPage > maxPage && maxPage > 0) {
                        setCurrentPage(maxPage);
                    }
                } else {
                    alert('Failed to archive image');
                }
            } catch (error) {
                console.error('Error archiving:', error);
                alert('Server error while archiving');
            }
        }
    };

    const handleViewDetails = (image) => {
        setSelectedImage(image);
        setShowDetailModal(true);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Filter and search logic (Still based on active images in state)
    const filteredImages = images.filter(image => {
        const matchesSearch = (image.imageName || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        // Get file extension from image name
        const fileExtension = (image.imageName?.split('.').pop() || '').toUpperCase();
        const matchesFileType = filterFileType === 'ALL' || fileExtension === filterFileType;
        
        return matchesSearch && matchesFileType;
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

                    {/* IMAGE FILTERS */}
                    <ImageFilters
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        filterFileType={filterFileType}
                        setFilterFileType={setFilterFileType}
                        fileTypeOptions={fileTypeOptions}
                        getFilterClassName={getFilterClassName}
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
                        <div className="vi-table-wrapper">
                            <table className="vi-table">
                                <thead>
                                    <tr>
                                        <th>PREVIEW</th>
                                        <th>FILE NAME</th>
                                        <th>FILE TYPE</th>
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
                                                            console.error('Image load error:', image.imageUrl);
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
                                            <td>
                                                <div className="vi-date">
                                                    <Calendar size={14} />
                                                    <span>
                                                        {image.createdAt ? formatDate(image.createdAt) : '--'}
                                                    </span>
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
                            
                            <ImagePagination
                                totalItems={filteredImages.length}
                                itemsPerPage={itemsPerPage}
                                currentPage={currentPage}
                                onPageChange={setCurrentPage}
                            />
                        </div>
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
        </div>
    );
};

export default ViewImage;
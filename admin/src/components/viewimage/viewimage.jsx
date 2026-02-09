import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus } from 'lucide-react'; 
import Sidebar from '../sidebar/sidebar';
import ImageDetailModal from './ImageDetailModal';
import ImagePagination from './ImagePagination';
import ImageFilters from './ImageFilters';
import ImagesTable from './ImagesTable'; 
import { useToast } from "../toast/ToastManager"; 
import './viewimage.css'; 
import { useNavigate } from 'react-router-dom'; // ✅ IMPORT THIS

// --- CUSTOM CONFIRMATION MODAL ---
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
    const navigate = useNavigate(); // ✅ INITIALIZE NAVIGATE
    
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // FILTERS
    const [searchTerm, setSearchTerm] = useState('');
    const [filterFileType, setFilterFileType] = useState('ALL');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false, title: "", message: "", onConfirm: () => {}, type: "primary"
    });

    const fileTypeOptions = ['ALL', 'JPG', 'PNG', 'GIF', 'WEBP', 'SVG'];

    const getFilterClassName = (type) => {
        return filterFileType === type ? 'if-active-navy' : '';
    };

    const askConfirmation = (title, message, onConfirm, type = "primary") => {
        setConfirmConfig({
            isOpen: true, title, message,
            onConfirm: () => { onConfirm(); setConfirmConfig(prev => ({ ...prev, isOpen: false })); },
            type
        });
    };

    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async () => {
        setLoading(true);
        try {
            const response = await fetch('https://wanderwaveph.onrender.com/api/images');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            
            const activeImages = data.filter(img => img.isArchive === "No").map(img => {
                const dateObj = img.createdAt ? new Date(img.createdAt) : null;
                const isValidDate = dateObj && !isNaN(dateObj);
                return {
                    ...img,
                    filterDate: isValidDate ? dateObj.toLocaleDateString('en-CA') : '',
                    displayDateAdded: isValidDate ? dateObj.toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric'
                    }) : 'N/A'
                };
            });

            setImages(activeImages);
            setCurrentPage(1);
        } catch (error) {
            console.error('❌ Error fetching images:', error);
            toast.error("Failed to load images.");
        } finally {
            setLoading(false);
        }
    };

    const handleArchive = (id, imageName) => {
        askConfirmation("Archive Image", `Are you sure you want to archive "${imageName}"?`, async () => {
            try {
                const response = await fetch(`https://wanderwaveph.onrender.com/api/images/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isArchive: 'Yes' })
                });
                if (response.ok) {
                    setImages(images.filter(img => img._id !== id));
                    toast.success('Image archived successfully');
                } else {
                    toast.error('Failed to archive image');
                }
            } catch (error) {
                toast.error('Server error while archiving');
            }
        }, "danger");
    };

    const handleViewDetails = (image) => {
        setSelectedImage(image);
        setShowDetailModal(true);
    };

    const filteredImages = images.filter(image => {
        const matchesSearch = (image.imageName || '').toLowerCase().includes(searchTerm.toLowerCase());
        const fileExtension = (image.imageName?.split('.').pop() || '').toUpperCase();
        const matchesFileType = filterFileType === 'ALL' || fileExtension === filterFileType;
        let matchesDate = true;
        if (dateStart) matchesDate = matchesDate && image.filterDate >= dateStart;
        if (dateEnd) matchesDate = matchesDate && image.filterDate <= dateEnd;
        return matchesSearch && matchesFileType && matchesDate;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentImages = filteredImages.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="vi-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            
            <main className={`vi-main ${isSidebarCollapsed ? "expanded" : ""}`}>
                <div className="vi-container">
                    
                    <header className="vi-header">
                        <div className="vi-header-content">
                            <h1 className="vi-title">IMAGE GALLERY</h1>
                            <div className="vi-subtitle">
                                Managing {images.length} active images in your gallery
                            </div>
                        </div>
                        
                        {/* ✅ FIX: Uses navigate('/add-image') */}
                        <button className="vi-btn-add" onClick={() => navigate('/add-image')}>
                            <Plus size={18} strokeWidth={3} />
                            UPLOAD NEW IMAGE
                        </button>
                    </header>

                    <ImageFilters
                        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                        filterFileType={filterFileType} setFilterFileType={setFilterFileType}
                        fileTypeOptions={fileTypeOptions} getFilterClassName={getFilterClassName}
                        dateStart={dateStart} setDateStart={setDateStart}
                        dateEnd={dateEnd} setDateEnd={setDateEnd}
                    />

                    {loading ? (
                        <div className="vi-loading"><div className="vi-spinner"></div><p>Loading images...</p></div>
                    ) : filteredImages.length === 0 ? (
                        <div className="vi-empty"><h3>No images found</h3></div>
                    ) : (
                        <>
                            <ImagesTable 
                                images={currentImages}
                                handleViewDetails={handleViewDetails}
                                handleArchive={handleArchive}
                            />
                            
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
                    showModal={showDetailModal} selectedImage={selectedImage}
                    setShowModal={setShowDetailModal} handleArchive={handleArchive}
                />
            )}

            <CustomConfirmModal 
                isOpen={confirmConfig.isOpen} title={confirmConfig.title} message={confirmConfig.message}
                type={confirmConfig.type} onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default ViewImage;
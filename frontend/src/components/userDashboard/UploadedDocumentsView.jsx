import React, { useState } from 'react';
import './UploadedDocumentsView.css';

// Icons Component
const Icons = {
    File: () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
    ),
    Image: () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
    Eye: () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    ),
    Download: () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
    ),
    Check: () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    ),
    Info: () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    X: () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
    ZoomIn: () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
        </svg>
    ),
    ZoomOut: () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
        </svg>
    )
};

const UploadedDocumentsView = ({ documents, isLoading }) => {
    const [loadingUrls, setLoadingUrls] = useState({});
    const [modalOpen, setModalOpen] = useState(false);
    const [currentDocument, setCurrentDocument] = useState(null);
    const [imageUrl, setImageUrl] = useState(null);
    const [imageLoading, setImageLoading] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);

    if (isLoading) {
        return (
            <div className="udv-container">
                <div className="udv-header">
                    <h2>Your Uploaded Documents</h2>
                </div>
                <div className="udv-loading">
                    <div className="udv-spinner"></div>
                    <p>Loading your documents...</p>
                </div>
            </div>
        );
    }

    if (!documents || documents.length === 0) {
        return (
            <div className="udv-container">
                <div className="udv-header">
                    <h2>Your Uploaded Documents</h2>
                    <p className="udv-subtitle">Documents you've submitted for this application</p>
                </div>
                <div className="udv-empty-state">
                    <div className="udv-empty-icon">
                        <Icons.File />
                    </div>
                    <h3>No Documents Yet</h3>
                    <p>You haven't uploaded any documents for this application yet.</p>
                    <p className="udv-empty-hint">Use the upload section below to submit your documents.</p>
                </div>
            </div>
        );
    }

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return 'N/A';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const getFileIcon = (fileName) => {
        const ext = fileName.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
            return <Icons.Image />;
        }
        return <Icons.File />;
    };

    const isImageFile = (fileName) => {
        const ext = fileName.split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
    };

    const getSignedUrl = async (documentId, type = 'view') => {
        try {
            setLoadingUrls(prev => ({ ...prev, [documentId]: true }));
            
            const endpoint = type === 'download' ? 'download' : 'view';
            const response = await fetch(`http://localhost:5000/api/documents/${documentId}/${endpoint}`);
            
            if (!response.ok) {
                throw new Error('Failed to get signed URL');
            }
            
            const data = await response.json();
            
            if (data.success && data.url) {
                return data.url;
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error('Error getting signed URL:', error);
            alert('Failed to access document. Please try again.');
            return null;
        } finally {
            setLoadingUrls(prev => ({ ...prev, [documentId]: false }));
        }
    };

    const handleViewDocument = async (e, doc) => {
        e.preventDefault();
        
        // Always open in modal for images
        setCurrentDocument(doc);
        setModalOpen(true);
        setImageLoading(true);
        setZoomLevel(1);
        
        const signedUrl = await getSignedUrl(doc._id, 'view');
        if (signedUrl) {
            setImageUrl(signedUrl);
            setImageLoading(false);
        } else {
            setModalOpen(false);
            setCurrentDocument(null);
        }
    };

    const handleDownloadDocument = async (e, documentId, fileName) => {
        e.preventDefault();
        const signedUrl = await getSignedUrl(documentId, 'download');
        if (signedUrl) {
            const link = document.createElement('a');
            link.href = signedUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const closeModal = () => {
        setModalOpen(false);
        setCurrentDocument(null);
        setImageUrl(null);
        setZoomLevel(1);
    };

    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev + 0.25, 3));
    };

    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
    };

    const groupedDocs = documents.reduce((acc, doc) => {
        const section = doc.section || 'General Documents';
        if (!acc[section]) {
            acc[section] = [];
        }
        acc[section].push(doc);
        return acc;
    }, {});

    return (
        <>
            <div className="udv-container">
                <div className="udv-header">
                    <div>
                        <h2>Your Uploaded Documents</h2>
                        <p className="udv-subtitle">
                            {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
                        </p>
                    </div>
                    <div className="udv-badge">
                        <Icons.Check />
                        <span>Submitted</span>
                    </div>
                </div>

                <div className="udv-sections">
                    {Object.entries(groupedDocs).map(([section, docs]) => (
                        <div key={section} className="udv-section">
                            <div className="udv-section-header">
                                <h3>{section}</h3>
                                <span className="udv-section-count">{docs.length} file{docs.length !== 1 ? 's' : ''}</span>
                            </div>

                            <div className="udv-docs-grid">
                                {docs.map((doc, idx) => (
                                    <div key={doc._id || idx} className="udv-doc-card">
                                        <div className="udv-doc-icon">
                                            {getFileIcon(doc.fileName)}
                                        </div>
                                        <div className="udv-doc-info">
                                            <h4 className="udv-doc-name" title={doc.fileName}>
                                                {doc.fileName}
                                            </h4>
                                            <div className="udv-doc-meta">
                                                <span className="udv-doc-size">
                                                    {formatFileSize(doc.fileSize)}
                                                </span>
                                                <span className="udv-doc-divider">•</span>
                                                <span className="udv-doc-date">
                                                    {formatDate(doc.uploadedAt)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="udv-doc-actions">
                                            <button 
                                                onClick={(e) => handleViewDocument(e, doc)}
                                                className="udv-btn-view"
                                                title="View document"
                                                disabled={loadingUrls[doc._id]}
                                            >
                                                <Icons.Eye />
                                                {loadingUrls[doc._id] ? 'Loading...' : 'View'}
                                            </button>
                                            <button 
                                                onClick={(e) => handleDownloadDocument(e, doc._id, doc.originalName)}
                                                className="udv-btn-download"
                                                title="Download document"
                                                disabled={loadingUrls[doc._id]}
                                            >
                                                <Icons.Download />
                                                {loadingUrls[doc._id] ? 'Loading...' : 'Download'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="udv-footer-note">
                    <Icons.Info />
                    <p>These documents have been submitted for review. You can still upload additional documents using the section below.</p>
                </div>
            </div>

            {/* Image Modal */}
            {modalOpen && (
                <div className="udv-modal-overlay" onClick={closeModal}>
                    <div className="udv-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="udv-modal-header">
                            <div className="udv-modal-title">
                                <h3>{currentDocument?.fileName}</h3>
                                <p>{formatFileSize(currentDocument?.fileSize)} • {formatDate(currentDocument?.uploadedAt)}</p>
                            </div>
                            <button className="udv-modal-close" onClick={closeModal} title="Close">
                                <Icons.X />
                            </button>
                        </div>

                        <div className="udv-modal-body">
                            {imageLoading ? (
                                <div className="udv-modal-loading">
                                    <div className="udv-spinner"></div>
                                    <p>Loading image...</p>
                                </div>
                            ) : (
                                <div className="udv-modal-image-wrapper">
                                    <img 
                                        src={imageUrl} 
                                        alt={currentDocument?.fileName}
                                        style={{ transform: `scale(${zoomLevel})` }}
                                        className="udv-modal-image"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="udv-modal-footer">
                            <div className="udv-modal-zoom-controls">
                                <button 
                                    onClick={handleZoomOut} 
                                    disabled={zoomLevel <= 0.5}
                                    className="udv-zoom-btn"
                                    title="Zoom out"
                                >
                                    <Icons.ZoomOut />
                                </button>
                                <span className="udv-zoom-level">{Math.round(zoomLevel * 100)}%</span>
                                <button 
                                    onClick={handleZoomIn} 
                                    disabled={zoomLevel >= 3}
                                    className="udv-zoom-btn"
                                    title="Zoom in"
                                >
                                    <Icons.ZoomIn />
                                </button>
                            </div>
                            <button 
                                onClick={(e) => handleDownloadDocument(e, currentDocument._id, currentDocument.originalName)}
                                className="udv-modal-download-btn"
                            >
                                <Icons.Download />
                                Download
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UploadedDocumentsView;
import React, { useState } from 'react';
import * as Icons from './Icons';
import { X } from 'lucide-react';
import './UploadedDocumentsView.css';

const UploadedDocumentsView = ({ documents, isLoading, booking }) => {
    const [loadingUrls, setLoadingUrls] = useState({});
    const [previewDoc, setPreviewDoc] = useState(null); // { fileUrl, fileName, docType }

    // ── Documents embedded directly on the booking (ID/passport per passenger + proof image) ──
    // These aren't rows in the Document collection (no inquiryId), so they're
    // sourced straight from the booking object instead of the documents prop.
    const bookingDocs = [];
    (booking?.passengers || []).forEach((p, idx) => {
        const passengerLabel = (p.firstName && p.lastName)
            ? `${p.firstName} ${p.lastName}`
            : `Passenger ${idx + 1}`;
        const idPath = p.idDocument?.path || p.idDocument?.url;
        const passportPath = p.passportDocument?.path || p.passportDocument?.url;
        if (idPath) {
            bookingDocs.push({
                _id: `id-${idx}`,
                fileName: p.idDocument.originalName || `${passengerLabel} - Valid ID`,
                originalName: p.idDocument.originalName,
                fileSize: p.idDocument.size,
                fileUrl: idPath,
                section: 'ID Documents',
                docType: 'ID',
                passengerLabel,
                passengerNumber: idx + 1,
                isDirectLink: true,
            });
        }
        if (passportPath) {
            bookingDocs.push({
                _id: `passport-${idx}`,
                fileName: p.passportDocument.originalName || `${passengerLabel} - Passport`,
                originalName: p.passportDocument.originalName,
                fileSize: p.passportDocument.size,
                fileUrl: passportPath,
                section: 'Passport Documents',
                docType: 'Passport',
                passengerLabel,
                passengerNumber: idx + 1,
                isDirectLink: true,
            });
        }
    });
    const allDocs = [...bookingDocs, ...(documents || [])];

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

    if (allDocs.length === 0) {
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

    // ✅ NEW: Function to get signed URL from backend
    const getSignedUrl = async (documentId, type = 'view') => {
        try {
            setLoadingUrls(prev => ({ ...prev, [documentId]: true }));
            
            const endpoint = type === 'download' ? 'download' : 'view';
            const response = await fetch(`/api/documents/${documentId}/${endpoint}`);
            
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
            alert('Failed to access document. Please try again.');
            return null;
        } finally {
            setLoadingUrls(prev => ({ ...prev, [documentId]: false }));
        }
    };

    const isImageFile = (fileName) =>
        /\.(jpg|jpeg|png|webp|gif)$/i.test(fileName || '');

    // ✅ NEW: Handle view button click
    const handleViewDocument = async (e, doc) => {
        e.preventDefault();
        if (doc.isDirectLink) {
            if (isImageFile(doc.fileName)) {
                setPreviewDoc(doc);
            } else {
                window.open(doc.fileUrl, '_blank', 'noopener,noreferrer');
            }
            return;
        }
        const signedUrl = await getSignedUrl(doc._id, 'view');
        if (signedUrl) {
            if (isImageFile(doc.fileName)) {
                setPreviewDoc({ ...doc, fileUrl: signedUrl });
            } else {
                window.open(signedUrl, '_blank', 'noopener,noreferrer');
            }
        }
    };

    const downloadViaBlob = async (url, fileName) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch file');
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName || 'document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
    };

    // ✅ NEW: Handle download button click
    const handleDownloadDocument = async (e, doc) => {
        e.preventDefault();
        const fileName = doc.originalName || doc.fileName;
        try {
            if (doc.isDirectLink) {
                setLoadingUrls(prev => ({ ...prev, [doc._id]: true }));
                await downloadViaBlob(doc.fileUrl, fileName);
                setLoadingUrls(prev => ({ ...prev, [doc._id]: false }));
                return;
            }
            const signedUrl = await getSignedUrl(doc._id, 'download');
            if (signedUrl) {
                await downloadViaBlob(signedUrl, fileName);
            }
        } catch {
            alert('Failed to download document. Please try again.');
            setLoadingUrls(prev => ({ ...prev, [doc._id]: false }));
        }
    };

    // Group booking docs by passenger (keyed by passenger index, not name —
    // passengers can share the same name); general inquiry docs go under "General Documents"
    const passengerMap = {};
    const generalDocs = [];

    allDocs.forEach((doc) => {
        if (doc.passengerLabel) {
            const key = doc.passengerNumber ?? doc.passengerLabel;
            if (!passengerMap[key]) {
                passengerMap[key] = { label: doc.passengerLabel, number: doc.passengerNumber, docs: [] };
            }
            passengerMap[key].docs.push(doc);
        } else {
            generalDocs.push(doc);
        }
    });

    const passengerEntries = Object.values(passengerMap)
        .sort((a, b) => (a.number ?? 0) - (b.number ?? 0));

    return (
        <div className="udv-container">
            <div className="udv-header">
                <div>
                    <h2>Your Uploaded Documents</h2>
                    <p className="udv-subtitle">
                        {allDocs.length} document{allDocs.length !== 1 ? 's' : ''} uploaded
                    </p>
                </div>
                <div className="udv-badge">
                    <Icons.Check />
                    <span>Submitted</span>
                </div>
            </div>

            <div className="udv-sections">
                {/* Per-passenger sections */}
                {passengerEntries.map(({ label: passengerLabel, number, docs }, pIdx) => (
                    <div key={`${passengerLabel}-${number ?? pIdx}`} className="udv-section udv-passenger-section">
                        <div className="udv-section-header">
                            <div className="udv-passenger-title">
                                <span className="udv-passenger-number">Passenger {number ?? pIdx + 1}</span>
                                <h3>{passengerLabel}</h3>
                            </div>
                            <span className="udv-section-count">{docs.length} file{docs.length !== 1 ? 's' : ''}</span>
                        </div>

                        <div className="udv-docs-grid">
                            {docs.map((doc, idx) => (
                                <div key={doc._id || idx} className="udv-doc-card">
                                    <div className="udv-doc-icon">
                                        {getFileIcon(doc.fileName)}
                                    </div>
                                    <div className="udv-doc-info">
                                        <div className="udv-doc-badges">
                                            {doc.docType && (
                                                <span className={`udv-doc-type-badge udv-doc-type-${doc.docType.toLowerCase()}`}>
                                                    {doc.docType === 'ID' ? 'Valid ID' : doc.docType}
                                                </span>
                                            )}
                                            {doc.section && (
                                                <span className="udv-doc-section-badge">
                                                    {doc.section}
                                                </span>
                                            )}
                                        </div>
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
                                            onClick={(e) => handleDownloadDocument(e, doc)}
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

                {/* General / inquiry documents (not tied to a specific passenger) */}
                {generalDocs.length > 0 && (
                    <div className="udv-section">
                        <div className="udv-section-header">
                            <h3>General Documents</h3>
                            <span className="udv-section-count">{generalDocs.length} file{generalDocs.length !== 1 ? 's' : ''}</span>
                        </div>

                        <div className="udv-docs-grid">
                            {generalDocs.map((doc, idx) => (
                                <div key={doc._id || idx} className="udv-doc-card">
                                    <div className="udv-doc-icon">
                                        {getFileIcon(doc.fileName)}
                                    </div>
                                    <div className="udv-doc-info">
                                        <div className="udv-doc-badges">
                                            {doc.docType && (
                                                <span className={`udv-doc-type-badge udv-doc-type-${doc.docType.toLowerCase()}`}>
                                                    {doc.docType}
                                                </span>
                                            )}
                                        </div>
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
                                            onClick={(e) => handleDownloadDocument(e, doc)}
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
                )}
            </div>

            <div className="udv-footer-note">
                <Icons.Info />
                <p>These documents have been submitted for review. You can still upload additional documents using the section below.</p>
            </div>

            {/* ── IMAGE PREVIEW MODAL ── */}
            {previewDoc && (
                <div className="udv-preview-overlay" onClick={() => setPreviewDoc(null)}>
                    <div className="udv-preview-modal" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="udv-preview-header">
                            <div className="udv-preview-header-info">
                                <div className="udv-preview-header-icon">
                                    <Icons.Image />
                                </div>
                                <div className="udv-preview-header-text">
                                    <p className="udv-preview-name">{previewDoc.fileName || 'Document Preview'}</p>
                                    <div className="udv-doc-badges">
                                        {previewDoc.docType && (
                                            <span className={`udv-doc-type-badge udv-doc-type-${previewDoc.docType.toLowerCase()}`}>
                                                {previewDoc.docType === 'ID' ? 'Valid ID' : previewDoc.docType}
                                            </span>
                                        )}
                                        {previewDoc.section && (
                                            <span className="udv-doc-section-badge">{previewDoc.section}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button className="udv-preview-close" onClick={() => setPreviewDoc(null)}>
                                ✕
                            </button>
                        </div>
                        {/* Image — fixed height so it fills predictably */}
                        <div className="udv-preview-body">
                            <img
                                src={previewDoc.fileUrl}
                                alt={previewDoc.fileName}
                                className="udv-preview-img"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UploadedDocumentsView;
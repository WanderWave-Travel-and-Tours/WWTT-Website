import { useState, useEffect } from 'react';
import axios from 'axios';
import './UserDashboard.css';

const UserDashboard = ({ user, onLogout }) => {
    const [inquiries, setInquiries] = useState([]);
    const [selectedInquiry, setSelectedInquiry] = useState(null);
    const [uploadedFiles, setUploadedFiles] = useState({});
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [visaDetails, setVisaDetails] = useState(null);

    useEffect(() => {
        const fetchInquiries = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`http://localhost:5000/api/inquiries/email/${user.email}`);
                const data = await response.json();

                if (data.success) {
                    console.log('✅ Inquiries loaded:', data.data);
                    setInquiries(data.data);
                } else {
                    console.error('Failed to fetch inquiries:', data.message);
                }
            } catch (error) {
                console.error('Error fetching inquiries:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user?.email) {
            fetchInquiries();
        }
    }, [user]);

    useEffect(() => {
        const fetchVisaDetails = async () => {
            if (selectedInquiry?.visaId) {
                try {
                    const response = await axios.get(`http://localhost:5000/api/visas/${selectedInquiry.visaId}`);
                    if (response.data) {
                        console.log('✅ Visa details loaded:', response.data);
                        setVisaDetails(response.data);
                    }
                } catch (error) {
                    console.error('Error fetching visa details:', error);
                    setVisaDetails(null);
                }
            } else {
                setVisaDetails(null);
            }
        };

        fetchVisaDetails();
    }, [selectedInquiry]);

    const handlePayment = async () => {
        if (!selectedInquiry) return;

        try {
            setIsLoading(true);
            const response = await fetch('http://localhost:5000/api/payment/create-inquiry-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inquiryId: selectedInquiry._id })
            });

            const data = await response.json();

            if (data.success && data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            } else {
                alert('Failed to initiate payment. Please try again.');
            }
        } catch (error) {
            console.error('Payment Error:', error);
            alert('Payment system is currently unavailable.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileSelect = (e, section) => {
        const files = Array.from(e.target.files);
        handleFiles(files, section);
    };

    const handleFiles = async (files, section) => {
        setIsUploading(true);
        
        for (let i = 0; i <= 100; i += 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
            setUploadProgress(i);
        }

        const newFiles = files.map(file => ({
            id: Date.now() + Math.random(),
            name: file.name,
            size: (file.size / 1024).toFixed(2) + ' KB',
            type: file.type,
            uploadDate: new Date().toLocaleDateString(),
            file: file,
            section: section // ✅ Track which section this file belongs to
        }));

        setUploadedFiles(prev => ({
            ...prev,
            [section]: [...(prev[section] || []), ...newFiles]
        }));
        
        setIsUploading(false);
        setUploadProgress(0);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e, section) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files, section);
    };

    const removeFile = (section, fileId) => {
        setUploadedFiles(prev => ({
            ...prev,
            [section]: prev[section].filter(f => f.id !== fileId)
        }));
    };

    const submitDocuments = async () => {
        if (!selectedInquiry) {
            alert('Please select an inquiry first');
            return;
        }

        const allFiles = Object.values(uploadedFiles).flat();
        
        if (allFiles.length === 0) {
            alert('Please upload at least one document');
            return;
        }

        const formData = new FormData();
        formData.append('inquiryId', selectedInquiry._id);
        formData.append('userId', user._id);
        
        allFiles.forEach((fileObj) => {
            formData.append(`documents`, fileObj.file);
            formData.append(`sections`, fileObj.section);
        });

        try {
            const response = await fetch('http://localhost:5000/api/documents/upload', {
                 method: 'POST',
                 body: formData
            });
            
            const data = await response.json();
            alert('Documents submitted successfully! Our team will review them soon.');
            setUploadedFiles({});
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to submit documents. Please try again.');
        }
    };

    const getStatusClass = (status) => {
        switch (status?.toUpperCase()) {
            case 'PENDING': return 'status-pending';
            case 'CONTACTED': return 'status-contacted';
            case 'PAYMENT_PENDING': return 'status-contacted'; // Same orange/warning color or create new css class
            case 'PAID': return 'status-completed'; // Green
            case 'COMPLETED': return 'status-completed';
            case 'CANCELLED': return 'status-cancelled';
            default: return 'status-pending';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // ✅ Get required document sections based on service type
    const getRequiredDocumentSections = () => {
        // If it's a visa inquiry and we have visa details
        if (visaDetails && visaDetails.requirements) {
            return visaDetails.requirements.map(req => ({
                title: req.title,
                items: req.items || []
            }));
        }
        
        // Default sections for non-visa services
        return [
            {
                title: 'Required Documents',
                items: ['Valid ID', 'Passport Photo', 'Proof of Address']
            }
        ];
    };

    return (
        <div className="user-dashboard">
            <header className="dashboard-header">
                <div className="header-content">
                    <div className="logo-section">
                        <img
                            src="https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911894edaa4e3fb6cfb8afe.png"
                            alt="WanderWave Logo"
                            className="header-logo"
                        />
                        <span className="header-title">WanderWave</span>
                    </div>
                    <div className="user-section">
                        <div className="user-info">
                            <span className="user-name">{user?.fullName}</span>
                            <span className="user-email">{user?.email}</span>
                        </div>
                        <button onClick={onLogout} className="logout-btn">
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="dashboard-container">
                <aside className="sidebar">
                    <h2 className="sidebar-title">My Travel Inquiries</h2>
                    <div className="inquiries-list">
                        {isLoading ? (
                            <div className="loading-state">
                                <p>Loading your inquiries...</p>
                            </div>
                        ) : inquiries.length === 0 ? (
                            <div className="empty-state">
                                <p>No inquiries yet</p>
                                <p className="empty-hint">
                                    Submit an inquiry on our website to get started!
                                </p>
                            </div>
                        ) : (
                            inquiries.map(inquiry => (
                                <div
                                    key={inquiry._id}
                                    className={`inquiry-card ${selectedInquiry?._id === inquiry._id ? 'selected' : ''}`}
                                    onClick={() => setSelectedInquiry(inquiry)}
                                >
                                    <h3 className="inquiry-destination">{inquiry.serviceName}</h3>
                                    {inquiry.visaCountry && (
                                        <p className="inquiry-country">
                                            📍 {inquiry.visaCountry}
                                        </p>
                                    )}
                                    <p className="inquiry-date">
                                        📅 {formatDate(inquiry.createdAt)}
                                    </p>
                                    <span className={`inquiry-status ${getStatusClass(inquiry.status)}`}>
                                        {inquiry.status || 'PENDING'}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </aside>

                <main className="main-content">
                    {selectedInquiry ? (
                        <>
                            <div className="content-header">
                                <h1 className="content-title">Inquiry Details</h1>
                                <p className="content-subtitle">
                                    Service: {selectedInquiry.serviceName}
                                </p>
                            </div>

                            <div className="inquiry-details-card">
                                <div className="detail-row">
                                    <span className="detail-label">Service:</span>
                                    <span className="detail-value">{selectedInquiry.serviceName}</span>
                                </div>
                                {selectedInquiry.visaCountry && (
                                    <div className="detail-row">
                                        <span className="detail-label">Country:</span>
                                        <span className="detail-value">{selectedInquiry.visaCountry}</span>
                                    </div>
                                )}
                                {selectedInquiry.estimatedPrice > 0 && (
                                    <div className="detail-row">
                                        <span className="detail-label">Estimated Price:</span>
                                        <span className="detail-value">₱{selectedInquiry.estimatedPrice.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="detail-row">
                                    <span className="detail-label">Status:</span>
                                    <span className={`detail-value ${getStatusClass(selectedInquiry.status)}`}>
                                        {selectedInquiry.status || 'PENDING'}
                                    </span>
                                </div>
                                {selectedInquiry.status === 'PAYMENT_PENDING' && (
                                    <div style={{
                                        marginTop: '20px',
                                        padding: '20px',
                                        background: '#ecfdf5',
                                        border: '1px solid #10b981',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px'
                                    }}>
                                        <h4 style={{ margin: 0, color: '#047857', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            💳 Payment Required
                                        </h4>
                                        <p style={{ margin: 0, fontSize: '14px', color: '#065f46' }}>
                                            Your documents have been approved! Please settle the payment to proceed with the visa application.
                                        </p>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                            <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#0f172a' }}>
                                                Total: ₱{selectedInquiry.estimatedPrice?.toLocaleString()}
                                            </span>
                                            <button 
                                                onClick={handlePayment}
                                                style={{
                                                    background: '#059669',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '12px 24px',
                                                    borderRadius: '6px',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    transition: 'background 0.2s'
                                                }}
                                                onMouseOver={(e) => e.target.style.background = '#047857'}
                                                onMouseOut={(e) => e.target.style.background = '#059669'}
                                            >
                                                Pay Now via PayMongo
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {selectedInquiry.remarks && 
                                selectedInquiry.status !== 'PAYMENT_PENDING' && 
                                selectedInquiry.status !== 'PAID' && 
                                selectedInquiry.status !== 'COMPLETED' && (
                                    <div className="remarks-section" style={{ 
                                        marginTop: '20px', 
                                        padding: '15px', 
                                        backgroundColor: '#fff1f2', 
                                        border: '1px solid #fda4af',
                                        borderRadius: '8px'
                                    }}>
                                        <h4 style={{ color: '#be123c', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            ⚠️ Action Required / Admin Remarks
                                        </h4>
                                        <p style={{ color: '#881337', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                                            {selectedInquiry.remarks}
                                        </p>
                                        
                                        {selectedInquiry.evidenceUrl && (
                                            <div style={{ marginTop: '10px' }}>
                                                <p style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>Evidence/Screenshot:</p>
                                                <a 
                                                    href={`http://localhost:5000${selectedInquiry.evidenceUrl}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    style={{ 
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '5px',
                                                        color: '#be123c',
                                                        textDecoration: 'underline',
                                                        fontSize: '13px'
                                                    }}
                                                >
                                                    📄 View Evidence ({selectedInquiry.evidenceName || 'File'})
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="detail-row">
                                    <span className="detail-label">Submitted:</span>
                                    <span className="detail-value">{formatDate(selectedInquiry.createdAt)}</span>
                                </div>
                                <div className="detail-row detail-message">
                                    <span className="detail-label">Your Message:</span>
                                    <span className="detail-value">{selectedInquiry.message}</span>
                                </div>
                            </div>

                            {/* ✅ DYNAMIC DOCUMENT UPLOAD SECTIONS */}
                            <div className="content-header" style={{ marginTop: '30px' }}>
                                <h2 className="content-title">Upload Required Documents</h2>
                                <p className="content-subtitle">
                                    Please upload all required documents for your {selectedInquiry.serviceName} application
                                </p>
                            </div>

                            {/* ✅ RENDER SECTIONS DYNAMICALLY */}
                            {getRequiredDocumentSections().map((section, sectionIndex) => (
                                <div key={sectionIndex} className="document-section">
                                    <div className="document-section-header">
                                        <h3 className="document-section-title">
                                            📁 {section.title}
                                        </h3>
                                        <span className="document-section-count">
                                            {section.items.length} items required
                                        </span>
                                    </div>

                                    {/* Required Items List */}
                                    <div className="required-items-list">
                                        {section.items.map((item, itemIndex) => (
                                            <div key={itemIndex} className="required-item">
                                                <span className="required-item-icon">✓</span>
                                                <span className="required-item-text">{item}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Upload Area for this Section */}
                                    <div
                                        className={`upload-area ${isDragging ? 'dragging' : ''}`}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, section.title)}
                                    >
                                        <div className="upload-content">
                                            <div className="upload-icon">📁</div>
                                            <h3>Drag & Drop Files Here</h3>
                                            <p>or</p>
                                            <label className="browse-btn">
                                                Browse Files
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*,.pdf,.doc,.docx"
                                                    onChange={(e) => handleFileSelect(e, section.title)}
                                                    style={{ display: 'none' }}
                                                />
                                            </label>
                                            <p className="upload-hint">
                                                Supported: JPG, PNG, PDF, DOC (Max 10MB each)
                                            </p>
                                        </div>
                                    </div>

                                    {/* Show uploaded files for this section */}
                                    {uploadedFiles[section.title] && uploadedFiles[section.title].length > 0 && (
                                        <div className="section-uploaded-files">
                                            <h4 className="section-files-title">
                                                Uploaded Files ({uploadedFiles[section.title].length})
                                            </h4>
                                            <div className="files-grid-section">
                                                {uploadedFiles[section.title].map(file => (
                                                    <div key={file.id} className="file-card">
                                                        <div className="file-icon">
                                                            {file.type.includes('image') ? '🖼️' : '📄'}
                                                        </div>
                                                        <div className="file-info">
                                                            <p className="file-name">{file.name}</p>
                                                            <p className="file-meta">
                                                                {file.size} • {file.uploadDate}
                                                            </p>
                                                        </div>
                                                        <button
                                                            className="remove-file-btn"
                                                            onClick={() => removeFile(section.title, file.id)}
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isUploading && (
                                <div className="upload-progress">
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill" 
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                    <p className="progress-text">Uploading... {uploadProgress}%</p>
                                </div>
                            )}

                            {/* Submit All Documents Button */}
                            {Object.values(uploadedFiles).flat().length > 0 && (
                                <div className="submit-section">
                                    <div className="submit-summary">
                                        <span className="submit-summary-text">
                                            Total files to submit: {Object.values(uploadedFiles).flat().length}
                                        </span>
                                    </div>
                                    <button className="submit-docs-btn" onClick={submitDocuments}>
                                        Submit All Documents
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="no-selection">
                            <div className="no-selection-icon">📋</div>
                            <h2>Select an Inquiry</h2>
                            <p>Choose an inquiry from the left to view details and upload documents</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default UserDashboard;
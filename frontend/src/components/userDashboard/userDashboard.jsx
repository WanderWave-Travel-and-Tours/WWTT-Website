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
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // For responsive menu

    useEffect(() => {
        const fetchInquiries = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`http://localhost:5000/api/inquiries/email/${user.email}`);
                const data = await response.json();

                if (data.success) {
                    console.log('✅ Inquiries loaded:', data.data);
                    setInquiries(data.data);
                    // Select first inquiry by default if available
                    if (data.data.length > 0 && !selectedInquiry) {
                        setSelectedInquiry(data.data[0]);
                    }
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
    }, [user, selectedInquiry]);

    useEffect(() => {
        const fetchVisaDetails = async () => {
            if (selectedInquiry?.visaId) {
                try {
                    const response = await axios.get(`http://localhost:5000/api/visas/${selectedInquiry.visaId}`);
                    if (response.data) {
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
        
        for (let i = 0; i <= 100; i += 20) {
            await new Promise(resolve => setTimeout(resolve, 50));
            setUploadProgress(i);
        }

        const newFiles = files.map(file => ({
            id: Date.now() + Math.random(),
            name: file.name,
            size: (file.size / 1024).toFixed(2) + ' KB',
            type: file.type,
            uploadDate: new Date().toLocaleDateString(),
            file: file,
            section: section 
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
            case 'PENDING': return 'badge-pending';
            case 'CONTACTED': return 'badge-contacted';
            case 'PAYMENT_PENDING': return 'badge-payment'; 
            case 'PAID': return 'badge-paid'; 
            case 'COMPLETED': return 'badge-completed';
            case 'CANCELLED': return 'badge-cancelled';
            default: return 'badge-default';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getRequiredDocumentSections = () => {
        if (visaDetails && visaDetails.requirements) {
            return visaDetails.requirements.map(req => ({
                title: req.title,
                items: req.items || []
            }));
        }
        return [
            {
                title: 'General Requirements',
                items: ['Valid ID (Passport/Driver\'s License)', 'Recent Photo', 'Proof of Address']
            }
        ];
    };

    // SVG Icons
    const Icons = {
        Dashboard: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
        Upload: () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>,
        File: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>,
        Image: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>,
        Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
        Close: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
        Menu: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>,
        User: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
    };

    return (
        <div className="dashboard-wrapper">
            {/* Header / Navbar */}
            <nav className="dashboard-navbar">
                <div className="navbar-brand">
                    <img
                        src="https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911894edaa4e3fb6cfb8afe.png"
                        alt="WanderWave"
                        className="navbar-logo"
                    />
                    <span className="navbar-title">WanderWave</span>
                </div>
                
                <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    <Icons.Menu />
                </button>

                <div className={`navbar-actions ${mobileMenuOpen ? 'show' : ''}`}>
                    <div className="user-profile">
                        <div className="avatar">
                            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="user-details">
                            <span className="name">{user?.fullName || 'User'}</span>
                            <span className="email">{user?.email || 'guest@example.com'}</span>
                        </div>
                    </div>
                    <button onClick={onLogout} className="btn-logout">
                        Sign Out
                    </button>
                </div>
            </nav>

            <div className="dashboard-layout">
                {/* Sidebar - Inquiries List */}
                <aside className={`dashboard-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
                    <div className="sidebar-header">
                        <h3><Icons.Dashboard /> My Applications</h3>
                    </div>
                    
                    <div className="inquiries-list-container">
                        {isLoading ? (
                            <div className="sidebar-loading">
                                <div className="spinner"></div>
                                <p>Loading applications...</p>
                            </div>
                        ) : inquiries.length === 0 ? (
                            <div className="sidebar-empty">
                                <p>No active applications found.</p>
                                <button className="btn-link">Start a New Inquiry</button>
                            </div>
                        ) : (
                            inquiries.map(inquiry => (
                                <div
                                    key={inquiry._id}
                                    className={`inquiry-item ${selectedInquiry?._id === inquiry._id ? 'active' : ''}`}
                                    onClick={() => {
                                        setSelectedInquiry(inquiry);
                                        setMobileMenuOpen(false); // Close mobile menu on select
                                    }}
                                >
                                    <div className="inquiry-item-header">
                                        <span className="service-name">{inquiry.serviceName}</span>
                                        <span className={`status-dot ${getStatusClass(inquiry.status)}`}></span>
                                    </div>
                                    <div className="inquiry-item-meta">
                                        <span className="meta-location">{inquiry.visaCountry || 'General'}</span>
                                        <span className="meta-date">{formatDate(inquiry.createdAt)}</span>
                                    </div>
                                    <span className={`status-badge ${getStatusClass(inquiry.status)}`}>
                                        {inquiry.status?.replace('_', ' ') || 'PENDING'}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="dashboard-main">
                    {selectedInquiry ? (
                        <div className="content-containers">
                            {/* Header Section */}
                            <header className="content-header">
                                <div>
                                    <h1 className="content-title">{selectedInquiry.serviceName}</h1>
                                    <p className="content-id">Application ID: {selectedInquiry._id.slice(-8).toUpperCase()}</p>
                                </div>
                                <div className={`header-status ${getStatusClass(selectedInquiry.status)}`}>
                                    {selectedInquiry.status?.replace('_', ' ') || 'PENDING'}
                                </div>
                            </header>

                            {/* Details Grid */}
                            <div className="details-grid">
                                <div className="info-card">
                                    <h3>Application Details</h3>
                                    <div className="info-row">
                                        <span className="label">Destination</span>
                                        <span className="value">{selectedInquiry.visaCountry || 'N/A'}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="label">Submission Date</span>
                                        <span className="value">{formatDate(selectedInquiry.createdAt)}</span>
                                    </div>
                                    {selectedInquiry.estimatedPrice > 0 && (
                                        <div className="info-row highlight">
                                            <span className="label">Total Amount</span>
                                            <span className="value price">₱{selectedInquiry.estimatedPrice.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="info-row message-row">
                                        <span className="label">Your Message</span>
                                        <p className="value message">{selectedInquiry.message || 'No additional notes provided.'}</p>
                                    </div>
                                </div>

                                {/* Action / Remarks Card */}
                                <div className="info-card action-card">
                                    <h3>Status & Actions</h3>
                                    
                                    {selectedInquiry.remarks && (
                                        <div className="remarks-box">
                                            <h4><span className="icon">💬</span> Admin Remarks</h4>
                                            <p>{selectedInquiry.remarks}</p>
                                            {selectedInquiry.evidenceUrl && (
                                                <a href={`http://localhost:5000${selectedInquiry.evidenceUrl}`} target="_blank" rel="noopener noreferrer" className="evidence-link">
                                                    View Attached Evidence ↗
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {selectedInquiry.status === 'PAYMENT_PENDING' && (
                                        <div className="payment-alert">
                                            <div className="alert-content">
                                                <h4>Payment Required</h4>
                                                <p>Your application has been approved. Please settle the payment to proceed.</p>
                                            </div>
                                            <button onClick={handlePayment} className="btn-primary btn-pay">
                                                Pay Now (₱{selectedInquiry.estimatedPrice?.toLocaleString()})
                                            </button>
                                        </div>
                                    )}

                                    {selectedInquiry.status === 'PENDING' && !selectedInquiry.remarks && (
                                        <div className="empty-action">
                                            <p>Your application is currently under review. We will notify you once an update is available.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Document Upload Section */}
                            <section className="documents-section">
                                <div className="section-header">
                                    <h2>Required Documents</h2>
                                    <p>Please upload clear copies of the following documents.</p>
                                </div>

                                {getRequiredDocumentSections().map((section, idx) => (
                                    <div key={idx} className="document-group">
                                        <div className="group-header">
                                            <h3>{section.title}</h3>
                                            <span className="badge-count">{section.items.length} items</span>
                                        </div>

                                        <div className="requirements-list">
                                            {section.items.map((item, i) => (
                                                <div key={i} className="req-item">
                                                    <span className="check-icon"><Icons.Check /></span>
                                                    <span>{item}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Upload Area */}
                                        <div 
                                            className={`dropzone ${isDragging ? 'active' : ''}`}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, section.title)}
                                        >
                                            <div className="dropzone-content">
                                                <div className="icon-wrapper"><Icons.Upload /></div>
                                                <div className="text-wrapper">
                                                    <h4>Drag & drop files here</h4>
                                                    <p>or <label className="browse-trigger">browse files<input type="file" multiple onChange={(e) => handleFileSelect(e, section.title)} hidden /></label></p>
                                                    <span className="support-text">Supported: PDF, JPG, PNG (Max 10MB)</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Uploaded Files List */}
                                        {uploadedFiles[section.title] && uploadedFiles[section.title].length > 0 && (
                                            <div className="uploaded-files-list">
                                                {uploadedFiles[section.title].map(file => (
                                                    <div key={file.id} className="file-item">
                                                        <div className="file-icon-wrapper">
                                                            {file.type.includes('image') ? <Icons.Image /> : <Icons.File />}
                                                        </div>
                                                        <div className="file-details">
                                                            <span className="file-name">{file.name}</span>
                                                            <span className="file-size">{file.size}</span>
                                                        </div>
                                                        <button className="btn-remove" onClick={() => removeFile(section.title, file.id)}>
                                                            <Icons.Close />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {isUploading && (
                                    <div className="progress-container">
                                        <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                                    </div>
                                )}

                                {Object.values(uploadedFiles).flat().length > 0 && (
                                    <div className="submit-area">
                                        <button className="btn-primary btn-submit" onClick={submitDocuments}>
                                            Submit All Documents
                                        </button>
                                        <p className="submit-hint">Make sure all documents are clear before submitting.</p>
                                    </div>
                                )}
                            </section>
                        </div>
                    ) : (
                        <div className="empty-dashboard">
                            <div className="empty-content">
                                <div className="empty-icon">👋</div>
                                <h2>Welcome, {user?.fullName?.split(' ')[0]}!</h2>
                                <p>Select an application from the sidebar to view details, track status, and upload documents.</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default UserDashboard;
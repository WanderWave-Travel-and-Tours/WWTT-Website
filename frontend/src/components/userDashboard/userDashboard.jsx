import { useState, useEffect } from 'react';
import './UserDashboard.css';

const UserDashboard = ({ user, onLogout }) => {
    const [inquiries, setInquiries] = useState([]);
    const [selectedInquiry, setSelectedInquiry] = useState(null);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        const sampleInquiries = [
            {
                id: 1,
                destination: 'Boracay',
                travelDate: '2025-03-15',
                status: 'Pending Documents',
                requiredDocs: ['Valid ID', 'Passport Photo', 'Travel Insurance']
            },
            {
                id: 2,
                destination: 'Palawan',
                travelDate: '2025-04-20',
                status: 'Confirmed',
                requiredDocs: ['Valid ID', 'Medical Certificate']
            }
        ];
        setInquiries(sampleInquiries);
    }, []);

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        handleFiles(files);
    };

    const handleFiles = async (files) => {
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
            file: file
        }));

        setUploadedFiles([...uploadedFiles, ...newFiles]);
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

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    };

    const removeFile = (fileId) => {
        setUploadedFiles(uploadedFiles.filter(f => f.id !== fileId));
    };

    const submitDocuments = async () => {
        if (!selectedInquiry) {
            alert('Please select an inquiry first');
            return;
        }

        if (uploadedFiles.length === 0) {
            alert('Please upload at least one document');
            return;
        }

        const formData = new FormData();
        formData.append('inquiryId', selectedInquiry.id);
        formData.append('userId', user._id);
        
        uploadedFiles.forEach((fileObj, index) => {
            formData.append(`documents`, fileObj.file);
        });

        try {
            const response = await fetch('http://localhost:5000/api/documents/upload', {
                 method: 'POST',
                 body: formData
            });
            
            const data = await response.json();
            alert('Documents submitted successfully! Our team will review them soon.');
            setUploadedFiles([]);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to submit documents. Please try again.');
        }
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
                        {inquiries.length === 0 ? (
                            <div className="empty-state">
                                <p>No inquiries yet</p>
                                <button className="create-inquiry-btn">Create New Inquiry</button>
                            </div>
                        ) : (
                            inquiries.map(inquiry => (
                                <div
                                    key={inquiry.id}
                                    className={`inquiry-card ${selectedInquiry?.id === inquiry.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedInquiry(inquiry)}
                                >
                                    <h3 className="inquiry-destination">{inquiry.destination}</h3>
                                    <p className="inquiry-date">
                                        📅 {new Date(inquiry.travelDate).toLocaleDateString('en-US', {
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </p>
                                    <span className={`inquiry-status ${inquiry.status.toLowerCase().replace(' ', '-')}`}>
                                        {inquiry.status}
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
                                <h1 className="content-title">Upload Documents</h1>
                                <p className="content-subtitle">
                                    Upload required documents for your {selectedInquiry.destination} trip
                                </p>
                            </div>

                            <div className="required-docs-section">
                                <h3>Required Documents:</h3>
                                <ul className="required-docs-list">
                                    {selectedInquiry.requiredDocs.map((doc, index) => (
                                        <li key={index} className="required-doc-item">
                                            <span className="doc-icon">📄</span>
                                            {doc}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div
                                className={`upload-area ${isDragging ? 'dragging' : ''}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
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
                                            onChange={handleFileSelect}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                    <p className="upload-hint">
                                        Supported: JPG, PNG, PDF, DOC (Max 10MB each)
                                    </p>
                                </div>
                            </div>

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

                            {uploadedFiles.length > 0 && (
                                <div className="uploaded-files-section">
                                    <h3>Uploaded Files ({uploadedFiles.length})</h3>
                                    <div className="files-grid">
                                        {uploadedFiles.map(file => (
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
                                                    onClick={() => removeFile(file.id)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="submit-docs-btn" onClick={submitDocuments}>
                                        Submit Documents
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="no-selection">
                            <div className="no-selection-icon">📋</div>
                            <h2>Select an Inquiry</h2>
                            <p>Choose an inquiry from the left to upload documents</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default UserDashboard;
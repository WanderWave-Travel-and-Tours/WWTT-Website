import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './userDashboard.css'; 
import TopNavbar from './TopNavbar';
import Sidebar from './Sidebar';
import ApplicationDetails from './ApplicationDetails';
import * as Icons from './Icons'; 

const UserDashboard = ({ user, onLogout }) => {
    // --- State ---
    const [inquiries, setInquiries] = useState([]);
    const [selectedInquiry, setSelectedInquiry] = useState(null);
    const [visaDetails, setVisaDetails] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    // --- HISTORY TRACKING (Critical for Sidebar Logic) ---
    const [viewedHistory, setViewedHistory] = useState({});

    // File Upload State
    const [uploadedFiles, setUploadedFiles] = useState({});
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Load User & Viewed History
    useEffect(() => {
        if (user) {
            localStorage.setItem('wanderwave_user', JSON.stringify(user));
        }
        // Load history form local storage
        const storedHistory = JSON.parse(localStorage.getItem('wanderwave_viewed_history') || '{}');
        setViewedHistory(storedHistory);
    }, [user]);

    // --- HELPER: Update History State ---
    const updateHistory = (inquiryId, updates) => {
        const currentRecord = viewedHistory[inquiryId] || {};
        const newRecord = { 
            ...currentRecord, 
            ...updates,
            lastViewed: new Date().toISOString() 
        };

        const newHistory = { ...viewedHistory, [inquiryId]: newRecord };
        setViewedHistory(newHistory);
        localStorage.setItem('wanderwave_viewed_history', JSON.stringify(newHistory));
    };

    // --- HELPER: FETCH INQUIRIES ---
    const fetchInquiries = async () => {
        if (!user?.email) return;

        try {
            const response = await fetch(`http://localhost:5000/api/inquiries/email/${user.email}`);
            const data = await response.json();
            
            if (data.success) {
                setInquiries(data.data);
                // Keep selected inquiry in sync with updates
                if (selectedInquiry) {
                    const updatedSelected = data.data.find(i => i._id === selectedInquiry._id);
                    if (updatedSelected) setSelectedInquiry(updatedSelected);
                }
            }
        } catch (error) {
            console.error('Error fetching inquiries:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // --- INITIAL LOAD ---
    useEffect(() => {
        if (user?.email) {
            setIsLoading(true);
            fetchInquiries();
            const interval = setInterval(fetchInquiries, 30000); // Auto-refresh every 30s
            return () => clearInterval(interval);
        }
    }, [user]);

    // ... (Payment Verification Logic) ...
    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const isSuccess = queryParams.get('success');
        const inquiryId = queryParams.get('inquiryId');

        if (isSuccess === 'true' && inquiryId) {
            const verifyPayment = async () => {
                try {
                    setIsLoading(true);
                    await axios.put(`http://localhost:5000/api/inquiries/${inquiryId}/pay`);
                    alert('Payment successful! Status updated.');
                    window.history.replaceState({}, document.title, window.location.pathname);
                    await fetchInquiries();
                } catch (error) {
                    console.error('Payment verification failed:', error);
                } finally {
                    setIsLoading(false);
                }
            };
            verifyPayment();
        }
    }, []);

    // ... (Visa Details Fetcher) ...
    useEffect(() => {
        const fetchVisaDetails = async () => {
            if (selectedInquiry?.visaId) {
                try {
                    const response = await axios.get(`http://localhost:5000/api/visas/${selectedInquiry.visaId}`);
                    if (response.data) setVisaDetails(response.data);
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

    // --- HANDLERS ---
    const handleSelectInquiry = (inquiry) => {
        setSelectedInquiry(inquiry);
        setMobileMenuOpen(false); 
        
        // Mark as "Seen" (adds to local history but doesn't complete it yet)
        if (inquiry.status !== 'COMPLETED') {
            updateHistory(inquiry._id, { status: inquiry.status });
        }
    };

    // --- ACTION: Handle Download (MOVES TO HISTORY) ---
    const handleDownloadAction = (inquiryId) => {
        // This sets 'downloaded: true'. 
        // Sidebar checks this flag. If COMPLETED + DOWNLOADED = HISTORY.
        updateHistory(inquiryId, { downloaded: true, status: 'COMPLETED' });
    };

    const handleLogout = () => {
        localStorage.removeItem('wanderwave_user');
        if (onLogout) onLogout();
    };

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
                alert('Failed to initiate payment.');
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Payment error:', error);
            setIsLoading(false);
        }
    };

    // --- File Handling ---
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
            file: file,
            section: section 
        }));
        setUploadedFiles(prev => ({ ...prev, [section]: [...(prev[section] || []), ...newFiles] }));
        setIsUploading(false);
        setUploadProgress(0);
    };

    const handleFileSelect = (e, section) => { handleFiles(Array.from(e.target.files), section); };
    const handleDrop = (e, section) => { e.preventDefault(); handleFiles(Array.from(e.dataTransfer.files), section); };
    const removeFile = (section, fileId) => {
        setUploadedFiles(prev => ({ ...prev, [section]: prev[section].filter(f => f.id !== fileId) }));
    };

    const submitDocuments = async () => {
        if (!selectedInquiry) return alert('Please select an inquiry');
        const allFiles = Object.values(uploadedFiles).flat();
        if (allFiles.length === 0) return alert('Please upload at least one document');

        const formData = new FormData();
        formData.append('inquiryId', selectedInquiry._id);
        formData.append('userId', user._id);
        allFiles.forEach((fileObj) => {
            formData.append(`documents`, fileObj.file);
            formData.append(`sections`, fileObj.section);
        });

        try {
            await fetch('http://localhost:5000/api/documents/upload', { method: 'POST', body: formData });
            alert('Documents submitted successfully!');
            setUploadedFiles({});
            fetchInquiries(); 
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to submit documents.');
        }
    };

    return (
        <div className="ud-wrapper">
            <TopNavbar 
                user={user} 
                onLogout={handleLogout}
                mobileMenuOpen={mobileMenuOpen} 
                setMobileMenuOpen={setMobileMenuOpen} 
            />
            
            <div className="ud-layout-body">
                <Sidebar 
                    inquiries={inquiries} 
                    selectedInquiry={selectedInquiry} 
                    onSelectInquiry={handleSelectInquiry} 
                    mobileMenuOpen={mobileMenuOpen} 
                    isLoading={isLoading}
                    // Pass viewedHistory so Sidebar knows what has been downloaded
                    userInteractions={viewedHistory} 
                />

                <main className="ud-main-content">
                    {selectedInquiry ? (
                        <ApplicationDetails 
                            inquiry={selectedInquiry}
                            visaDetails={visaDetails}
                            handlePayment={handlePayment}
                            uploadedFiles={uploadedFiles}
                            handleFileSelect={handleFileSelect}
                            handleDrop={handleDrop}
                            removeFile={removeFile}
                            submitDocuments={submitDocuments}
                            isUploading={isUploading}
                            uploadProgress={uploadProgress}
                            // Pass the trigger to Details
                            onDownloadComplete={handleDownloadAction}
                        />
                    ) : (
                        <div className="ud-welcome-state">
                            <div className="ud-welcome-icon">
                                <Icons.Plane />
                            </div>
                            <h2>Welcome, {user?.fullName?.split(' ')[0]}!</h2>
                            <p>Select an application to view details.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default UserDashboard;
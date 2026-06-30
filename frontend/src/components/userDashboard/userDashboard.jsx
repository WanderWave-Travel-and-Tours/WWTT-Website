import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './userDashboard.css'; 
import TopNavbar from './TopNavbar';
import Sidebar from './Sidebar';
import ApplicationDetails from './ApplicationDetails';
import AccountSettings from './AccountSettings'; 
import * as Icons from './Icons'; 
import { ToastProvider, useToast } from '../toast/ToastManager';
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal';
import WanderLoader from '../loading/WanderLoader';
import { getAuthHeaders } from '../../utils/authHeaders';

// ─────────────────────────────────────────────────────────────
// Inner component — must be inside ToastProvider to use useToast
// ─────────────────────────────────────────────────────────────
const UserDashboardInner = ({ user, onLogout }) => {
    const toast = useToast();

    // --- State ---
    const [inquiries, setInquiries] = useState([]);
    const [selectedInquiry, setSelectedInquiry] = useState(null);
    const [visaDetails, setVisaDetails] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [currentView, setCurrentView] = useState('applications'); 
    const [viewedHistory, setViewedHistory] = useState({});

    // NEW: State for uploaded documents
    const [uploadedDocuments, setUploadedDocuments] = useState([]);
    const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);

    // File Upload State (for new uploads)
    const [uploadedFiles, setUploadedFiles] = useState({});
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // ── Confirm Modal State ──────────────────────────────────────
    const [confirmModal, setConfirmModal] = useState({
        isOpen:   false,
        title:    '',
        message:  '',
        type:     'primary',
        onConfirm: null,
    });

    const showConfirm = ({ title, message, type = 'primary', onConfirm }) => {
        setConfirmModal({ isOpen: true, title, message, type, onConfirm });
    };

    const closeConfirm = () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false, onConfirm: null }));
    };

    // Load User & Viewed History
    useEffect(() => {
        if (user) {
            localStorage.setItem('wanderwave_user', JSON.stringify(user));
        }
        const storedHistory = JSON.parse(localStorage.getItem('wanderwave_viewed_history') || '{}');
        setViewedHistory(storedHistory);
    }, [user]);

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

    const fetchUserData = async (showLoader = false) => {
        // FIX: If user or email is missing, stop loading immediately to avoid blank page
        if (!user || !user.email) {
            setIsLoading(false);
            return;
        }

        // Only show the WanderLoader on the very first load, not on background refreshes
        if (showLoader) setIsLoading(true);

        try {
            // ── Fire all 5 requests in parallel — no artificial delays ──
            const [
                inquiriesRes,
                bookingsRes,
                tourBookingsRes,
                transferBookingsRes,
                customizedBookingsRes,
            ] = await Promise.allSettled([
                fetch(`https://wanderwaveph.onrender.com/api/inquiries/email/${user.email}`).then(r => r.json()),
                fetch(`https://wanderwaveph.onrender.com/api/bookings/user/${user.email}`, { headers: getAuthHeaders() }).then(r => r.json()),
                fetch(`https://wanderwaveph.onrender.com/api/tour-bookings?email=${user.email}`, { headers: getAuthHeaders() }).then(r => r.json()),
                fetch(`https://wanderwaveph.onrender.com/api/transfer-bookings?email=${user.email}`, { headers: getAuthHeaders() }).then(r => r.json()),
                fetch(`https://wanderwaveph.onrender.com/api/customized-bookings?email=${user.email}`, { headers: getAuthHeaders() }).then(r => r.json()),
            ]);

            // Safely unwrap — a rejected/failed call returns null so it's skipped below
            const inquiriesData        = inquiriesRes.status        === 'fulfilled' ? inquiriesRes.value        : null;
            const bookingsData         = bookingsRes.status         === 'fulfilled' ? bookingsRes.value         : null;
            const tourBookingsData     = tourBookingsRes.status     === 'fulfilled' ? tourBookingsRes.value     : null;
            const transferBookingsData = transferBookingsRes.status === 'fulfilled' ? transferBookingsRes.value : null;
            const customizedBookingsData = customizedBookingsRes.status === 'fulfilled' ? customizedBookingsRes.value : null;

            let combinedData = [];

            if (inquiriesData.success) {
                combinedData = [...combinedData, ...inquiriesData.data];
            }

            if (bookingsData.success) {
                const formattedBookings = bookingsData.data.map(booking => ({
                    ...booking,
                    serviceName: booking.packageName, 
                    inquiryType: 'BOOKING',
                    bookingType: 'package',
                    status: booking.status ? booking.status.toUpperCase() : 'PENDING', 
                    estimatedPrice: booking.totalAmount, 
                    message: booking.message || `Booking for ${booking.packageName}`
                }));
                combinedData = [...combinedData, ...formattedBookings];
            }

            if (tourBookingsData.success) {
                const formattedTourBookings = tourBookingsData.data.map(booking => ({
                    ...booking,
                    serviceName: booking.packageName,
                    inquiryType: 'BOOKING',
                    bookingType: 'tour',
                    status: booking.status ? booking.status.toUpperCase() : 'PENDING',
                    estimatedPrice: booking.totalAmount,
                    message: booking.message || `Tour Booking for ${booking.packageName}`
                }));
                combinedData = [...combinedData, ...formattedTourBookings];
            }

            // ── Format & merge transfer bookings ─────────────────────
            if (transferBookingsData.success) {
                const formattedTransferBookings = transferBookingsData.data.map(booking => ({
                    ...booking,
                    serviceName: booking.activityName,
                    inquiryType: 'BOOKING',
                    bookingType: 'transfer',
                    status: booking.status ? booking.status.toUpperCase() : 'PENDING',
                    estimatedPrice: booking.totalAmount,
                    message: booking.message || `Transfer Booking for ${booking.activityName}`
                }));
                combinedData = [...combinedData, ...formattedTransferBookings];
            }

            // ── NEW: Format & merge customized bookings ───────────────
            if (customizedBookingsData.success) {
                const formattedCustomizedBookings = customizedBookingsData.data.map(booking => ({
                    ...booking,
                    // serviceName shown in the sidebar card — use destination as the label
                    serviceName: booking.destination || 'Customized Booking',
                    inquiryType: 'BOOKING',
                    bookingType: 'customized',
                    status: booking.status ? booking.status.toUpperCase() : 'PENDING',
                    estimatedPrice: booking.totalAmount,
                    message: booking.message || `Customized Booking for ${booking.destination}`,
                }));
                combinedData = [...combinedData, ...formattedCustomizedBookings];
            }

            combinedData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setInquiries(combinedData);

            if (selectedInquiry) {
                const updatedSelected = combinedData.find(i => i._id === selectedInquiry._id);
                if (updatedSelected) setSelectedInquiry(updatedSelected);
            }

        } catch (error) {
        } finally {
            setIsLoading(false);
        }
    };

    // NEW: Fetch uploaded documents for selected inquiry
    const fetchUploadedDocuments = async (inquiryId) => {
        if (!inquiryId) {
            setUploadedDocuments([]);
            return;
        }

        try {
            setIsLoadingDocuments(true);
            const response = await fetch(`https://wanderwaveph.onrender.com/api/documents/inquiry/${inquiryId}`);
            const data = await response.json();
            
            if (data.success) {
                setUploadedDocuments(data.documents || []);
            } else {
                setUploadedDocuments([]);
            }
        } catch (error) {
            setUploadedDocuments([]);
        } finally {
            setIsLoadingDocuments(false);
        }
    };

    useEffect(() => {
        // FIX: Ensure logic runs correctly even if user is not fully ready initially
        // Pass showLoader=true only for the initial fetch so WanderLoader appears once
        fetchUserData(true);
        
        // Only set interval if user exists — background refreshes skip the loader
        if (user?.email) {
            const interval = setInterval(() => fetchUserData(false), 30000); 
            return () => clearInterval(interval);
        } else {
            // Safety turn off loading if no user
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const isSuccess = queryParams.get('success');
        const inquiryId = queryParams.get('inquiryId');

        if (isSuccess === 'true' && inquiryId) {
            const verifyPayment = async () => {
                try {
                    setIsLoading(true);
                    await axios.put(`https://wanderwaveph.onrender.com/api/inquiries/${inquiryId}/pay`);
                    toast.success('Your payment has been received and your status has been updated.', 'Payment Successful!');
                    window.history.replaceState({}, document.title, window.location.pathname);
                    await fetchUserData();
                } catch (error) {
                } finally {
                    setIsLoading(false);
                }
            };
            verifyPayment();
        }
    }, []);

    useEffect(() => {
        const fetchVisaDetails = async () => {
            if (selectedInquiry?.visaId) {
                try {
                    const response = await axios.get(`https://wanderwaveph.onrender.com/api/visas/${selectedInquiry.visaId}`);
                    if (response.data) setVisaDetails(response.data);
                } catch (error) {
                    setVisaDetails(null);
                }
            } else {
                setVisaDetails(null);
            }
        };
        fetchVisaDetails();
    }, [selectedInquiry]);

    // NEW: Fetch uploaded documents when inquiry changes
    useEffect(() => {
        if (selectedInquiry?._id) {
            fetchUploadedDocuments(selectedInquiry._id);
        } else {
            setUploadedDocuments([]);
        }
    }, [selectedInquiry]);

    // --- HANDLERS ---
    const handleSelectInquiry = (inquiry) => {
        setSelectedInquiry(inquiry);
        setMobileMenuOpen(false); 
        
        if (inquiry.status !== 'COMPLETED') {
            updateHistory(inquiry._id, { status: inquiry.status });
        }
    };

    const handleDownloadAction = (inquiryId) => {
        updateHistory(inquiryId, { downloaded: true, status: 'COMPLETED' });
    };

    const handleLogout = () => {
        localStorage.removeItem('wanderwave_user');
        if (onLogout) onLogout();
    };

    const handlePayment = async () => {
        if (!selectedInquiry) return;

        // Replace window.confirm with CustomConfirmModal
        showConfirm({
            title:   'Confirm Payment',
            message: `Proceed to payment for ₱${(selectedInquiry.estimatedPrice || 0).toLocaleString()}?`,
            type:    'primary',
            onConfirm: async () => {
                closeConfirm();
                try {
                    setIsLoading(true);
                    const response = await fetch('https://wanderwaveph.onrender.com/api/payment/create-inquiry-checkout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ inquiryId: selectedInquiry._id })
                    });
                    const data = await response.json();
                    if (data.success && data.checkoutUrl) {
                        window.location.href = data.checkoutUrl;
                    } else {
                        toast.error('Unable to initiate payment. Please try again.', 'Payment Failed');
                        setIsLoading(false);
                    }
                } catch (error) {
                    toast.error('Something went wrong. Please try again later.', 'Payment Error');
                    setIsLoading(false);
                }
            },
        });
    };

    // ✅ NEW: Handler for booking updates (passenger edits, customizations)
    const handleBookingUpdate = async (updatedBooking) => {
        
    // ✅ FIXED: Preserve inquiryType and populated packageId.
    // Without this, ApplicationDetails loses the BOOKING type after save,
    // and BookingCustomizer loses destination data (returns null).
    const mergedBooking = {
        ...updatedBooking,
        inquiryType: 'BOOKING',
        serviceName: updatedBooking.packageName,
        estimatedPrice: updatedBooking.totalAmount,
        // If backend didn't populate packageId (returns raw ObjectId), fall back
        // to the populated one already in selectedInquiry so destination stays intact.
        packageId: (updatedBooking.packageId && typeof updatedBooking.packageId === 'object')
            ? updatedBooking.packageId
            : selectedInquiry?.packageId,
    };
    setSelectedInquiry(mergedBooking);
        
        // Also update in the inquiries list
        setInquiries(prev => prev.map(inq => 
            inq._id === updatedBooking._id ? mergedBooking : inq
        ));
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
    if (!selectedInquiry?._id) {
        toast.error('Please select an application first.');
        return;
    }

    const allFiles = Object.values(uploadedFiles).flat();
    if (allFiles.length === 0) {
        toast.error('No documents to upload.');
        return;
    }

    const formData = new FormData();
    formData.append('inquiryId', selectedInquiry._id);
    formData.append('userId', String(user?._id || user?.id));  // ← siguraduhin na string

    allFiles.forEach((fileObj) => {
        formData.append('documents', fileObj.file);
        formData.append('sections', fileObj.section || 'General Documents');
    });

    try {
        setIsUploading(true);
        setUploadProgress(0);

        const response = await fetch('https://wanderwaveph.onrender.com/api/documents/upload', {
            method: 'POST',
            body: formData,
            // NO Content-Type header!
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Upload failed');
        }

        toast.success('Documents submitted successfully!', 'Success');
        setUploadedFiles({}); 
        await fetchUploadedDocuments(selectedInquiry._id);   // refresh

    } catch (error) {
        toast.error(error.message || 'Failed to upload documents. Please try again.');
    } finally {
        setIsUploading(false);
        setUploadProgress(0);
    }
};

    const handleNavigateBackToDashboard = () => {
        setCurrentView('applications');
    };

    return (
        <div className="ud-wrapper">
            {/* ── WanderLoader Overlay — fullScreen covers entire viewport incl. navbar ── */}
            <WanderLoader loading={isLoading} fullScreen />

            {/* ── Custom Confirm Modal ── */}
            <CustomConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                onConfirm={confirmModal.onConfirm}
                onCancel={closeConfirm}
            />

            <TopNavbar 
                user={user} 
                onLogout={handleLogout}
                onNavigateSettings={() => {
                    setCurrentView('settings');
                    setSelectedInquiry(null); 
                }}
                onNavigateHome={() => setCurrentView('applications')}
                mobileMenuOpen={mobileMenuOpen} 
                setMobileMenuOpen={setMobileMenuOpen} 
            />
                        
            <div className="ud-layout-body">
                <Sidebar 
                    inquiries={inquiries} 
                    selectedInquiry={selectedInquiry} 
                    onSelectInquiry={(inquiry) => {
                        handleSelectInquiry(inquiry);
                        setCurrentView('applications'); 
                    }}
                    mobileMenuOpen={mobileMenuOpen} 
                    isLoading={isLoading}
                    userInteractions={viewedHistory} 
                />

                <main className="ud-main-content">
                    {currentView === 'settings' ? (
                        <AccountSettings 
                            user={user} 
                            onNavigateBack={handleNavigateBackToDashboard}
                        />
                    ) : selectedInquiry ? (
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
                            onDownloadComplete={handleDownloadAction}
                            uploadedDocuments={uploadedDocuments}
                            isLoadingDocuments={isLoadingDocuments}
                            onBookingUpdate={handleBookingUpdate}  // ✅ NEW: Pass booking update handler
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

// ─────────────────────────────────────────────────────────────
// Outer wrapper — provides ToastProvider context so useToast
// works inside UserDashboardInner and all its children
// ─────────────────────────────────────────────────────────────
const UserDashboard = ({ user, onLogout }) => {
    return (
        <ToastProvider>
            <UserDashboardInner user={user} onLogout={onLogout} />
        </ToastProvider>
    );
};

export default UserDashboard;
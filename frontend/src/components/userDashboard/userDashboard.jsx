import { useState, useEffect } from 'react';
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
    
    // File Upload State
    const [uploadedFiles, setUploadedFiles] = useState({});
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Persist user session on page reload
    useEffect(() => {
        if (user) {
            localStorage.setItem('wanderwave_user', JSON.stringify(user));
        }
    }, [user]);

    // --- Fetch User Inquiries ---
    useEffect(() => {
        const fetchInquiries = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`http://localhost:5000/api/inquiries/email/${user.email}`);
                const data = await response.json();
                
                if (data.success) {
                    setInquiries(data.data);
                    if (data.data.length > 0 && !selectedInquiry) {
                        setSelectedInquiry(data.data[0]);
                    }
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

    // --- Fetch Visa Details ---
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

    // --- Handlers ---
    const handleSelectInquiry = (inquiry) => {
        setSelectedInquiry(inquiry);
        setMobileMenuOpen(false); 
    };

    const handleLogout = () => {
        // Clear localStorage and call parent logout handler
        localStorage.removeItem('wanderwave_user');
        if (onLogout) {
            onLogout();
        }
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
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert('Payment system unavailable.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFiles = async (files, section) => {
        setIsUploading(true);
        
        // Simulate upload progress
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
        
        setUploadedFiles(prev => ({ 
            ...prev, 
            [section]: [...(prev[section] || []), ...newFiles] 
        }));
        
        setIsUploading(false);
        setUploadProgress(0);
    };

    const handleFileSelect = (e, section) => {
        handleFiles(Array.from(e.target.files), section);
    };

    const handleDrop = (e, section) => { 
        e.preventDefault(); 
        handleFiles(Array.from(e.dataTransfer.files), section); 
    };
    
    const removeFile = (section, fileId) => {
        setUploadedFiles(prev => ({ 
            ...prev, 
            [section]: prev[section].filter(f => f.id !== fileId) 
        }));
    };

    const submitDocuments = async () => {
        if (!selectedInquiry) {
            return alert('Please select an inquiry');
        }
        
        const allFiles = Object.values(uploadedFiles).flat();
        
        if (allFiles.length === 0) {
            return alert('Please upload at least one document');
        }

        const formData = new FormData();
        formData.append('inquiryId', selectedInquiry._id);
        formData.append('userId', user._id);
        
        allFiles.forEach((fileObj) => {
            formData.append(`documents`, fileObj.file);
            formData.append(`sections`, fileObj.section);
        });

        try {
            await fetch('http://localhost:5000/api/documents/upload', { 
                method: 'POST', 
                body: formData 
            });
            alert('Documents submitted successfully!');
            setUploadedFiles({});
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
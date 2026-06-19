import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Lock, Save, Shield, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../toast/ToastManager'; // Updated Import
import CustomConfirmModal from "../confirmationModal/CustomConfirmModal"; // Added Modal Import
import './AccountSettings.css';
 
const AccountSettings = ({ user, onNavigateBack }) => {
    // 1. Initialize Toast
    const toast = useToast();
    
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        username: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // 2. State for Confirmation Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        title: '',
        message: '',
        type: 'primary',
        onConfirm: () => {} 
    });

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                fullName: user.fullName || '',
                email: user.email || '',
                username: user.username || ''
            }));
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- PROFILE UPDATE LOGIC ---

    // Step A: Trigger (Validation & Open Modal)
    const triggerUpdateProfile = (e) => {
        e.preventDefault();

        // Validation
        if (!formData.fullName.trim()) {
            toast.error("Full name is required");
            return;
        }

        if (!formData.email.trim()) {
            toast.error("Email address is required");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        if (!user || !user.id) {
            toast.error("User ID not found. Please try logging in again.");
            return;
        }

        // Configure and Open Modal
        setModalConfig({
            title: "Update Profile",
            message: "Are you sure you want to save these changes to your personal information?",
            type: "primary",
            onConfirm: performUpdateProfile // Pass the actual execution function
        });
        setIsModalOpen(true);
    };

    // Step B: Execution (API Call - called by Modal)
    const performUpdateProfile = async () => {
        setIsModalOpen(false);

        const token = localStorage.getItem('wanderwave_token');
        if (!token) {
            toast.error("Session expired. Please log in again.");
            return;
        }

        try {
            const response = await fetch('https://wanderwaveph.onrender.com/api/users/update-profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    email: formData.email,
                    username: formData.username
                })
            });
            const result = await response.json();

            if (result.status === "ok") {
                toast.success("Profile updated successfully");
                localStorage.setItem('wanderwave_user', JSON.stringify(result.data));
            } else {
                toast.error(result.message || "Failed to update profile");
            }
        } catch (error) {
            console.error("Update Profile Error:", error);
            toast.error("Connection error to server. Please try again.");
        }
    };

    // --- PASSWORD UPDATE LOGIC ---

    // Step A: Trigger (Validation & Open Modal)
    const triggerChangePassword = (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.currentPassword.trim()) {
            toast.error("Current password is required");
            return;
        }

        if (!formData.newPassword.trim()) {
            toast.error("New password is required");
            return;
        }

        if (formData.newPassword.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        if (!formData.confirmPassword.trim()) {
            toast.error("Please confirm your new password");
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        if (!user || !user.id) {
            toast.error("User ID not found. Please log in again.");
            return;
        }

        // Configure and Open Modal
        setModalConfig({
            title: "Change Password",
            message: "Are you sure you want to update your password?",
            type: "primary", // Can be 'danger' if preferred for sensitive actions
            onConfirm: performChangePassword // Pass the actual execution function
        });
        setIsModalOpen(true);
    };

    // Step B: Execution (API Call - called by Modal)
    const performChangePassword = async () => {
        setIsModalOpen(false);

        const token = localStorage.getItem('wanderwave_token');
        if (!token) {
            toast.error("Session expired. Please log in again.");
            return;
        }

        try {
            // FIX 1: Static route — no :id in URL. Identity comes from server-verified JWT.
            const response = await fetch('https://wanderwaveph.onrender.com/api/users/update-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword
                })
            });
            const result = await response.json();

            if (result.status === "ok") {
                toast.success("Password updated successfully");
                setFormData(prev => ({
                    ...prev,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                }));
            } else {
                toast.error(result.message || "Failed to update password");
            }
        } catch (error) {
            console.error("Password Update Error:", error);
            toast.error("Connection error to server. Please try again.");
        }
    };

    return (
        <div className="account-settings-container">
            {/* Back Button */}
            <button 
                className="account-back-button" 
                onClick={onNavigateBack}
                type="button"
            >
                <ArrowLeft size={20} />
                <span>Back to Dashboard</span>
            </button>

            {/* Header */}
            <header className="account-settings-header">
                <div className="account-settings-header-content">
                    <h1 className="account-settings-title">MY ACCOUNT</h1>
                    <p className="account-settings-subtitle">Update your personal information and security settings</p>
                </div>
            </header>

            <div className="account-settings-form-wrapper">
                {/* Section 1: Personal Information */}
                <section className="account-settings-section">
                    <div className="account-settings-section-header">
                        <User size={20} className="account-section-icon" />
                        <h2 className="account-settings-section-title">Personal Information</h2>
                    </div>
                    
                    {/* Updated onSubmit to trigger validation + modal */}
                    <form onSubmit={triggerUpdateProfile} className="account-form">
                        <div className="account-fields-grid">
                            <div className="account-field">
                                <label className="account-label">
                                    Full Name <span className="account-required">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="Enter your full name"
                                    className="account-input"
                                    required
                                />
                            </div>
                            <div className="account-field">
                                <label className="account-label">
                                    Email Address <span className="account-required">*</span>
                                </label>
                                <input 
                                    type="email" 
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="email@example.com"
                                    className="account-input"
                                    required
                                />
                            </div>
                        </div>
                        <div className="account-actions">
                            <button type="submit" className="account-btn account-btn-save">
                                <Save size={18} />
                                Save Changes
                            </button>
                        </div>
                    </form>
                </section>

                {/* Section 2: Security & Password */}
                <section className="account-settings-section">
                    <div className="account-settings-section-header">
                        <Shield size={20} className="account-section-icon" />
                        <h2 className="account-settings-section-title">Security & Password</h2>
                    </div>
                    
                    {/* Updated onSubmit to trigger validation + modal */}
                    <form onSubmit={triggerChangePassword} className="account-form">
                        <div className="account-fields-grid">
                            <div className="account-field account-full-width">
                                <label className="account-label">
                                    Current Password <span className="account-required">*</span>
                                </label>
                                <div className="account-password-wrapper">
                                    <input 
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        name="currentPassword"
                                        value={formData.currentPassword}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="account-input"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="account-toggle-password"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    >
                                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="account-field">
                                <label className="account-label">
                                    New Password <span className="account-required">*</span>
                                </label>
                                <div className="account-password-wrapper">
                                    <input 
                                        type={showNewPassword ? 'text' : 'password'}
                                        name="newPassword"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        placeholder="Min. 8 characters"
                                        className="account-input"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="account-toggle-password"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                    >
                                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="account-field">
                                <label className="account-label">
                                    Confirm New Password <span className="account-required">*</span>
                                </label>
                                <div className="account-password-wrapper">
                                    <input 
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Confirm new password"
                                        className="account-input"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="account-toggle-password"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="account-actions">
                            <button type="submit" className="account-btn account-btn-secondary">
                                <Lock size={18} />
                                Update Password
                            </button>
                        </div>
                    </form>
                </section>
            </div>

            {/* Confirmation Modal Component */}
            <CustomConfirmModal 
                isOpen={isModalOpen}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onConfirm={modalConfig.onConfirm}
                onCancel={() => setIsModalOpen(false)}
            />
        </div>
    );
};

export default AccountSettings;
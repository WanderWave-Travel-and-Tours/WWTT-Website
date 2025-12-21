import React, { useState, useEffect } from 'react';
import './AccountSettings.css';

const AccountSettings = ({ user }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        username: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

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

    const handleUpdateProfile = async (e) => {
        e.preventDefault();

        if (!user || !user.id) {
            console.error("DEBUG: Current User Object:", user);
            alert("❌ Error: User ID not found. Please try logging in again.");
            return;
        }
        try {
            const response = await fetch(`https://wanderwaveph-backend.onrender.com0/api/users/update-profile/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    email: formData.email,
                    username: formData.username
                })
            });
            const result = await response.json();

            if (result.status === "ok") {
                alert("✅ Profile updated! Please log in again to see changes.");
                localStorage.setItem('wanderwave_user', JSON.stringify(result.data));
            } else {
                alert("❌ " + result.message);
            }
        } catch (error) {
            alert("⚠️ Connection error to server.");
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        
        if (!user || !user.id) {
            console.error("DEBUG: User ID missing in Password Update:", user);
            alert("❌ Error: User ID not found. Please log in again.");
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            alert("❌ New passwords do not match!");
            return;
        }

        try {
            const response = await fetch(`https://wanderwaveph-backend.onrender.com0/api/users/update-password/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword
                })
            });
            const result = await response.json();

            if (result.status === "ok") {
                alert("✅ Password updated successfully!");
                setFormData(prev => ({ 
                    ...prev, 
                    currentPassword: '', 
                    newPassword: '', 
                    confirmPassword: '' 
                }));
            } else {
                alert("❌ " + result.message);
            }
        } catch (error) {
            console.error("Password Update Error:", error);
            alert("⚠️ Connection error to server.");
        }
    };

    return (
        <div className="account-settings-container">
            <header className="account-settings-header">
                <h1 className="account-settings-title">MY ACCOUNT</h1>
                <p className="account-settings-subtitle">Update your personal information and security settings</p>
            </header>

            <div className="account-settings-grid">
                <section className="account-settings-section">
                    <div className="account-settings-section-header">
                        <h2 className="account-settings-section-title">Personal Information</h2>
                    </div>
                    
                    <form onSubmit={handleUpdateProfile} className="account-fields-grid">
                        <div className="account-field">
                            <label>Full Name</label>
                            <input 
                                type="text" 
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="Enter your full name"
                            />
                        </div>
                        <div className="account-field">
                            <label>Email Address</label>
                            <input 
                                type="email" 
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="email@example.com"
                            />
                        </div>
                        <div className="account-actions">
                            <button type="submit" className="btn-save-account">Save Changes</button>
                        </div>
                    </form>
                </section>

                <section className="account-settings-section">
                    <div className="account-settings-section-header">
                        <h2 className="account-settings-section-title">Security & Password</h2>
                    </div>
                    
                    <form onSubmit={handleChangePassword} className="account-fields-grid">
                        <div className="account-field full-width">
                            <label>Current Password</label>
                            <input 
                                type="password" 
                                name="currentPassword"
                                onChange={handleChange}
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="account-field">
                            <label>New Password</label>
                            <input 
                                type="password" 
                                name="newPassword"
                                onChange={handleChange}
                                placeholder="Min. 8 characters"
                            />
                        </div>
                        <div className="account-field">
                            <label>Confirm New Password</label>
                            <input 
                                type="password" 
                                name="confirmPassword"
                                onChange={handleChange}
                                placeholder="Confirm new password"
                            />
                        </div>
                        <div className="account-actions">
                            <button type="submit" className="btn-save-account secondary">Update Password</button>
                        </div>
                    </form>
                </section>
            </div>
        </div>
    );
};

export default AccountSettings;
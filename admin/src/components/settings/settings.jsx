import React, { useState, useEffect } from 'react';
import Sidebar from '../sidebar/sidebar';
import './settings.css';

const Settings = () => {
    const [settings, setSettings] = useState({
        username: 'admin', 
        businessName: '',
        businessAddress: '',
        businessLogo: ''
    });

    const [logoFile, setLogoFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/admin/settings');
                const result = await response.json();
                if (result.status === 'ok') {
                    setSettings({
                        username: result.data.username,
                        businessName: result.data.businessName || '',
                        businessAddress: result.data.businessAddress || '',
                        businessLogo: result.data.businessLogo || ''
                    });
                }
            } catch (error) {
                console.error("Error loading settings:", error);
            }
        };
        fetchSettings();
    }, []);

    const handleSettingsChange = (e) => {
        setSettings({ ...settings, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setLogoFile(file);
        if (file) {
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('businessName', settings.businessName);
        formData.append('businessAddress', settings.businessAddress);
        
        if (logoFile) {
            formData.append('businessLogo', logoFile);
        }

        try {
            const response = await fetch('http://localhost:5000/api/admin/update-settings', {
                method: 'PUT',
                body: formData
            });
            const result = await response.json();
            
            if (result.status === 'ok') {
                alert("✅ Business Profile Updated Successfully!");
                if (result.data.businessLogo) {
                    setSettings(prev => ({...prev, businessLogo: result.data.businessLogo}));
                }
            } else {
                alert("❌ Error updating settings");
            }
        } catch (error) {
            console.error("Server Error:", error);
            alert("⚠️ Failed to connect to server");
        }
    };

    return (
        <div className="settings-page">
            <Sidebar />
            
            <main className="settings-main">
                <div className="settings-container">
                    
                    {/* Header */}
                    <header className="settings-header">
                        <h1 className="settings-title">BUSINESS PROFILE</h1>
                        <p className="settings-subtitle">Manage your agency's public information and branding</p>
                    </header>

                    <form onSubmit={handleSubmit} className="settings-grid">
                        
                        {/* Section 1: General Info */}
                        <section className="settings-section">
                            <div className="settings-section-header">
                                <h2 className="settings-section-title">General Information</h2>
                            </div>

                            {/* Logo Area */}
                            <div className="logo-upload-wrapper">
                                <div className="logo-preview-box">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" />
                                    ) : settings.businessLogo ? (
                                        <img src={`http://localhost:5000/uploads/${settings.businessLogo}`} alt="Business Logo" />
                                    ) : (
                                        <div className="logo-placeholder">✈️</div>
                                    )}
                                </div>
                                <div className="logo-info">
                                    <span className="logo-label">Business Logo</span>
                                    <p className="logo-helper">
                                        Recommended size: 350px x 180px. <br />
                                        Supports JPG, PNG.
                                    </p>
                                    <div className="logo-btn-group">
                                        <label htmlFor="logo-upload" className="btn-upload-trigger">
                                            Upload New
                                        </label>
                                        <input 
                                            type="file" 
                                            id="logo-upload" 
                                            hidden 
                                            onChange={handleFileChange} 
                                            accept="image/*" 
                                        />
                                        <button 
                                            type="button" 
                                            className="btn-remove-trigger"
                                            onClick={() => {setLogoFile(null); setPreviewUrl(null);}}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Inputs Grid */}
                            <div className="settings-fields-grid">
                                <div className="settings-field">
                                    <label>Friendly Business Name</label>
                                    <input 
                                        type="text" 
                                        name="businessName"
                                        value={settings.businessName}
                                        onChange={handleSettingsChange}
                                        placeholder="e.g., WanderWave Travel and Tours" 
                                    />
                                </div>

                                <div className="settings-field">
                                    <label>Legal Admin ID (Read Only)</label>
                                    <input 
                                        type="text" 
                                        value={settings.username} 
                                        disabled
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Address */}
                        <section className="settings-section">
                            <div className="settings-section-header">
                                <h2 className="settings-section-title">Location Details</h2>
                            </div>

                            <div className="settings-fields-grid">
                                <div className="settings-field full-width">
                                    <label>Street Address / Full Address</label>
                                    <input 
                                        type="text" 
                                        name="businessAddress"
                                        value={settings.businessAddress}
                                        onChange={handleSettingsChange}
                                        placeholder="e.g., MQ4C+5R8, Pangasinan - Nueva Ecija Rd" 
                                    />
                                </div>

                                <div className="settings-field">
                                    <label>City / Municipality</label>
                                    <input 
                                        type="text" 
                                        placeholder="Guimba, Nueva Ecija" 
                                        disabled 
                                    />
                                </div>

                                <div className="settings-field">
                                    <label>Country</label>
                                    <select disabled>
                                        <option>Philippines</option>
                                    </select>
                                </div>

                                <div className="settings-field">
                                    <label>Time Zone</label>
                                    <select disabled>
                                        <option>Asia/Manila (GMT+8)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Submit Button Action */}
                            <div className="settings-actions">
                                <button type="submit" className="btn-save-settings">
                                    Update Information
                                </button>
                            </div>
                        </section>

                    </form>
                </div>
            </main>
        </div>
    );
};

export default Settings;
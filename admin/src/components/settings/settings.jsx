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
        <div className="admin-layout">
            <Sidebar />
            
            <div className="settings-content">
                <div className="header-section">
                    <h1>Business Profile Settings</h1>
                    <p>Manage your business profile information & settings</p>
                </div>

                <form onSubmit={handleSubmit} className="settings-grid">
                    <div className="settings-card">
                        <h3 className="card-title">General Information</h3>
                        <div className="logo-upload-container">
                            <div className="logo-preview">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" />
                                ) : settings.businessLogo ? (
                                    <img src={`http://localhost:5000/uploads/${settings.businessLogo}`} alt="Business Logo" />
                                ) : (
                                    <div className="placeholder-logo">✈️</div>
                                )}
                            </div>
                            <div className="logo-actions">
                                <label className="input-label">Business Logo</label>
                                <p className="helper-text">The proposed size is 350px * 180px.</p>
                                <div className="btn-group">
                                    <label htmlFor="logo-upload" className="btn-upload">Upload</label>
                                    <input type="file" id="logo-upload" hidden onChange={handleFileChange} accept="image/*" />
                                    
                                    <button 
                                        type="button" 
                                        className="btn-remove" 
                                        onClick={() => {setLogoFile(null); setPreviewUrl(null);}}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Friendly Business Name</label>
                            <input 
                                type="text" 
                                name="businessName"
                                value={settings.businessName}
                                onChange={handleSettingsChange}
                                placeholder="WanderWave Travel and Tours" 
                            />
                        </div>

                        <div className="form-group">
                            <label>Legal Business Name (Admin ID)</label>
                            <input 
                                type="text" 
                                value={settings.username} 
                                disabled
                                className="input-disabled"
                            />
                        </div>
                    </div>

                    <div className="settings-card">
                        <h3 className="card-title">Business Physical Address</h3>
                        <div className="form-group">
                            <label>Street Address / Full Address</label>
                            <input 
                                type="text" 
                                name="businessAddress"
                                value={settings.businessAddress}
                                onChange={handleSettingsChange}
                                placeholder="MQ4C+5R8, Pangasinan - Nueva Ecija Rd" 
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group half">
                                <label>City</label>
                                <input type="text" placeholder="Guimba, Nueva Ecija" disabled className="input-disabled" />
                            </div>
                            <div className="form-group half">
                                <label>Country</label>
                                <select disabled className="input-disabled"><option>Philippines</option></select>
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label>Time Zone</label>
                            <select disabled className="input-disabled"><option>Asia/Manila</option></select>
                        </div>

                        <div className="form-actions" style={{ marginTop: '30px' }}>
                            <button type="submit" className="btn-save">Update Information</button>
                        </div>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default Settings;
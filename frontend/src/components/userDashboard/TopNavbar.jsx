import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './TopNavbar.css';

const TopNavbar = ({ user, onLogout, onNavigateSettings, mobileMenuOpen, setMobileMenuOpen }) => {
    const navigate = useNavigate(); 
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNavigate = (path) => {
        setDropdownOpen(false);
        navigate(path);
    };

    const handleSettingsClick = () => {
        setDropdownOpen(false);
        onNavigateSettings(); 
    };

    const handleHomeClick = () => {
        setDropdownOpen(false);
        window.location.href = 'https://wanderwaveph.com/packages';
    };

    const handleBrandClick = () => {
        window.location.href = 'https://wanderwaveph.com/packages';
    };

    return (
        <header className="ud-navbar">
            <div className="ud-nav-left">
                <button className="ud-mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    <span style={{color: 'white'}}>☰</span>
                </button>
                <div className="ud-brand-section" onClick={handleBrandClick} style={{cursor: 'pointer'}}>
                    <img src="https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911894edaa4e3fb6cfb8afe.png" alt="WanderWave" className="ud-brand-logo" />
                    <span className="ud-brand-name">WanderWave</span>
                </div>
            </div>

            <div className="ud-nav-right" ref={dropdownRef}>
                <div className="ud-user-profile-trigger" onClick={() => setDropdownOpen(!dropdownOpen)}>
                    <div className="ud-user-info">
                        <div className="ud-user-avatar">
                            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="ud-user-details">
                            <span className="ud-user-name">{user?.fullName || 'User'}</span>
                            <span className="ud-user-email">{user?.email || 'guest@example.com'}</span>
                        </div>
                        <span style={{fontSize: '10px', marginLeft: '5px', color: 'white'}}>{dropdownOpen ? '▲' : '▼'}</span>
                    </div>

                    {dropdownOpen && (
                        <div className="ud-dropdown-menu">
                            <div className="ud-dropdown-item" onClick={handleHomeClick}>
                                <span>🏠 Home</span>
                            </div>
                            <div className="ud-dropdown-item" onClick={handleSettingsClick}>
                                <span>⚙️ Account Settings</span>
                            </div>
                            <hr className="ud-dropdown-divider" />
                            <div className="ud-dropdown-item ud-logout-item" onClick={onLogout}>
                                <span>Logout</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default TopNavbar;
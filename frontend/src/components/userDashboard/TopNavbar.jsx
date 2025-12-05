import React from 'react';
import * as Icons from './Icons';
import './TopNavbar.css';

const TopNavbar = ({ user, onLogout, mobileMenuOpen, setMobileMenuOpen }) => {
    return (
        <header className="ud-navbar">
            <div className="ud-nav-left">
                <button 
                    className="ud-mobile-toggle" 
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    <Icons.Menu />
                </button>
                <div className="ud-brand-section">
                    <img 
                        src="https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911894edaa4e3fb6cfb8afe.png" 
                        alt="WanderWave" 
                        className="ud-brand-logo" 
                    />
                    <span className="ud-brand-name">WanderWave</span>
                </div>
            </div>

            <div className="ud-nav-right">
                <div className="ud-user-info">
                    <div className="ud-user-avatar">
                        {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="ud-user-details">
                        <span className="ud-user-name">{user?.fullName || 'User'}</span>
                        <span className="ud-user-email">{user?.email || 'guest@example.com'}</span>
                    </div>
                </div>
                <button className="ud-logout-btn" onClick={onLogout}>
                    Sign Out
                </button>
            </div>
        </header>
    );
};

export default TopNavbar;
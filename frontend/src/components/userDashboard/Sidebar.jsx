import React from 'react';
import * as Icons from './Icons';
import './Sidebar.css';

const Sidebar = ({ inquiries, selectedInquiry, onSelectInquiry, mobileMenuOpen, isLoading }) => {
    
    const getStatusClass = (status) => {
        switch (status?.toUpperCase()) {
            case 'PENDING': return 'ud-badge-pending';
            case 'CONTACTED': return 'ud-badge-contacted';
            case 'PAYMENT_PENDING': return 'ud-badge-payment';
            case 'PAID': return 'ud-badge-paid';
            case 'COMPLETED': return 'ud-badge-completed';
            case 'CANCELLED': return 'ud-badge-cancelled';
            default: return 'ud-badge-default';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    };

    // Helper para ipakita ang tamang label (Bansa o Document Name)
    const getInquirySubtitle = (inquiry) => {
        if (inquiry.visaCountry) return inquiry.visaCountry;
        if (inquiry.cenomarDocument) return 'CENOMAR Request';
        if (inquiry.psaDocument) return 'PSA Document';
        return 'Travel Assistance';
    };

    return (
        <aside className={`ud-sidebar ${mobileMenuOpen ? 'ud-sidebar-open' : ''}`}>
            <div className="ud-sidebar-header">
                <Icons.Dashboard />
                <h2>MY APPLICATIONS</h2>
            </div>

            <div className="ud-applications-list">
                {isLoading ? (
                    <div className="ud-loading-state">
                        <div className="ud-loader"></div>
                        <p>Loading your applications...</p>
                    </div>
                ) : inquiries.length === 0 ? (
                    <div className="ud-empty-state">
                        <Icons.Globe />
                        <p>No applications yet</p>
                        <small>Start your travel journey today!</small>
                    </div>
                ) : (
                    inquiries.map(inquiry => (
                        <div 
                            key={inquiry._id} 
                            className={`ud-inquiry-card ${selectedInquiry?._id === inquiry._id ? 'ud-card-active' : ''}`}
                            onClick={() => onSelectInquiry(inquiry)}
                        >
                            <div className="ud-card-content">
                                <div className="ud-card-top">
                                    <h3 className="ud-card-title">{inquiry.serviceName}</h3>
                                    <div className={`ud-status-dot ${getStatusClass(inquiry.status)}`}></div>
                                </div>
                                <div className="ud-card-middle">
                                    <span className="ud-card-destination">
                                        <Icons.Globe /> 
                                        {getInquirySubtitle(inquiry)}
                                    </span>
                                    <span className="ud-card-date">{formatDate(inquiry.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
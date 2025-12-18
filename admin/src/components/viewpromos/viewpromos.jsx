import React, { useState, useEffect } from 'react';
import { Archive, Calendar, Eye } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import PromoDetailModal from './PromoDetailModal';
import PromoPagination from './PromoPagination';
import PromoFilters from './PromoFilters';
import './viewpromos.css';

const ViewPromos = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const [promos, setPromos] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedPromo, setSelectedPromo] = useState(null);

    const statusOptions = ['ALL', 'Active', 'Expired'];

    const getFilterClassName = (status) => {
        return filterStatus === status ? 'prf-active-navy' : '';
    };

    useEffect(() => {
        fetchPromos();
    }, []);

    const fetchPromos = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/promos');
            if (!response.ok) {
                throw new Error('Failed to fetch promos');
            }
            const data = await response.json();
            setPromos(data);
            setCurrentPage(1);
        } catch (error) {
            console.error("Error loading promos:", error);
        }
    };

    const getStatus = (validUntil) => {
        const today = new Date();
        const expiryDate = new Date(validUntil);
        return expiryDate < today ? 'Expired' : 'Active';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleArchive = async (id, code) => {
        if (window.confirm(`Are you sure you want to archive promo code ${code}?`)) {
            try {
                const response = await fetch(`http://localhost:5000/api/promos/${id}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    const updatedPromos = promos.filter(promo => promo._id !== id);
                    setPromos(updatedPromos);
                    alert(`Promo Code ${code} has been archived.`);
                    
                    const maxPage = Math.ceil(updatedPromos.length / itemsPerPage);
                    if (currentPage > maxPage && maxPage > 0) {
                        setCurrentPage(maxPage);
                    }
                } else {
                    alert("Failed to archive promo.");
                }
            } catch (error) {
                console.error("Error archiving:", error);
                alert("Server error.");
            }
        }
    };

    const handleViewDetails = (promo) => {
        setSelectedPromo(promo);
        setShowDetailModal(true);
    };

    // Filter and search logic
    const filteredPromos = promos.filter(promo => {
        const matchesSearch = promo.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            promo.description.toLowerCase().includes(searchTerm.toLowerCase());
        const promoStatus = getStatus(promo.validUntil);
        const matchesStatus = filterStatus === 'ALL' || promoStatus === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPromos = filteredPromos.slice(indexOfFirstItem, indexOfLastItem);

    const activePromos = promos.filter(p => getStatus(p.validUntil) === 'Active').length;

    return (
        <div className="vpromos-page">
            <Sidebar 
                isCollapsed={isSidebarCollapsed} 
                toggleSidebar={toggleSidebar} 
            />
            <main className={`vpromos-main ${isSidebarCollapsed ? "vpromos-main--collapsed" : ""}`}>
                <div className="vpromos-container">
                    <header className="vpromos-header">
                        <div className="vpromos-header-content">
                            <h1 className="vpromos-title">PROMO CODES</h1>
                            <p className="vpromos-subtitle">
                                Managing {promos.length} promo codes • {activePromos} currently active
                            </p>
                        </div>
                        <button className="vpromos-btn vpromos-btn--add" onClick={() => window.location.href='/add-promo'}>
                            + Add New Promo
                        </button>
                    </header>

                    {/* PROMO FILTERS */}
                    <PromoFilters
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        filterStatus={filterStatus}
                        setFilterStatus={setFilterStatus}
                        statusOptions={statusOptions}
                        getFilterClassName={getFilterClassName}
                    />
                    
                    {promos.length === 0 ? (
                        <div className="vpromos-empty">
                            <span className="vpromos-empty-icon">🏷️</span>
                            <h3>No promo codes yet</h3>
                            <p>Start by creating your first promo code</p>
                            <button className="vpromos-btn vpromos-btn--add" onClick={() => window.location.href='/add-promo'}>
                                + Add Promo
                            </button>
                        </div>
                    ) : (
                        <div className="vpromos-table-wrapper">
                            <table className="vpromos-table">
                                <thead>
                                    <tr>
                                        <th>CODE</th>
                                        <th>CATEGORY</th>
                                        <th>DISCOUNT</th>
                                        <th>VALID UNTIL</th>
                                        <th>STATUS</th>
                                        <th>DESCRIPTION</th>
                                        <th>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentPromos.map(promo => {
                                        const status = getStatus(promo.validUntil);
                                        return (
                                            <tr key={promo._id}>
                                                <td>
                                                    <span className="vpromos-code">{promo.code}</span>
                                                </td>
                                                <td>
                                                    {promo.category}
                                                </td>
                                                <td>
                                                    <span className="vpromos-discount">
                                                        {promo.discountType === 'Percentage' 
                                                            ? `${promo.discountValue}%` 
                                                            : `₱${promo.discountValue.toLocaleString()}`
                                                        }
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="vpromos-date">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                                            <line x1="16" y1="2" x2="16" y2="6"/>
                                                            <line x1="8" y1="2" x2="8" y2="6"/>
                                                            <line x1="3" y1="10" x2="21" y2="10"/>
                                                        </svg>
                                                        <span>{formatDate(promo.validUntil)}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`vpromos-status vpromos-status--${status.toLowerCase()}`}>
                                                        {status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="vpromos-desc">{promo.description}</span>
                                                </td>
                                                <td>
                                                    <div className="vpromos-actions">
                                                        <button 
                                                            className="vpromos-action-btn vpromos-action-btn--view"
                                                            onClick={() => handleViewDetails(promo)}
                                                            title="View Details"
                                                        >
                                                            <Eye size={16} />
                                                            <span>View</span>
                                                        </button>
                                                        <button 
                                                            className="vpromos-action-btn vpromos-action-btn--archive"
                                                            onClick={() => handleArchive(promo._id, promo.code)}
                                                            title="Archive Promo"
                                                        >
                                                            <Archive size={16} />
                                                            <span>Archive</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            
                            <PromoPagination
                                totalItems={filteredPromos.length}
                                itemsPerPage={itemsPerPage}
                                currentPage={currentPage}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </div>
            </main>

            {showDetailModal && selectedPromo && (
                <PromoDetailModal
                    showModal={showDetailModal}
                    selectedPromo={selectedPromo}
                    setShowModal={setShowDetailModal}
                    handleArchive={handleArchive}
                />
            )}
        </div>
    );
};

export default ViewPromos;
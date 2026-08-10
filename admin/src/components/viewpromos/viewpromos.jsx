import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react'; // ✅ Using Plus Icon
import Sidebar from '../sidebar/sidebar';
import PromoDetailModal from './PromoDetailModal';
import PromoPagination from './PromoPagination';
import PromoFilters from './PromoFilters';
import PromosTable from './PromosTable'; 
import { useToast } from '../toast/ToastManager';
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal';
import './viewpromos.css'; // ✅ Imported updated CSS

const ViewPromos = () => {
    const toast = useToast();

    // ✅ STATE: Matches Tours/Packages Logic
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    
    // ✅ Toggle Function
    const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(true); // Added loading state

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterType, setFilterType] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedPromo, setSelectedPromo] = useState(null);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        id: null,
        code: ''
    });

    const statusOptions = ['ALL', 'Active', 'Expired'];

    const getFilterClassName = (status) => {
        return filterStatus === status ? 'prf-active-navy' : '';
    };

    useEffect(() => {
        fetchPromos();
    }, []);

    const fetchPromos = async () => {
        setLoading(true);
        try {
            // ✅ FIXED: Use /all to include vouchers (GET / excludes vouchers for public carousel only)
            const response = await fetch('/api/promos/all');
            if (!response.ok) {
                throw new Error('Failed to fetch promos');
            }
            const data = await response.json();
            
            // Filter non-archived promos (client-side)
            const nonArchivedPromos = data.filter(promo => promo.isArchive === "No");
            
            setPromos(nonArchivedPromos);
            setCurrentPage(1);
        } catch (error) {
            console.error("Error loading promos:", error);
            toast.error("Could not load promo codes from server.", "Fetch Error");
        } finally {
            setLoading(false);
        }
    };

    // Helper for filter logic (Status check)
    const getStatus = (validUntil) => {
        const today = new Date();
        const expiryDate = new Date(validUntil);
        return expiryDate < today ? 'Expired' : 'Active';
    };

    const handleArchiveClick = (id, code) => {
        setConfirmModal({
            isOpen: true,
            id,
            code
        });
    };

    const processArchive = async () => {
        const { id, code } = confirmModal;
        
        try {
            // ✅ FIXED: Use dedicated archive toggle endpoint instead of PUT
            // PUT route does NOT handle isArchive — it rebuilds updateData from specific fields only
            const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
            const response = await fetch(`/api/promos/${id}/archive`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userEmail: adminData.email || adminData.username || 'System Admin',
                    adminId: adminData._id || adminData.id || null
                }),
            });

            if (response.ok) {
                const updatedPromos = promos.filter(promo => promo._id !== id);
                setPromos(updatedPromos);
                
                toast.success(`Promo Code ${code} has been successfully moved to archives.`, "Archived Successfully");
                
                const maxPage = Math.ceil(updatedPromos.length / itemsPerPage);
                if (currentPage > maxPage && maxPage > 0) {
                    setCurrentPage(maxPage);
                }
            } else {
                toast.error("There was a problem archiving the promo.", "Action Failed");
            }
        } catch (error) {
            console.error("Error archiving:", error);
            toast.error("Server connection lost. Please try again later.", "Server Error");
        } finally {
            setConfirmModal({ ...confirmModal, isOpen: false });
        }
    };

    const handleViewDetails = (promo) => {
        setSelectedPromo(promo);
        setShowDetailModal(true);
    };

    // Filter Logic
    const filteredPromos = promos.filter(promo => {
        const matchesSearch = promo.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            promo.description.toLowerCase().includes(searchTerm.toLowerCase());
        const promoStatus = getStatus(promo.validUntil);
        const matchesStatus = filterStatus === 'ALL' || promoStatus === filterStatus;
        // ✅ NEW: Filter by type (Promo vs Voucher)
        const matchesType = filterType === 'ALL' || (promo.promoType || 'promo') === filterType.toLowerCase();
        return matchesSearch && matchesStatus && matchesType;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPromos = filteredPromos.slice(indexOfFirstItem, indexOfLastItem);

    const activePromos = promos.filter(p => getStatus(p.validUntil) === 'Active').length;

    return (
        <div className="vpromos-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            
            {/* ✅ LAYOUT FIX: Uses 'expanded' class logic */}
            <main className={`vpromos-main ${isSidebarCollapsed ? "expanded" : ""}`}>
                <div className="vpromos-container">
                    
                    {/* ✅ HEADER UI: Matches Standard Design */}
                    <header className="vpromos-header">
                        <div className="vpromos-header-content">
                            <h1 className="vpromos-title">PROMO CODES</h1>
                            <div className="vpromos-subtitle">
                                Managing {promos.length} promo codes • {activePromos} currently active
                            </div>
                        </div>
                        
                        <button className="vpromos-btn-add" onClick={() => window.location.href='/add-promo'}>
                            <Plus size={18} strokeWidth={3} />
                            ADD NEW PROMO
                        </button>
                    </header>

                    <PromoFilters
                        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                        filterStatus={filterStatus} setFilterStatus={setFilterStatus}
                        statusOptions={statusOptions} getFilterClassName={getFilterClassName}
                        filterType={filterType} setFilterType={setFilterType}
                    />
                    
                    {loading ? (
                        <div className="vpromos-loading"><div className="vpromos-spinner"></div><p>Loading promo codes...</p></div>
                    ) : promos.length === 0 ? (
                        <div className="vpromos-empty">
                            <h3>No promo codes yet</h3>
                        </div>
                    ) : (
                        <>
                            <PromosTable 
                                promos={currentPromos}
                                onView={handleViewDetails}
                                onArchive={handleArchiveClick}
                            />
                            
                            <PromoPagination
                                totalItems={filteredPromos.length}
                                itemsPerPage={itemsPerPage}
                                currentPage={currentPage}
                                onPageChange={setCurrentPage}
                            />
                        </>
                    )}
                </div>
            </main>

            {showDetailModal && selectedPromo && (
                <PromoDetailModal
                    showModal={showDetailModal}
                    selectedPromo={selectedPromo}
                    setShowModal={setShowDetailModal}
                    handleArchive={(id, code) => {
                        setShowDetailModal(false);
                        handleArchiveClick(id, code);
                    }}
                />
            )}

            <CustomConfirmModal
                isOpen={confirmModal.isOpen}
                title="Archive Promo Code?"
                message={`Are you sure you want to archive promo code "${confirmModal.code}"? This will hide it from the active list.`}
                type="danger"
                onConfirm={processArchive}
                onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
            />
        </div>
    );
};

export default ViewPromos;
import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import TransferDetailModal from './TransferDetailModal';
import TransferPagination from './TransferPagination';
import TransferFilters from './TransferFilters';
import TransfersTable from './TransfersTable';
import './viewtransfers.css';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../toast/ToastManager';

const API_BASE_URL = 'https://wanderwaveph.onrender.com/api/transfers';

// --- CONFIRMATION MODAL ---
const CustomConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, type = "primary" }) => {
    if (!isOpen) return null;
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 11000
        }}>
            <div style={{
                backgroundColor: 'white', padding: '2rem', borderRadius: '12px',
                maxWidth: '400px', width: '90%', textAlign: 'center',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}>
                <div style={{ marginBottom: '1rem' }}>
                    <HelpCircle size={48} color={type === 'danger' ? '#ef4444' : '#3b82f6'} style={{ margin: '0 auto' }} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', color: '#1e293b' }}>{title}</h3>
                <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.5' }}>{message}</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button
                        onClick={onCancel}
                        style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', fontWeight: '500' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none', backgroundColor: type === 'danger' ? '#ef4444' : '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: '500' }}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

const ViewTransfers = () => {
    const toast = useToast();
    const navigate = useNavigate();

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [filterType, setFilterType] = useState('ALL');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTransfer, setSelectedTransfer] = useState(null);

    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false, title: "", message: "", onConfirm: () => {}, type: "primary"
    });

    const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

    const askConfirmation = (title, message, onConfirm, type = "primary") => {
        setConfirmConfig({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                onConfirm();
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
            },
            type
        });
    };

    // Fetch all transfers (active + inactive) using ?all=true
    useEffect(() => {
        const fetchTransfers = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}?all=true&limit=200`);
                const result = await response.json();

                if (result.success) {
                    const mapped = result.data.map(transfer => {
                        const dateObj = transfer.createdAt ? new Date(transfer.createdAt) : null;
                        return {
                            ...transfer,
                            displayDate: dateObj && !isNaN(dateObj)
                                ? dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                : 'N/A'
                        };
                    });
                    setTransfers(mapped);
                } else {
                    toast.error("Failed to load transfers.");
                }
            } catch (err) {
                toast.error("Error connecting to server.");
            } finally {
                setLoading(false);
            }
        };
        fetchTransfers();
    }, [toast]);

    // Toggle active status
    const handleToggleActive = (id, currentIsActive) => {
        const action = currentIsActive ? 'deactivate' : 'activate';
        askConfirmation(
            currentIsActive ? "Deactivate Transfer" : "Activate Transfer",
            `Are you sure you want to ${action} this transfer?`,
            () => performToggle(id),
            currentIsActive ? "danger" : "primary"
        );
    };

    const performToggle = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}/toggle`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();

            if (data.success) {
                setTransfers(prev =>
                    prev.map(t => t._id === id ? { ...t, isActive: data.isActive } : t)
                );
                // Also update selected transfer if modal is open
                if (selectedTransfer && selectedTransfer._id === id) {
                    setSelectedTransfer(prev => ({ ...prev, isActive: data.isActive }));
                }
                toast.success(data.message || "Transfer status updated.");
            } else {
                toast.error(data.message || "Failed to update status.");
            }
        } catch (err) {
            toast.error("Error connecting to server.");
        }
    };

    const handleView = (transfer) => {
        setSelectedTransfer(transfer);
        setShowDetailModal(true);
    };

    // Derive categories dynamically from transfers
    const categories = ['ALL', ...new Set(transfers.map(t => t.category).filter(Boolean))];

    // Filter logic
    const filteredTransfers = transfers.filter(transfer => {
        const matchesSearch =
            transfer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (transfer.packageDestination || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = filterCategory === 'ALL' || transfer.category === filterCategory;

        // filterType is not applicable per-transfer since each transfer has both prices,
        // but we use it to filter based on whether a price exists
        let matchesType = true;
        if (filterType === 'oneway') matchesType = transfer.oneWayPrice > 0;
        if (filterType === 'roundtrip') matchesType = transfer.roundtripPrice > 0;

        return matchesSearch && matchesCategory && matchesType;
    });

    const activeCount = transfers.filter(t => t.isActive).length;
    const currentTransfers = filteredTransfers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset to page 1 when filters change
    const handleFilterChange = (setter) => (value) => {
        setter(value);
        setCurrentPage(1);
    };

    return (
        <div className="vtx-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

            <main className={`vtx-main ${isSidebarCollapsed ? "expanded" : ""}`}>
                <div className="vtx-container">

                    {/* HEADER */}
                    <header className="vtx-header">
                        <div className="vtx-header-content">
                            <h1 className="vtx-title">TRANSFER LISTINGS</h1>
                            <div className="vtx-subtitle">
                                Managing {transfers.length} transfers • {activeCount} active • {filteredTransfers.length} filtered
                            </div>
                        </div>
                        <button className="vtx-btn-add" onClick={() => navigate('/add-transfer')}>
                            <Plus size={18} strokeWidth={3} />
                            ADD NEW TRANSFER
                        </button>
                    </header>

                    {/* FILTERS */}
                    <TransferFilters
                        searchTerm={searchTerm}
                        setSearchTerm={handleFilterChange(setSearchTerm)}
                        filterCategory={filterCategory}
                        setFilterCategory={handleFilterChange(setFilterCategory)}
                        categories={categories}
                        filterType={filterType}
                        setFilterType={handleFilterChange(setFilterType)}
                    />

                    {/* CONTENT */}
                    {loading ? (
                        <div className="vtx-loading">
                            <div className="vtx-spinner"></div>
                            <p>Loading transfers...</p>
                        </div>
                    ) : filteredTransfers.length === 0 ? (
                        <div className="vtx-empty">
                            <h3>No transfers found</h3>
                            <p>Try adjusting your filters or add a new transfer.</p>
                        </div>
                    ) : (
                        <>
                            <TransfersTable
                                transfers={currentTransfers}
                                onView={handleView}
                                onToggleActive={handleToggleActive}
                            />
                            <TransferPagination
                                totalItems={filteredTransfers.length}
                                itemsPerPage={itemsPerPage}
                                currentPage={currentPage}
                                onPageChange={setCurrentPage}
                            />
                        </>
                    )}
                </div>
            </main>

            {/* DETAIL MODAL */}
            {showDetailModal && selectedTransfer && (
                <TransferDetailModal
                    transfer={selectedTransfer}
                    close={() => setShowDetailModal(false)}
                    onToggleActive={performToggle}
                    navigate={navigate}
                />
            )}

            {/* GLOBAL CONFIRM MODAL */}
            <CustomConfirmModal
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                type={confirmConfig.type}
                onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default ViewTransfers;

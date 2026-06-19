import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import PackageDetailModal from './PackageDetailModal';
import PackagePagination from './PackagePagination';
import PackageFilters from './PackageFilters';
import PackagesTable from './PackagesTable'; 
import './viewpackages.css';
import { useNavigate } from 'react-router-dom';

// Added Imports
import { useToast } from '../toast/ToastManager';
import CustomConfirmModal from "../../components/confirmationModal/CustomConfirmModal";

const ViewPackages = () => {
    // ✅ STATE: Matches Tours Logic
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const navigate = useNavigate();
    
    // Added Toast and Modal States
    const toast = useToast();
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        packageId: null,
        title: '',
        message: ''
    });

    const API_BASE_URL = 'https://wanderwaveph.onrender.com/api/packages';
    const getAdminHeaders = () => {
        const token = localStorage.getItem('adminToken');
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    // ✅ Toggle Function
    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/all`, { headers: getAdminHeaders() });
            const result = await response.json();
            if (result.status === 'ok') {
                const packagesWithDate = result.data.map(pkg => ({
                    ...pkg,
                    filterDate: pkg.createdAt ? new Date(pkg.createdAt).toLocaleDateString('en-CA') : '',
                    displayDate: pkg.createdAt ? new Date(pkg.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric'
                    }) : 'N/A'
                }));
                setPackages(packagesWithDate);
            }
        } catch (err) {
            console.error('Fetch error:', err);
            toast.error("Failed to load packages.", "Connection Error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const isLoggedIn = localStorage.getItem('adminToken');
        if (!isLoggedIn) navigate('/');
        fetchPackages();
    }, [navigate]);

    const getImageUrl = (image) => {
        if (!image) return "https://via.placeholder.com/400x300?text=No+Image";
        if (image.startsWith("http")) return image;
        return `https://wanderwaveph.onrender.com/uploads/${image}`;
    };

    const handleImageError = (e, pkg) => {
        e.target.onerror = null;
        if (pkg.imagePublicId && pkg.imagePublicId.trim() !== '') {
            const cloudinaryUrl = `https://res.cloudinary.com/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'dg0cmujxy'}/image/upload/${pkg.imagePublicId}`;
            e.target.src = cloudinaryUrl;
        } else {
            e.target.src = "https://via.placeholder.com/400x300?text=No+Image";
        }
    };

    // Triggered when clicking Archive button
    const handleArchiveClick = (packageId) => {
        setConfirmModal({
            isOpen: true,
            packageId: packageId,
            title: 'Archive Package',
            message: 'Are you sure you want to archive this package? This action can be reversed by administrators later.'
        });
    };

    // The actual archiving logic triggered by the Modal's Confirm button
    const handleConfirmArchive = async () => {
        const packageId = confirmModal.packageId;
        
        try {
            const userEmail = localStorage.getItem('adminEmail') || 'System Admin';
            const adminId = localStorage.getItem('adminId') || null;

            const response = await fetch(`${API_BASE_URL}/${packageId}/archive`, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userEmail: userEmail,
                    adminId: adminId
                })
            });

            const result = await response.json();
            if (result.status === 'ok') {
                setPackages(prev => prev.filter(pkg => pkg._id !== packageId));
                toast.success("Package has been archived successfully.", "Success");
            } else {
                toast.error(result.error || result.message, "Archive Failed");
            }
        } catch (err) {
            console.error("Error archiving:", err);
            toast.error("Failed to connect to the server.", "Server Error");
        } finally {
            setConfirmModal({ ...confirmModal, isOpen: false, packageId: null });
        }
    };

    const handleViewDetails = (pkg) => {
        setSelectedPackage(pkg);
        setShowDetailModal(true);
    };

    const categoryOptions = ['ALL', ...new Set(packages.map(p => p.category))];

    const filteredPackages = packages.filter(pkg => {
        // ✅ Null-safe search for both title and destination
        const matchesSearch =
            (pkg.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (pkg.destination?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'ALL' || pkg.category === filterCategory;
        let matchesDate = true;
        if (dateStart) matchesDate = matchesDate && pkg.filterDate >= dateStart;
        if (dateEnd) matchesDate = matchesDate && pkg.filterDate <= dateEnd;
        return matchesSearch && matchesCategory && matchesDate;
    });

    const currentPackages = filteredPackages.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="vpl-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            
            <main className={`vpl-main ${isSidebarCollapsed ? "expanded" : ""}`}>
                <div className="vpl-container">
                    
                    <header className="vpl-header">
                        <div className="vpl-header-content">
                            <h1 className="vpl-title">PACKAGE LIST</h1>
                            <div className="vpl-subtitle">
                                Managing {packages.length} packages • {filteredPackages.length} active
                            </div>
                        </div>
                        
                        <button className="vpl-btn-add" onClick={() => navigate('/add-package')}>
                            <Plus size={18} strokeWidth={3} />
                            ADD NEW PACKAGE
                        </button>
                    </header>

                    <PackageFilters
                        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                        filterCategory={filterCategory} setFilterCategory={setFilterCategory}
                        categoryOptions={categoryOptions}
                        dateStart={dateStart} setDateStart={setDateStart}
                        dateEnd={dateEnd} setDateEnd={setDateEnd}
                    />

                    {loading ? (
                        <div className="vpl-loading"><div className="vpl-spinner"></div><p>Loading packages...</p></div>
                    ) : filteredPackages.length === 0 ? (
                        <div className="vpl-empty"><h3>No packages found</h3></div>
                    ) : (
                        <>
                            <PackagesTable 
                                packages={currentPackages}
                                getImageUrl={getImageUrl}
                                handleImageError={handleImageError}
                                onView={handleViewDetails}
                                onArchive={handleArchiveClick}
                            />
                            
                            <PackagePagination
                                totalItems={filteredPackages.length}
                                itemsPerPage={itemsPerPage}
                                currentPage={currentPage}
                                onPageChange={setCurrentPage}
                            />
                        </>
                    )}
                </div>
            </main>

            {/* Custom Confirmation Modal */}
            <CustomConfirmModal 
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                type="danger"
                onConfirm={handleConfirmArchive}
                onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
            />

            {showDetailModal && (
                <PackageDetailModal
                    showModal={showDetailModal}
                    selectedPackage={selectedPackage}
                    setShowModal={setShowDetailModal}
                    handleArchive={handleArchiveClick}
                />
            )}
        </div>
    );
};
 
export default ViewPackages;
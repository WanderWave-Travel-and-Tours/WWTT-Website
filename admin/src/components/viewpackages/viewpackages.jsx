import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react'; // ✅ Using Plus Icon
import Sidebar from '../sidebar/sidebar';
import PackageDetailModal from './PackageDetailModal';
import PackagePagination from './PackagePagination';
import PackageFilters from './PackageFilters';
import PackagesTable from './PackagesTable'; 
import './viewpackages.css'; // ✅ Imported updated CSS
import { useNavigate } from 'react-router-dom';

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
    
    const API_BASE_URL = 'https://wanderwaveph-backend.onrender.com/api/packages';

    // ✅ Toggle Function
    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/all`);
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
        return `https://wanderwaveph-backend.onrender.com/uploads/${image}`;
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

    const handleArchive = async (packageId) => {
        if (window.confirm("Are you sure you want to archive this package?")) {
            try {
                const response = await fetch(`${API_BASE_URL}/${packageId}/archive`, { method: 'POST' });
                const result = await response.json();
                if (result.status === 'ok') {
                    setPackages(prev => prev.filter(pkg => pkg._id !== packageId));
                    alert("Package archived successfully!");
                }
            } catch (err) {
                console.error("Error archiving:", err);
            }
        }
    };

    const handleViewDetails = (pkg) => {
        setSelectedPackage(pkg);
        setShowDetailModal(true);
    };

    const categoryOptions = ['ALL', ...new Set(packages.map(p => p.category))];

    const filteredPackages = packages.filter(pkg => {
        const matchesSearch = pkg.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            pkg.destination.toLowerCase().includes(searchTerm.toLowerCase());
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
            
            {/* ✅ LAYOUT FIX: Uses 'expanded' class logic (Matches Tours) */}
            <main className={`vpl-main ${isSidebarCollapsed ? "expanded" : ""}`}>
                <div className="vpl-container">
                    
                    {/* ✅ HEADER UI: Matches Tours Design */}
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
                                onArchive={handleArchive}
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

            {showDetailModal && (
                <PackageDetailModal
                    showModal={showDetailModal}
                    selectedPackage={selectedPackage}
                    setShowModal={setShowDetailModal}
                    handleArchive={handleArchive}
                />
            )}
        </div>
    );
};

export default ViewPackages;
import React, { useState, useEffect } from 'react';
import { Trash2, Eye, Calendar, MapPin, Tag, Clock, Search } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import PackageDetailModal from './PackageDetailModal';
import PackagePagination from './PackagePagination';
import PackageFilters from './PackageFilters';
import './viewpackages.css';
import { useNavigate } from 'react-router-dom';

const ViewPackages = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // --- FILTERS STATE ---
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

    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/all`);
            const result = await response.json();
            if (result.status === 'ok') {
                const packagesWithDate = result.data.map(pkg => ({
                    ...pkg,
                    // ✅ FOR FILTERING: YYYY-MM-DD format (para sa comparison)
                    filterDate: pkg.createdAt ? new Date(pkg.createdAt).toLocaleDateString('en-CA') : '',
                    // ✅ FOR DISPLAY: Readable format (e.g., Oct 24, 2023)
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

    // ✅ ENHANCED FILTER LOGIC
    const filteredPackages = packages.filter(pkg => {
        // 1. Search Filter
        const matchesSearch = pkg.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            pkg.destination.toLowerCase().includes(searchTerm.toLowerCase());
        
        // 2. Category Filter
        const matchesCategory = filterCategory === 'ALL' || pkg.category === filterCategory;
        
        // 3. ✅ Date Range Filter (Using filterDate YYYY-MM-DD)
        let matchesDate = true;
        if (dateStart) {
            matchesDate = matchesDate && pkg.filterDate >= dateStart;
        }
        if (dateEnd) {
            matchesDate = matchesDate && pkg.filterDate <= dateEnd;
        }

        return matchesSearch && matchesCategory && matchesDate;
    });

    const currentPackages = filteredPackages.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="vt-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            <main className={`vt-main ${isSidebarCollapsed ? 'vt-main--collapsed' : ''}`}>
                <div className="vt-container">
                    <header className="vt-header">
                        <div className="vt-header-content">
                            <h1 className="vt-title">PACKAGE LIST</h1>
                            <p className="vt-subtitle">
                                Managing {packages.length} packages • {filteredPackages.length} active
                            </p>
                        </div>
                        <button className="vt-btn vt-btn--add" onClick={() => navigate('/add-package')}>
                            + Add New Package
                        </button>
                    </header>

                    <PackageFilters
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        filterCategory={filterCategory}
                        setFilterCategory={setFilterCategory}
                        categoryOptions={categoryOptions}
                        dateStart={dateStart}
                        setDateStart={setDateStart}
                        dateEnd={dateEnd}
                        setDateEnd={setDateEnd}
                    />

                    {loading ? (
                        <div className="vt-loading">
                            <div className="vt-spinner"></div>
                            <p>Loading packages...</p>
                        </div>
                    ) : filteredPackages.length === 0 ? (
                        <div className="vt-empty">
                            <span className="vt-empty-icon">📦</span>
                            <h3>No packages found</h3>
                            <p>Try adjusting your search or filter criteria</p>
                        </div>
                    ) : (
                        <>
                            <div className="vt-table-wrapper">
                                <table className="vt-table">
                                    <thead>
                                        <tr>
                                            <th>PACKAGE</th>
                                            <th>DESTINATION</th>
                                            <th>OVERVIEW</th>
                                            <th>DATE ADDED</th> 
                                            <th>PRICE</th>
                                            <th>STATUS</th>
                                            <th>ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentPackages.map((pkg) => (
                                            <tr key={pkg._id}>
                                                <td>
                                                    <div className="vt-customer-cell">
                                                        <div className="vt-image-preview">
                                                            <img 
                                                                src={getImageUrl(pkg.image)} 
                                                                alt={pkg.title}
                                                                onError={(e) => handleImageError(e, pkg)}
                                                            />
                                                        </div>
                                                        <span className="vt-customer-name">{pkg.title}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="vt-meta-cell">
                                                        <div className="vt-source"><MapPin size={14} /><span>{pkg.destination}</span></div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="vt-meta-cell">
                                                        <div className="vt-source"><Clock size={14} /><span>{pkg.duration}</span></div>
                                                        <div className="vt-date"><Tag size={14} /><span>{pkg.category}</span></div>
                                                    </div>
                                                </td>
                                                {/* ✅ NEW DATE CELL */}
                                                <td>
                                                    <div className="vt-date-added">
                                                        <Calendar size={14} />
                                                        <span>{pkg.displayDate}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="vt-rating">₱{pkg.price.toLocaleString()}</span>
                                                </td>
                                                <td>
                                                    <span className="vt-status vt-status--active">Active</span>
                                                </td>
                                                <td>
                                                    <div className="vt-actions">
                                                        <button className="vt-action-btn vt-action-btn--view" onClick={() => handleViewDetails(pkg)}>
                                                            <Eye size={16} /><span>View</span>
                                                        </button>
                                                        <button className="vt-action-btn vt-action-btn--delete" onClick={() => handleArchive(pkg._id)}>
                                                            <Trash2 size={16} /><span>Archive</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
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
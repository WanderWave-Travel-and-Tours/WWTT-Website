import React, { useState, useEffect } from 'react';
import { Trash2, Eye, Calendar, MapPin, Tag, Clock, Search } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import PackageDetailModal from './PackageDetailModal';
import PackagePagination from './PackagePagination';
import PackageFilters from './PackageFilters';
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal'; // Siguraduhin ang tamang path nito
import { useToast } from '../toast/ToastManager'; // Path na binigay mo
import './viewpackages.css';
import { useNavigate } from 'react-router-dom';

const ViewPackages = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    
    // Modal States
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [packageToArchive, setPackageToArchive] = useState(null);

    const navigate = useNavigate();
    const toast = useToast(); // Initialize Toast
    
    const API_BASE_URL = 'http://localhost:5000/api/packages';

    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/all`);
            const result = await response.json();
            if (result.status === 'ok') {
                setPackages(result.data);
            }
        } catch (err) {
            console.error('Fetch error:', err);
            toast.error("Failed to load packages. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const isLoggedIn = localStorage.getItem('adminToken');
        if (!isLoggedIn) {
            navigate('/');
        } else {
            fetchPackages();
        }
    }, [navigate]);

    // Helper function: PRIORITY - Database first, then Cloudinary
    const getImageUrl = (image) => {
        if (!image) return "https://via.placeholder.com/400x300?text=No+Image";
        if (image.startsWith("http")) return image;
        return `http://localhost:5000/uploads/${image}`;
    };

    // Smart error handler: If database fails, try Cloudinary
    const handleImageError = (e, pkg) => {
        e.target.onerror = null;
        if (pkg.imagePublicId && pkg.imagePublicId.trim() !== '') {
            const cloudinaryUrl = `https://res.cloudinary.com/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'dg0cmujxy'}/image/upload/${pkg.imagePublicId}`;
            e.target.src = cloudinaryUrl;
        } else {
            e.target.src = "https://via.placeholder.com/400x300?text=No+Image";
        }
    };

    // Step 1: Trigger the Custom Modal instead of window.confirm
    const openArchiveConfirmation = (pkg) => {
        setPackageToArchive(pkg);
        setShowConfirmModal(true);
    };

    // Step 2: The actual archive logic
    const handleArchive = async () => {
        if (!packageToArchive) return;

        try {
            const response = await fetch(`${API_BASE_URL}/${packageToArchive._id}/archive`, { 
                method: 'POST' 
            });
            const result = await response.json();
            
            if (result.status === 'ok') {
                setPackages(prev => prev.filter(pkg => pkg._id !== packageToArchive._id));
                toast.success(`Package "${packageToArchive.title}" has been archived.`, "Archived Successfully");
            } else {
                toast.error("Something went wrong while archiving.");
            }
        } catch (err) {
            console.error("Error archiving:", err);
            toast.error("Could not connect to the server.");
        } finally {
            setShowConfirmModal(false);
            setPackageToArchive(null);
            // Close detail modal if it was open
            setShowDetailModal(false);
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
        return matchesSearch && matchesCategory;
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
                                            <th>DURATION & CAT</th>
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
                                                        <button className="vt-action-btn vt-action-btn--delete" onClick={() => openArchiveConfirmation(pkg)}>
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

            {/* Modal para sa Detalye */}
            {showDetailModal && (
                <PackageDetailModal
                    showModal={showDetailModal}
                    selectedPackage={selectedPackage}
                    setShowModal={setShowDetailModal}
                    handleArchive={() => openArchiveConfirmation(selectedPackage)}
                />
            )}

            {/* Custom Confirmation Modal */}
            <CustomConfirmModal
                isOpen={showConfirmModal}
                type="danger"
                title="Confirm Archive"
                message={`Are you sure you want to archive "${packageToArchive?.title}"? This will hide the package from public view.`}
                onConfirm={handleArchive}
                onCancel={() => setShowConfirmModal(false)}
            />
        </div>
    );
};

export default ViewPackages;
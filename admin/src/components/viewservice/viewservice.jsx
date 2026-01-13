import React, { useState, useEffect } from 'react';
import Sidebar from '../sidebar/sidebar';
import './viewservice.css';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, Plane, BookOpen, Hotel, FileText, 
  Calendar, Ship, HeartHandshake, ShieldCheck, 
  ToggleLeft, ToggleRight 
} from 'lucide-react'; 

// Import Hooks and Components
import { useToast } from '../toast/ToastManager';
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal';

const API_BASE_URL = 'http://localhost:5000/api/services';
const ADMIN_FETCH_URL = `${API_BASE_URL}/admin/all`;

const ViewServices = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Toast and Modal States
    const toast = useToast();
    const navigate = useNavigate();
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        type: 'primary'
    });

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const closeModal = () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
    };

    useEffect(() => {
        const isLoggedIn = localStorage.getItem('adminToken');
        if (!isLoggedIn) {
            navigate('/');
        }
    }, [navigate]);

    const fetchServices = async () => {
        try {
            const response = await fetch(ADMIN_FETCH_URL); 
            const result = await response.json();

            if (response.ok && result.success) {
                const processedServices = result.data.map(service => ({
                  ...service,
                  isComingSoon: !service.isActive,
                }));

                processedServices.sort((a, b) => {
                  if (a.isActive !== b.isActive) {
                    return a.isActive ? -1 : 1; 
                  }
                  return (a.order || 0) - (b.order || 0);
                });
                
                setServices(processedServices);
            } else {
                setError('Error: ' + (result.message || 'Failed to fetch data.'));
                toast.error(result.message || 'Failed to fetch services', 'Fetch Error');
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Network error: Could not connect to the server.');
            toast.error('Could not connect to the server.', 'Network Error');
        } finally {
            setLoading(false);
        }
    };

    const toggleComingSoon = (serviceId, currentIsActive) => {
        const newIsActive = !currentIsActive;
        
        setModalConfig({
            isOpen: true,
            title: newIsActive ? "Activate Service" : "Set to Coming Soon",
            message: newIsActive 
                ? "Are you sure you want to activate this service? It will be visible on the front-end." 
                : "Are you sure you want to mark this as 'Coming Soon'? This will hide it from the front-end.",
            type: "primary",
            onConfirm: () => handleToggleStatus(serviceId, newIsActive)
        });
    };

    const handleToggleStatus = async (serviceId, newIsActive) => {
        closeModal();
        try {
            const response = await fetch(`${API_BASE_URL}/${serviceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: newIsActive }), 
            });

            if (response.ok) {
                toast.success(
                    `Service is now ${newIsActive ? 'Active' : 'Coming Soon'}`, 
                    'Status Updated'
                );
                fetchServices();
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || "Failed to update status", "Server Error");
            }
        } catch (err) {
            console.error('Toggle error:', err);
            toast.error("Network error during status update.", "Connection Failed");
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const getIconComponent = (iconName) => {
        const icons = {
            Briefcase, Plane, BookOpen, Hotel, FileText, 
            Calendar, Ship, HeartHandshake, ShieldCheck
        };
        const Icon = icons[iconName] || Briefcase; 
        return <Icon size={16} />;
    };

    const handleEdit = (serviceId) => {
        navigate(`/edit-service/${serviceId}`); 
    };

    const handleDeleteClick = (serviceId) => {
        setModalConfig({
            isOpen: true,
            title: "Delete Service",
            message: "Are you sure you want to delete this service? This action cannot be undone.",
            type: "danger",
            onConfirm: () => performDelete(serviceId)
        });
    };

    const performDelete = async (serviceId) => {
        closeModal();
        try {
            const response = await fetch(`${API_BASE_URL}/${serviceId}`, {
                method: 'DELETE',
            });
            const result = await response.json();

            if (response.ok && result.success) {
                toast.success("Service has been permanently removed.", "Deleted Successfully");
                fetchServices();
            } else {
                toast.error(result.message || "Server error", "Delete Failed");
            }
        } catch (err) {
            console.error('Delete error:', err);
            toast.error("Network error during deletion.", "Connection Failed");
        }
    };

    if (loading) {
        return (
            <div className="viewservices-page">
                <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
                <main className={`viewservices-main ${isSidebarCollapsed ? "viewservices-main--collapsed" : ""}`}>
                    <div className="viewservices-loader">
                        <div className="viewservices-spinner"></div>
                        <p>Loading services...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="viewservices-page">
                <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
                <main className={`viewservices-main ${isSidebarCollapsed ? "viewservices-main--collapsed" : ""}`}>
                    <div className="viewservices-error">
                        <span className="viewservices-error-icon">⚠️</span>
                        <p>{error}</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="viewservices-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            <main className={`viewservices-main ${isSidebarCollapsed ? "viewservices-main--collapsed" : ""}`}>
                <div className="viewservices-container">
                    <header className="viewservices-header">
                        <div className="viewservices-header-left">
                            <h1 className="viewservices-title">SERVICE LISTS</h1>
                            <p className="viewservices-subtitle">Manage all non-package/non-tour services ({services.length} total)</p>
                        </div>
                        <button className="viewservices-btn viewservices-btn--add" onClick={() => navigate('/add-service')}>
                            + Add New Service
                        </button>
                    </header>

                    {services.length === 0 ? (
                        <div className="viewservices-empty">
                            <span className="viewservices-empty-icon">💼</span>
                            <h3>No services yet</h3>
                            <p>Start by creating your first service offering</p>
                            <button className="viewservices-btn viewservices-btn--add" onClick={() => navigate('/add-service')}>
                                + Add Service
                            </button>
                        </div>
                    ) : (
                        <div className="viewservices-grid">
                            {services.map((service) => (
                                <div 
                                    key={service._id} 
                                    className={`viewservices-card ${!service.isActive ? 'viewservices-card--coming-soon' : ''}`}
                                >
                                    <div className="viewservices-status-bar">
                                        <div className={`viewservices-status-indicator ${service.isActive ? 'is-active' : 'is-coming-soon'}`}>
                                            {service.isActive ? 'ACTIVE' : 'COMING SOON'}
                                        </div>
                                        <button 
                                            className="viewservices-toggle-btn"
                                            onClick={() => toggleComingSoon(service._id, service.isActive)}
                                            title={service.isActive ? 'Mark as Coming Soon' : 'Activate Service'}
                                        >
                                            {service.isActive ? (
                                                <ToggleRight size={32} className="toggle-on" />
                                            ) : (
                                                <ToggleLeft size={32} className="toggle-off" />
                                            )}
                                        </button>
                                    </div>
                                    
                                    <div className="viewservices-card-image">
                                        <img 
                                            src={service.image.startsWith('http') 
                                                ? service.image 
                                                : `http://localhost:5000/uploads/${service.image}`
                                            } 
                                            alt={service.title} 
                                        />
                                    {!service.isActive && <span className="viewservices-soon-tag">COMING SOON</span>}
                                        <span className="viewservices-card-category">{service.category}</span>
                                    </div>
                                    
                                    <div className="viewservices-card-body">
                                        <h3 className="viewservices-card-title">{service.title.toUpperCase()}</h3>
                                        
                                        <div className="viewservices-card-info">
                                            <div className="viewservices-info-row">
                                                <Briefcase size={16} />
                                                <span>Status: {service.isActive ? 'Active' : 'Inactive'}</span>
                                            </div>
                                            <div className="viewservices-info-row">
                                                {getIconComponent(service.icon)}
                                                <span>Order: {service.order}</span>
                                            </div>
                                        </div>

                                        <div className="viewservices-card-footer">
                                            <div className="viewservices-price">
                                                <span className="viewservices-price-label">PRICE</span>
                                                <span className="viewservices-price-value">₱{service.price ? service.price.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "0.00"}</span>
                                            </div>
                                            
                                            <div className="viewservices-actions">
                                                <button 
                                                    className="viewservices-btn-action viewservices-btn-action--edit"
                                                    onClick={() => handleEdit(service._id)}
                                                    disabled={!service.isActive}
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    className="viewservices-btn-action viewservices-btn-action--delete"
                                                    onClick={() => handleDeleteClick(service._id)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Global Confirmation Modal Instance */}
            <CustomConfirmModal 
                isOpen={modalConfig.isOpen}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onConfirm={modalConfig.onConfirm}
                onCancel={closeModal}
            />
        </div>
    );
};

export default ViewServices;
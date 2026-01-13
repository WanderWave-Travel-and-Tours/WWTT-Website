import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../sidebar/sidebar';
import AdminFilters from './AdminFilters';
import AdminPagination from './AdminPagination';
import AddAdminModal from './Addadminmodal';
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal'; // Path as requested
import { useToast } from '../toast/ToastManager'; // Path as requested
import { 
  UserCog, 
  Plus
} from 'lucide-react';
import './ViewAdmin.css';
import './AdminFilters.css';
import './AdminPagination.css';
import axios from 'axios';

// =========================================================================
// MAIN VIEW ADMIN COMPONENT
// =========================================================================
const ADMINS_PER_PAGE = 10;

const ViewAdmin = () => {
  const navigate = useNavigate();
  const toast = useToast(); // Initialize toast
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [isMainAdmin, setIsMainAdmin] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State para sa Custom Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    adminId: null,
    adminEmail: ''
  });

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const getRoles = () => {
    return ['ALL', 'Main Admin', 'Admin'];
  };

  const roleOptions = getRoles();

  const getFilterClassName = (role) => {
    return filterRole === role ? 'af-active-navy' : '';
  };

  useEffect(() => {
    const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
    const mainAdmin = adminData.email?.toLowerCase() === 'info@wanderwavetravelandtours.com';
    
    if (!mainAdmin) {
      toast.error('Access Denied: Only Main Admin can access this page', 'Security Error');
      navigate('/dashboard');
      return;
    }
    
    setIsMainAdmin(true);
  }, [navigate, toast]);

  useEffect(() => {
    if (!isMainAdmin) return;
    fetchAdmins();
  }, [isMainAdmin]);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5000/api/admin/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.status === 'ok') {
        setAdmins(data.admins || []);
        console.log('✅ Admins loaded:', data.admins.length);
      } else {
        console.error('❌ Failed to fetch admins:', data.message);
        toast.error('Failed to load admins: ' + data.message, 'Fetch Error');
      }
    } catch (error) {
      console.error('❌ Error fetching admins:', error);
      toast.error('Error loading admins. Please try again.', 'Connection Error');
    } finally {
      setIsLoading(false);
    }
  };

  // Function para buksan ang Confirmation Modal
  const openDeleteConfirm = (adminId, adminEmail) => {
    if (adminEmail.toLowerCase() === 'info@wanderwavetravelandtours.com') {
      toast.warning('Cannot delete Main Admin account!', 'Action Restricted');
      return;
    }
    setConfirmModal({
      isOpen: true,
      adminId,
      adminEmail
    });
  };

  // Ang actual na delete function na tinatawag ng Modal
  const handleDeleteAdmin = async () => {
    const { adminId, adminEmail } = confirmModal;
    
    // Isara muna ang modal
    setConfirmModal({ ...confirmModal, isOpen: false });

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/admin/delete/${adminId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.status === 'ok') {
        toast.success(`Admin ${adminEmail} archived successfully!`, 'Success');
        fetchAdmins();
        
        const updatedAdmins = admins.filter(admin => admin.id !== adminId);
        if (currentPage > Math.ceil(updatedAdmins.length / ADMINS_PER_PAGE)) {
          setCurrentPage(Math.max(1, currentPage - 1));
        }
      } else {
        toast.error('Failed to archive admin: ' + data.message, 'Error');
      }
    } catch (error) {
      console.error('❌ Error archiving admin:', error);
      toast.error('Error archiving admin. Please try again.', 'System Error');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = 
      admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const isMainAdminAccount = admin.email.toLowerCase() === 'info@wanderwavetravelandtours.com';
    const adminRole = isMainAdminAccount ? 'Main Admin' : 'Admin';
    const matchesRole = filterRole === 'ALL' || adminRole === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const totalAdmins = filteredAdmins.length;
  const totalPages = Math.ceil(totalAdmins / ADMINS_PER_PAGE);
  const indexOfLastAdmin = currentPage * ADMINS_PER_PAGE;
  const indexOfFirstAdmin = indexOfLastAdmin - ADMINS_PER_PAGE;
  const currentAdmins = filteredAdmins.slice(indexOfFirstAdmin, indexOfLastAdmin);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const activeCount = admins.length;
  const mainClasses = `view-admins-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`;

  if (!isMainAdmin) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="view-admins-wrapper">
        <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
        <main className={mainClasses}>
          <div className="view-admins-container loading-state">
            <div className="spinner"></div>
            <p>Loading admins...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="view-admins-wrapper">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      <main className={mainClasses}>
        <div className="view-admins-container">
          <div className="view-admins-header-actions">
            <div className="header-left">
              <h1 className="view-admins-title">SYSTEM ADMINS</h1>
              <p className="view-admins-subtitle">
                Managing {admins.length} admin account{admins.length !== 1 ? 's' : ''} • {activeCount} currently active
              </p>
            </div>
            <button 
              className="add-admin-btn"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus size={20} />
              Add New Admin
            </button>
          </div>

          <AdminFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterRole={filterRole}
            setFilterRole={setFilterRole}
            roleOptions={roleOptions}
            getFilterClassName={getFilterClassName}
          />

          {filteredAdmins.length === 0 ? (
            <div className="empty-state">
              <UserCog size={64} className="empty-icon" />
              <h3>No Admins Found</h3>
              <p>
                {searchTerm || filterRole !== 'ALL'
                  ? 'No admins match your search criteria' 
                  : 'No administrators have been added yet'}
              </p>
            </div>
          ) : (
            <>
              <div className="admins-table-wrapper">
                <table className="admins-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>FULL NAME</th>
                      <th>EMAIL</th>
                      <th>ROLE</th>
                      <th>STATUS</th>
                      <th>CREATED AT</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentAdmins.map((admin, index) => {
                      const isMainAdminAccount = admin.email.toLowerCase() === 'info@wanderwavetravelandtours.com';
                      const itemNumber = indexOfFirstAdmin + index + 1;
                      
                      return (
                        <tr key={admin.id}>
                          <td>{itemNumber}</td>
                          <td>
                            <span className="admin-name">{admin.username}</span>
                          </td>
                          <td>{admin.email}</td>
                          <td>
                            <span className={`admin-role-badge ${isMainAdminAccount ? 'main-admin' : 'admin'}`}>
                              {isMainAdminAccount ? 'Main Admin' : 'Admin'}
                            </span>
                          </td>
                          <td>
                            <span className="admin-status-badge active">Active</span>
                          </td>
                          <td>
                            <div className="admin-date">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                              </svg>
                              <span>{formatDate(admin.createdAt)}</span>
                            </div>
                          </td>
                          <td>
                            <div className="admin-actions">
                              {isMainAdminAccount ? (
                                <button className="admin-action-btn protected">
                                  Protected
                                </button>
                              ) : (
                                <button
                                  className="admin-action-btn archive"
                                  onClick={() => openDeleteConfirm(admin.id, admin.email)}
                                >
                                  Archive
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <AdminPagination
                totalItems={totalAdmins}
                itemsPerPage={ADMINS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={paginate}
              />
            </>
          )}
        </div>
      </main>

      {/* MODAL COMPONENTS */}
      <AddAdminModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdminAdded={fetchAdmins}
      />

      <CustomConfirmModal
        isOpen={confirmModal.isOpen}
        title="Confirm Archive"
        message={`Are you sure you want to archive admin: ${confirmModal.adminEmail}? This action cannot be undone.`}
        type="danger"
        onConfirm={handleDeleteAdmin}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
};

export default ViewAdmin;
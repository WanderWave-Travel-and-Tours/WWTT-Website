import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../sidebar/sidebar';
import { UserCog, Plus, Trash2, Search, Shield, User } from 'lucide-react';
import './ViewAdmin.css';

const ViewAdmin = () => {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMainAdmin, setIsMainAdmin] = useState(false);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  // ✅ Check if current user is main admin
  useEffect(() => {
    const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
    const mainAdmin = adminData.email?.toLowerCase() === 'info@wanderwavetravelandtours.com';
    
    if (!mainAdmin) {
      alert('⛔ Access Denied: Only Main Admin can access this page');
      navigate('/dashboard');
      return;
    }
    
    setIsMainAdmin(true);
  }, [navigate]);

  // ✅ Fetch all admins
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
        alert('Failed to load admins: ' + data.message);
      }
    } catch (error) {
      console.error('❌ Error fetching admins:', error);
      alert('Error loading admins. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId, adminEmail) => {
    // Prevent deleting main admin
    if (adminEmail.toLowerCase() === 'info@wanderwavetravelandtours.com') {
      alert('⛔ Cannot delete Main Admin account!');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete admin: ${adminEmail}?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

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
        alert('✅ Admin deleted successfully!');
        fetchAdmins(); // Refresh list
      } else {
        alert('❌ Failed to delete admin: ' + data.message);
      }
    } catch (error) {
      console.error('❌ Error deleting admin:', error);
      alert('Error deleting admin. Please try again.');
    }
  };

  const filteredAdmins = admins.filter(admin =>
    admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isMainAdmin) {
    return null; // Don't render anything if not main admin
  }

  return (
    <div className="view-admins-wrapper">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      <div className={`view-admins-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="view-admins-container">
          {/* Header */}
          <div className="view-admins-header">
            <div className="header-left">
              <UserCog size={32} className="header-icon" />
              <div>
                <h1 className="page-title">Admin Management</h1>
                <p className="page-subtitle">View and manage system administrators</p>
              </div>
            </div>
            <button 
              className="add-admin-btn"
              onClick={() => navigate('/add-admin')}
            >
              <Plus size={20} />
              Add New Admin
            </button>
          </div>

          {/* Search Bar */}
          <div className="search-section">
            <div className="search-box">
              <Search size={20} className="search-icon" />
              <input
                type="text"
                placeholder="Search admins by email or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          {/* Admins Table */}
          <div className="admins-table-container">
            {isLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading admins...</p>
              </div>
            ) : filteredAdmins.length === 0 ? (
              <div className="empty-state">
                <UserCog size={64} className="empty-icon" />
                <h3>No Admins Found</h3>
                <p>
                  {searchTerm 
                    ? 'No admins match your search criteria' 
                    : 'No administrators have been added yet'}
                </p>
              </div>
            ) : (
              <table className="admins-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Created Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdmins.map((admin) => {
                    const isMainAdminAccount = admin.email.toLowerCase() === 'info@wanderwavetravelandtours.com';
                    
                    return (
                      <tr key={admin.id}>
                        <td>
                          <div className="admin-email">
                            {isMainAdminAccount && (
                              <Shield size={16} className="main-admin-badge" />
                            )}
                            {admin.email}
                          </div>
                        </td>
                        <td>
                          <div className="admin-username">
                            <User size={16} />
                            {admin.username}
                          </div>
                        </td>
                        <td>
                          <span className={`role-badge ${isMainAdminAccount ? 'main-admin' : 'admin'}`}>
                            {isMainAdminAccount ? 'Main Admin' : 'Admin'}
                          </span>
                        </td>
                        <td className="date-cell">
                          {new Date(admin.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td>
                          {isMainAdminAccount ? (
                            <span className="protected-badge">Protected</span>
                          ) : (
                            <button
                              className="delete-btn"
                              onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                              title="Delete Admin"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Stats Footer */}
          <div className="admins-stats">
            <div className="stat-item">
              <span className="stat-label">Total Admins:</span>
              <span className="stat-value">{admins.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Showing:</span>
              <span className="stat-value">{filteredAdmins.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewAdmin;
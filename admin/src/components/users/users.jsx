import React, { useState, useEffect } from 'react';
import Sidebar from '../sidebar/sidebar';
import UserFilters from './UserFilters';
import UserPagination from './Userpagination';
import { UserCog } from 'lucide-react';
import './users.css';
import './UserFilters.css';
import './UserPagination.css';

// =========================================================================
// MAIN USERS COMPONENT
// =========================================================================
const USERS_PER_PAGE = 10;

const Users = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);

    const API_URL = 'https://wanderwaveph-backend.onrender.com/api/users';

    // Get dynamic status options
    const getStatusOptions = () => {
        return ['ALL', 'Active', 'Inactive'];
    };

    const statusOptions = getStatusOptions();

    const getFilterClassName = (status) => {
        return filterStatus === status ? 'uf-active-navy' : '';
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch(API_URL);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(errorData.message || 'Failed to fetch users');
            }
            
            const data = await response.json();
            setUsers(data);
            setError(null);
        } catch (error) {
            console.error("Error loading users:", error);
            setError(`Could not fetch data. Ensure the backend server is running on port 5000 and connected to MongoDB.`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const getStatus = (isActive) => {
        return isActive ? 'Active' : 'Inactive';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleArchive = async (id, username) => {
        if (window.confirm(`Are you sure you want to ARCHIVE user: ${username}?`)) {
            try {
                const response = await fetch(`${API_URL}/archive/${id}`, {
                    method: 'PUT',
                });

                if (response.ok) {
                    const updatedUsers = users.filter(user => user._id !== id);
                    setUsers(updatedUsers);
                    
                    if (currentPage > Math.ceil(updatedUsers.length / USERS_PER_PAGE)) {
                        setCurrentPage(Math.max(1, currentPage - 1));
                    }
                    alert(`User ${username} has been archived.`);
                } else {
                    const errorData = await response.json();
                    alert(`Failed to archive user: ${errorData.message || response.statusText}`);
                }
            } catch (error) {
                console.error("Error archiving:", error);
                alert("Server error during archiving.");
            }
        }
    };

    // Filter users based on search and status
    const filteredUsers = users.filter(user => {
        const matchesSearch = 
            user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        
        const userStatus = getStatus(user.isActive);
        const matchesStatus = filterStatus === 'ALL' || userStatus === filterStatus;
        
        return matchesSearch && matchesStatus;
    });

    const totalUsers = filteredUsers.length;
    const totalPages = Math.ceil(totalUsers / USERS_PER_PAGE);
    const indexOfLastUser = currentPage * USERS_PER_PAGE;
    const indexOfFirstUser = indexOfLastUser - USERS_PER_PAGE;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

    const paginate = (pageNumber) => {
        if (pageNumber > 0 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    const activeUsers = users.filter(u => getStatus(u.isActive) === 'Active').length;
    const mainClasses = `vusers-main ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`;

    if (loading) {
        return (
            <div className="vusers-page">
                <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
                <main className={mainClasses}>
                    <div className="vusers-container loading-state">
                        <div className="spinner"></div>
                        <p>Loading users...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="vusers-page">
                <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
                <main className={mainClasses}>
                    <div className="vusers-container error-state">{error}</div>
                </main>
            </div>
        );
    }

    return (
        <div className="vusers-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            <main className={mainClasses}>
                <div className="vusers-container">
                    <header className="vusers-header">
                        <div className="vusers-header-content">
                            <h1 className="vusers-title">SYSTEM USERS</h1>
                            <p className="vusers-subtitle">
                                Managing {users.length} user account{users.length !== 1 ? 's' : ''} • {activeUsers} currently active
                            </p>
                        </div>
                    </header>

                    <UserFilters
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        filterStatus={filterStatus}
                        setFilterStatus={setFilterStatus}
                        statusOptions={statusOptions}
                        getFilterClassName={getFilterClassName}
                    />

                    {filteredUsers.length === 0 ? (
                        <div className="vusers-empty">
                            <UserCog size={64} className="vusers-empty-icon" />
                            <h3>No Users Found</h3>
                            <p>
                                {searchTerm || filterStatus !== 'ALL'
                                    ? 'No users match your search criteria' 
                                    : 'No user accounts have been created yet'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="vusers-table-wrapper">
                                <table className="vusers-table">
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
                                        {currentUsers.map((user, index) => {
                                            const status = getStatus(user.isActive);
                                            const itemNumber = indexOfFirstUser + index + 1;
                                            return (
                                                <tr key={user._id}>
                                                    <td>{itemNumber}</td>
                                                    <td><span className="vusers-name">{user.fullName}</span></td>
                                                    <td>{user.email}</td>
                                                    <td><span className={`vusers-role vusers-role--${user.role}`}>{user.role}</span></td>
                                                    <td><span className={`vusers-status vusers-status--${status.toLowerCase()}`}>{status}</span></td>
                                                    <td>
                                                        <div className="vusers-date">
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                                                <line x1="16" y1="2" x2="16" y2="6"/>
                                                                <line x1="8" y1="2" x2="8" y2="6"/>
                                                                <line x1="3" y1="10" x2="21" y2="10"/>
                                                            </svg>
                                                            <span>{formatDate(user.createdAt)}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="vusers-actions">
                                                            <button 
                                                                className="vusers-action-btn vusers-action-btn--archive"
                                                                onClick={() => handleArchive(user._id, user.fullName)}
                                                            >
                                                                Archive
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* 🔥 PAGINATION IS NOW OUTSIDE THE TABLE WRAPPER! */}
                            <UserPagination
                                totalItems={totalUsers}
                                itemsPerPage={USERS_PER_PAGE}
                                currentPage={currentPage}
                                onPageChange={paginate}
                            />
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Users;
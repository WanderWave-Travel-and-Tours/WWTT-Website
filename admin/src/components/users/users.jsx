import React, { useState, useEffect } from 'react';
import Sidebar from '../sidebar/sidebar';
import './users.css';

// =========================================================================
// PAGINATION COMPONENT (New)
// =========================================================================
const Pagination = ({ applicationsPerPage, totalApplications, paginate, currentPage }) => {
  const pageNumbers = [];
  const totalPages = Math.ceil(totalApplications / applicationsPerPage);

  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const handlePrev = () => {
    if (currentPage > 1) {
      paginate(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      paginate(currentPage + 1);
    }
  };

  if (totalApplications <= applicationsPerPage) return null;

  return (
    <nav className="pagination-nav">
      <ul className="pagination-list">
        <li>
          <button 
            onClick={handlePrev} 
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
        </li>
        {pageNumbers.map(number => (
          <li key={number} className="page-item">
            <button 
              onClick={() => paginate(number)} 
              className={`pagination-btn ${number === currentPage ? 'active' : ''}`}
            >
              {number}
            </button>
          </li>
        ))}
        <li>
          <button 
            onClick={handleNext} 
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
};
// =========================================================================
// END PAGINATION COMPONENT
// =========================================================================


const USERS_PER_PAGE = 10;

const Users = () => {

// --- SIDEBAR TOGGLE LOGIC START ---
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };
    // --- SIDEBAR TOGGLE LOGIC END ---


    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const API_URL = 'http://localhost:5000/api/users';

    const fetchUsers = async () => {
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

    const handleDelete = async (id, username) => {
        if (window.confirm(`Are you sure you want to delete user: ${username}?`)) {
            try {
                const response = await fetch(`${API_URL}/${id}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    const updatedUsers = users.filter(user => user._id !== id);
                    setUsers(updatedUsers);
                    
                    if (currentPage > Math.ceil(updatedUsers.length / USERS_PER_PAGE)) {
                        setCurrentPage(Math.max(1, currentPage - 1));
                    }
                    alert(`User ${username} has been deleted.`);
                } else {
                    const errorData = await response.json();
                    alert(`Failed to delete user: ${errorData.message || response.statusText}`);
                }
            } catch (error) {
                console.error("Error deleting:", error);
                alert("Server error during deletion.");
            }
        }
    };

    const totalUsers = users.length;
    const totalPages = Math.ceil(totalUsers / USERS_PER_PAGE);
    const indexOfLastUser = currentPage * USERS_PER_PAGE;
    const indexOfFirstUser = indexOfLastUser - USERS_PER_PAGE;
    const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);

    const paginate = (pageNumber) => {
        if (pageNumber > 0 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    const activeUsers = users.filter(u => getStatus(u.isActive) === 'Active').length;

    if (loading) {
        return (
            <div className="vusers-page">
                <Sidebar />
                <main className="vusers-main">
                    <div className="vusers-container loading-state">Loading users...</div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="vusers-page">
                <Sidebar />
                <main className="vusers-main">
                    <div className="vusers-container error-state">{error}</div>
                </main>
            </div>
        );
    }

    return (
        <div className="vusers-page">
                        <Sidebar 
                isCollapsed={isSidebarCollapsed} 
                toggleSidebar={toggleSidebar} 
            />
            <main className="vusers-main">
                <div className="vusers-container">
                    <header className="vusers-header">
                        <h1 className="vusers-title">SYSTEM USERS</h1>
                        <p className="vusers-subtitle">
                            Managing {users.length} user accounts • {activeUsers} currently active
                        </p>
                    </header>

                    {users.length === 0 ? (
                        <div className="vusers-empty">
                            <span className="vusers-empty-icon">👥</span>
                            <h3>No users found</h3>
                            <p>Start by creating the first user account</p>
                        </div>
                    ) : (
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
                                                <td>
                                                    <span className="vusers-name">{user.fullName}</span>
                                                </td>
                                                <td>{user.email}</td>
                                                <td>
                                                    <span className={`vusers-role vusers-role--${user.role}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`vusers-status vusers-status--${status.toLowerCase()}`}>
                                                        {status}
                                                    </span>
                                                </td>
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
                                                            className="vusers-action-btn vusers-action-btn--delete"
                                                            onClick={() => handleDelete(user._id, user.fullName)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="pagination-container">
                            <button 
                                className="page-btn"
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                &larr; Previous
                            </button>
                            
                            <span className="page-info">
                                Page {currentPage} of {totalPages}
                            </span>

                            <button
                                className="page-btn"
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Next &rarr;
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Users;
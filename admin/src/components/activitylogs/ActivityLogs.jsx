import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../sidebar/sidebar.jsx';
import { Activity, AlertCircle, CheckCircle, Info, XCircle, RefreshCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import ActivityLogsStats from './ActivityLogsStats';
import ActivityLogsFilters from './ActivityLogsFilters';
import ActivityLogsTable from './ActivityLogsTable';
import ActivityLogsDetailModal from './ActivityLogsDetailModal';
import ActivityLogsPagination from './ActivityLogsPagination';
import './ActivityLogs.css';

const ActivityLogs = () => {
    const navigate = useNavigate();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    
    // Activity Logs Data State
    const [activityLogs, setActivityLogs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedActionType, setSelectedActionType] = useState('ALL');
    const [selectedModule, setSelectedModule] = useState('ALL Modules');
    const [selectedSeverity, setSelectedSeverity] = useState('ALL Severity');
    const [sortOrder, setSortOrder] = useState('desc');
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;
    
    // Modal State
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);

    // Check authentication
    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            navigate('/admin');
        }
    }, [navigate]);

    // Fetch Activity Logs from API
    useEffect(() => {
        fetchActivityLogs();
    }, []);

    const fetchActivityLogs = async () => {
        setLoading(true);
        try {
            // REPLACE WITH YOUR ACTUAL API ENDPOINT
            // const response = await fetch('https://your-api.com/api/activity-logs');
            // const data = await response.json();
            // setActivityLogs(data);
            
            // MOCK DATA FOR DEMONSTRATION
            const mockLogs = generateMockActivityLogs();
            setActivityLogs(mockLogs);
        } catch (error) {
            console.error('Error fetching activity logs:', error);
        } finally {
            setLoading(false);
        }
    };

    // Generate Mock Activity Logs
    const generateMockActivityLogs = () => {
        const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT', 'IMPORT'];
        const modules = ['Bookings', 'Packages', 'Users', 'Services', 'Hotels', 'Tours', 'Settings', 'Promos'];
        const users = ['Admin User', 'John Doe', 'Jane Smith', 'System Admin', 'Manager'];
        const severities = ['INFO', 'WARNING', 'ERROR', 'SUCCESS'];
        
        return Array.from({ length: 100 }, (_, i) => {
            const action = actions[Math.floor(Math.random() * actions.length)];
            const module = modules[Math.floor(Math.random() * modules.length)];
            const user = users[Math.floor(Math.random() * users.length)];
            const severity = severities[Math.floor(Math.random() * severities.length)];
            const timestamp = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
            
            return {
                id: `LOG-${String(i + 1).padStart(6, '0')}`,
                logNumber: i + 1,
                action: action,
                module: module,
                user: user,
                severity: severity,
                description: `${action} operation performed on ${module}`,
                timestamp: timestamp.toISOString(),
                ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                details: {
                    affectedRecords: Math.floor(Math.random() * 10) + 1,
                    duration: `${Math.floor(Math.random() * 5000)}ms`,
                    endpoint: `/api/${module.toLowerCase()}`,
                    method: action === 'CREATE' ? 'POST' : action === 'UPDATE' ? 'PUT' : action === 'DELETE' ? 'DELETE' : 'GET',
                    statusCode: severity === 'ERROR' ? 500 : 200
                }
            };
        });
    };

    // Filter and Sort Logic
    const getFilteredAndSortedLogs = () => {
        let filtered = [...activityLogs];

        // Filter by action type
        if (selectedActionType !== 'ALL') {
            filtered = filtered.filter(log => log.action === selectedActionType);
        }

        // Filter by module
        if (selectedModule !== 'ALL Modules') {
            filtered = filtered.filter(log => log.module === selectedModule);
        }

        // Filter by severity
        if (selectedSeverity !== 'ALL Severity') {
            filtered = filtered.filter(log => log.severity === selectedSeverity);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(log =>
                log.id.toLowerCase().includes(query) ||
                log.action.toLowerCase().includes(query) ||
                log.module.toLowerCase().includes(query) ||
                log.user.toLowerCase().includes(query) ||
                log.description.toLowerCase().includes(query)
            );
        }

        // Sort by log number
        filtered.sort((a, b) => {
            return sortOrder === 'asc' ? a.logNumber - b.logNumber : b.logNumber - a.logNumber;
        });

        return filtered;
    };

    const filteredLogs = getFilteredAndSortedLogs();
    
    // Pagination calculations
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentLogs = filteredLogs.slice(startIndex, endIndex);
    
    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedActionType, selectedModule, selectedSeverity]);

    // Stats Calculation
    const calculateStats = () => {
        const total = activityLogs.length;
        const createActions = activityLogs.filter(log => log.action === 'CREATE').length;
        const updateActions = activityLogs.filter(log => log.action === 'UPDATE').length;
        const deleteActions = activityLogs.filter(log => log.action === 'DELETE').length;
        const errorLogs = activityLogs.filter(log => log.severity === 'ERROR').length;

        return [
            {
                label: 'Total Activities',
                value: total,
                icon: <Activity size={28} />,
                image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800'
            },
            {
                label: 'Create Actions',
                value: createActions,
                icon: <CheckCircle size={28} />,
                image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800'
            },
            {
                label: 'Update Actions',
                value: updateActions,
                icon: <RefreshCcw size={28} />,
                image: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800'
            },
            {
                label: 'Error Logs',
                value: errorLogs,
                icon: <AlertCircle size={28} />,
                image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800'
            }
        ];
    };

    const stats = calculateStats();

    // Action type options
    const actionTypeOptions = ['ALL', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT', 'IMPORT'];
    
    // Module options
    const moduleOptions = [
        'ALL Modules',
        'Bookings',
        'Packages', 
        'Users',
        'Services',
        'Hotels',
        'Tours',
        'Settings',
        'Promos'
    ];

    // Severity options
    const severityOptions = ['ALL Severity', 'INFO', 'WARNING', 'ERROR', 'SUCCESS'];

    // Handlers
    const handleViewDetails = (log) => {
        setSelectedLog(log);
        setShowDetailModal(true);
    };

    const handleSortToggle = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    const handleRefresh = () => {
        fetchActivityLogs();
    };
    
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const toggleSidebarCollapse = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="act-page">
            <Sidebar isCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebarCollapse} />
            
            <main className={`act-main ${sidebarCollapsed ? 'expanded' : ''}`}>
                <div className="act-container">
                    
                    {/* Header */}
                    <div className="act-header">
                        <div className="act-title">
                            <h1>ACTIVITY LOGS</h1>
                            <p>Monitor and track all system activities and user actions</p>
                        </div>
                        <button 
                            className="act-btn-refresh"
                            onClick={handleRefresh}
                            disabled={loading}
                        >
                            <RefreshCcw size={18} /> Refresh Logs
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <ActivityLogsStats stats={stats} />

                    {/* Filters */}
                    <ActivityLogsFilters
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        selectedActionType={selectedActionType}
                        setSelectedActionType={setSelectedActionType}
                        selectedModule={selectedModule}
                        setSelectedModule={setSelectedModule}
                        selectedSeverity={selectedSeverity}
                        setSelectedSeverity={setSelectedSeverity}
                        actionTypeOptions={actionTypeOptions}
                        moduleOptions={moduleOptions}
                        severityOptions={severityOptions}
                    />

                    {/* Table */}
                    <div className="act-table-container">
                        <ActivityLogsTable
                            loading={loading}
                            filteredLogsCount={filteredLogs.length}
                            currentLogs={currentLogs}
                            handleViewDetails={handleViewDetails}
                            formatDate={formatDate}
                            sortOrder={sortOrder}
                            handleSortToggle={handleSortToggle}
                            startIndex={startIndex}
                        />
                    </div>
                    
                    {/* Pagination */}
                    {filteredLogs.length > 0 && totalPages > 1 && (
                        <ActivityLogsPagination
                            totalItems={filteredLogs.length}
                            itemsPerPage={itemsPerPage}
                            currentPage={currentPage}
                            onPageChange={handlePageChange}
                            ChevronLeftIcon={ChevronLeft}
                            ChevronRightIcon={ChevronRight}
                        />
                    )}

                </div>
            </main>

            {/* Detail Modal */}
            {showDetailModal && selectedLog && (
                <ActivityLogsDetailModal
                    showModal={showDetailModal}
                    selectedLog={selectedLog}
                    setShowModal={setShowDetailModal}
                    formatDate={formatDate}
                />
            )}
        </div>
    );
};

export default ActivityLogs;
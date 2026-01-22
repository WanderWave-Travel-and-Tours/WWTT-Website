import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../sidebar/sidebar.jsx';
import { Activity, AlertCircle, CheckCircle, RefreshCcw, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import ActivityLogsStats from './ActivityLogsStats';
import ActivityLogsFilters from './ActivityLogsFilters';
import ActivityLogsTable from './ActivityLogsTable';
import ActivityLogsDetailModal from './ActivityLogsDetailModal';
import ActivityLogsPagination from './ActivityLogsPagination';
import { exportActivityLogsToPDF } from './utils/activityLogsPdfExport';

// --- NEW IMPORTS ---
import { useToast } from "../toast/ToastManager";
import CustomConfirmModal from "../../components/confirmationModal/CustomConfirmModal";
// -------------------

import './ActivityLogs.css';

const ActivityLogs = () => {
    const navigate = useNavigate();
    const toast = useToast(); // Initialize toast
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    
    // Activity Logs Data State
    const [activityLogs, setActivityLogs] = useState([]);
    const [fetchError, setFetchError] = useState(null);
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

    // --- NEW: Confirmation Modal State ---
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => {},
        type: "primary"
    });

    // Helper function for confirmation
    const askConfirmation = (title, message, onConfirm, type = "primary") => {
        setConfirmConfig({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                onConfirm();
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
            },
            type
        });
    };
    // ------------------------------------

    // Check authentication
    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            navigate('/admin');
        }
    }, [navigate]);

    // Fetch activity logs on component mount
    useEffect(() => {
        console.log('🎯 ActivityLogs component mounted');
        fetchActivityLogs();
    }, []);

    // ==========================================
    // IMPROVED FETCH FUNCTION WITH TOAST
    // ==========================================
    const fetchActivityLogs = async () => {
        console.log('🔍 Starting to fetch activity logs...');
        setLoading(true);
        setFetchError(null);
        
        try {
            // API endpoint
            const apiUrl = 'http://localhost:5000/api/activity-logs';
            console.log('📡 Fetching from:', apiUrl);
            
            const response = await fetch(apiUrl);
            console.log('📡 Response status:', response.status);
            console.log('📡 Response OK:', response.ok);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('📊 Raw data received:', data);
            
            // Check if data is empty
            if (!data || !Array.isArray(data)) {
                console.warn('⚠️ Invalid data format received');
                setActivityLogs([]);
                setFetchError('Invalid data format received from server');
                toast.error("Failed to load logs. Invalid data format."); // Toast Notification
                return;
            }

            if (data.length === 0) {
                console.log('ℹ️ No activity logs found in database');
                setActivityLogs([]);
                return;
            }

            // Format data from MongoDB
            console.log('🔄 Formatting logs...');
            const formattedLogs = data.map((log, index) => {
                return {
                    id: log._id || `log-${index}`,
                    logNumber: data.length - index,
                    action: log.action || 'UNKNOWN',
                    module: log.module || 'System',
                    user: log.user || 'Unknown',
                    severity: log.severity || 'INFO',
                    description: log.description || 'No description',
                    timestamp: log.createdAt || new Date().toISOString(),
                    ipAddress: log.ipAddress || 'N/A',
                    userAgent: log.userAgent || 'N/A',
                    adminInfo: log.adminInfo || null,
                    details: log.details || {
                        affectedRecords: 0,
                        duration: 'N/A',
                        method: 'N/A',
                        endpoint: 'N/A',
                        statusCode: 200
                    }
                };
            });
            
            console.log('✅ Formatted logs:', formattedLogs.length);
            setActivityLogs(formattedLogs);
            toast.success("Logs synchronized successfully."); // Toast Notification

        } catch (error) {
            console.error('❌ Error fetching activity logs:', error);
            setFetchError(error.message);
            setActivityLogs([]);
            toast.error("Error connecting to the server."); // Toast Notification
        } finally {
            setLoading(false);
            console.log('🏁 Fetch completed, loading:', false);
        }
    };

    // Debug: Log state changes
    useEffect(() => {
        console.log('📊 activityLogs state updated:', {
            count: activityLogs.length,
            logs: activityLogs
        });
    }, [activityLogs]);

    useEffect(() => {
        console.log('⏳ loading state changed:', loading);
    }, [loading]);

    // 🔥🔥🔥 FIXED FILTER AND SORT LOGIC 🔥🔥🔥
    const getFilteredAndSortedLogs = () => {
        console.log('🔍 Filtering logs...');
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

        // Search filter - Enhanced to include adminInfo
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(log => {
                const matchesBasic = 
                    (log.id && log.id.toLowerCase().includes(query)) ||
                    (log.action && log.action.toLowerCase().includes(query)) ||
                    (log.module && log.module.toLowerCase().includes(query)) ||
                    (log.user && log.user.toLowerCase().includes(query)) ||
                    (log.description && log.description.toLowerCase().includes(query));
                
                const matchesAdminInfo = log.adminInfo && (
                    (log.adminInfo.fullName && log.adminInfo.fullName.toLowerCase().includes(query)) ||
                    (log.adminInfo.username && log.adminInfo.username.toLowerCase().includes(query)) ||
                    (log.adminInfo.email && log.adminInfo.email.toLowerCase().includes(query))
                );
                
                return matchesBasic || matchesAdminInfo;
            });
        }

        // Sort by timestamp
        filtered.sort((a, b) => {
            if (sortOrder === 'asc') {
                return new Date(a.timestamp) - new Date(b.timestamp);
            } else {
                return new Date(b.timestamp) - new Date(a.timestamp);
            }
        });

        return filtered;
    };

    const filteredLogs = getFilteredAndSortedLogs();
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentLogs = filteredLogs.slice(startIndex, endIndex);
    
    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedActionType, selectedModule, selectedSeverity]);

    // Calculate statistics
    const calculateStats = () => {
        const total = activityLogs.length;
        const createActions = activityLogs.filter(log => log.action === 'CREATE').length;
        const updateActions = activityLogs.filter(log => log.action === 'UPDATE').length;
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
    
    // Filter options
    const actionTypeOptions = ['ALL', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT', 'IMPORT', 'ARCHIVE'];
    
    const moduleOptions = [
        'ALL Modules', 'Auth', 'Users', 'Bookings', 'Packages', 
        'Services', 'Hotels', 'Tours', 'Promos', 'Blogs', 
        'Testimonials', 'Visas', 'Passports', 'System'
    ];

    const severityOptions = ['ALL Severity', 'INFO', 'SUCCESS', 'WARNING', 'ERROR'];

    // Event handlers
    const handleViewDetails = (log) => {
        console.log('👁️ Viewing details for log:', log.id);
        setSelectedLog(log);
        setShowDetailModal(true);
    };

    const handleSortToggle = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    const handleRefresh = () => {
        console.log('🔄 Refreshing activity logs...');
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

    // 🔥 UPDATED: Export to PDF with Confirmation Modal and Toast
    const handleExportPDF = () => {
        askConfirmation(
            "Export Activity Logs",
            "Are you sure you want to download the current filtered logs as a PDF report?",
            () => {
                console.log('📄 Exporting Activity Logs to PDF...');
                try {
                    exportActivityLogsToPDF(filteredLogs, stats);
                    console.log('✅ PDF Export successful');
                    toast.success("PDF report generated successfully.");
                } catch (error) {
                    console.error('❌ Error exporting PDF:', error);
                    toast.error("Failed to export PDF. Please try again.");
                }
            },
            "primary"
        );
    };

    // Format date helper
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            return new Date(dateString).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return "Invalid Date";
        }
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
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button 
                                className="act-btn-refresh"
                                onClick={handleExportPDF}
                                disabled={loading || filteredLogs.length === 0}
                                style={{ background: '#10b981' }}
                            >
                                <Download size={18} /> 
                                Export PDF
                            </button>
                            <button 
                                className="act-btn-refresh"
                                onClick={handleRefresh}
                                disabled={loading}
                            >
                                <RefreshCcw size={18} className={loading ? 'spinning' : ''} /> 
                                {loading ? 'Loading...' : 'Refresh Logs'}
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {fetchError && (
                        <div className="act-error-message">
                            <AlertCircle size={18} />
                            Error fetching logs: {fetchError}
                        </div>
                    )}

                    {/* Statistics Cards */}
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

            {/* --- NEW: Custom Confirmation Modal Component --- */}
            <CustomConfirmModal 
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                type={confirmConfig.type}
                onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default ActivityLogs;
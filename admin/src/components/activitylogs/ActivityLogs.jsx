import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../sidebar/sidebar.jsx';
import { Activity, AlertCircle, CheckCircle, RefreshCcw, ChevronLeft, ChevronRight, Download } from 'lucide-react';

// Components
import ActivityLogsStats from './ActivityLogsStats';
import ActivityLogsFilters from './ActivityLogsFilters';
import ActivityLogsTable from './ActivityLogsTable';
import ActivityLogsDetailModal from './ActivityLogsDetailModal';
import ActivityLogsPagination from './ActivityLogsPagination';

// Utils and Hooks
import { exportActivityLogsToPDF } from './utils/activityLogsPdfExport';
import { useToast } from '../toast/ToastManager'; // Import Toast Hook
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal'; // Import Custom Modal

import './ActivityLogs.css';

const ActivityLogs = () => {
    const navigate = useNavigate();
    const toast = useToast(); // Initialize Toast
    
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
    
    // Modal States
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);

    // 🔥 Confirm Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {}
    });

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

    const fetchActivityLogs = async () => {
        console.log('🔍 Starting to fetch activity logs...');
        setLoading(true);
        setFetchError(null);
        
        try {
            const apiUrl = 'http://localhost:5000/api/activity-logs';
            console.log('📡 Fetching from:', apiUrl);
            
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data || !Array.isArray(data)) {
                console.warn('⚠️ Invalid data format received');
                setActivityLogs([]);
                setFetchError('Invalid data format received from server');
                toast.error("Hindi wasto ang format ng data mula sa server.", "Data Error");
                return;
            }

            if (data.length === 0) {
                console.log('ℹ️ No activity logs found in database');
                setActivityLogs([]);
                toast.info("Walang nakitang activity logs sa database.", "System Info");
                return;
            }

            const formattedLogs = data.map((log, index) => ({
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
            }));
            
            setActivityLogs(formattedLogs);
            toast.success("Activity logs successfully loaded.", "Success");

        } catch (error) {
            console.error('❌ Error fetching activity logs:', error);
            setFetchError(error.message);
            setActivityLogs([]);
            toast.error(`Error: ${error.message}`, "Fetch Failed");
        } finally {
            setLoading(false);
        }
    };

    // Debug: Log state changes
    useEffect(() => {
        console.log('📊 activityLogs state updated:', {
            count: activityLogs.length,
            logs: activityLogs
        });
    }, [activityLogs]);

    const getFilteredAndSortedLogs = () => {
        let filtered = [...activityLogs];

        if (selectedActionType !== 'ALL') {
            filtered = filtered.filter(log => log.action === selectedActionType);
        }

        if (selectedModule !== 'ALL Modules') {
            filtered = filtered.filter(log => log.module === selectedModule);
        }

        if (selectedSeverity !== 'ALL Severity') {
            filtered = filtered.filter(log => log.severity === selectedSeverity);
        }

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
    const currentLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedActionType, selectedModule, selectedSeverity]);

    const calculateStats = () => {
        const total = activityLogs.length;
        const createActions = activityLogs.filter(log => log.action === 'CREATE').length;
        const updateActions = activityLogs.filter(log => log.action === 'UPDATE').length;
        const errorLogs = activityLogs.filter(log => log.severity === 'ERROR').length;

        return [
            { label: 'Total Activities', value: total, icon: <Activity size={28} />, image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800' },
            { label: 'Create Actions', value: createActions, icon: <CheckCircle size={28} />, image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800' },
            { label: 'Update Actions', value: updateActions, icon: <RefreshCcw size={28} />, image: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800' },
            { label: 'Error Logs', value: errorLogs, icon: <AlertCircle size={28} />, image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800' }
        ];
    };

    const stats = calculateStats();
    const actionTypeOptions = ['ALL', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT', 'IMPORT', 'ARCHIVE'];
    const moduleOptions = ['ALL Modules', 'Auth', 'Users', 'Bookings', 'Packages', 'Services', 'Hotels', 'Tours', 'Promos', 'Blogs', 'Testimonials', 'Visas', 'Passports', 'System'];
    const severityOptions = ['ALL Severity', 'INFO', 'SUCCESS', 'WARNING', 'ERROR'];

    // Event handlers
    const handleViewDetails = (log) => {
        setSelectedLog(log);
        setShowDetailModal(true);
    };

    const handleSortToggle = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    const handleRefresh = () => {
        fetchActivityLogs();
        toast.info("Nagre-refresh ang mga logs...", "System");
    };
    
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const toggleSidebarCollapse = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    // 🔥 Updated: Export with Custom Confirmation Modal
    const handleExportPDF = () => {
        setConfirmModal({
            isOpen: true,
            title: "Export Activity Logs",
            message: `Sigurado ka ba na gusto mong i-export ang ${filteredLogs.length} record(s) sa PDF?`,
            onConfirm: () => {
                try {
                    exportActivityLogsToPDF(filteredLogs, stats);
                    toast.success("Matagumpay na na-export ang PDF.", "Export Success");
                } catch (error) {
                    console.error('❌ Error exporting PDF:', error);
                    toast.error("Hindi ma-export ang PDF. Pakisubukang muli.", "Export Error");
                }
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            return new Date(dateString).toLocaleDateString("en-US", {
                year: "numeric", month: "short", day: "numeric", hour: '2-digit', minute: '2-digit'
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
                                <Download size={18} /> Export PDF
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

                    {fetchError && (
                        <div className="act-error-message">
                            <AlertCircle size={18} />
                            Error fetching logs: {fetchError}
                        </div>
                    )}

                    <ActivityLogsStats stats={stats} />

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

            {/* 🔥 Custom Confirmation Modal Component */}
            <CustomConfirmModal 
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                type="primary"
            />
        </div>
    );
};

export default ActivityLogs;
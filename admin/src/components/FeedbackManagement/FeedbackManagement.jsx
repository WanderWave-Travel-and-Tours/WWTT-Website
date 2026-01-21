import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../sidebar/sidebar';
import FeedbackStats from './FeedbackStats';
import FeedbackFilters from './FeedbackFilters';
import FeedbackTable from './FeedbackTable';
import FeedbackPagination from './FeedbackPagination';
import FeedbackViewModal from './FeedbackViewModal';
import CustomConfirmModal from "../../components/confirmationModal/CustomConfirmModal";
import { useToast } from '../toast/ToastManager';
import { Download } from 'lucide-react';
import './FeedbackManagement.css';

// Image URLs for Stats Cards
const FEEDBACK_IMAGES = {
  TOTAL: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
  BUGS: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
  RATING: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80'
};

const FeedbackManagement = () => {
  const toast = useToast();
  
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal States
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  // Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'primary'
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter States
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterRating, setFilterRating] = useState('all');

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    fetchFeedbacks();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory, filterRating]);

  // ============================================
  // API FUNCTIONS (WITH AUTH TOKEN)
  // ============================================
  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://wanderwaveph-backend.onrender.com/api/feedback', {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        console.error('Failed to fetch feedbacks:', response.status);
        setFeedbacks([]);
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setFeedbacks(Array.isArray(data.feedbacks) ? data.feedbacks : []);
      } else {
        setFeedbacks([]);
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // ACTION HANDLERS
  // ============================================
  const handleView = (feedback) => {
    setSelectedFeedback(feedback);
    setShowViewModal(true);
  };

  const handleArchive = (id) => {
    const targetFeedback = feedbacks.find(f => f._id === id);
    const feedbackName = targetFeedback ? (targetFeedback.name || 'Anonymous') : 'this item';

    setConfirmConfig({
      isOpen: true,
      title: 'Archive Feedback',
      message: `Are you sure you want to archive the feedback from ${feedbackName}? This will hide it from the active list.`,
      type: 'warning',
      onConfirm: async () => {
        try {
          const response = await fetch(`https://wanderwaveph-backend.onrender.com/api/feedback/${id}/archive`, {
            method: 'PATCH',
            headers: getAuthHeaders()
          });

          if (response.ok) {
            toast.success('Feedback archived successfully!', 'Archived');
            
            // Optimistic Update
            setFeedbacks(prev => prev.map(item => 
              item._id === id ? { ...item, isArchive: 'Yes' } : item
            ));

            if (showViewModal) setShowViewModal(false);
          } else {
            const errData = await response.json();
            toast.error(errData.message || 'Failed to archive feedback', 'Error');
          }
        } catch (error) {
          console.error('Error archiving feedback:', error);
          toast.error('Error connecting to server', 'Error');
        }
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const exportToCSV = async () => {
    try {
      const headers = ['Date', 'Category', 'Rating', 'Message', 'Status', 'Browser', 'Screen Size'];
      
      const rows = filteredFeedbacks.map(f => [
        new Date(f.createdAt).toLocaleDateString(),
        f.category,
        f.rating || 'N/A',
        `"${f.message.replace(/"/g, '""')}"`,
        f.status,
        f.technicalData?.browser || 'N/A',
        f.technicalData?.screenSize || 'N/A'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const fileName = `feedback_export_${new Date().toISOString().split('T')[0]}.csv`;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      
      toast.success('Feedback exported successfully!', 'Export Complete');

      // 📝 OPTIONAL: Log the export action to Backend
      await fetch('https://wanderwaveph-backend.onrender.com/api/activity-logs', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
              action: 'EXPORT',
              module: 'Feedback',
              description: `Exported ${filteredFeedbacks.length} feedback records to CSV`,
              details: {
                  fileName: fileName,
                  exportFormat: 'CSV',
                  affectedRecords: filteredFeedbacks.length
              }
          })
      });

    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export feedback');
    }
  };

  // ============================================
  // FILTER & SEARCH LOGIC
  // ============================================
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter(feedback => {
      
      // Filter out archived items
      if (feedback.isArchive === 'Yes') return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          feedback.message?.toLowerCase().includes(query) ||
          feedback.category?.toLowerCase().includes(query) ||
          feedback.name?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filterCategory !== 'all' && feedback.category !== filterCategory) {
        return false;
      }

      // Rating filter
      if (filterRating !== 'all') {
        const rating = parseInt(filterRating);
        if (feedback.rating !== rating) return false;
      }

      return true;
    });
  }, [feedbacks, searchQuery, filterCategory, filterRating]);

  const paginatedFeedbacks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredFeedbacks.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredFeedbacks, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredFeedbacks.length / itemsPerPage);

  // ============================================
  // STATS CALCULATION
  // ============================================
  const activeFeedbacks = feedbacks.filter(f => f.isArchive !== 'Yes');
  
  const stats = [
    {
      label: 'Total Feedback',
      value: activeFeedbacks.length,
      color: '#3b82f6',
      image: FEEDBACK_IMAGES.TOTAL
    },
    {
      label: 'Bug Reports',
      value: activeFeedbacks.filter(f => f.category === 'bug').length,
      color: '#ef4444',
      image: FEEDBACK_IMAGES.BUGS
    },
    {
      label: 'Avg Rating',
      value: activeFeedbacks.length > 0 
        ? (activeFeedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / activeFeedbacks.length).toFixed(1)
        : '0.0',
      color: '#f59e0b',
      image: FEEDBACK_IMAGES.RATING
    }
  ];

  const toggleSidebar = () => setSidebarCollapsed(!isSidebarCollapsed);

  return (
    <div className="fb-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      <div className={`fb-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
        <div className="fb-container">
          
          <div className="fb-header">
            <div className="fb-title">
              <h1>USER FEEDBACK</h1>
              <p>Manage and review customer feedback submissions</p>
            </div>
            <div className="fb-header-actions">
              <button className="fb-btn-primary" onClick={exportToCSV}>
                <Download size={18} /> Export CSV
              </button>
            </div>
          </div>

          <FeedbackStats stats={stats} />

          <FeedbackFilters 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            filterRating={filterRating}
            setFilterRating={setFilterRating}
            onRefresh={fetchFeedbacks}
          />

          <FeedbackTable 
            loading={loading}
            feedbacks={paginatedFeedbacks}
            onView={handleView}
            onArchive={handleArchive}
          />

          {!loading && filteredFeedbacks.length > 0 && totalPages > 1 && (
            <FeedbackPagination
              totalItems={filteredFeedbacks.length}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          )}

          {/* VIEW MODAL */}
          <FeedbackViewModal 
            show={showViewModal}
            onClose={() => setShowViewModal(false)}
            feedback={selectedFeedback}
            onArchive={handleArchive}
          />

          {/* CUSTOM CONFIRMATION MODAL */}
          <CustomConfirmModal 
            isOpen={confirmConfig.isOpen}
            title={confirmConfig.title}
            message={confirmConfig.message}
            type={confirmConfig.type}
            onConfirm={confirmConfig.onConfirm}
            onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
          />

        </div>
      </div>
    </div>
  );
};

export default FeedbackManagement;
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Sidebar from '../sidebar/sidebar';
import SellerRateStats from './Sellerratestats';
import SellerRateFilters from './Sellerratefilters';
import SellerRateTable from './Sellerratetable';
import SellerRateModal from './Sellerratemodal';
import SellerRateUploadModal from './Sellerrateuploadmodal';
import SellerRatePreviewModal from './SellerRatePreviewModal';
import PaginationControls from './SellerPaginationControls';
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal'; // Import ng custom modal
import { useToast } from '../toast/ToastManager'; // Ginamit ang path na binigay mo
import { Plus, Upload } from 'lucide-react';
import { parseFlexibleExcel, previewExcelColumns } from './flexibleExcelParser';
import './SellerRate.css';

// Image URLs for Stats Cards
const RATE_IMAGES = {
  TOTAL_RATES: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
  AVG_MARKUP: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&q=80',
  TOTAL_REVENUE: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80'
};

const SellerRate = () => {
  const toast = useToast(); // Hook para sa Toast Notifications

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  
  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingRate, setEditingRate] = useState(null);

  // Custom Confirmation State
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'primary',
    onConfirm: () => {}
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form State
  const [formData, setFormData] = useState({
    destination: '',
    activity: '',
    supplierName: '',
    supplierRate: '',
    markup: '',
    markupType: 'percentage',
    pax: '',
    inclusions: '',
    notes: ''
  });

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    fetchRates();
  }, []);

  // ============================================
  // API FUNCTIONS
  // ============================================
  const fetchRates = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/seller-rates');
      if (!response.ok) {
        console.error('Failed to fetch rates:', response.status);
        setRates([]);
        return;
      }
      const data = await response.json();
      setRates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching rates:', error);
      toast.error('Could not connect to the server.', 'Connection Error');
      setRates([]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // CALCULATION FUNCTIONS
  // ============================================
  const calculateSellingPrice = () => {
    const rate = parseFloat(formData.supplierRate) || 0;
    const markup = parseFloat(formData.markup) || 0;

    if (formData.markupType === 'percentage') {
      return rate + (rate * markup / 100);
    } else {
      return rate + markup;
    }
  };

  // ============================================
  // FORM HANDLERS
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const sellingPrice = calculateSellingPrice();
    const rateData = {
      ...formData,
      supplierRate: parseFloat(formData.supplierRate),
      markup: parseFloat(formData.markup),
      sellingPrice,
      status: 'active',
      dateAdded: new Date()
    };

    try {
      const url = editingRate 
        ? `http://localhost:5000/api/seller-rates/${editingRate._id}`
        : 'http://localhost:5000/api/seller-rates';
      
      const method = editingRate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rateData)
      });

      if (response.ok) {
        toast.success(
          editingRate ? 'Rate updated successfully!' : 'New rate added successfully!',
          editingRate ? 'Update Success' : 'Entry Added'
        );
        fetchRates();
        resetForm();
        setShowAddModal(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to save rate', 'Error');
      }
    } catch (error) {
      console.error('Error saving rate:', error);
      toast.error('Server error. Please check your connection.', 'Save Failed');
    }
  };

  const resetForm = () => {
    setFormData({
      destination: '',
      activity: '',
      supplierName: '',
      supplierRate: '',
      markup: '',
      markupType: 'percentage',
      pax: '',
      inclusions: '',
      notes: ''
    });
    setEditingRate(null);
  };

  // ============================================
  // EXCEL UPLOAD HANDLERS
  // ============================================
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setUploadStatus({ type: 'loading', message: 'Analyzing Excel file...' });

    try {
      const preview = await previewExcelColumns(file);
      setPreviewData(preview);
      setShowPreviewModal(true);
      setUploadStatus(null);
    } catch (error) {
      console.error('Error previewing file:', error);
      toast.error(error.message || 'Error reading file', 'File Error');
      setUploadStatus({ 
        type: 'error', 
        message: `Error reading file: ${error.message || 'Please check file format'}` 
      });
    }
  };

  const handleFlexibleUpload = async () => {
    if (!selectedFile) return;

    setUploadStatus({ type: 'loading', message: 'Importing rates...' });
    setShowPreviewModal(false);

    try {
      const { rates: parsedRates, report } = await parseFlexibleExcel(selectedFile);

      if (!parsedRates || parsedRates.length === 0) {
        toast.warning('No valid data found in the Excel file.', 'Import Warning');
        setUploadStatus({
          type: 'error',
          message: 'No valid data found in Excel file.'
        });
        return;
      }

      const response = await fetch('http://localhost:5000/api/seller-rates/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedRates)
      });

      if (response.ok) {
        toast.success(`Successfully imported ${parsedRates.length} rates!`, 'Bulk Import');
        fetchRates();
        setSelectedFile(null);
        
        setTimeout(() => {
          setShowUploadModal(false);
          setUploadStatus(null);
        }, 3000);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Server error during upload', 'Upload Failed');
        setUploadStatus({
          type: 'error',
          message: `Upload failed: ${errorData.message || 'Server error'}`
        });
      }
    } catch (error) {
      console.error('Error uploading rates:', error);
      toast.error(error.message || 'Failed to import rates', 'Upload Error');
    }
  };

  // ============================================
  // ACTION HANDLERS (With Custom Confirmation)
  // ============================================
  const closeConfirm = () => {
    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
  };

  const handleDelete = async (id) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Rate',
      message: 'Are you sure you want to delete this rate? This action cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/seller-rates/${id}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            toast.success('Rate has been permanently deleted.', 'Deleted');
            fetchRates();
          } else {
            toast.error('Failed to delete rate.', 'Error');
          }
        } catch (error) {
          toast.error('Error connecting to server.', 'Server Error');
        }
        closeConfirm();
      }
    });
  };

  const handleArchive = async (id) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Archive Rate',
      message: 'Move this rate to archives? It will be hidden from the main list.',
      type: 'primary',
      onConfirm: async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/seller-rates/${id}/archive`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              isArchive: 'Yes',
              archivedAt: new Date().toISOString()
            })
          });

          if (response.ok) {
            toast.success('Rate moved to archives.', 'Archived');
            fetchRates();
          } else {
            toast.error('Failed to archive rate.', 'Error');
          }
        } catch (error) {
          toast.error('Error connecting to server.', 'Server Error');
        }
        closeConfirm();
      }
    });
  };

  const handleEdit = (rate) => {
    setEditingRate(rate);
    setFormData({
      destination: rate.destination || '',
      activity: rate.activity || '',
      supplierName: rate.supplierName || '',
      supplierRate: rate.supplierRate || '',
      markup: rate.markup || '',
      markupType: rate.markupType || 'percentage',
      pax: rate.pax || '',
      inclusions: rate.inclusions || '',
      notes: rate.notes || ''
    });
    setShowAddModal(true);
  };

  // ============================================
  // FILTER & SEARCH LOGIC
  // ============================================
  const filteredRates = useMemo(() => {
    return rates.filter(rate => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        rate.destination?.toLowerCase().includes(query) ||
        rate.activity?.toLowerCase().includes(query) ||
        rate.supplierName?.toLowerCase().includes(query) ||
        rate.pax?.toLowerCase().includes(query)
      );
    });
  }, [rates, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const paginatedRates = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRates.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRates, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredRates.length / itemsPerPage);

  // ============================================
  // STATS CALCULATION
  // ============================================
  const stats = [
    {
      label: 'Total Rates',
      value: rates.length,
      color: '#3b82f6',
      image: RATE_IMAGES.TOTAL_RATES
    },
    {
      label: 'Avg. Markup',
      value: rates.length > 0 
        ? `${(rates.reduce((sum, r) => sum + (r.markup || 0), 0) / rates.length).toFixed(1)}%`
        : '0%',
      color: '#10b981',
      image: RATE_IMAGES.AVG_MARKUP
    },
    {
      label: 'Total Revenue',
      value: `₱${rates.reduce((sum, r) => sum + (r.sellingPrice || 0), 0).toLocaleString()}`,
      color: '#f59e0b',
      image: RATE_IMAGES.TOTAL_REVENUE
    }
  ];

  const toggleSidebar = () => setSidebarCollapsed(!isSidebarCollapsed);

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="sr-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      <div className={`sr-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
        <div className="sr-container">
          
          <div className="sr-header">
            <div className="sr-title">
              <h1>SUPPLIER RATES</h1>
              <p>Manage your supplier pricing and markups</p>
            </div>
            <div className="sr-header-actions">
              <button className="sr-btn-secondary" onClick={() => setShowUploadModal(true)}>
                <Upload size={18} /> Import Excel
              </button>
              <button className="sr-btn-primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
                <Plus size={18} /> Add Rate
              </button>
            </div>
          </div>

          <SellerRateStats stats={stats} />

          <SellerRateFilters 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onRefresh={fetchRates}
          />

          <SellerRateTable 
            loading={loading}
            rates={paginatedRates}
            onEdit={handleEdit}
            onArchive={handleArchive}
            onDelete={handleDelete} // Ipinasa ang delete handler sa table
          />

          {!loading && filteredRates.length > 0 && totalPages > 1 && (
            <PaginationControls
              totalItems={filteredRates.length}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          )}

          {/* MODALS SECTION */}
          <SellerRateModal 
            show={showAddModal}
            onClose={() => { setShowAddModal(false); resetForm(); }}
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            calculateSellingPrice={calculateSellingPrice}
            editingRate={editingRate}
          />

          <SellerRateUploadModal 
            show={showUploadModal}
            onClose={() => { setShowUploadModal(false); setUploadStatus(null); }}
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            uploadStatus={uploadStatus}
          />

          <SellerRatePreviewModal 
            show={showPreviewModal}
            onClose={() => setShowPreviewModal(false)}
            previewData={previewData}
            onConfirm={handleFlexibleUpload}
          />

          {/* CUSTOM CONFIRMATION MODAL COMPONENT */}
          <CustomConfirmModal 
            isOpen={confirmConfig.isOpen}
            title={confirmConfig.title}
            message={confirmConfig.message}
            type={confirmConfig.type}
            onConfirm={confirmConfig.onConfirm}
            onCancel={closeConfirm}
          />

        </div>
      </div>
    </div>
  );
};

export default SellerRate;
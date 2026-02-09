import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Sidebar from '../sidebar/sidebar';
import SellerRateStats from './Sellerratestats';
import SellerRateFilters from './Sellerratefilters';
import SellerRateTable from './Sellerratetable';
import SellerRateModal from './Sellerratemodal';
import SellerRateUploadModal from './Sellerrateuploadmodal';
import SellerRatePreviewModal from './SellerRatePreviewModal';
import PaginationControls from './SellerPaginationControls';
import CustomConfirmModal from "../../components/confirmationModal/CustomConfirmModal";
import { useToast } from '../toast/ToastManager';
import { Plus, Upload } from 'lucide-react';
import { parseFlexibleExcel, previewExcelColumns } from './flexibleExcelParser';
import './SellerRate.css';

// Image URLs for Stats Cards - Landscape Photos
const RATE_IMAGES = {
  TOTAL_RATES: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
  AVG_MARKUP: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&q=80',
  TOTAL_REVENUE: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80'
};

const SellerRate = () => {
  const toast = useToast();
  
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
      // Backend should ideally filter isArchive="No", 
      // but we handle it in frontend too for safety
      const response = await fetch('https://wanderwaveph.onrender.com/api/seller-rates');
      if (!response.ok) {
        console.error('Failed to fetch rates:', response.status);
        setRates([]);
        return;
      }
      const data = await response.json();
      setRates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching rates:', error);
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
      isArchive: 'No', // Default for new or updated entries
      dateAdded: new Date()
    };

    try {
      const url = editingRate 
        ? `https://wanderwaveph.onrender.com/api/seller-rates/${editingRate._id}`
        : 'https://wanderwaveph.onrender.com/api/seller-rates';
      
      const method = editingRate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rateData)
      });

      if (response.ok) {
        toast.success(editingRate ? 'Rate updated successfully!' : 'Rate added successfully!', 'Success');
        fetchRates();
        resetForm();
        setShowAddModal(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to save rate', 'Error');
      }
    } catch (error) {
      console.error('Error saving rate:', error);
      toast.error('Failed to save rate. Please check connection.', 'Error');
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
      setUploadStatus({ 
        type: 'error', 
        message: `Error reading file: ${error.message || 'Please check file format'}` 
      });
      toast.error('Failed to read Excel file', 'File Error');
    }
  };

  const handleFlexibleUpload = async () => {
    if (!selectedFile) return;

    setUploadStatus({ type: 'loading', message: 'Importing rates...' });
    setShowPreviewModal(false);

    try {
      const { rates: parsedRates, report } = await parseFlexibleExcel(selectedFile);

      if (!parsedRates || parsedRates.length === 0) {
        setUploadStatus({
          type: 'error',
          message: 'No valid data found in Excel file.'
        });
        toast.error('No valid data found in Excel file', 'Import Failed');
        return;
      }

      const response = await fetch('https://wanderwaveph.onrender.com/api/seller-rates/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedRates)
      });

      if (response.ok) {
        setUploadStatus({
          type: 'success',
          message: `Successfully imported ${parsedRates.length} rates!`
        });
        toast.success(`Successfully imported ${parsedRates.length} rates!`, 'Import Success');
        fetchRates();
        setSelectedFile(null);
        
        setTimeout(() => {
          setShowUploadModal(false);
          setUploadStatus(null);
        }, 3000);
      } else {
        const errorData = await response.json();
        setUploadStatus({
          type: 'error',
          message: `Upload failed: ${errorData.message || 'Server error'}`
        });
        toast.error('Server failed to process the bulk upload', 'Error');
      }
    } catch (error) {
      console.error('Error uploading rates:', error);
      setUploadStatus({
        type: 'error',
        message: error.message || 'Failed to import rates'
      });
      toast.error('Failed to import rates', 'Error');
    }
  };

  // ============================================
  // ACTION HANDLERS WITH CONFIRMATION
  // ============================================
  const handleDelete = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Rate',
      message: 'Are you sure you want to delete this rate? This action cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        try {
          const response = await fetch(`https://wanderwaveph.onrender.com/api/seller-rates/${id}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            toast.success('Rate deleted successfully!', 'Deleted');
            fetchRates();
          } else {
            toast.error('Failed to delete rate', 'Error');
          }
        } catch (error) {
          console.error('Error deleting rate:', error);
          toast.error('Error deleting rate', 'Error');
        }
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleArchive = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Archive Rate',
      message: 'Are you sure you want to archive this rate? This will remove it from the active display list.',
      type: 'primary',
      onConfirm: async () => {
        try {
          // Gamitin ang patch/put base sa iyong API. Gagayahin natin ang logic ng ViewBlog.
          const response = await fetch(`https://wanderwaveph.onrender.com/api/seller-rates/${id}/archive`, {
            method: 'PATCH', // O 'PUT' depende sa route na ginawa mo sa sellerRoute.js
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              isArchive: 'Yes',
              status: 'archived'
            })
          });

          if (response.ok) {
            toast.success('Rate archived successfully!', 'Archived');
            // I-update agad ang local state para mawala sa listahan
            setRates(prevRates => prevRates.filter(rate => rate._id !== id));
          } else {
            toast.error('Failed to archive rate', 'Error');
          }
        } catch (error) {
          console.error('Error archiving rate:', error);
          toast.error('Error archiving rate', 'Error');
        }
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
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
  // FILTER & SEARCH LOGIC WITH PAGINATION
  // ============================================
  const filteredRates = useMemo(() => {
    return rates.filter(rate => {
      // 1. FILTER OUT ARCHIVED (Ito ang hiningi mong logic)
      if (rate.isArchive === "Yes") return false;

      // 2. SEARCH FILTER
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
  // STATS CALCULATION (Only for Non-Archived)
  // ============================================
  const stats = useMemo(() => {
      return [
        {
          label: 'Total Rates',
          value: filteredRates.length,
          color: '#3b82f6',
          image: RATE_IMAGES.TOTAL_RATES
        },
        {
          label: 'Avg. Markup',
          value: filteredRates.length > 0 
            ? `${(filteredRates.reduce((sum, r) => sum + (r.markup || 0), 0) / filteredRates.length).toFixed(1)}%`
            : '0%',
          color: '#10b981',
          image: RATE_IMAGES.AVG_MARKUP
        },
        {
          label: 'Total Revenue',
          value: `₱${filteredRates.reduce((sum, r) => sum + (r.sellingPrice || 0), 0).toLocaleString()}`,
          color: '#f59e0b',
          image: RATE_IMAGES.TOTAL_REVENUE
        }
      ];
  }, [filteredRates]);

  const toggleSidebar = () => setSidebarCollapsed(!isSidebarCollapsed);

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
            onDelete={handleDelete}
          />

          {!loading && filteredRates.length > 0 && totalPages > 1 && (
            <PaginationControls
              totalItems={filteredRates.length}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          )}

          {/* MODALS */}
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

export default SellerRate; 
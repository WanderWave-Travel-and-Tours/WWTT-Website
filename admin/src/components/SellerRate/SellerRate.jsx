import React, { useState, useEffect } from 'react';
import Sidebar from '../sidebar/sidebar';
import SellerRateStats from './Sellerratestats';
import SellerRateFilters from './SellerRateFilters';
import SellerRateTable from './Sellerratetable';
import SellerRateModal from './Sellerratemodal';
import SellerRateUploadModal from './SellerRateUploadModal';
import SellerRatePreviewModal from './SellerRatePreviewModal';
import { Plus, Upload } from 'lucide-react';
import { parseFlexibleExcel, previewExcelColumns } from './flexibleExcelParser';
import './SellerRate.css';

// Image URLs for Stats Cards - Landscape Photos
const RATE_IMAGES = {
  TOTAL_RATES: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', // Mountain landscape
  AVG_MARKUP: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&q=80', // Beach sunset
  TOTAL_REVENUE: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80' // Rolling hills
};

const SellerRate = () => {
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
      const response = await fetch('https://wanderwaveph-backend.onrender.com/api/seller-rates');
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
      dateAdded: new Date()
    };

    try {
      const url = editingRate 
        ? `https://wanderwaveph-backend.onrender.com/api/seller-rates/${editingRate._id}`
        : 'https://wanderwaveph-backend.onrender.com/api/seller-rates';
      
      const method = editingRate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rateData)
      });

      if (response.ok) {
        alert(editingRate ? 'Rate updated!' : 'Rate added successfully!');
        fetchRates();
        resetForm();
        setShowAddModal(false);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'Failed to save rate'}`);
      }
    } catch (error) {
      console.error('Error saving rate:', error);
      alert('Failed to save rate. Please check console for details.');
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
    }
  };

  const handleFlexibleUpload = async () => {
    if (!selectedFile) return;

    setUploadStatus({ type: 'loading', message: 'Importing rates...' });
    setShowPreviewModal(false);

    try {
      const { rates: parsedRates, report } = await parseFlexibleExcel(selectedFile);

      console.log('📊 Import Report:', report);
      console.log('✅ Parsed Rates:', parsedRates);

      if (!parsedRates || parsedRates.length === 0) {
        setUploadStatus({
          type: 'error',
          message: 'No valid data found in Excel file. Please check your file format.'
        });
        return;
      }

      const response = await fetch('https://wanderwaveph-backend.onrender.com/api/seller-rates/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedRates)
      });

      if (response.ok) {
        setUploadStatus({
          type: 'success',
          message: `Successfully imported ${parsedRates.length} rates! (${report.skippedRows} rows skipped)`
        });
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
      }
    } catch (error) {
      console.error('Error uploading rates:', error);
      setUploadStatus({
        type: 'error',
        message: error.message || 'Failed to import rates'
      });
    }
  };

  // ============================================
  // TABLE ACTION HANDLERS
  // ============================================
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

  const handleArchive = async (id) => {
    if (!window.confirm('Archive this rate? It will be moved to the archive section.')) return;

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
        alert('Rate archived successfully!');
        fetchRates();
      } else {
        alert('Failed to archive rate');
      }
    } catch (error) {
      console.error('Error archiving rate:', error);
      alert('Error archiving rate');
    }
  };

  // ============================================
  // FILTER & SEARCH LOGIC
  // ============================================
  const filteredRates = rates.filter(rate => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      rate.destination?.toLowerCase().includes(query) ||
      rate.activity?.toLowerCase().includes(query) ||
      rate.supplierName?.toLowerCase().includes(query) ||
      rate.pax?.toLowerCase().includes(query)
    );
  });

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

  // ============================================
  // UI HANDLERS
  // ============================================
  const toggleSidebar = () => setSidebarCollapsed(!isSidebarCollapsed);

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="sr-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      <div className={`sr-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
        <div className="sr-container">
          
          {/* HEADER */}
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

          {/* STATS */}
          <SellerRateStats stats={stats} />

          {/* FILTERS */}
          <SellerRateFilters 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onRefresh={fetchRates}
          />

          {/* TABLE */}
          <SellerRateTable 
            loading={loading}
            rates={filteredRates}
            onEdit={handleEdit}
            onArchive={handleArchive}
          />

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

        </div>
      </div>
    </div>
  );
};

export default SellerRate;
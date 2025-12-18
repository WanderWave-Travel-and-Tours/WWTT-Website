import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Users, Search, TrendingUp, Eye, CheckCircle, XCircle, AlertCircle, Mail, Check, X,
  ChevronLeft, ChevronRight, FileText, CreditCard, FolderOpen, Archive, Trash2, RotateCcw, Package, Wrench, List,
  ArrowUpDown
} from 'lucide-react';
import './Archive.css';
import Sidebar from '../sidebar/sidebar';
import ArchiveStats from './ArchiveStats';
import ArchiveFilters from './ArchiveFilters'; 
import ArchiveTable from './ArchiveTable';
import ArchiveDetailModal from './ArchiveDetailModal';
import PaginationControls from '../booking/PaginationControls'; 

// Import separated functions
import { fetchArchivedBookings, restoreBooking } from './archiveFunctions/bookingService';
import { fetchArchivedPackages, restorePackage } from './archiveFunctions/packageService';
import { fetchArchivedTours, restoreTour } from './archiveFunctions/tourService';
import { fetchArchivedTestimonials, restoreTestimonial } from './archiveFunctions/testimonialService';

const ARCHIVE_IMAGES = {
    TOTAL_ITEMS: 'https://picsum.photos/seed/desk/800/600', 
    ARCHIVED_LIST: 'https://picsum.photos/seed/books/800/600',    
    ARCHIVED_SERVICES: 'https://picsum.photos/seed/wrench/800/600',
    ARCHIVED_USERS: 'https://picsum.photos/seed/people/800/600',
    ITEMS_RESTORED: 'https://picsum.photos/seed/folder/800/600' 
};

const ARCHIVE_RETENTION_DAYS = 90;

const ARCHIVE_TYPES = [
    'ALL',
    'Archived List', 
    'Archived Services',
    'Archived Users',
];

const SERVICE_SUBTYPES_LIST = [ 
    'ALL Services', 
    'Manage Services', 
    'VISA Processing',
    'PSA Serbilis',
    'CENOMAR',
    'Passport Appt',
    'Airline Booking',
    'Hotel Booking',
    'Tour Arrangements',
    'Ferry Booking',
    'Marriage Cert',
    'Travel Insurance',
    'Bills Payment',
];

const LIST_ARCHIVE_ITEMS = [
    'ALL List Items', 
    'Booking', 
    'Package', 
    'Tour', 
    'Promo', 
    'Poster', 
    'Blog', 
    'Hotel', 
    'Testimonial', 
    'Image Gallery'
];

const USER_ARCHIVE_ITEMS = [
    'ALL Users',
    'Inactive Users',
    'Suspended Users',
    'Deleted Accounts',
];

const ArchiveComponent = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [archiveItems, setArchiveItems] = useState([]);
  const [filteredArchiveItems, setFilteredArchiveItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL'); 
  const [filterSubtype, setFilterSubtype] = useState('ALL Services'); 
  const [filterListSubtype, setFilterListSubtype] = useState('ALL List Items');
  const [filterUserSubtype, setFilterUserSubtype] = useState('ALL Users');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 
  const [sortDirection, setSortDirection] = useState('desc'); 

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);
  const handleSort = () => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');

  const isExpired = (archivedDate) => {
    if (!archivedDate) return false;
    const archived = new Date(archivedDate);
    const now = new Date();
    const daysDiff = Math.floor((now - archived) / (1000 * 60 * 60 * 24));
    return daysDiff >= ARCHIVE_RETENTION_DAYS;
  };

  const getDaysRemaining = (archivedDate) => {
    if (!archivedDate) return ARCHIVE_RETENTION_DAYS;
    const archived = new Date(archivedDate);
    const now = new Date();
    const daysDiff = Math.floor((now - archived) / (1000 * 60 * 60 * 24));
    const remaining = ARCHIVE_RETENTION_DAYS - daysDiff;
    return remaining > 0 ? remaining : 0;
  };

  const fetchArchiveItems = async () => {
    try {
      setLoading(true);
      
      const results = await Promise.allSettled([
        fetchArchivedBookings(),
        fetchArchivedPackages(),
        fetchArchivedTours(),
        fetchArchivedTestimonials()
      ]);
      
      const bookingsData = results[0].status === 'fulfilled' ? results[0].value : [];
      const packagesData = results[1].status === 'fulfilled' ? results[1].value : [];
      const toursData = results[2].status === 'fulfilled' ? results[2].value : [];
      const testimonialsData = results[3].status === 'fulfilled' ? results[3].value : [];

      // Pagsamahin lahat ng data sources
      const combinedData = [...bookingsData, ...packagesData, ...toursData, ...testimonialsData];
      
      // I-filter out ang mga lampas na sa retention policy
      const nonExpiredData = combinedData.filter(item => !isExpired(item.archivedAt));

      // Mapping logic: Sinisiguro na lilitaw ang itemName kahit title o fullName ang gamit sa DB
      const formatted = nonExpiredData.map((item, index) => {
        const archiveNumber = nonExpiredData.length - index;
        const archiveId = `AR${String(archiveNumber).padStart(4, '0')}`;
        const dateRaw = item.archivedAt || item.updatedAt || item.createdAt || new Date().toISOString();

        return {
          id: archiveId,
          mongoId: item._id || item.mongoId,
          archiveNumber: archiveNumber,
          // Support para sa title (Tours) at fullName (Bookings)
          itemName: item.itemName || item.title || item.fullName || item.name || 'Unnamed Item', 
          type: item.type || (item.title ? 'Tour' : 'Booking'), 
          dateArchived: new Date(dateRaw).toLocaleDateString('en-CA'),
          archivedAtISO: dateRaw,
          daysRemaining: getDaysRemaining(dateRaw),
          reference: item.reference || item.referenceNumber || item.slug || item._id?.substring(0, 8) || 'N/A',
          status: item.status || 'Archived', 
          rawData: item
        };
      });

      setArchiveItems(formatted);
    } catch (err) {
      console.error('Archive Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => { 
    fetchArchiveItems(); 
  }, []);

  useEffect(() => {
    let filtered = [...archiveItems];
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    if (filterType === 'Archived List') {
        const listSubtypeNames = LIST_ARCHIVE_ITEMS.slice(1);
        filtered = filtered.filter(item => listSubtypeNames.includes(item.type));
        if (filterListSubtype !== 'ALL List Items') filtered = filtered.filter(item => item.type === filterListSubtype);
    } else if (filterType === 'Archived Services') {
        const serviceSubtypeNames = SERVICE_SUBTYPES_LIST.slice(1);
        filtered = filtered.filter(item => serviceSubtypeNames.includes(item.type));
        if (filterSubtype !== 'ALL Services') filtered = filtered.filter(item => item.type === filterSubtype);
    } else if (filterType === 'Archived Users') {
        const userSubtypeNames = USER_ARCHIVE_ITEMS.slice(1);
        filtered = filtered.filter(item => userSubtypeNames.includes(item.type));
        if (filterUserSubtype !== 'ALL Users') filtered = filtered.filter(item => item.type === filterUserSubtype);
    }

    if (lowerSearchTerm) {
      filtered = filtered.filter(item => 
        item.itemName.toLowerCase().includes(lowerSearchTerm) ||
        item.id.toLowerCase().includes(lowerSearchTerm) ||
        item.type.toLowerCase().includes(lowerSearchTerm) ||
        item.reference.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    const sorted = [...filtered].sort((a, b) => {
        const dateA = new Date(a.archivedAtISO);
        const dateB = new Date(b.archivedAtISO);
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });

    setFilteredArchiveItems(sorted);
    setCurrentPage(1); 
  }, [searchTerm, filterType, filterSubtype, filterListSubtype, filterUserSubtype, archiveItems, sortDirection]);

  const handleRestore = async (item) => { 
    if (!window.confirm(`Are you sure you want to restore ${item.itemName}?`)) return;
    setActionLoading(true);
    try {
      let restored = false;
      if (item.type === 'Package') restored = await restorePackage(item.mongoId);
      else if (item.type === 'Booking') restored = await restoreBooking(item.mongoId);
      else if (item.type === 'Tour') restored = await restoreTour(item.mongoId);
      else if (item.type === 'Testimonial') restored = await restoreTestimonial(item.mongoId);
      
      if (restored) {
        setArchiveItems(prev => prev.filter(i => i.mongoId !== item.mongoId));
        setShowModal(false);
        setSelectedItem(null);
        alert(`Successfully restored: ${item.itemName}`);
      } else {
        throw new Error('Restore operation failed.');
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally { 
      setActionLoading(false); 
    }
  };

  const handleRestoreAll = async () => {
    if (filteredArchiveItems.length === 0) return alert('No items to restore.');
    if (!window.confirm(`Restore all ${filteredArchiveItems.length} filtered items?`)) return;
    
    setActionLoading(true);
    try {
      for (const item of filteredArchiveItems) {
        if (item.type === 'Package') await restorePackage(item.mongoId);
        else if (item.type === 'Booking') await restoreBooking(item.mongoId);
        else if (item.type === 'Tour') await restoreTour(item.mongoId);
        else if (item.type === 'Testimonial') await restoreTestimonial(item.mongoId);
      }
      await fetchArchiveItems();
      alert('Selected items have been restored.');
    } catch (error) {
      alert('An error occurred during bulk restore.');
    } finally { 
      setActionLoading(false); 
    }
  };
  
  const handleViewDetails = (item) => { 
    setSelectedItem(item); 
    setShowModal(true); 
  };

  const totalPages = Math.ceil(filteredArchiveItems.length / itemsPerPage);
  
  const currentArchiveItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredArchiveItems.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, filteredArchiveItems]);

  const stats = useMemo(() => {
    const serviceSubtypeNames = SERVICE_SUBTYPES_LIST.slice(1);
    const listSubtypeNames = LIST_ARCHIVE_ITEMS.slice(1);
    const userSubtypeNames = USER_ARCHIVE_ITEMS.slice(1);

    return [
      { label: "Total Archived", value: archiveItems.length, icon: <Archive size={24} />, image: ARCHIVE_IMAGES.TOTAL_ITEMS },
      { label: "Archived List Items", value: archiveItems.filter(i => listSubtypeNames.includes(i.type)).length, icon: <List size={24} />, image: ARCHIVE_IMAGES.ARCHIVED_LIST },
      { label: "Archived Services", value: archiveItems.filter(i => serviceSubtypeNames.includes(i.type)).length, icon: <Wrench size={24} />, image: ARCHIVE_IMAGES.ARCHIVED_SERVICES },
      { label: "Archived Users", value: archiveItems.filter(i => userSubtypeNames.includes(i.type)).length, icon: <Users size={24} />, image: ARCHIVE_IMAGES.ARCHIVED_USERS },
    ];
  }, [archiveItems]);

  return (
    <div className="arc-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} /> 
      <main className={`arc-main ${isSidebarCollapsed ? "expanded" : ""}`}>
        <div className="arc-container">
          <div className="arc-header">
            <div className="arc-title">
              <h1>Archive Management</h1>
              <p>View and restore archived items • Auto-delete after {ARCHIVE_RETENTION_DAYS} days</p>
            </div>
            <button 
                className="arc-btn-restore-all" 
                onClick={handleRestoreAll} 
                disabled={actionLoading || filteredArchiveItems.length === 0}
            >
              <RotateCcw size={18} /> Restore Filtered
            </button>
          </div>

          <ArchiveStats stats={stats} />

          <ArchiveFilters
            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
            filterType={filterType} setFilterType={setFilterType}
            filterSubtype={filterSubtype} setFilterSubtype={setFilterSubtype}
            filterListSubtype={filterListSubtype} setFilterListSubtype={setFilterListSubtype}
            filterUserSubtype={filterUserSubtype} setFilterUserSubtype={setFilterUserSubtype}
            typeOptions={ARCHIVE_TYPES} serviceSubtypes={SERVICE_SUBTYPES_LIST}
            listSubtypes={LIST_ARCHIVE_ITEMS} userSubtypes={USER_ARCHIVE_ITEMS}
          />

          <div className="arc-table-container">
            <ArchiveTable
              loading={loading} 
              filteredArchiveItemsCount={filteredArchiveItems.length}
              currentArchiveItems={currentArchiveItems} 
              handleViewDetails={handleViewDetails}
              handleRestore={handleRestore} 
              actionLoading={actionLoading}
              EyeIcon={Eye} 
              RotateCcwIcon={RotateCcw}
              sortDirection={sortDirection} 
              handleSort={handleSort} 
              ArrowUpDownIcon={ArrowUpDown}
            />
          </div>

          {filteredArchiveItems.length > 0 && totalPages > 1 && (
            <PaginationControls 
              totalItems={filteredArchiveItems.length} 
              itemsPerPage={itemsPerPage}
              currentPage={currentPage} 
              onPageChange={(p) => setCurrentPage(p)}
              ChevronLeftIcon={ChevronLeft} 
              ChevronRightIcon={ChevronRight}
            />
          )}
        </div>
      </main>

      <ArchiveDetailModal
        showModal={showModal} 
        selectedItem={selectedItem} 
        setShowModal={setShowModal}
        handleRestore={handleRestore} 
        actionLoading={actionLoading}
        RotateCcwIcon={RotateCcw} 
        retentionDays={ARCHIVE_RETENTION_DAYS}
      />
    </div>
  );
};

export default ArchiveComponent;  
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Search, Eye, RotateCcw, Archive, ChevronLeft, ChevronRight, 
  Wrench, List, ArrowUpDown
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
import { fetchArchivedPromos, restorePromo } from './archiveFunctions/promoService';
import { fetchArchivedPosters, restorePoster } from './archiveFunctions/posterService';
import { fetchArchivedInquiries, restoreInquiry } from './archiveFunctions/inquiryService';
import { fetchArchivedBlogs, restoreBlog } from './archiveFunctions/blogService'; 
import { fetchArchivedImages, restoreImage } from './archiveFunctions/imageService'; 
import { fetchArchivedUsers, restoreUser } from './archiveFunctions/userService'; // INIDAGDAG

const ARCHIVE_IMAGES = {
    TOTAL_ITEMS: 'https://picsum.photos/seed/desk/800/600', 
    ARCHIVED_LIST: 'https://picsum.photos/seed/books/800/600',    
    ARCHIVED_SERVICES: 'https://picsum.photos/seed/wrench/800/600',
    ARCHIVED_USERS: 'https://picsum.photos/seed/people/800/600',
    ITEMS_RESTORED: 'https://picsum.photos/seed/folder/800/600' 
};

const ARCHIVE_RETENTION_DAYS = 30;

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
    'User',      // Binago para mag-match sa role field ng User model
    'Admin',     // Binago para mag-match sa role field ng User model
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
        fetchArchivedTestimonials(),
        fetchArchivedPromos(),
        fetchArchivedPosters(),
        fetchArchivedInquiries(),
        fetchArchivedBlogs(),
        fetchArchivedImages(),
        fetchArchivedUsers() // INIDAGDAG (Index 9)
      ]);
      
      const bookingsData = results[0].status === 'fulfilled' ? results[0].value : [];
      const packagesData = results[1].status === 'fulfilled' ? results[1].value : [];
      const toursData = results[2].status === 'fulfilled' ? results[2].value : [];
      const testimonialsData = results[3].status === 'fulfilled' ? results[3].value : [];
      const promosData = results[4].status === 'fulfilled' ? results[4].value : [];
      const postersData = results[5].status === 'fulfilled' ? results[5].value : []; 
      const inquiriesData = results[6].status === 'fulfilled' ? results[6].value : []; 
      const blogsData = results[7].status === 'fulfilled' ? results[7].value : [];
      const imagesData = results[8].status === 'fulfilled' ? results[8].value : []; 
      const usersData = results[9].status === 'fulfilled' ? results[9].value : []; // INIDAGDAG

      const combinedData = [
        ...bookingsData, 
        ...packagesData, 
        ...toursData, 
        ...testimonialsData,
        ...promosData,
        ...postersData,
        ...inquiriesData,
        ...blogsData,
        ...imagesData,
        ...usersData // INIDAGDAG
      ];
      
      const nonExpiredData = combinedData.filter(item => !isExpired(item.archivedAt));

      const formatted = nonExpiredData.map((item, index) => {
        const archiveNumber = nonExpiredData.length - index;
        const archiveId = `AR${String(archiveNumber).padStart(4, '0')}`;
        const dateRaw = item.archivedAt || item.updatedAt || item.createdAt || new Date().toISOString();

        let displayType = item.type || 'Other';
        
        // Logic para ma-identify kung ang item ay isang User
        if (item.role) {
            displayType = item.role.charAt(0).toUpperCase() + item.role.slice(1); // Gagawin itong 'User' o 'Admin'
        }

        if (item.inquiryType) {
           switch(item.inquiryType) {
             case 'VISA': displayType = 'VISA Processing'; break;
             case 'PSA': displayType = 'PSA Serbilis'; break;
             case 'CENOMAR': displayType = 'CENOMAR'; break;
             case 'PASSPORT': displayType = 'Passport Appt'; break; 
             case 'FLIGHT_BOOKING': displayType = 'Airline Booking'; break;
             default: displayType = item.inquiryType;
           }
        }

        return {
          id: archiveId,
          mongoId: item._id || item.mongoId,
          archiveNumber: archiveNumber,
          // Gagamit ng fullName kung user, title kung package/blog, etc.
          itemName: item.fullName || item.imageName || item.title || item.itemName || item.name || item.code || 'Unnamed Item', 
          type: displayType, 
          dateArchived: new Date(dateRaw).toLocaleDateString('en-CA'),
          archivedAtISO: dateRaw,
          daysRemaining: getDaysRemaining(dateRaw),
          // Email ang reference para sa users, imageUrl para sa gallery
          reference: item.email || item.imageUrl || item.author || item.reference || item.referenceNumber || item.code || item.slug || item._id?.substring(0, 8) || 'N/A',
          status: item.isArchive === "Yes" ? 'Archived' : (item.status || 'Archived'), 
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
        // I-filter ang mga items na may type 'User' o 'Admin'
        const userSubtypeNames = ['User', 'Admin'];
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
      // Identify if the item is a User/Admin type
      if (item.type === 'User' || item.type === 'Admin') {
          restored = await restoreUser(item.mongoId);
      }
      else if (item.type === 'Package') restored = await restorePackage(item.mongoId);
      else if (item.type === 'Booking') restored = await restoreBooking(item.mongoId);
      else if (item.type === 'Tour') restored = await restoreTour(item.mongoId);
      else if (item.type === 'Testimonial') restored = await restoreTestimonial(item.mongoId);
      else if (item.type === 'Promo') restored = await restorePromo(item.mongoId);
      else if (item.type === 'Poster') restored = await restorePoster(item.mongoId);
      else if (item.type === 'Blog') restored = await restoreBlog(item.mongoId);
      else if (item.type === 'Image Gallery') restored = await restoreImage(item.mongoId);
      else if (SERVICE_SUBTYPES_LIST.includes(item.type)) {
        restored = await restoreInquiry(item.mongoId);
      }
      
      if (restored) {
        setArchiveItems(prev => prev.filter(i => i.mongoId !== item.mongoId));
        setShowModal(false);
        setSelectedItem(null);
        alert(`Successfully restored: ${item.itemName}`);
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
        if (item.type === 'User' || item.type === 'Admin') await restoreUser(item.mongoId);
        else if (item.type === 'Package') await restorePackage(item.mongoId);
        else if (item.type === 'Booking') await restoreBooking(item.mongoId);
        else if (item.type === 'Tour') await restoreTour(item.mongoId);
        else if (item.type === 'Testimonial') await restoreTestimonial(item.mongoId);
        else if (item.type === 'Promo') await restorePromo(item.mongoId);
        else if (item.type === 'Poster') await restorePoster(item.mongoId);
        else if (item.type === 'Blog') await restoreBlog(item.mongoId);
        else if (item.type === 'Image Gallery') await restoreImage(item.mongoId);
        else if (SERVICE_SUBTYPES_LIST.includes(item.type)) await restoreInquiry(item.mongoId);
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
    const userTypes = ['User', 'Admin'];

    return [
      { label: "Total Archived", value: archiveItems.length, icon: <Archive size={24} />, image: ARCHIVE_IMAGES.TOTAL_ITEMS },
      { label: "Archived List Items", value: archiveItems.filter(i => listSubtypeNames.includes(i.type)).length, icon: <List size={24} />, image: ARCHIVE_IMAGES.ARCHIVED_LIST },
      { label: "Archived Services", value: archiveItems.filter(i => serviceSubtypeNames.includes(i.type)).length, icon: <Wrench size={24} />, image: ARCHIVE_IMAGES.ARCHIVED_SERVICES },
      { label: "Archived Users", value: archiveItems.filter(i => userTypes.includes(i.type)).length, icon: <Users size={24} />, image: ARCHIVE_IMAGES.ARCHIVED_USERS },
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
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Users, Search, TrendingUp, Eye, CheckCircle, XCircle, AlertCircle, Mail, Check, X,
  ChevronLeft, ChevronRight, FileText, CreditCard, FolderOpen, Archive as ArchiveIcon, Trash2, RotateCcw, Package, Wrench, List,
    ArrowUpDown
} from 'lucide-react';
import './Archive.css';
import Sidebar from '../sidebar/sidebar';
import ArchiveStats from './ArchiveStats';
import ArchiveFilters from './ArchiveFilters'; 
import ArchiveTable from './ArchiveTable';
import ArchiveDetailModal from './ArchiveDetailModal';
import PaginationControls from '../booking/PaginationControls'; 

const ARCHIVE_IMAGES = {
    TOTAL_ITEMS: 'https://picsum.photos/seed/desk/800/600', 
    ARCHIVED_LIST: 'https://picsum.photos/seed/books/800/600',    
    ARCHIVED_SERVICES: 'https://picsum.photos/seed/wrench/800/600',
    ARCHIVED_USERS: 'https://picsum.photos/seed/people/800/600',
    ITEMS_RESTORED: 'https://picsum.photos/seed/folder/800/600' 
};

// Archive retention period in days
const ARCHIVE_RETENTION_DAYS = 90;

// 1. TOP-LEVEL ARCHIVE TYPES
const ARCHIVE_TYPES = [
    'ALL',
    'Archived List', 
    'Archived Services',
    'Archived Users',
];

// 2. DETAILED SERVICE SUB-TYPES (from Sidebar structure)
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

// 3. DETAILED LIST SUB-TYPES (from Sidebar structure)
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

// 4. USER ARCHIVE SUB-TYPES
const USER_ARCHIVE_ITEMS = [
    'ALL Users',
    'Inactive Users',
    'Suspended Users',
    'Deleted Accounts',
];


const Archive = () => {
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

  // Sorting state: 'asc' = 1,2,3,4... | 'desc' = 20,19,18...
  const [sortDirection, setSortDirection] = useState('asc'); 

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };
    
  // Toggle between ascending and descending
  const handleSort = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  // Check if item has expired (90 days)
  const isExpired = (archivedDate) => {
    const archived = new Date(archivedDate);
    const now = new Date();
    const daysDiff = Math.floor((now - archived) / (1000 * 60 * 60 * 24));
    return daysDiff >= ARCHIVE_RETENTION_DAYS;
  };

  // Calculate days remaining until expiration
  const getDaysRemaining = (archivedDate) => {
    const archived = new Date(archivedDate);
    const now = new Date();
    const daysDiff = Math.floor((now - archived) / (1000 * 60 * 60 * 24));
    const remaining = ARCHIVE_RETENTION_DAYS - daysDiff;
    return remaining > 0 ? remaining : 0;
  };

  const generateMockData = () => {
      const today = new Date();
      const mockList = [];
      
      const listTypes = LIST_ARCHIVE_ITEMS.slice(1);
      const serviceTypes = SERVICE_SUBTYPES_LIST.slice(1);
      const userTypes = USER_ARCHIVE_ITEMS.slice(1);
      const allTypes = [...listTypes, ...serviceTypes, ...userTypes]; 
      const names = ['Client A Request', 'Holiday Promo', 'Mt. Apo Package', 'Bohol Tour', 'Old Blog Post', 'Manila Hotel Deal', 'Testimonial Review', 'VISA App'];

      for (let i = 1; i <= 25; i++) {
          // ALL ITEMS ARE CANCELLED - NO MORE 'deleted' STATUS
          const status = 'cancelled';
          const typeIndex = i % allTypes.length;
          const type = allTypes[typeIndex];
          
          // Create dates with varying ages (some old, some new)
          const archivedDate = new Date(today);
          archivedDate.setDate(today.getDate() - (i * 2)); // Items archived 2, 4, 6... days ago

          mockList.push({
              _id: `mockId${i}`,
              fullName: `Item ${i} (${type})`,
              type: type,
              status: status,
              archivedAt: archivedDate.toISOString(),
              referenceNumber: `${type.substring(0, 3).toUpperCase()}${String(100 + i).padStart(3, '0')}`,
              name: `${names[i % names.length]} - ${i}`,
              slug: `slug-item-${i}`
          });
      }
      return mockList;
  };
  
  const fetchArchiveItems = async () => {
    try {
      setLoading(true);
      const dataToUse = generateMockData();

      // Filter out expired items (older than 90 days) automatically
      const nonExpiredData = dataToUse.filter(item => !isExpired(item.archivedAt));

      const formatted = nonExpiredData.map((item, index) => {
        // Create Archive ID (AR0025, AR0024, AR0023...)
        const archiveNumber = nonExpiredData.length - index;
        const archiveId = `AR${String(archiveNumber).padStart(4, '0')}`;
        
        return {
          id: archiveId,
          mongoId: item._id,
          archiveNumber: archiveNumber,
          itemName: item.name || item.fullName || 'No Name', 
          type: item.type || 'Booking', 
          dateArchived: new Date(item.archivedAt || item.createdAt).toLocaleDateString('en-CA'),
          archivedAtISO: item.archivedAt, // Keep ISO for expiration calculation
          daysRemaining: getDaysRemaining(item.archivedAt),
          reference: item.referenceNumber || item.slug || 'N/A',
          status: item.status || 'cancelled', 
          rawData: item
        };
      });

      setArchiveItems(formatted);
    } catch (err) {
      console.error('Archive Fetch error (using mock data):', err);
      const fallbackData = generateMockData();
      const nonExpiredData = fallbackData.filter(item => !isExpired(item.archivedAt));
      
      setArchiveItems(nonExpiredData.map((item, index) => {
        const archiveNumber = nonExpiredData.length - index;
        const archiveId = `AR${String(archiveNumber).padStart(4, '0')}`;
        return {
          id: archiveId,
          mongoId: item._id,
          archiveNumber: archiveNumber,
          itemName: item.name || item.fullName || 'No Name', 
          type: item.type || 'Booking', 
          dateArchived: new Date(item.archivedAt || item.createdAt).toLocaleDateString('en-CA'),
          archivedAtISO: item.archivedAt,
          daysRemaining: getDaysRemaining(item.archivedAt),
          reference: item.referenceNumber || item.slug || 'N/A',
          status: item.status || 'cancelled', 
          rawData: item
        };
      }));
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchArchiveItems();
  }, []);

  useEffect(() => {
    let filtered = archiveItems;

    const lowerSearchTerm = searchTerm.toLowerCase();
    
    // 1. Filter by Hierarchical Type
    if (filterType === 'Archived List') {
        const listSubtypeNames = LIST_ARCHIVE_ITEMS.slice(1);
        filtered = filtered.filter(item => listSubtypeNames.includes(item.type));
        
        if (filterListSubtype !== 'ALL List Items') {
            filtered = filtered.filter(item => item.type === filterListSubtype);
        }

    } else if (filterType === 'Archived Services') {
        const serviceSubtypeNames = SERVICE_SUBTYPES_LIST.slice(1);
        filtered = filtered.filter(item => serviceSubtypeNames.includes(item.type));

        if (filterSubtype !== 'ALL Services') {
            filtered = filtered.filter(item => item.type === filterSubtype);
        }
    } else if (filterType === 'Archived Users') {
        const userSubtypeNames = USER_ARCHIVE_ITEMS.slice(1);
        filtered = filtered.filter(item => userSubtypeNames.includes(item.type));

        if (filterUserSubtype !== 'ALL Users') {
            filtered = filtered.filter(item => item.type === filterUserSubtype);
        }
    }

    // 2. Filter by Search Term
    if (lowerSearchTerm) {
      filtered = filtered.filter(item => 
        item.itemName.toLowerCase().includes(lowerSearchTerm) ||
        item.id.toLowerCase().includes(lowerSearchTerm) ||
        item.type.toLowerCase().includes(lowerSearchTerm) ||
        item.reference.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    // 3. Apply Sorting based on Archive Number
    const sorted = [...filtered].sort((a, b) => {
        // ASC: 1, 2, 3, 4... 25
        // DESC: 25, 24, 23... 1
        if (sortDirection === 'asc') {
            return a.archiveNumber - b.archiveNumber;
        } else {
            return b.archiveNumber - a.archiveNumber;
        }
    });

    setFilteredArchiveItems(sorted);
    setCurrentPage(1); 
}, [searchTerm, filterType, filterSubtype, filterListSubtype, filterUserSubtype, archiveItems, sortDirection]);

  const handleRestore = async (item) => { 
    setActionLoading(true);
    console.log('Restoring item:', item);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Remove item from archive list after restore
    setArchiveItems(prevItems => prevItems.filter(i => i.id !== item.id));
    
    // Close modal if open
    setShowModal(false);
    setSelectedItem(null);
    
    setActionLoading(false);
    alert(`Item ${item.id} restored successfully!`);
  };
  
  const handleRestoreAll = async () => {
    if (archiveItems.length === 0) {
      alert('No items to restore.');
      return;
    }
    
    const confirmed = window.confirm(`Are you sure you want to restore all ${archiveItems.length} archived items?`);
    if (!confirmed) return;
    
    setActionLoading(true);
    console.log('Restoring all items...');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Clear all archive items
    setArchiveItems([]);
    
    setActionLoading(false);
    alert('All items restored successfully!');
  };
  
  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };
    
  const stats = useMemo(() => {
    const serviceSubtypeNames = SERVICE_SUBTYPES_LIST.slice(1);
    const listSubtypeNames = LIST_ARCHIVE_ITEMS.slice(1);
    const userSubtypeNames = USER_ARCHIVE_ITEMS.slice(1);
    const totalRestored = 0;

    return [
      { 
          label: "Total Archived", 
          value: archiveItems.length, 
          icon: <ArchiveIcon size={24} />, 
          image: ARCHIVE_IMAGES.TOTAL_ITEMS 
      },
      { 
          label: "Archived List Items", 
          value: archiveItems.filter(i => listSubtypeNames.includes(i.type)).length, 
          icon: <List size={24} />, 
          image: ARCHIVE_IMAGES.ARCHIVED_LIST 
      },
      { 
          label: "Archived Services", 
          value: archiveItems.filter(i => serviceSubtypeNames.includes(i.type)).length, 
          icon: <Wrench size={24} />, 
          image: ARCHIVE_IMAGES.ARCHIVED_SERVICES 
      },
      { 
          label: "Archived Users", 
          value: archiveItems.filter(i => userSubtypeNames.includes(i.type)).length, 
          icon: <Users size={24} />, 
          image: ARCHIVE_IMAGES.ARCHIVED_USERS 
      },
    ];
  }, [archiveItems]);
    
  const totalPages = Math.ceil(filteredArchiveItems.length / itemsPerPage);
  
  // Get current page items (already sorted)
  const currentArchiveItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredArchiveItems.slice(startIndex, endIndex);
  }, [currentPage, filteredArchiveItems, itemsPerPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

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
              disabled={actionLoading || archiveItems.length === 0}
            >
              <RotateCcw size={18} /> Restore All
            </button>
          </div>

          <ArchiveStats stats={stats} />
          
          <ArchiveFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterType={filterType}
            setFilterType={setFilterType}
            filterSubtype={filterSubtype}
            setFilterSubtype={setFilterSubtype}
            filterListSubtype={filterListSubtype} 
            setFilterListSubtype={setFilterListSubtype}
            filterUserSubtype={filterUserSubtype}
            setFilterUserSubtype={setFilterUserSubtype}
            typeOptions={ARCHIVE_TYPES} 
            serviceSubtypes={SERVICE_SUBTYPES_LIST}
            listSubtypes={LIST_ARCHIVE_ITEMS}
            userSubtypes={USER_ARCHIVE_ITEMS}
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
              onPageChange={handlePageChange}
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

export default Archive;
import React, { useState, useMemo } from 'react';
import Sidebar from '../../sidebar/sidebar';
import { Plus, Shield, Clock, FileText, AlertCircle, ChevronLeft, ChevronRight, Search } from 'lucide-react'; // Import Search icon
import './TravelInsurance.css';

const TravelInsurance = () => {
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    
    // --- Search and Filter States ---
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('All Items'); // Default to show all

    // --- Pagination State ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; 

    const stats = [
        { label: 'Policies Active', value: '45', icon: <Shield size={24}/> },
        { label: 'Pending Issuance', value: '2', icon: <Clock size={24}/> },
        { label: 'Expired', value: '120', icon: <FileText size={24}/> },
        { label: 'Claims', value: '0', icon: <AlertCircle size={24}/> },
    ];

    // --- Expanded Data Set for Pagination Demonstration ---
    const allData = useMemo(() => [
        { id: 'INS-99', client: 'Anne Curtis', provider: 'Standard Insurance', coverage: 'International Gold', days: '15 Days', amount: '₱2,500', status: 'Active' },
        { id: 'INS-98', client: 'John Lloyd Cruz', provider: 'Pru Life UK', coverage: 'Domestic Silver', days: '7 Days', amount: '₱1,200', status: 'Expired' },
        { id: 'INS-97', client: 'Bea Alonzo', provider: 'AXA Philippines', coverage: 'International Platinum', days: '30 Days', amount: '₱5,000', status: 'Active' },
        { id: 'INS-96', client: 'Dingdong Dantes', provider: 'Standard Insurance', coverage: 'Domestic Gold', days: '10 Days', amount: '₱1,800', status: 'Active' },
        { id: 'INS-95', client: 'Marian Rivera', provider: 'BDO Insure', coverage: 'International Silver', days: '20 Days', amount: '₱3,200', status: 'Pending' },
        { id: 'INS-94', client: 'Coco Martin', provider: 'Standard Insurance', coverage: 'Domestic Platinum', days: '5 Days', amount: '₱900', status: 'Active' },
        { id: 'INS-93', client: 'Angel Locsin', provider: 'Pru Life UK', coverage: 'International Gold', days: '14 Days', amount: '₱2,400', status: 'Expired' },
        { id: 'INS-92', client: 'Kathryn Bernardo', provider: 'AXA Philippines', coverage: 'Domestic Silver', days: '3 Days', amount: '₱600', status: 'Active' },
        { id: 'INS-91', client: 'Daniel Padilla', provider: 'Standard Insurance', coverage: 'International Gold', days: '25 Days', amount: '₱4,000', status: 'Active' },
        { id: 'INS-90', client: 'Liza Soberano', provider: 'BDO Insure', coverage: 'Domestic Gold', days: '7 Days', amount: '₱1,100', status: 'Pending' },
        { id: 'INS-89', client: 'Enrique Gil', provider: 'Pru Life UK', coverage: 'International Platinum', days: '45 Days', amount: '₱7,500', status: 'Active' },
        { id: 'INS-88', client: 'Maja Salvador', provider: 'Standard Insurance', coverage: 'Domestic Platinum', days: '12 Days', amount: '₱2,100', status: 'Active' },
        { id: 'INS-87', client: 'Vice Ganda', provider: 'AXA Philippines', coverage: 'International Gold', days: '18 Days', amount: '₱2,900', status: 'Expired' },
    ], []); // useMemo to prevent re-creation

    const filterOptions = ['All Items', 'Active', 'Pending', 'Expired'];

    // --- Combined Filter and Search Logic ---
    const filteredAndSearchedData = useMemo(() => {
        let data = allData;
        
        // 1. Filter by Status
        if (activeFilter !== 'All Items') {
            data = data.filter(item => item.status === activeFilter);
        }

        // 2. Search by Term
        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            data = data.filter(item => 
                item.id.toLowerCase().includes(lowerCaseSearchTerm) ||
                item.client.toLowerCase().includes(lowerCaseSearchTerm) ||
                item.provider.toLowerCase().includes(lowerCaseSearchTerm) ||
                item.coverage.toLowerCase().includes(lowerCaseSearchTerm) ||
                item.status.toLowerCase().includes(lowerCaseSearchTerm)
            );
        }

        // Reset to first page after filtering/searching
        setCurrentPage(1); 

        return data;
    }, [allData, activeFilter, searchTerm]);


    // --- Pagination Logic ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentData = filteredAndSearchedData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredAndSearchedData.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const renderPageNumbers = () => {
        const pageNumbers = [];
        for (let i = 1; i <= totalPages; i++) {
            pageNumbers.push(
                <button
                    key={i}
                    onClick={() => paginate(i)}
                    className={`pagination-btn ${i === currentPage ? 'active' : ''}`}
                >
                    {i}
                </button>
            );
        }
        return pageNumbers;
    };
    // -------------------------

    return (
        <div className="insurance-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
            <main className={`insurance-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
                <div className="insurance-container">
                    <div className="insurance-header">
                        <div className="insurance-title">
                            <h1>Travel Insurance</h1>
                            <p>Medical and Trip Cancellation Coverage ({filteredAndSearchedData.length} Policies)</p>
                        </div>
                        <button className="insurance-btn-add"><Plus size={18} style={{marginRight:'8px'}}/> New Policy</button>
                    </div>

                    <div className="insurance-stats-grid">
                        {stats.map((s, i) => (
                            <div className="insurance-card" key={i}>
                                <div><h2>{s.value}</h2><span>{s.label}</span></div>
                                <div className="insurance-card-icon">{s.icon}</div>
                            </div>
                        ))}
                    </div>

                    {/* --- Search and Filter Card --- */}
                    <div className="search-filter-card">
                        <div className="search-filter-wrapper">
                            <div className="search-box">
                                <Search size={20} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search by Policy No, Client, or Provider..."
                                    className="search-input"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="filter-buttons">
                                {filterOptions.map((filter) => {
                                    const statusClass = filter.toLowerCase().replace(' ', '-');
                                    return (
                                        <button
                                            key={filter}
                                            className={`filter-btn ${activeFilter === filter ? `${statusClass}-active` : ''} ${filter === 'All Items' ? 'active-filter' : ''}`}
                                            onClick={() => setActiveFilter(filter)}
                                        >
                                            {filter}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    {/* ----------------------------- */}


                    <div className="insurance-table-container">
                        <table className="insurance-table">
                            <thead>
                                <tr>
                                    <th style={{width: '5%'}}>#</th> 
                                    <th>Policy No.</th>
                                    <th>Insured Name</th>
                                    <th>Provider</th>
                                    <th>Coverage</th>
                                    <th>Duration</th>
                                    <th>Premium</th>
                                    <th>Status</th>
                                    <th style={{textAlign:'right'}}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentData.length > 0 ? (
                                    currentData.map((item, index) => (
                                        <tr key={item.id}>
                                            <td style={{fontWeight:'500', color:'#475569'}}>
                                                {indexOfFirstItem + index + 1} 
                                            </td>
                                            <td style={{fontWeight:'700', color:'#0f172a'}}>{item.id}</td>
                                            <td>{item.client}</td>
                                            <td>{item.provider}</td>
                                            <td>{item.coverage}</td>
                                            <td>{item.days}</td>
                                            <td style={{fontWeight:'700'}}>{item.amount}</td>
                                            <td><span className={`status-pill status-${item.status.toLowerCase()}`}>{item.status}</span></td>
                                            <td style={{textAlign:'right'}}>
                                                <button className="insurance-action-btn">Policy</button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>
                                            No travel insurance policies found matching your search or filter criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        
                        {/* --- Pagination Navigation --- */}
                        {totalPages > 1 && (
                            <nav className="pagination-nav">
                                <ul className="pagination-list">
                                    <li>
                                        <button 
                                            onClick={() => paginate(currentPage - 1)} 
                                            disabled={currentPage === 1}
                                            className="pagination-btn"
                                        >
                                            <ChevronLeft size={16} /> Prev
                                        </button>
                                    </li>
                                    
                                    {renderPageNumbers()}

                                    <li>
                                        <button 
                                            onClick={() => paginate(currentPage + 1)} 
                                            disabled={currentPage === totalPages}
                                            className="pagination-btn"
                                        >
                                            Next <ChevronRight size={16} />
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        )}
                        {/* ----------------------------- */}

                    </div>
                </div>
            </main>
        </div>
    );
};
export default TravelInsurance;
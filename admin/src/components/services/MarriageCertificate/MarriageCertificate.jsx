import React, { useState } from 'react';
import Sidebar from '../../sidebar/sidebar';
import { Plus, Heart, Clock, Truck, AlertOctagon, ChevronLeft, ChevronRight } from 'lucide-react';
import './MarriageCertificate.css';

const ITEMS_PER_PAGE = 10;

// Expanded mock data for demonstration purposes
const allRequests = [
    { id: 'MC-101', husband: 'Dingdong Dantes', wife: 'Marian Rivera', dateMarried: 'Dec 30, 2014', copies: 2, status: 'Completed' },
    { id: 'MC-102', husband: 'Richard Gutierrez', wife: 'Sarah Lahbati', dateMarried: 'Mar 14, 2020', copies: 1, status: 'Pending' },
    { id: 'MC-103', husband: 'Drew Arellano', wife: 'Iya Villania', dateMarried: 'Jan 31, 2014', copies: 3, status: 'Completed' },
    { id: 'MC-104', husband: 'Ryan Agoncillo', wife: 'Judy Ann Santos', dateMarried: 'Apr 28, 2009', copies: 1, status: 'Completed' },
    { id: 'MC-105', husband: 'Zoren Legaspi', wife: 'Carmina Villaroel', dateMarried: 'Nov 15, 2012', copies: 2, status: 'Unclaimed' },
    { id: 'MC-106', husband: 'Erwan Heussaff', wife: 'Anne Curtis', dateMarried: 'Nov 12, 2017', copies: 1, status: 'Processing' },
    { id: 'MC-107', husband: 'Ogie Alcasid', wife: 'Regine Velasquez', dateMarried: 'Dec 22, 2010', copies: 2, status: 'Completed' },
    { id: 'MC-108', husband: 'Vhong Navarro', wife: 'Tanya Bautista', dateMarried: 'Nov 28, 2019', copies: 1, status: 'Completed' },
    { id: 'MC-109', husband: 'Robin Padilla', wife: 'Mariel Rodriguez', dateMarried: 'Aug 19, 2010', copies: 3, status: 'Pending' },
    { id: 'MC-110', husband: 'Piolo Pascual', wife: 'Shaina Magdayao', dateMarried: 'Feb 14, 2022', copies: 1, status: 'Processing' }, // End of Page 1 (10 items)

    { id: 'MC-111', husband: 'John Lloyd Cruz', wife: 'Ellen Adarna', dateMarried: 'Apr 04, 2018', copies: 2, status: 'Completed' },
    { id: 'MC-112', husband: 'Coco Martin', wife: 'Julia Montes', dateMarried: 'May 05, 2021', copies: 1, status: 'Pending' },
    { id: 'MC-113', husband: 'Alden Richards', wife: 'Maine Mendoza', dateMarried: 'Dec 12, 2020', copies: 1, status: 'Completed' },
    { id: 'MC-114', husband: 'Daniel Padilla', wife: 'Kathryn Bernardo', dateMarried: 'Jun 11, 2023', copies: 2, status: 'Completed' },
    { id: 'MC-115', husband: 'Jericho Rosales', wife: 'Kim Jones', dateMarried: 'May 01, 2014', copies: 1, status: 'Unclaimed' },
    { id: 'MC-116', husband: 'Sam Milby', wife: 'Catriona Gray', dateMarried: 'Jan 28, 2024', copies: 3, status: 'Processing' },
    { id: 'MC-117', husband: 'Gerald Anderson', wife: 'Julia Barretto', dateMarried: 'Aug 20, 2022', copies: 1, status: 'Completed' },
    { id: 'MC-118', husband: 'Rayver Cruz', wife: 'Julie Anne San Jose', dateMarried: 'Oct 10, 2023', copies: 2, status: 'Pending' },
    { id: 'MC-119', husband: 'Matteo Guidicelli', wife: 'Sarah Geronimo', dateMarried: 'Feb 20, 2020', copies: 1, status: 'Completed' },
    { id: 'MC-120', husband: 'Billy Crawford', wife: 'Coleen Garcia', dateMarried: 'Apr 20, 2018', copies: 2, status: 'Processing' }, // End of Page 2 (20 items)
    
    { id: 'MC-121', husband: 'Vico Sotto', wife: 'Robi Domingo', dateMarried: 'Dec 25, 2024', copies: 1, status: 'Pending' },
    { id: 'MC-122', husband: 'Bamboo Mañalac', wife: 'Lea Salonga', dateMarried: 'Feb 02, 2025', copies: 2, status: 'Unclaimed' },
    { id: 'MC-123', husband: 'Apl.de.ap', wife: 'Nicole Scherzinger', dateMarried: 'Mar 03, 2025', copies: 1, status: 'Completed' },
    { id: 'MC-124', husband: 'Ben&Ben', wife: 'Moira Dela Torre', dateMarried: 'Apr 04, 2025', copies: 3, status: 'Processing' },
    { id: 'MC-125', husband: 'Silent Sanctuary', wife: 'Callalily', dateMarried: 'May 05, 2025', copies: 2, status: 'Completed' }, // End of all items (25 items)
];


const MarriageCertificate = () => {
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    
    // Pagination Logic
    const totalPages = Math.ceil(allRequests.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentRequests = allRequests.slice(startIndex, endIndex);

    const changePage = (pageNumber) => {
        if (pageNumber > 0 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };
    
    // Helper function to generate page numbers
    const getPageNumbers = () => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
        return pages;
    };

    const stats = [
        { label: 'Requests', value: '150', icon: <Heart size={24}/> }, // Assuming 150 total requests
        { label: 'Processing', value: '12', icon: <Clock size={24}/> },
        { label: 'Delivered', value: '135', icon: <Truck size={24}/> },
        { label: 'Unclaimed', value: '3', icon: <AlertOctagon size={24}/> },
    ];

    return (
        <div className="marriage-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
            <main className={`marriage-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
                <div className="marriage-container">
                    <div className="marriage-header">
                        <div className="marriage-title">
                            <h1>Marriage Certificate</h1>
                            <p>PSA Authenticated Marriage Certificate Requests</p>
                        </div>
                        <button className="marriage-btn-add"><Plus size={18} style={{marginRight:'8px'}}/> New Request</button>
                    </div>

                    <div className="marriage-stats-grid">
                        {stats.map((s, i) => (
                            <div className="marriage-card" key={i}>
                                <div><h2>{s.value}</h2><span>{s.label}</span></div>
                                <div className="marriage-card-icon">{s.icon}</div>
                            </div>
                        ))}
                    </div>

                    <div className="marriage-table-container">
                        <table className="marriage-table">
                            <thead>
                                <tr>
                                    <th>Ref #</th>
                                    <th>Husband Name</th>
                                    <th>Wife Name</th>
                                    <th>Date of Marriage</th>
                                    <th>Copies</th>
                                    <th>Status</th>
                                    <th style={{textAlign:'right'}}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentRequests.map((req) => (
                                    <tr key={req.id}>
                                        <td style={{fontWeight:'700', color:'#0f172a'}}>{req.id}</td>
                                        <td>{req.husband}</td>
                                        <td>{req.wife}</td>
                                        <td>{req.dateMarried}</td>
                                        <td style={{textAlign:'center'}}>{req.copies}</td>
                                        <td><span className={`status-pill status-${req.status.toLowerCase().replace(' ', '-')}`}>{req.status}</span></td>
                                        <td style={{textAlign:'right'}}>
                                            <button className="marriage-action-btn">Details</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {/* --- PAGINATION NAVIGATION --- */}
                        <div className="pagination-nav">
                            <ul className="pagination-list">
                                <li>
                                    <button 
                                        className="pagination-btn"
                                        onClick={() => changePage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft size={16} /> Previous
                                    </button>
                                </li>
                                {getPageNumbers().map(number => (
                                    <li key={number}>
                                        <button
                                            className={`pagination-btn ${currentPage === number ? 'active' : ''}`}
                                            onClick={() => changePage(number)}
                                        >
                                            {number}
                                        </button>
                                    </li>
                                ))}
                                <li>
                                    <button 
                                        className="pagination-btn"
                                        onClick={() => changePage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next <ChevronRight size={16} />
                                    </button>
                                </li>
                            </ul>
                        </div>
                        {/* --- END PAGINATION NAVIGATION --- */}
                    </div>
                </div>
            </main>
        </div>
    );
};
export default MarriageCertificate;
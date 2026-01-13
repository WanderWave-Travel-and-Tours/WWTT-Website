import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Package, 
  Tag, 
  ClipboardList, 
  Star, 
  Wrench, 
  Users, 
  LogOut, 
  ChevronDown, 
  ChevronRight,
  ChevronLeft,
  List,
  Menu,
  FilePlus,
  ListOrdered,
  Settings, 
  FileText,
  HeartHandshake,
  Plane,
  BookOpen,
  Hotel,
  Calendar,
  Image, 
  Images,
  PenTool,
  Newspaper,
  UploadCloud, 
  Grid,
  MapPin,
  Ship,       
  ShieldCheck,
  Briefcase,
  TrendingUp,
  Archive as ArchiveIcon,
  Activity,
  DollarSign,
  UserCog
} from 'lucide-react';

// --- UPDATED IMPORTS ---
import { useToast } from '../toast/ToastManager';
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal';
import './sidebar.css';

// --- HELPER: PATH LISTS ---
const MENU_PATHS = {
    add: [
        '/add-package', '/add-tour', '/add-promo', '/add-poster', 
        '/add-hotel', '/add-blog', '/add-image', '/add-testimonial', '/add-service'
    ],
    list: [
        '/view-packages', '/view-tours', '/view-promos', '/view-posters', 
        '/view-blogs', '/view-hotels', '/view-images', '/view-testimonials'
    ],
    services: [
        '/view-services', '/services/visa', '/services/psa', '/services/cenomar',
        '/services/passport', '/services/airlinebooking', '/services/hotelbooking',
        '/services/tourarrangements', '/services/ferrybooking', '/services/marriagecert',
        '/services/travelinsurance', '/services/billspayment'
    ]
};

// --- SUB-COMPONENTS ---

const MenuItem = ({ path, icon: Icon, label, isCollapsed, isActive, onClick }) => {
  return (
    <li className="nav-item">
      <button
        onClick={onClick}
        className={`menu-btn ${isActive ? 'active' : ''}`}
        title={isCollapsed ? label : ''}
      >
        <div className="btn-content">
          <Icon size={20} className="btn-icon" />
          <span className={`btn-label ${isCollapsed ? 'hidden' : ''}`}>{label}</span>
        </div>
      </button>
    </li>
  );
};

const DropdownMenu = ({ title, icon: Icon, menuKey, childrenItems, isOpen, isCollapsed, toggleMenu, location, navigate }) => {
  const isChildActive = childrenItems.some(item => item.path === location.pathname);

  return (
    <li className="nav-item">
      <div className="submenu-container">
        <button
          onClick={() => toggleMenu(menuKey)}
          className={`menu-btn ${isChildActive || (isOpen && !isCollapsed) ? 'active' : ''}`}
          title={isCollapsed ? title : ''}
        >
          <div className="btn-content">
            <Icon size={20} className="btn-icon" />
            <span className={`btn-label ${isCollapsed ? 'hidden' : ''}`}>{title}</span>
          </div>
          {!isCollapsed && (
            <span className="arrow-icon">
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </span>
          )}
        </button>

        <div className={`submenu-wrapper ${isOpen && !isCollapsed ? 'open' : 'closed'}`}>
          <ul className="submenu-list">
            {childrenItems.map((item) => (
              <li key={item.path}>
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    navigate(item.path); 
                  }}
                  className={`submenu-btn ${location.pathname === item.path ? 'active' : ''}`}
                >
                  <item.icon size={16} className="sub-icon" />
                  <span className="sub-label">{item.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
};

// --- MAIN COMPONENT ---

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast(); // ✅ Initialize Toast Manager
  
  // Initialize state based on current URL to prevent flicker on load
  const getInitialMenuState = useCallback(() => {
    const path = location.pathname;
    return {
        add: MENU_PATHS.add.includes(path),
        list: MENU_PATHS.list.includes(path),
        services: MENU_PATHS.services.includes(path) || path.startsWith('/services/')
    };
  }, [location.pathname]);

  const [openMenus, setOpenMenus] = useState(getInitialMenuState);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMainAdmin, setIsMainAdmin] = useState(false);
  
  // ✅ Modal State for Logout
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
    const mainAdmin = adminData.isMainAdmin === true;
    setIsMainAdmin(mainAdmin);
    
    console.log('🔐 Sidebar Admin Check:', {
      email: adminData.email,
      isMainAdmin: mainAdmin
    });
  }, []);

  useEffect(() => {
    const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
    const mainAdmin = adminData.email?.toLowerCase() === 'info@wanderwavetravelandtours.com';
    setIsMainAdmin(mainAdmin);
    
    console.log('🔐 Sidebar Admin Check:', {
      email: adminData.email,
      isMainAdmin: mainAdmin
    });
  }, []);

  // ---------------------------------------------------------
  // ✅ LOGIC 1: SYNC MENU WITH URL
  // ---------------------------------------------------------
  useEffect(() => {
    if (isCollapsed) return;

    const path = location.pathname;
    let targetState = { add: false, list: false, services: false };

    if (MENU_PATHS.add.includes(path)) {
        targetState = { add: true, list: false, services: false };
    } else if (MENU_PATHS.list.includes(path)) {
        targetState = { add: false, list: true, services: false };
    } else if (MENU_PATHS.services.includes(path) || path.startsWith('/services/')) {
        targetState = { add: false, list: false, services: true };
    } else {
        return; 
    }

    setOpenMenus(targetState);
  }, [location.pathname, isCollapsed]);


  // ---------------------------------------------------------
  // ✅ LOGIC 2: CLOSE MENUS WHEN SIDEBAR COLLAPSES
  // ---------------------------------------------------------
  useEffect(() => {
    if (isCollapsed) {
      setOpenMenus({ add: false, list: false, services: false });
    }
  }, [isCollapsed]);

  // ---------------------------------------------------------
  // ✅ LOGIC 3: MANUAL TOGGLE
  // ---------------------------------------------------------
  const toggleMenu = (menuKey) => {
    if (isCollapsed) {
      toggleSidebar();
      setTimeout(() => {
        setOpenMenus({
          add: false,
          list: false,
          services: false,
          [menuKey]: true 
        });
      }, 100);
      return; 
    }

    setOpenMenus(prev => ({
      add: false,
      list: false,
      services: false,
      [menuKey]: !prev[menuKey] 
    }));
  };

  // ---------------------------------------------------------
  // ✅ LOGIC 4: UPDATED LOGOUT WITH MODAL AND TOAST
  // ---------------------------------------------------------
  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = async () => {
    setIsLogoutModalOpen(false); // Close modal first
    setIsLoggingOut(true);
    
    try {
      const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
      const adminToken = localStorage.getItem('adminToken');

      const response = await fetch('http://localhost:5000/api/admin/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminToken && { 'Authorization': `Bearer ${adminToken}` })
        },
        body: JSON.stringify({
          email: adminData.email || 'admin@wanderwave.com',
          adminId: adminData.id || null
        })
      });

      if (response.ok) {
        toast.success('You have been logged out successfully.', 'Logout Success');
      } else {
        toast.warning('Session expired or already logged out.', 'Logout Info');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Could not connect to the server. Logging out locally.', 'Network Error');
    } finally {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      setIsLoggingOut(false);
      navigate('/admin');
    }
  };

  return (
    <>
      <div className={`sidebar-container custom-scrollbar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand-wrapper">
              <div className="sidebar-logo-box">
                  <img 
                  src="https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911894edaa4e3fb6cfb8afe.png" 
                  alt="Logo" 
                  className="sidebar-logo-img"
                  />
              </div>
              
              <div className={`brand-info ${isCollapsed ? 'hidden' : ''}`}>
                  <h1>WANDERWAVE</h1>
                  <span>Admin Panel</span>
              </div>
          </div>
          
          <button 
              className="toggle-btn" 
              onClick={toggleSidebar}
              type="button"
          >
              {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="sidebar-nav custom-scrollbar">
          <div className="menu-group">
            <h3 className={`menu-title ${isCollapsed ? 'hidden' : ''}`}>Main Menu</h3>
            <ul className="nav-list">
              <MenuItem 
                  path="/dashboard" 
                  icon={LayoutDashboard} 
                  label="Dashboard" 
                  isCollapsed={isCollapsed}
                  isActive={location.pathname === '/dashboard'}
                  onClick={() => navigate('/dashboard')}
              />
              <MenuItem 
                  path="/booking" 
                  icon={Calendar} 
                  label="Booking" 
                  isCollapsed={isCollapsed}
                  isActive={location.pathname === '/booking'}
                  onClick={() => navigate('/booking')}
              />
              
              <DropdownMenu 
                title="Add New" 
                icon={PlusCircle} 
                menuKey="add"
                isOpen={openMenus.add}
                isCollapsed={isCollapsed}
                toggleMenu={toggleMenu}
                location={location}
                navigate={navigate}
                childrenItems={[
                  { name: 'Package', path: '/add-package', icon: FilePlus },
                  { name: 'Tour', path: '/add-tour', icon: MapPin },
                  { name: 'Promo', path: '/add-promo', icon: Tag },
                  { name: 'Poster', path: '/add-poster', icon: Image },
                  { name: 'Hotel', path: '/add-hotel', icon: Hotel },
                  { name: 'Blog', path: '/add-blog', icon: PenTool },
                  { name: 'Image', path: '/add-image', icon: UploadCloud }, 
                  { name: 'Testimonial', path: '/add-testimonial', icon: Star },
                  { name: 'Service', path: '/add-service', icon: Briefcase },
                ]}
              />

              <DropdownMenu 
                title="Lists" 
                icon={List} 
                menuKey="list"
                isOpen={openMenus.list}
                isCollapsed={isCollapsed}
                toggleMenu={toggleMenu}
                location={location}
                navigate={navigate}
                childrenItems={[
                  { name: 'Packages', path: '/view-packages', icon: Package },
                  { name: 'Tours', path: '/view-tours', icon: MapPin },
                  { name: 'Promos', path: '/view-promos', icon: ListOrdered },
                  { name: 'Posters', path: '/view-posters', icon: Images },
                  { name: 'Blogs', path: '/view-blogs', icon: Newspaper },
                  { name: 'Hotels', path: '/view-hotels', icon: Hotel },
                  { name: 'Gallery', path: '/view-images', icon: Grid }, 
                  { name: 'Testimonials', path: '/view-testimonials', icon: ClipboardList },
                ]}
              />
              <DropdownMenu 
                title="Services" 
                icon={Wrench} 
                menuKey="services"
                isOpen={openMenus.services}
                isCollapsed={isCollapsed}
                toggleMenu={toggleMenu}
                location={location}
                navigate={navigate}
                childrenItems={[
                  { name: 'Manage All', path: '/view-services', icon: Briefcase }, 
                  { name: 'VISA', path: '/services/visa', icon: BookOpen },
                  { name: 'PSA', path: '/services/psa', icon: FileText },
                  { name: 'CENOMAR', path: '/services/cenomar', icon: HeartHandshake },
                  { name: 'Passport', path: '/services/passport', icon: BookOpen },
                  { name: 'Flights', path: '/services/airlinebooking', icon: Plane },
                  { name: 'Hotels', path: '/services/hotelbooking', icon: Hotel },
                  { name: 'Tours', path: '/services/tourarrangements', icon: Calendar },
                  { name: 'Ferry', path: '/services/ferrybooking', icon: Ship },
                  { name: 'Marriage', path: '/services/marriagecert', icon: FileText },
                  { name: 'Insurance', path: '/services/travelinsurance', icon: ShieldCheck },
                  { name: 'Bills', path: '/services/billspayment', icon: DollarSign },
                ]}
              />
            </ul>
          </div>

          <div className="menu-group">
            <h3 className={`menu-title ${isCollapsed ? 'hidden' : ''}`}>Management</h3>
            <ul className="nav-list">
              <MenuItem 
                  path="/seller-rate" 
                  icon={TrendingUp} 
                  label="Supplier Rate" 
                  isCollapsed={isCollapsed}
                  isActive={location.pathname === '/seller-rate'}
                  onClick={() => navigate('/seller-rate')}
              />
              <MenuItem 
                  path="/users" 
                  icon={Users} 
                  label="Users" 
                  isCollapsed={isCollapsed}
                  isActive={location.pathname === '/users'}
                  onClick={() => navigate('/users')}
              />
              {isMainAdmin && (
                <MenuItem 
                  path="/admins" 
                  icon={UserCog} 
                  label="Admins"
                  isCollapsed={isCollapsed}
                  isActive={location.pathname === '/admins'}
                  onClick={() => navigate('/admins')}
                />
              )}
              <MenuItem 
                  path="/archive" 
                  icon={ArchiveIcon} 
                  label="Archive" 
                  isCollapsed={isCollapsed}
                  isActive={location.pathname === '/archive'}
                  onClick={() => navigate('/archive')}
              />
              <MenuItem 
                  path="/activity-logs" 
                  icon={Activity} 
                  label="Activity Logs" 
                  isCollapsed={isCollapsed}
                  isActive={location.pathname === '/activity-logs'}
                  onClick={() => navigate('/activity-logs')}
              />
              <MenuItem 
                  path="/settings" 
                  icon={Settings} 
                  label="Settings" 
                  isCollapsed={isCollapsed}
                  isActive={location.pathname === '/settings'}
                  onClick={() => navigate('/settings')}
              />
            </ul>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className={`user-profile-card ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="user-info-group">
              <div className="user-avatar">A</div>
              <div className={`user-details ${isCollapsed ? 'hidden' : ''}`}>
                <span className="user-name">Admin</span>
                <span className="user-role">{isMainAdmin ? 'Main Admin' : 'SysAdmin'}</span>
              </div>
            </div>
            {!isCollapsed && (
              <button 
                onClick={handleLogoutClick} 
                className="logout-btn" 
                title="Logout"
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <div className="logout-spinner"></div>
                ) : (
                  <LogOut size={18} />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ✅ CUSTOM CONFIRMATION MODAL FOR LOGOUT */}
      <CustomConfirmModal 
        isOpen={isLogoutModalOpen}
        title="Confirm Logout"
        message="Are you sure you want to exit the admin panel? You will need to login again to access your dashboard."
        onConfirm={confirmLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
        type="danger"
      />
    </>
  );
};

export default Sidebar;
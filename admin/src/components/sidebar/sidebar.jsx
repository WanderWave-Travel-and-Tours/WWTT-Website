import React, { useState, useEffect } from 'react';
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
  Settings, // Icon for Settings
  FileText,
  HeartHandshake,
  Plane,
  BookOpen
} from 'lucide-react';
import './sidebar.css';

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [openMenus, setOpenMenus] = useState({
    add: false,
    list: false,
    services: false
  });

  useEffect(() => {
    if (isCollapsed) {
      setOpenMenus({
        add: false,
        list: false,
        services: false
      });
    }
  }, [isCollapsed]);

  const toggleMenu = (menuKey) => {
    if (isCollapsed) {
      toggleSidebar();
      setTimeout(() => {
        setOpenMenus(prev => ({ ...prev, [menuKey]: true }));
      }, 150);
      return;
    }

    setOpenMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  const handleLogout = () => {
    console.log('Logging out user...');
    localStorage.removeItem('adminToken');
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;
  
  const MenuItem = ({ path, icon: Icon, label }) => {
    const active = isActive(path);
    return (
      <li className="nav-item">
        <button
          onClick={() => navigate(path)}
          className={`menu-btn ${active ? 'active' : ''}`}
          title={isCollapsed ? label : ''}
        >
          <div className="btn-content">
            <Icon size={20} className="btn-icon" />
            <span className="btn-label">{label}</span>
          </div>
        </button>
      </li>
    );
  };

  const DropdownMenu = ({ title, icon: Icon, menuKey, childrenItems }) => {
    const isOpen = openMenus[menuKey];
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
              <span className="btn-label">{title}</span>
            </div>
            
            {!isCollapsed && (
              isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
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
                    className={`submenu-btn ${isActive(item.path) ? 'active' : ''}`}
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

  return (
    <div className={`sidebar-container custom-scrollbar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-wrapper">
          <div className="logo-box">
            <img 
              src="https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911894edaa4e3fb6cfb8afe.png" 
              alt="Wanderwave Logo" 
              className="logo-img"
            />
          </div>
          <div className="brand-info">
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
          <h3 className="menu-title">Main Menu</h3>
          <ul className="nav-list">
            <MenuItem path="/dashboard" icon={LayoutDashboard} label="Dashboard" />

            <DropdownMenu 
              title="Add" 
              icon={PlusCircle} 
              menuKey="add"
              childrenItems={[
                { name: 'Create Package', path: '/add-package', icon: FilePlus },
                { name: 'Add Promo', path: '/add-promo', icon: Tag },
                { name: 'Add Testimonial', path: '/add-testimonial', icon: Star },
              ]}
            />

            <DropdownMenu 
              title="List" 
              icon={List} 
              menuKey="list"
              childrenItems={[
                { name: 'Manage Packages', path: '/view-packages', icon: Package },
                { name: 'Promo List', path: '/view-promos', icon: ListOrdered },
                { name: 'Testimonials List', path: '/view-testimonials', icon: ClipboardList },
              ]}
            />
          </ul>
        </div>

        <div className="menu-group">
          <h3 className="menu-title">Management</h3>
          <ul className="nav-list">
            <DropdownMenu 
              title="Other Services" 
              icon={Wrench} 
              menuKey="services"
              childrenItems={[
                { name: 'VISA Processing', path: '/services/visa', icon: BookOpen },
                { name: 'PSA Serbilis', path: '/services/psa', icon: FileText },
                { name: 'CENOMAR', path: '/services/cenomar', icon: HeartHandshake },
                { name: 'Passport Appt', path: '/services/passport', icon: Plane },
              ]}
            />

            <MenuItem path="/users" icon={Users} label="Users" />
            
            {/* --- DITO KO IDINAGDAG ANG SETTINGS BUTTON --- */}
            <MenuItem path="/settings" icon={Settings} label="Settings" />
            
          </ul>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile-card">
          <div className="user-info-group">
            <div className="user-avatar">A</div>
            <div className="user-details">
              <span className="user-name">Admin</span>
              <span className="user-role">SysAdmin</span>
            </div>
          </div>
          {!isCollapsed && (
            <button 
              onClick={handleLogout}
              className="logout-btn"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
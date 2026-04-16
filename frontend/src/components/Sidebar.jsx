import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import "bootstrap/dist/css/bootstrap.min.css";
import { Nav, Button, Offcanvas } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faGavel, faThLarge, faMapMarkedAlt, faFileAlt, 
  faFolderOpen, faUserFriends, faHistory, faSignOutAlt, faBars, faBalanceScale, faChartLine
} from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";

const Sidebar = ({ activeTab, setActiveTab }) => {
  const [showMobile, setShowMobile] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: faThLarge },
    { id: "vendor", label: "Vendor Management", icon: faUserFriends },
    { id: "ec", label: "Land EC", icon: faMapMarkedAlt },
    { id: "nagal", label: "Nagal/Adangal", icon: faFileAlt },
    { id: "aggrement", label: "Agreements", icon: faFolderOpen },
    { id: "deed", label: "Deed Records", icon: faUserFriends },
    { id: "payment", label: "Payment History", icon: faHistory },
    { id: "logs", label: "Profit & Expense", icon: faChartLine },
  ];

  const handleClose = () => setShowMobile(false);
  const handleShow = () => setShowMobile(true);

  const handleLogout = () => {
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="sidebar-inner">
      <div className="sidebar-header">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }}
          className="brand-box"
        >
          <img src="/ajlogo.jpeg" alt="AJ Law Logo" className="brand-logo" />
          <span className="brand-name">AJ LAW FIRM</span>
        </motion.div>
      </div>

      <Nav className="flex-column mt-4">
        {menuItems.map((item) => (
          <motion.div key={item.id} whileHover={{ x: 5 }} whileTap={{ scale: 0.95 }}>
            <Nav.Link 
              className={`nav-item-custom ${activeTab === item.id ? "active" : ""}`}
              onClick={() => {
                setActiveTab(item.id);
                handleClose();
                const routeMap = {
                  dashboard: '/dashboard',
                  vendor: '/vendor',
                  ec: '/ec',
                  nagal: '/nagal',
                  aggrement: '/aggrement',
                  deed: '/deed',
                  payment: '/payment',
                  logs: '/logs'
                };
                const target = routeMap[item.id] || '/dashboard';
                navigate(target);
              }}
            >
              <FontAwesomeIcon icon={item.icon} className="nav-icon" />
              <span>{item.label}</span>
              {activeTab === item.id && (
                <motion.div layoutId="activePill" className="active-indicator" />
              )}
            </Nav.Link>
          </motion.div>
        ))}
      </Nav>

      <div className="sidebar-footer">
        <Button variant="link" className="logout-btn" onClick={handleLogout}>
          <FontAwesomeIcon icon={faSignOutAlt} className="me-2" /> Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        /* Global Sidebar Styles */
        .sidebar-desktop {
          background: #0f172a;
          min-height: 100vh;
          width: 280px;
          position: fixed;
          left: 0;
          top: 0;
          border-right: 1px solid rgba(251, 191, 36, 0.1);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* Decorative Background Elements */
        .sidebar-desktop::before {
          content: "⚖";
          position: absolute;
          font-size: 180px;
          opacity: 0.05;
          top: -40px;
          right: -50px;
          color: #fbbf24;
          z-index: 0;
          transform: rotate(25deg);
          pointer-events: none;
        }

        .sidebar-desktop::after {
          content: "⚖";
          position: absolute;
          font-size: 150px;
          opacity: 0.03;
          bottom: 50px;
          left: -40px;
          color: #fbbf24;
          z-index: 0;
          transform: rotate(-30deg);
          pointer-events: none;
        }

        .sidebar-inner {
          padding: 30px 20px;
          height: 100%;
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 1;
        }

        .brand-box {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          margin-bottom: 20px;
          position: relative;
        }

        .brand-box::after {
          content: "";
          position: absolute;
          bottom: -15px;
          left: 0;
          width: 40px;
          height: 2px;
          background: linear-gradient(90deg, #fbbf24 0%, rgba(251, 191, 36, 0) 100%);
          border-radius: 1px;
        }

        .gold-icon {
          color: #fbbf24;
          font-size: 1.5rem;
        }

        .brand-logo {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(251, 191, 36, 0.6);
          flex-shrink: 0;
        }

        .mobile-brand-logo {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(251, 191, 36, 0.6);
          flex-shrink: 0;
        }

        .brand-name {
          color: white;
          font-weight: 800;
          letter-spacing: 1px;
          font-size: 1.2rem;
        }

        .nav-item-custom {
          color: rgba(255, 255, 255, 0.6) !important;
          padding: 14px 18px !important;
          border-radius: 12px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 15px;
          font-weight: 500;
          position: relative;
          transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .nav-item-custom::before {
          content: "";
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 24px;
          background: linear-gradient(90deg, #fbbf24 0%, rgba(251, 191, 36, 0.3) 100%);
          border-radius: 0 4px 4px 0;
          transition: width 0.3s ease;
          opacity: 0;
        }

        .nav-item-custom:hover {
          background: rgba(255, 255, 255, 0.08);
          color: white !important;
          box-shadow: inset 0 0 12px rgba(251, 191, 36, 0.08);
          transform: translateX(2px);
        }

        .nav-item-custom:hover::before {
          width: 4px;
          opacity: 1;
        }

        .nav-item-custom.active {
          color: #fbbf24 !important;
          background: rgba(251, 191, 36, 0.1);
        }

        .active-indicator {
          position: absolute;
          left: 0;
          width: 4px;
          height: 20px;
          background: #fbbf24;
          border-radius: 0 4px 4px 0;
        }

        .nav-icon {
          width: 20px;
          font-size: 1.1rem;
        }

        .sidebar-footer {
          margin-top: auto;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,0.05);
          position: relative;
        }

        .sidebar-footer::before {
          content: "";
          position: absolute;
          top: -2px;
          right: 0;
          width: 50px;
          height: 2px;
          background: linear-gradient(90deg, rgba(251, 191, 36, 0) 0%, #fbbf24 100%);
          border-radius: 1px;
        }

        .logout-btn {
          color: #ef4444 !important;
          text-decoration: none !important;
          font-weight: 600;
          width: 100%;
          text-align: left;
          padding: 10px 18px;
        }

        /* Mobile Styles */
        .mobile-header {
          display: none;
          background: #0f172a;
          padding: 15px 20px;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 1100;
        }

        .hamburger-btn {
          color: #fbbf24;
          background: rgba(251, 191, 36, 0.1);
          border: none;
          padding: 8px 12px;
          border-radius: 8px;
        }

        .mobile-drawer {
          background-color: #0f172a !important;
          width: 280px !important;
        }

        @media (max-width: 991px) {
          .sidebar-desktop { display: none; }
          .mobile-header { display: flex; }
        }
      `}</style>

      {/* Mobile Top Nav */}
      <div className="mobile-header">
        <div className="d-flex align-items-center gap-2">
          <img src="/ajlogo.jpeg" alt="AJ Law Logo" className="mobile-brand-logo" />
          <span className="brand-name" style={{fontSize: '1rem'}}>AJ LAW FIRM</span>
        </div>
        <button className="hamburger-btn" onClick={handleShow}>
          <FontAwesomeIcon icon={faBars} />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="sidebar-desktop">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar (Drawer) */}
      <Offcanvas 
        show={showMobile} 
        onHide={handleClose} 
        className="mobile-drawer"
      >
        <Offcanvas.Body className="p-0">
          <SidebarContent />
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default Sidebar;
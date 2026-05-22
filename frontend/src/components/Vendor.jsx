import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal, Button, Form, Card, Row, Col, Badge, Nav, Table } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus, faSearch, faTimes, faBalanceScale, faBook, faScroll,
  faPhone, faMapMarkerAlt, faUser, faMoneyBillWave, faCheckCircle, faClock,
  faIdCard, faFileAlt, faEye, faEdit, faTrash, faHandHoldingUsd, faUsers,
  faBuilding, faSave, faArrowLeft, faFolderOpen, faLandmark, faHistory
} from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import API_BASE_URL from "../config";

// Enhanced dummy data for Vendor records
const dummyVendorData = [
  { id: 1, vendorId: "VEN001", name: "Vendor A", phone: "9876543210", address: "123 Business Park, Suite 100", district: "Mumbai", status: "Active" },
  { id: 2, vendorId: "VEN002", name: "Vendor B", phone: "9876543211", address: "456 Trade Center, Floor 5", district: "Bangalore", status: "Active" },
  { id: 3, vendorId: "VEN003", name: "Vendor C", phone: "9876543212", address: "789 Commerce Street, Block 3", district: "Pune", status: "Inactive" },
  { id: 4, vendorId: "VEN004", name: "Vendor D", phone: "9876543213", address: "321 Enterprise Road, Unit 2", district: "Ahmedabad", status: "Active" },
  { id: 5, vendorId: "VEN005", name: "Vendor E", phone: "9876543214", address: "654 Market Plaza, Tower 4", district: "Delhi", status: "Active" }
];

// Refactored dummy data: Document tracking with specific dates, times, costs and payments
const dummyCustomerData = [
  {
    id: 1, name: "Customer 1", phone: "1234567890", address: "Address 1, Mumbai", vendorId: "VEN001",
    ecRecords: [{ id: 1, status: "Active", date: "2023-01-01", time: "10:30 AM", details: "EC for property ABC", cost: 1500, paid: 1000 }],
    nagalRecords: [{ id: 1, status: "Completed", date: "2023-02-01", time: "11:00 AM", details: "Nagal record XYZ", cost: 800, paid: 800 }],
    agreementRecords: [{ id: 1, status: "Signed", date: "2023-03-01", time: "02:15 PM", details: "Rental agreement", cost: 3000, paid: 1500 }],
    deedRecords: [{ id: 1, status: "Registered", date: "2023-04-01", time: "04:45 PM", details: "Deed for land DEF", cost: 5000, paid: 5000 }],
  },
  {
    id: 2, name: "Customer 2", phone: "1234567891", address: "Address 2, Bangalore", vendorId: "VEN002",
    ecRecords: [{ id: 2, status: "Pending", date: "2023-01-15", time: "09:00 AM", details: "EC for property GHI", cost: 1200, paid: 0 }],
    nagalRecords: [{ id: 2, status: "In Progress", date: "2023-02-15", time: "12:00 PM", details: "Nagal record JKL", cost: 900, paid: 400 }],
    agreementRecords: [{ id: 2, status: "Draft", date: "2023-03-15", time: "01:30 PM", details: "Lease agreement", cost: 2500, paid: 1000 }],
    deedRecords: [],
  },
  {
    id: 3, name: "Customer 3", phone: "1234567892", address: "Address 3, Pune", vendorId: "VEN003",
    ecRecords: [],
    nagalRecords: [],
    agreementRecords: [],
    deedRecords: [{ id: 3, status: "Registered", date: "2023-04-20", time: "11:20 AM", details: "Deed for land VWX", cost: 8000, paid: 8000 }],
  },
  {
    id: 4, name: "Customer 4", phone: "1234567893", address: "Address 4, Ahmedabad", vendorId: "Others",
    ecRecords: [{ id: 4, status: "Active", date: "2023-01-25", time: "10:10 AM", details: "EC for property YZA", cost: 2000, paid: 500 }],
    nagalRecords: [{ id: 4, status: "Completed", date: "2023-02-25", time: "03:40 PM", details: "Nagal record BCD", cost: 600, paid: 600 }],
    agreementRecords: [],
    deedRecords: [],
  }
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
  exit: { opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.2 } }
};

const Vendor = () => {
  const [activeTab, setActiveTab] = useState("vendor");
  const [localTab, setLocalTab] = useState("vendor"); // "vendor" or "customer"
  
  const [vendorData, setVendorData] = useState([]);
  const [customerData, setCustomerData] = useState([]);

  const fetchData = async () => {
    try {
      const [clientsRes, docsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/clients`),
        fetch(`${API_BASE_URL}/api/documents`)
      ]);
      const clients = await clientsRes.json();
      const docs = await docsRes.json();
      
      const toFrontendRecord = (d) => {
          const dateStr = d.date ? d.date.split('T')[0] : new Date(d.createdAt || Date.now()).toISOString().split('T')[0];
          const timeStr = new Date(d.createdAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          return {
            id: d._id,
            rawData: d,
            status: d.status,
            date: dateStr,
            time: timeStr,
            details: d.reference || d.documentType,
            customerName: d.customerName || "N/A",
            cost: d.totalFee,
            paid: d.received,
            balance: d.balance || (d.totalFee - (d.received || 0)),
            payments: d.payments || []
          };
      };

      const v = clients.filter(c => c.clientType === 'Vendor').map(c => {
         const vDocs = docs.filter(d => d.client && (d.client === c._id || d.client._id === c._id));
         return {
           ...c, id: c._id, vendorId: c.clientId,
           ecRecords: vDocs.filter(d => d.documentType === 'EC').map(toFrontendRecord),
           nagalRecords: vDocs.filter(d => d.documentType === 'Nagal').map(toFrontendRecord),
           agreementRecords: vDocs.filter(d => d.documentType === 'Agreement').map(toFrontendRecord),
           deedRecords: vDocs.filter(d => d.documentType === 'Deed').map(toFrontendRecord)
         };
      });
      
      const custs = clients.filter(c => c.clientType === 'Customer').map(c => {
         const cDocs = docs.filter(d => (d.customerName === c.name) || (d.client && (d.client === c._id || d.client._id === c._id)));
         return {
           ...c,
           id: c._id,
           vendorId: c.referenceVendor || 'Others',
           ecRecords: cDocs.filter(d => d.documentType === 'EC').map(toFrontendRecord),
           nagalRecords: cDocs.filter(d => d.documentType === 'Nagal').map(toFrontendRecord),
           agreementRecords: cDocs.filter(d => d.documentType === 'Agreement').map(toFrontendRecord),
           deedRecords: cDocs.filter(d => d.documentType === 'Deed').map(toFrontendRecord)
         };
      });

      setVendorData(v);
      setCustomerData(custs);
      
      // Flatten all pending documents for the Pendings tab
      const allPd = docs.map(d => {
        const mapped = toFrontendRecord(d);
        // Identify client type for filtering
        const clientObj = clients.find(c => c._id === (d.client?._id || d.client));
        return {
          ...mapped,
          displayName: (clientObj ? clientObj.name : mapped.customerName) || "N/A",
          clientType: clientObj ? clientObj.clientType : (d.customerName ? 'Customer' : 'Unknown'),
          clientPhone: clientObj ? clientObj.phone : (d.rawData?.phone || '')
        };
      }).filter(d => d.balance > 0);
      setAllDocsFlattened(allPd);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ status: "" });

  // Pendings Tab Specific States
  const [allDocsFlattened, setAllDocsFlattened] = useState([]);
  const [pendingDocType, setPendingDocType] = useState("");
  const [pendingClientType, setPendingClientType] = useState("");
  const [pendingSearchTerm, setPendingSearchTerm] = useState("");
  const [pendingStartDate, setPendingStartDate] = useState("");
  const [pendingEndDate, setPendingEndDate] = useState("");

  // Modal Visibility States
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [currentVendor, setCurrentVendor] = useState(null);
  
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [viewingCustomerFromVendor, setViewingCustomerFromVendor] = useState(false);

  // Form States Functionality
  const [showAddVendorForm, setShowAddVendorForm] = useState(false);
  const [newVendorData, setNewVendorData] = useState({ vendorId: "", name: "", phone: "", address: "", status: "Active" });
  const [isEditingVendor, setIsEditingVendor] = useState(false);

  const [showAddCustomerForm, setShowAddCustomerForm] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ name: "", phone: "", address: "", vendorId: "" });
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  
  // Document View Modal State
  const [showDocModal, setShowDocModal] = useState(false);
  const [currentDoc, setCurrentDoc] = useState(null);

  // Directly Linked Documents Filter States
  const [vendorDocSearch, setVendorDocSearch] = useState("");
  const [vendorDocType, setVendorDocType] = useState("");
  const [vendorDocDate, setVendorDocDate] = useState("");
  const [vendorDocTab, setVendorDocTab] = useState("EC Records");
  const [customerDocTab, setCustomerDocTab] = useState("EC Records");
  const [customerDocSearch, setCustomerDocSearch] = useState("");
  const [customerDocDate, setCustomerDocDate] = useState("");

  // Computed Methods
  const getCustomerPaymentSummary = (customer) => {
    let collected = 0;
    let cost = 0;
    const categories = ['ecRecords', 'nagalRecords', 'agreementRecords', 'deedRecords'];
    categories.forEach(cat => {
      if (customer[cat]) {
        customer[cat].forEach(record => {
          cost += Number(record.cost || 0);
          collected += Number(record.paid || 0);
        });
      }
    });
    return { collected, balance: cost - collected, cost };
  };

  const getVendorPaymentTotals = (vId) => {
    let totals = customerData.reduce((acc, customer) => {
      if (customer.vendorId !== vId) return acc;
      const { collected, balance } = getCustomerPaymentSummary(customer);
      acc.collected += collected;
      acc.balance += balance;
      return acc;
    }, { collected: 0, balance: 0 });
    
    // Add natively attached documents directly under Vendor
    const vendor = vendorData.find(v => v.vendorId === vId);
    if (vendor) {
      const vSum = getCustomerPaymentSummary(vendor);
      totals.collected += vSum.collected;
      totals.balance += vSum.balance;
    }
    return totals;
  };

  const renderDocs = (records, title, icon) => {
    if(!records || records.length === 0) return null;
    return (
      <>
        <h4 className="section-title"><FontAwesomeIcon icon={icon} /> {title} Details</h4>
        {records.map(r => (
          <div className="billing-item" key={r.id}>
            <div className="billing-item-header">
              <div className="b-date"><FontAwesomeIcon icon={faClock}/> {r.date} &nbsp;|&nbsp; {r.time}</div>
              <Badge bg={['Completed', 'Registered', 'Active'].includes(r.status) ? 'success' : 'secondary'} className="px-3 py-2 rounded-pill fs-6">{r.status}</Badge>
            </div>
            <div className="billing-item-body d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div className="b-detail m-0"><FontAwesomeIcon icon={faFileAlt} className="text-muted me-2"/> {r.details} | Customer: <b>{r.customerName}</b></div>
              
              <div className="d-flex gap-3 flex-nowrap align-items-center m-0" style={{overflowX: 'auto'}}>
                <div className="payment-tag cost" style={{background: 'rgba(251,191,36,0.1)', color: '#b45309'}}>Total: {formatCurrency(r.cost)}</div>
                <div className="payment-tag paid" style={{background: 'rgba(16,185,129,0.1)', color: '#047857'}}>Received: {formatCurrency(r.paid)}</div>
                <div className="payment-tag cost" style={{background: 'rgba(239,68,68,0.1)', color: '#b91c1c'}}>Pending: {formatCurrency(r.balance)}</div>
              </div>

              <div className="m-0">
                <button className="modern-btn btn-light w-auto p-2 border" onClick={(e) => {
                  e.stopPropagation();
                  setCurrentDoc(r.rawData);
                  setShowDocModal(true);
                }}>
                  <FontAwesomeIcon icon={faEye} /> View
                </button>
              </div>
            </div>

            {/* Payment history removed from here, now inside View modal */}
          </div>
        ))}
      </>
    );
  };

  const formatCurrency = (value) => {
    if (typeof value !== 'number') return "₹0";
    return value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  };

  // Filters
  const filteredVendors = vendorData.filter(v => {
    const matchSearch = v.vendorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        v.phone.includes(searchTerm);
    const matchStatus = filters.status ? v.status === filters.status : true;
    return matchSearch && matchStatus;
  });

  const filteredCustomers = customerData.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.phone.includes(searchTerm) ||
                        c.address.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  // Handlers
  const handleVendorClick = (vendor) => {
    setCurrentVendor(vendor);
    setShowVendorModal(true);
  };

  const handleCustomerClick = (customer, fromVendorModal = false) => {
    setCurrentCustomer(customer);
    setViewingCustomerFromVendor(fromVendorModal);
    setCustomerDocSearch("");
    setCustomerDocDate("");
    if (fromVendorModal) {
      setShowVendorModal(false);
    }
    setShowCustomerModal(true);
  };

  const handleBackToVendorModal = () => {
    setShowCustomerModal(false);
    setShowVendorModal(true);
  };

  const handleWhatsAppShare = (client, totals) => {
    const phone = client.phone.replace(/\D/g, ''); // Clean phone number
    if (!phone) {
      alert("Mobile number not registered for this client.");
      return;
    }
    const message = `Hello ${client.name},\n\nThis is a friendly reminder from AJ Law Firm. You have a pending payment for your record.\n\n*Outstanding Balance:* ₹${totals.balance.toLocaleString()}\n\nPlease kindly settle this amount at your earliest convenience. Thank you!\n\n_Regards,_\n_AJ Law Firm_`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/91${phone}?text=${encodedMessage}`, '_blank');
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilters({ status: "" });
    setPendingDocType("");
    setPendingClientType("");
    setPendingSearchTerm("");
    setPendingStartDate("");
    setPendingEndDate("");
  };

  // Form Handlers: Vendor
  const openAddVendorForm = () => {
    setNewVendorData({ vendorId: `VEN00${vendorData.length + 1}`, name: "", phone: "", address: "", status: "Active" });
    setIsEditingVendor(false);
    setShowAddVendorForm(true);
  };

  const openEditVendorForm = (e, vendor) => {
    e.stopPropagation(); // prevent modal open
    setNewVendorData({ ...vendor });
    setIsEditingVendor(true);
    setShowAddVendorForm(true);
  };

  const handleSaveVendor = async () => {
    const payload = {
       clientType: 'Vendor',
       clientId: newVendorData.vendorId,
       name: newVendorData.name,
       phone: newVendorData.phone,
       address: newVendorData.address,
       status: newVendorData.status
    };
    if (isEditingVendor) {
      const cleanId = newVendorData.id?.toString().split(':')[0];
      await fetch(`${API_BASE_URL}/api/clients/${cleanId}`, {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload)
      });
    } else {
      await fetch(`${API_BASE_URL}/api/clients`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload)
      });
    }
    fetchData();
    setShowAddVendorForm(false);
  };

  const handleDeleteVendor = async (e, vendorId) => {
    e.stopPropagation();
    if(window.confirm("Are you sure you want to delete this vendor?")) {
      const cleanId = vendorId?.toString().split(':')[0];
      await fetch(`${API_BASE_URL}/api/clients/${cleanId}`, { method: 'DELETE' });
      fetchData();
    }
  };

  // Form Handlers: Customer
  const openAddCustomerForm = () => {
    setNewCustomerData({ name: "", phone: "", address: "", vendorId: "" });
    setIsEditingCustomer(false);
    setShowAddCustomerForm(true);
  };

  const openEditCustomerForm = (e, customer) => {
    e.stopPropagation();
    setNewCustomerData({ ...customer });
    setIsEditingCustomer(true);
    setShowAddCustomerForm(true);
  };

  const handleSaveCustomer = async () => {
    const payload = {
       clientType: 'Customer',
       clientId: `CUST-${Date.now()}`,
       name: newCustomerData.name,
       phone: newCustomerData.phone,
       address: newCustomerData.address,
       referenceVendor: newCustomerData.vendorId
    };
    // Ensure vendor is initialized if not provided
    if (!payload.referenceVendor) {
        payload.referenceVendor = "";
    }
    if (isEditingCustomer) {
      const cleanId = newCustomerData.id?.toString().split(':')[0];
      await fetch(`${API_BASE_URL}/api/clients/${cleanId}`, {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload)
      });
    } else {
      await fetch(`${API_BASE_URL}/api/clients`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload)
      });
    }
    fetchData();
    setShowAddCustomerForm(false);
  };

  const handleDeleteCustomer = async (e, customerId) => {
    e.stopPropagation();
    if(window.confirm("Are you sure you want to delete this customer?")) {
      const cleanId = customerId?.toString().split(':')[0];
      await fetch(`${API_BASE_URL}/api/clients/${cleanId}`, { method: 'DELETE' });
      fetchData();
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      Active: { bg: "#10b981", icon: faCheckCircle },
      Inactive: { bg: "#f59e0b", icon: faClock }
    };
    const config = variants[status] || variants.Active;
    return (
      <Badge style={{
        background: `linear-gradient(135deg, ${config.bg} 0%, ${config.bg}dd 100%)`,
        border: "none", padding: "6px 12px", borderRadius: "12px",
        fontWeight: "600", fontSize: "0.8rem", display: "inline-flex",
        alignItems: "center", gap: "6px", color: "#fff", boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <FontAwesomeIcon icon={config.icon} size="sm" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="layout-page">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-content">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
          
          .layout-page {
            background: linear-gradient(135deg, #f5f7fa 0%, #e4e9f2 50%, #fefefe 100%);
            min-height: 100vh;
            font-family: 'Inter', sans-serif;
            overflow-x: hidden;
          }
          
          .main-content {
            margin-left: 280px; 
            padding: 40px; 
            min-height: 100vh;
          }
          @media (max-width: 991px) { .main-content { margin-left: 0; padding: 20px; } }
          @media (max-width: 767px) {
            .page-title { font-size: 1.7rem !important; }
            .custom-tab-btn { padding: 10px 18px; font-size: 0.85rem; }
            .controls-bar { padding: 16px; margin-bottom: 24px; }
            .modern-input, .modern-select { padding: 12px 14px; font-size: 0.88rem; }
            .modern-btn { padding: 12px 16px; font-size: 0.88rem; }
            .data-card { padding: 20px; }
            .card-title { font-size: 1.25rem; }
            .modal-info-row { flex-direction: column; gap: 20px; padding: 20px; }
            .modal-info-item { min-width: auto; flex: 1; border-bottom: none !important; }
            .mobile-detail-group { display: flex; gap: 15px; width: 100%; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px; }
            .mobile-detail-group:last-child { border-bottom: none; }
            .status-top { order: -1; width: 100%; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px; }
            .section-title { font-size: 1.2rem; margin: 30px 0 15px; }
            .billing-item { padding: 16px; }
            .grand-summary { grid-template-columns: 1fr; gap: 16px; padding: 24px; }
          }
          @media (max-width: 575px) {
            .main-content { padding: 12px; }
            .page-title { font-size: 1.4rem !important; }
            .custom-tabs { 
              flex-direction: row; width: 100%; overflow-x: auto; white-space: nowrap; 
              scrollbar-width: none; -ms-overflow-style: none; padding: 6px; gap: 6px;
            }
            .custom-tabs::-webkit-scrollbar { display: none; }
            .custom-tab-btn { flex: 1; border-radius: 10px; padding: 10px 16px; white-space: nowrap; width: auto; font-size: 0.8rem; }
            .controls-bar { 
              flex-direction: row; align-items: center; overflow-x: auto; 
              gap: 12px; scrollbar-width: none; flex-wrap: nowrap;
            }
            .controls-bar::-webkit-scrollbar { display: none; }
            .search-wrapper, .modern-select, .action-group { width: auto !important; min-width: max-content; }
            .action-group { flex-direction: row !important; gap: 8px; }
            .action-group .modern-btn { padding: 10px 16px; font-size: 0.8rem; width: auto; white-space: nowrap; }
            .data-card .actions { opacity: 1; top: 12px; right: 12px; }
            .circle-btn { width: 32px; height: 32px; font-size: 0.8rem; }
            .card-stats { grid-template-columns: 1fr; gap: 10px; }
          }

          .page-header { margin-bottom: 24px; }
          .page-title {
            font-family: 'Playfair Display', serif;
            font-size: 2.2rem;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
          }

          /* Modern Extruded Tabs */
          .custom-tabs {
            display: inline-flex; gap: 8px; margin-bottom: 30px;
            background: rgba(255, 255, 255, 0.7);
            padding: 8px; border-radius: 20px;
            backdrop-filter: blur(20px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.03), inset 0 2px 4px rgba(255,255,255,0.8);
          }
          .custom-tab-btn {
            background: transparent; border: none; padding: 12px 28px;
            border-radius: 14px; font-weight: 600; color: #64748b;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer;
          }
          .custom-tab-btn.active {
            background: linear-gradient(135deg, #ffeb58ff 0%, #ffae00ff 100%); color: #020617;
            box-shadow: 0 4px 12px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
            transform: translateY(-1px);
          }
          .custom-tab-btn:not(.active):hover { background: rgba(255,255,255,0.5); color: #334155; }

          /* Controls Bar */
          .controls-bar {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(24px); border-radius: 20px;
            padding: 24px; margin-bottom: 32px;
            box-shadow: 0 10px 40px rgba(31,38,135,0.04), inset 0 1px 0 rgba(255,255,255,1);
            border: 1px solid rgba(255,255,255,0.7);
          }

          .modern-input, .modern-select {
            border-radius: 14px; border: 2px solid #e2e8f0;
            background: #f8fafc;
            padding: 14px 18px; font-size: 0.95rem; width: 100%;
            transition: all 0.3s ease; color: #1e293b; font-weight: 500;
          }
          .modern-input:focus, .modern-select:focus {
            border-color: #fbbf24; outline: none; background: #ffffff;
            box-shadow: 0 0 0 4px rgba(251,191,36,0.15);
          }
          .modern-input::placeholder { color: #94a3b8; }
          
          .modern-search-wrapper { position: relative; }
          .modern-search-wrapper svg {
            position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: #64748b;
            font-size: 1.1rem;
          }
          .modern-search-wrapper input { padding-left: 48px; }

          .modern-btn {
            border-radius: 14px; padding: 14px 24px; width: 100%; font-size: 0.95rem; font-weight: 600;
            display: inline-flex; align-items: center; justify-content: center; gap: 8px;
            transition: all 0.3s ease;
          }
          .btn-gold {
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
            border: none; color: white;
            box-shadow: 0 8px 20px rgba(217,119,6,0.25), inset 0 1px 0 rgba(255,255,255,0.3);
            text-transform: uppercase; letter-spacing: 0.5px;
          }
          .btn-gold:hover { transform: translateY(-3px); box-shadow: 0 12px 25px rgba(217,119,6,0.35); }
          .btn-gold:active { transform: translateY(-1px); }

          .btn-clear { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
          .btn-clear:hover { background: #e2e8f0; color: #1e293b; border-color: #cbd5e1; }

          /* Interactive Full Width Grid Cards */
          .data-card {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            border-radius: 24px; border: 1px solid rgba(255,255,255,1);
            padding: 24px; cursor: pointer;
            box-shadow: 0 10px 30px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            height: 100%; display: flex; flex-direction: column;
            position: relative; overflow: hidden;
          }
          .data-card::before {
            content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 5px;
            background: linear-gradient(90deg, #fbbf24 0%, #d97706 100%);
            opacity: 0; transition: opacity 0.3s ease;
          }
          .data-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); background: #ffffff; }
          .data-card:hover::before { opacity: 1; }

          .data-card .actions { 
            position: absolute; top: 20px; right: 20px; display: flex; gap: 8px; opacity: 0; transition: 0.3s;
          }
          .data-card:hover .actions { opacity: 1; }
          
          .circle-btn {
            width: 36px; height: 36px; border-radius: 50%; border: none;
            display: inline-flex; align-items: center; justify-content: center;
            background: #f8fafc; color: #64748b; font-size: 0.9rem;
            transition: all 0.2s ease; box-shadow: 0 2px 5px rgba(0,0,0,0.05);
          }
          .circle-btn.edit:hover { background: #eff6ff; color: #3b82f6; }
          .circle-btn.del:hover { background: #fef2f2; color: #ef4444; }

          .card-title { font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 700; color: #0f172a; margin-bottom: 8px; padding-right: 40px; }
          .card-subtitle { font-size: 0.9rem; color: #878b64ff; font-weight: 500; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
          .card-subtitle svg { color: #ffb031ff; }
          
          .card-stats {
            background: #f8fafc; border-radius: 16px; padding: 16px; 
            margin-top: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
            border: 1px solid #f1f5f9;
          }
          .stat-block .label { font-size: 0.75rem; text-transform: uppercase; color: #94a3b8; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 6px; }
          .stat-block .val { font-size: 1.25rem; font-weight: 700; color: #0f172a; }
          .stat-block .val.success { color: #10b981; }
          .stat-block .val.warning { color: #f59e0b; }

          /* Mini Cards for Vendor Details */
          .mini-cards-grid {
            display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;
          }
          .mini-card {
            background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px;
            cursor: pointer; transition: all 0.3s ease; display: block; text-decoration: none;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          }
          .mini-card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border-color: #cbd5e1; }
          .mini-card-title { font-weight: 700; color: #1e293b; font-size: 1.1rem; margin-bottom: 8px; }
          .mini-card-stat { display: flex; justify-content: space-between; font-size: 0.9rem; margin-top: 12px; font-weight: 600; }

          /* Specific Modals styling */
          .custom-modal-content {
            background: rgba(255, 255, 255, 0.98); backdrop-filter: blur(20px);
            border-radius: 28px; border: none; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3); overflow: hidden;
          }
          .custom-modal-header {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            border: none; padding: 24px 32px; color: white; display: flex; align-items: center;
          }
          .custom-modal-title { font-family: 'Playfair Display', serif; font-weight: 700; font-size: 1.6rem; letter-spacing: -0.5px; }
          .btn-close-white { filter: invert(1) grayscale(100%) brightness(200%); opacity: 0.8; }
          
          .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 32px; }
          .info-item { background: #f8fafc; padding: 20px; border-radius: 20px; border: 1px solid #f1f5f9; }
          .info-item .lbl { font-size: 0.8rem; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; }
          .info-item .v { font-size: 1.15rem; font-weight: 700; color: #0f172a; }

          .section-title { font-family: 'Playfair Display', serif; font-weight: 700; color: #0f172a; margin: 40px 0 20px; display: flex; align-items: center; gap: 12px; font-size: 1.4rem; padding-bottom: 12px; border-bottom: 2px solid #f1f5f9; }
          .section-title svg { color: #fbbf24; background: #fffbeb; padding: 10px; border-radius: 12px; }
          
          /* Detailed Document Entries Billing */
          .billing-item {
            display: flex; flex-direction: column; background: #ffffff; border: 1px solid #e2e8f0;
            border-radius: 20px; padding: 24px; margin-bottom: 16px; transition: all 0.2s ease;
          }
          .billing-item:hover { box-shadow: 0 4px 15px rgba(0,0,0,0.03); border-color: #cbd5e1; }
          .billing-item-header { display: flex; justify-content: space-between; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px dashed #e2e8f0; }
          .billing-item-body { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 20px; align-items: center; }
          .b-detail { font-size: 1.05rem; color: #334155; font-weight: 500;}
          .b-date { color: #64748b; font-size: 0.9rem; font-weight: 600; display:flex; align-items: center; gap: 8px;}
          .payment-tag { padding: 12px 16px; border-radius: 16px; text-align: center; font-weight: 700;}
          .payment-tag.cost { background: #f8fafc; color: #0f172a; }
          .payment-tag.paid { background: #ecfdf5; color: #059669; }

          /* Summary Aggregation Block */
          .grand-summary {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 24px;
            padding: 32px; margin-top: 40px; color: white; display: grid; grid-template-columns: repeat(3, 1fr);
            gap: 24px; box-shadow: 0 20px 40px -10px rgba(15,23,42,0.4);
          }

          /* In-Modal Horizontal Info Row */
          .modal-info-row {
            background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0;
            padding: 24px 32px; display: flex; align-items: center; gap: 40px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.02); margin-bottom: 24px;
          }
          .modal-info-item { min-width: 120px; }
          .modal-info-item .lbl { font-size: 0.75rem; text-transform: uppercase; color: #94a3b8; font-weight: 700; margin-bottom: 4px; letter-spacing: 0.5px; }
          .modal-info-item .val { font-size: 1.1rem; font-weight: 700; color: #1e293b; }

          /* Modal Tab Styles */
          .modal-tabs-wrapper {
            display: flex; gap: 8px; margin-bottom: 24px; padding: 6px;
            background: #f1f5f9; border-radius: 16px; width: 100%;
            overflow-x: auto; white-space: nowrap;
            -ms-overflow-style: none; scrollbar-width: none;
          }
          .modal-tabs-wrapper::-webkit-scrollbar { display: none; }
          .modal-tab-pill {
            padding: 10px 20px; border-radius: 12px; border: none;
            background: transparent; color: #64748b; font-weight: 600; font-size: 0.85rem;
            transition: all 0.2s ease; cursor: pointer; flex-shrink: 0;
          }
          .modal-tab-pill.active {
            background: #ffc525ff; color: #0f172a; box-shadow: 0 4px 10px rgba(0,0,0,0.05);
          }
          .modal-tab-pill:hover:not(.active) { color: #334155; transform: translateY(-1px); }
          .summary-col { display: flex; flex-direction: column; gap: 8px; }
          .summary-col .lbl { color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; font-size: 0.85rem;}
          .summary-col .val { font-size: 2.5rem; font-family: 'Playfair Display', serif; font-weight: 700; color: #ffffff;}
          .summary-col .val.highlight { color: #fbbf24; }

          /* Form Labels */
          .form-label { font-weight: 600; color: #475569; margin-bottom: 8px; font-size: 0.9rem; }

          /* Premium Unified Table Styling */
          .modern-table-card {
            background: white; border-radius: 20px; overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.03); border: 1px solid #e2e8f0;
          }
          .modern-table { width: 100%; border-collapse: separate; border-spacing: 0; }
          .modern-table thead { background: #f8fafc; }
          .modern-table th {
            padding: 20px 24px; text-align: left; font-size: 0.75rem; 
            text-transform: uppercase; letter-spacing: 1px; color: #64748b;
            font-weight: 700; border-bottom: 2px solid #f1f5f9;
          }
          .modern-table td {
            padding: 20px 24px; vertical-align: middle; border-bottom: 1px solid #f1f5f9;
            transition: all 0.2s ease;
          }
          .modern-table tr:last-child td { border-bottom: none; }
          .modern-table tr:hover td { background: #fdfaf3; }
          .table-customer-info { display: flex; align-items: center; gap: 12px; }
          .customer-avatar {
            width: 40px; height: 40px; border-radius: 12px; background: #fffbeb;
            display: flex; align-items: center; justify-content: center; color: #fbbf24;
            font-weight: 700; font-size: 1rem; border: 1px solid #fef3c7;
          }
          .table-badge { padding: 6px 12px; border-radius: 8px; font-weight: 600; font-size: 0.75rem; }
          .payment-total { font-weight: 700; color: #1e293b; }
          .payment-balance { font-weight: 700; color: #d97706; padding: 6px 12px; background: #fffbeb; border-radius: 8px; }
          .payment-zero { color: #10b981; background: #ecfdf5; }
          
          .table-action-btn {
            width: 38px; height: 38px; border-radius: 10px; border: 1px solid #e2e8f0;
            background: white; color: #64748b; transition: all 0.2s ease;
            display: inline-flex; align-items: center; justify-content: center;
          }
          .table-action-btn:hover { border-color: #fbbf24; color: #fbbf24; transform: translateY(-2px); }
          .table-action-btn.whatsapp-btn { color: #10b981; border-color: #d1fae5; }
          .table-action-btn.whatsapp-btn:hover { background: #10b981; color: white; border-color: #10b981; }
        `}</style>

        <div className="page-header d-flex justify-content-between align-items-center">
          <div>
            <h2 className="page-title">Records Dashboard</h2>
          </div>
        </div>

        {/* Extruded Tabs */}
        <div className="custom-tabs">
          <button className={`custom-tab-btn ${localTab === 'vendor' ? 'active' : ''}`} onClick={() => setLocalTab('vendor')}>
            <FontAwesomeIcon icon={faBuilding} className="me-2" />
            Top Vendors
          </button>
          <button className={`custom-tab-btn ${localTab === 'customer' ? 'active' : ''}`} onClick={() => setLocalTab('customer')}>
            <FontAwesomeIcon icon={faUsers} className="me-2" />
            Normal Customers
          </button>
          <button className={`custom-tab-btn ${localTab === 'pending' ? 'active' : ''}`} onClick={() => setLocalTab('pending')}>
            <FontAwesomeIcon icon={faClock} className="me-2" />
            Pendings
          </button>
        </div>

        {/* Action Controls Bar */}
        <div className="controls-bar">
          <Row className="g-4 align-items-center">
            {localTab !== 'pending' ? (
              <>
                <Col lg={4} md={6}>
                  <div className="modern-search-wrapper">
                    <FontAwesomeIcon icon={faSearch} />
                    <input 
                      type="text" 
                      className="modern-input" 
                      placeholder={`Search ${localTab === 'vendor' ? 'Vendors' : 'Customers'}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </Col>
                {localTab === 'vendor' && (
                  <Col lg={2} md={6}>
                    <select className="modern-select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                      <option value="">All Statuses</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </Col>
                )}
                <Col lg={2} md={6}>
                  <button className="modern-btn btn-clear" onClick={clearFilters}>
                    <FontAwesomeIcon icon={faTimes} className="me-2" /> Clear
                  </button>
                </Col>
                <Col lg={localTab === 'vendor' ? 4 : 6} md={6} className="text-md-end">
                  {localTab === 'vendor' ? (
                    <button className="modern-btn btn-gold w-auto d-inline-flex px-5" onClick={openAddVendorForm}>
                      <FontAwesomeIcon icon={faPlus} className="me-2" /> Add New Vendor
                    </button>
                  ) : (
                    <button className="modern-btn btn-gold w-auto d-inline-flex px-5" onClick={openAddCustomerForm}>
                      <FontAwesomeIcon icon={faPlus} className="me-2" /> Add New Customer
                    </button>
                  )}
                </Col>
              </>
            ) : (
              <>
                <Col lg={2} md={6}>
                   <div className="modern-search-wrapper">
                      <FontAwesomeIcon icon={faSearch} />
                      <input 
                        type="text" 
                        className="modern-input" 
                        placeholder="Search Pendings..."
                        value={pendingSearchTerm}
                        onChange={(e) => setPendingSearchTerm(e.target.value)}
                      />
                   </div>
                </Col>
                <Col lg={2} md={6}>
                   <select className="modern-select" value={pendingDocType} onChange={(e) => setPendingDocType(e.target.value)}>
                      <option value="">Categories (All)</option>
                      <option value="EC">EC</option>
                      <option value="Nagal">Nagal</option>
                      <option value="Agreement">Agreement</option>
                      <option value="Deed">Deed</option>
                   </select>
                </Col>
                <Col lg={2} md={6}>
                   <select className="modern-select" value={pendingClientType} onChange={(e) => setPendingClientType(e.target.value)}>
                      <option value="">Clients (All)</option>
                      <option value="Vendor">Vendor</option>
                      <option value="Customer">Normal Customer</option>
                   </select>
                </Col>
                <Col lg={2} md={6}>
                   <input type="date" className="modern-input" title="From Date" value={pendingStartDate} onChange={(e) => setPendingStartDate(e.target.value)} />
                </Col>
                <Col lg={2} md={6}>
                   <input type="date" className="modern-input" title="To Date" value={pendingEndDate} onChange={(e) => setPendingEndDate(e.target.value)} />
                </Col>
                <Col lg={2} md={6}>
                  <button className="modern-btn btn-clear" onClick={clearFilters}>
                    <FontAwesomeIcon icon={faTimes} className="me-2" /> Clear
                  </button>
                </Col>
              </>
            )}
          </Row>
        </div>

        {/* Render dynamic Grid */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="pb-5">
          {localTab === 'vendor' && (
            <Row className="g-4">
              <AnimatePresence>
                {filteredVendors.length > 0 ? filteredVendors.map(vendor => {
                  const totals = getVendorPaymentTotals(vendor.vendorId);
                  return (
                    <Col xs={12} md={6} xl={3} key={vendor.id}>
                      <motion.div variants={itemVariants} layout className="h-100">
                        <div className="data-card" onClick={() => handleVendorClick(vendor)}>
                          <div className="actions">
                            <button className="circle-btn whatsapp" style={{background: '#ebfdf5', color: '#10b981'}} onClick={(e) => { e.stopPropagation(); handleWhatsAppShare(vendor, totals); }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.897-5.335 11.9-11.894a11.83 11.83 0 00-3.484-8.413z"/></svg>
                            </button>
                            <button className="circle-btn edit" onClick={(e) => openEditVendorForm(e, vendor)}><FontAwesomeIcon icon={faEdit}/></button>
                            <button className="circle-btn del" onClick={(e) => handleDeleteVendor(e, vendor.id)}><FontAwesomeIcon icon={faTrash}/></button>
                          </div>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h3 className="card-title text-truncate" title={vendor.name}>{vendor.name}</h3>
                          </div>
                          {getStatusBadge(vendor.status)}
                          <div className="card-subtitle mt-3">
                            <FontAwesomeIcon icon={faIdCard} /> ID: {vendor.vendorId}
                          </div>
                          <div className="card-subtitle">
                            <FontAwesomeIcon icon={faPhone} /> {vendor.phone}
                          </div>
                          
                          <div className="card-stats mt-auto pt-3">
                            <div className="stat-block">
                              <div className="label">Total Collected</div>
                              <div className="val success">{formatCurrency(totals.collected)}</div>
                            </div>
                            <div className="stat-block">
                              <div className="label">Total Balance</div>
                              <div className="val warning">{formatCurrency(totals.balance)}</div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </Col>
                  );
                }) : (
                  <Col xs={12} className="text-center py-5 text-muted"><h5>No vendors found matching criteria</h5></Col>
                )}
              </AnimatePresence>
            </Row>
          )}

          {localTab === 'customer' && (
            <Row className="g-4">
              <AnimatePresence>
                {filteredCustomers.length > 0 ? filteredCustomers.map(customer => {
                  const summary = getCustomerPaymentSummary(customer);
                  return (
                    <Col xs={12} md={6} xl={3} key={customer.id}>
                      <motion.div variants={itemVariants} layout className="h-100">
                        <div className="data-card" onClick={() => handleCustomerClick(customer)}>
                          <div className="actions">
                            <button className="circle-btn whatsapp" style={{background: '#ebfdf5', color: '#10b981'}} onClick={(e) => { e.stopPropagation(); handleWhatsAppShare(customer, summary); }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.897-5.335 11.9-11.894a11.83 11.83 0 00-3.484-8.413z"/></svg>
                            </button>
                            <button className="circle-btn edit" onClick={(e) => openEditCustomerForm(e, customer)}><FontAwesomeIcon icon={faEdit}/></button>
                            <button className="circle-btn del" onClick={(e) => handleDeleteCustomer(e, customer.id)}><FontAwesomeIcon icon={faTrash}/></button>
                          </div>
                          <h3 className="card-title mb-2 pr-5 text-truncate" title={customer.name}>{customer.name}</h3>
                          <div className="card-subtitle">
                            <FontAwesomeIcon icon={faIdCard} /> Ref: <Badge bg="light" text="dark">{customer.vendorId}</Badge>
                          </div>
                          <div className="card-subtitle text-truncate" style={{marginBottom: "20px"}}>
                            <FontAwesomeIcon icon={faPhone} /> {customer.phone}
                          </div>
                          
                          <div className="card-stats mt-auto">
                            <div className="stat-block">
                              <div className="label">Collected</div>
                              <div className="val success">{formatCurrency(summary.collected)}</div>
                            </div>
                            <div className="stat-block">
                              <div className="label">Balance</div>
                              <div className="val warning">{formatCurrency(summary.balance)}</div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </Col>
                  );
                }) : (
                  <Col xs={12} className="text-center py-5 text-muted"><h5>No customers found matching criteria</h5></Col>
                )}
              </AnimatePresence>
            </Row>
          )}
          
          {localTab === 'pending' && (
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="modern-table-card">
              <div className="table-responsive">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Client Name</th>
                      <th>Category</th>
                      <th>Client Type</th>
                      <th>Date</th>
                      <th>Total Amount</th>
                      <th>Pending Balance</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let filtered = allDocsFlattened;
                      if (pendingDocType) {
                        filtered = filtered.filter(d => (d.rawData?.documentType || '') === pendingDocType);
                      }
                      if (pendingClientType) {
                        filtered = filtered.filter(d => d.clientType === pendingClientType);
                      }
                      if (pendingStartDate) {
                        filtered = filtered.filter(d => d.date >= pendingStartDate);
                      }
                      if (pendingEndDate) {
                        filtered = filtered.filter(d => d.date <= pendingEndDate);
                      }
                      if (pendingSearchTerm) {
                        const q = pendingSearchTerm.toLowerCase();
                        filtered = filtered.filter(d => 
                          d.customerName.toLowerCase().includes(q) || 
                          d.details.toLowerCase().includes(q) ||
                          (d.rawData?.recordNo && d.rawData.recordNo.toLowerCase().includes(q))
                        );
                      }

                      return filtered.length > 0 ? filtered.map(item => (
                        <tr key={item.id}>
                          <td>
                            <div className="table-customer-info">
                              <div className="customer-avatar">{(item.displayName || "N").charAt(0)}</div>
                              <div>
                                <div className="fw-bold text-dark">{item.displayName || "N/A"}</div>
                                <div className="text-muted" style={{fontSize: '0.8rem'}}>{item.clientPhone || 'No Phone'}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <Badge bg="info" className="table-badge" style={{background: '#e0f2fe', color: '#0369a1'}}>{item.rawData?.documentType}</Badge>
                          </td>
                          <td>
                             <span className="text-muted fw-semibold" style={{fontSize: '0.85rem'}}>{item.clientType}</span>
                          </td>
                          <td>
                             <div className="fw-semibold text-muted" style={{fontSize: '0.85rem', whiteSpace: 'nowrap'}}>
                               {item.date ? item.date.split('-').reverse().join('/') : 'N/A'}
                             </div>
                          </td>
                          <td><span className="payment-total">{formatCurrency(item.cost)}</span></td>
                          <td><span className="payment-balance">{formatCurrency(item.balance)}</span></td>
                          <td>
                            <div className="d-flex justify-content-end gap-2">
                              <button className="table-action-btn whatsapp-btn" title="Send Reminder" onClick={(e) => { 
                                e.stopPropagation(); 
                                handleWhatsAppShare({ name: item.displayName, phone: item.clientPhone }, { balance: item.balance }); 
                              }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.897-5.335 11.9-11.894a11.83 11.83 0 00-3.484-8.413z"/></svg>
                              </button>
                              <button className="table-action-btn" title="View Details" onClick={() => {
                                setCurrentDoc(item.rawData);
                                setShowDocModal(true);
                              }}>
                                <FontAwesomeIcon icon={faEye} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="8" className="text-center py-5 text-muted">
                            <FontAwesomeIcon icon={faHistory} size="2x" className="mb-3 d-block mx-auto opacity-20" />
                            <h5>No pending records found matching criteria</h5>
                          </td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Form Modals */}
        {/* Vendor Form */}
        <AnimatePresence>
          {showAddVendorForm && (
            <Modal show={showAddVendorForm} onHide={() => setShowAddVendorForm(false)} centered contentClassName="custom-modal-content" backdrop="static">
              <Modal.Header className="custom-modal-header" closeButton closeVariant="white">
                <Modal.Title className="custom-modal-title">
                  <FontAwesomeIcon icon={isEditingVendor ? faEdit : faBuilding} className="me-3" />
                  {isEditingVendor ? "Edit Vendor" : "New Vendor"}
                </Modal.Title>
              </Modal.Header>
              <Modal.Body className="p-4">
                <Row className="g-4">
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="form-label">Vendor ID</Form.Label>
                      <Form.Control type="text" className="modern-input" value={newVendorData.vendorId} onChange={(e) => setNewVendorData({...newVendorData, vendorId: e.target.value})} />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="form-label">Vendor Name *</Form.Label>
                      <Form.Control type="text" className="modern-input" value={newVendorData.name} onChange={(e) => setNewVendorData({...newVendorData, name: e.target.value})} autoFocus />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="form-label">Phone</Form.Label>
                      <Form.Control type="tel" className="modern-input" value={newVendorData.phone} onChange={(e) => setNewVendorData({...newVendorData, phone: e.target.value})} />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="form-label">Address</Form.Label>
                      <Form.Control as="textarea" rows={2} className="modern-input" value={newVendorData.address} onChange={(e) => setNewVendorData({...newVendorData, address: e.target.value})} />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="form-label">Status</Form.Label>
                      <Form.Select className="modern-select" value={newVendorData.status} onChange={(e) => setNewVendorData({...newVendorData, status: e.target.value})}>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Modal.Body>
              <Modal.Footer className="border-0 p-4 pt-0">
                <Button variant="light" className="px-4 py-2" style={{borderRadius: '12px', fontWeight:600}} onClick={() => setShowAddVendorForm(false)}>Cancel</Button>
                <button className="modern-btn btn-gold w-auto" onClick={handleSaveVendor}>
                  <FontAwesomeIcon icon={faSave} className="me-2" /> Save Vendor
                </button>
              </Modal.Footer>
            </Modal>
          )}
        </AnimatePresence>

        {/* Customer Form */}
        <AnimatePresence>
          {showAddCustomerForm && (
            <Modal show={showAddCustomerForm} onHide={() => setShowAddCustomerForm(false)} centered contentClassName="custom-modal-content" backdrop="static">
              <Modal.Header className="custom-modal-header" closeButton closeVariant="white">
                <Modal.Title className="custom-modal-title">
                  <FontAwesomeIcon icon={isEditingCustomer ? faEdit : faUser} className="me-3" />
                  {isEditingCustomer ? "Edit Customer" : "New Customer"}
                </Modal.Title>
              </Modal.Header>
              <Modal.Body className="p-4">
                <Row className="g-4">
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="form-label">Customer Name *</Form.Label>
                      <Form.Control type="text" className="modern-input" value={newCustomerData.name} onChange={(e) => setNewCustomerData({...newCustomerData, name: e.target.value})} autoFocus />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="form-label">Phone</Form.Label>
                      <Form.Control type="tel" className="modern-input" value={newCustomerData.phone} onChange={(e) => setNewCustomerData({...newCustomerData, phone: e.target.value})} />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="form-label">Address</Form.Label>
                      <Form.Control as="textarea" rows={2} className="modern-input" value={newCustomerData.address} onChange={(e) => setNewCustomerData({...newCustomerData, address: e.target.value})} />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="form-label">Reference (Vendor)</Form.Label>
                      <Form.Select className="modern-select" value={newCustomerData.vendorId} onChange={(e) => setNewCustomerData({...newCustomerData, vendorId: e.target.value})}>
                        <option value="">-- Select Reference --</option>
                        {vendorData.filter(v => v.status==='Active').map(v => (
                          <option key={v.id} value={v.vendorId}>{v.name} ({v.vendorId})</option>
                        ))}
                        <option value="Others">Others</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Modal.Body>
              <Modal.Footer className="border-0 p-4 pt-0">
                <Button variant="light" className="px-4 py-2" style={{borderRadius: '12px', fontWeight:600}} onClick={() => setShowAddCustomerForm(false)}>Cancel</Button>
                <button className="modern-btn btn-gold w-auto" onClick={handleSaveCustomer}>
                  <FontAwesomeIcon icon={faSave} className="me-2" /> Save Customer
                </button>
              </Modal.Footer>
            </Modal>
          )}
        </AnimatePresence>

        {/* Display Modals */}
        {/* Vendor Details */}
        <AnimatePresence>
          {showVendorModal && currentVendor && (
            <Modal show={showVendorModal} onHide={() => setShowVendorModal(false)} size="xl" centered contentClassName="custom-modal-content">
              <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit">
                <Modal.Header className="custom-modal-header" closeButton closeVariant="white">
                  <Modal.Title className="custom-modal-title"><FontAwesomeIcon icon={faBuilding} className="me-3" /> Vendor: {currentVendor.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4 p-md-5" style={{maxHeight:'80vh', overflowY:'auto'}}>
                  <div className="modal-info-row">
                    <div className="modal-info-item status-top">
                      <div className="lbl">Status</div>
                      <div className="val">{getStatusBadge(currentVendor.status)}</div>
                    </div>
                    <div className="mobile-detail-group">
                      <div className="modal-info-item"><div className="lbl">Vendor ID</div><div className="val">{currentVendor.vendorId}</div></div>
                      <div className="modal-info-item"><div className="lbl">Phone</div><div className="val">{currentVendor.phone}</div></div>
                    </div>
                    <div className="mobile-detail-group">
                      <div className="modal-info-item"><div className="lbl">Collected</div><div className="val text-success">{formatCurrency(getVendorPaymentTotals(currentVendor.vendorId).collected)}</div></div>
                      <div className="modal-info-item"><div className="lbl">Balance</div><div className="val text-warning">{formatCurrency(getVendorPaymentTotals(currentVendor.vendorId).balance)}</div></div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
                      <h4 className="section-title m-0 border-0"><FontAwesomeIcon icon={faFolderOpen} /> Linked Documents</h4>
                      <div className="modal-tabs-wrapper">
                        {["EC Records", "Nagal Records", "Agreements", "Deeds"].map(tab => (
                          <button key={tab} className={`modal-tab-pill ${vendorDocTab === tab ? 'active' : ''}`} onClick={() => setVendorDocTab(tab)}>{tab}</button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="p-3 mb-4" style={{background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 8px 25px rgba(0,0,0,0.03)'}}>
                      <Row className="g-3 align-items-center">
                        <Col lg={8} md={12}>
                          <div className="position-relative">
                            <FontAwesomeIcon icon={faSearch} className="position-absolute" style={{left:'16px', top:'50%', transform:'translateY(-50%)', color:'#64748b', fontSize: '1.1rem'}} />
                            <input className="form-control" style={{padding: '12px 16px 12px 48px', borderRadius: '12px', border: '2px solid #e2e8f0', backgroundColor: '#ffffff', fontWeight: 500, boxShadow: 'none'}} placeholder={`Search ${vendorDocTab}...`} value={vendorDocSearch} onChange={e => setVendorDocSearch(e.target.value)} />
                          </div>
                        </Col>
                        <Col lg={4} md={12}>
                          <div className="position-relative">
                            <input type="date" className="form-control" style={{padding: '12px 16px', borderRadius: '12px', border: '2px solid #e2e8f0', backgroundColor: '#ffffff', fontWeight: 500, cursor: 'pointer', boxShadow: 'none'}} value={vendorDocDate} onChange={e => setVendorDocDate(e.target.value)} />
                          </div>
                        </Col>
                      </Row>
                    </div>

                    {(()=>{
                      const filterVendorDocs = (records, typeName) => {
                        let res = records || [];
                        if (vendorDocTab !== typeName) return [];
                        if (vendorDocDate) {
                           res = res.filter(r => r.date === vendorDocDate);
                        }
                        if (vendorDocSearch) {
                           const q = vendorDocSearch.trim().toLowerCase();
                           res = res.filter(r => {
                             const rd = r.rawData || {};
                             const matchStr = `
                               ${r.details || ''} ${r.customerName || ''} ${String(r.date)} ${rd.ecNo || ''}
                               ${rd.nagalNo || ''} ${rd.tpNo || ''} ${rd.docNo || ''} ${rd.nagar || ''}
                               ${rd.phone || ''} ${rd.reference || ''} ${rd.recordNo || ''}
                             `.toLowerCase();
                             return matchStr.includes(q);
                           });
                        }
                        return res;
                      };

                      const fEc = filterVendorDocs(currentVendor.ecRecords, "EC Records");
                      const fNagal = filterVendorDocs(currentVendor.nagalRecords, "Nagal Records");
                      const fAgr = filterVendorDocs(currentVendor.agreementRecords, "Agreements");
                      const fDeed = filterVendorDocs(currentVendor.deedRecords, "Deeds");

                      const hasDocs = fEc.length > 0 || fNagal.length > 0 || fAgr.length > 0 || fDeed.length > 0;
                      if(!hasDocs) return <div className="text-center py-5 text-muted border rounded-4 bg-light my-4">No matching {vendorDocTab} found.</div>;
                      return (
                        <>
                          {renderDocs(fEc, "EC Records", faMapMarkerAlt)}
                          {renderDocs(fNagal, "Nagal Records", faBook)}
                          {renderDocs(fAgr, "Agreements", faFileAlt)}
                          {renderDocs(fDeed, "Deeds", faScroll)}
                        </>
                      );
                    })()}
                  </div>
                </Modal.Body>
              </motion.div>
            </Modal>
          )}
        </AnimatePresence>

        {/* Customer Details & Individual Document Billing */}
        <AnimatePresence>
          {showCustomerModal && currentCustomer && (
            <Modal show={showCustomerModal} onHide={() => {
              setShowCustomerModal(false);
              if (viewingCustomerFromVendor) setShowVendorModal(true);
            }} size="xl" centered contentClassName="custom-modal-content">
              <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit">
                <Modal.Header className="custom-modal-header" closeButton closeVariant="white">
                  {viewingCustomerFromVendor && (
                    <Button variant="link" className="text-white text-decoration-none me-3 p-0" onClick={handleBackToVendorModal}>
                      <FontAwesomeIcon icon={faArrowLeft} size="lg" />
                    </Button>
                  )}
                  <Modal.Title className="custom-modal-title"><FontAwesomeIcon icon={faUser} className="me-3" /> Customer Profile: {currentCustomer.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4 p-md-5" style={{maxHeight: '80vh', overflowY: 'auto'}}>
                  <div className="modal-info-row">
                    <div className="modal-info-item status-top">
                      <div className="lbl">Reference Link</div>
                      <div className="val"><Badge bg="light" text="dark" style={{border: '1px solid #e2e8f0'}}>{currentCustomer.vendorId}</Badge></div>
                    </div>
                    <div className="mobile-detail-group">
                      <div className="modal-info-item"><div className="lbl">Phone / Contact</div><div className="val">{currentCustomer.phone}</div></div>
                      <div className="modal-info-item"><div className="lbl">Address</div><div className="val">{currentCustomer.address}</div></div>
                    </div>
                    {(() => {
                      const sums = getCustomerPaymentSummary(currentCustomer);
                      return (
                        <div className="mobile-detail-group">
                          <div className="modal-info-item"><div className="lbl">Collected</div><div className="val text-success">{formatCurrency(sums.collected)}</div></div>
                          <div className="modal-info-item"><div className="lbl">Balance</div><div className="val text-warning">{formatCurrency(sums.balance)}</div></div>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="mt-5">
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
                      <h4 className="section-title m-0 border-0"><FontAwesomeIcon icon={faFolderOpen} /> Linked Documents</h4>
                      <div className="modal-tabs-wrapper">
                        {["EC Records", "Nagal Records", "Agreements", "Deeds"].map(tab => (
                          <button key={tab} className={`modal-tab-pill ${customerDocTab === tab ? 'active' : ''}`} onClick={() => setCustomerDocTab(tab)}>{tab}</button>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 mb-4" style={{background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 8px 25px rgba(0,0,0,0.03)'}}>
                      <Row className="g-3 align-items-center">
                        <Col lg={8} md={12}>
                          <div className="position-relative">
                            <FontAwesomeIcon icon={faSearch} className="position-absolute" style={{left:'16px', top:'50%', transform:'translateY(-50%)', color:'#64748b', fontSize: '1.1rem'}} />
                            <input className="form-control" style={{padding: '12px 16px 12px 48px', borderRadius: '12px', border: '2px solid #e2e8f0', backgroundColor: '#ffffff', fontWeight: 500, boxShadow: 'none'}} placeholder={`Search ${customerDocTab}...`} value={customerDocSearch} onChange={e => setCustomerDocSearch(e.target.value)} />
                          </div>
                        </Col>
                        <Col lg={4} md={12}>
                          <div className="position-relative">
                            <input type="date" className="form-control" style={{padding: '12px 16px', borderRadius: '12px', border: '2px solid #e2e8f0', backgroundColor: '#ffffff', fontWeight: 500, cursor: 'pointer', boxShadow: 'none'}} value={customerDocDate} onChange={e => setCustomerDocDate(e.target.value)} />
                          </div>
                        </Col>
                      </Row>
                    </div>

                    {(() => {
                      const filterCustDocs = (records, typeName) => {
                        let res = records || [];
                        if (customerDocTab !== typeName) return [];
                        if (customerDocDate) {
                           res = res.filter(r => r.date === customerDocDate);
                        }
                        if (customerDocSearch) {
                           const q = customerDocSearch.trim().toLowerCase();
                           res = res.filter(r => {
                             const rd = r.rawData || {};
                             const matchStr = `
                               ${r.details || ''} ${r.customerName || ''} ${String(r.date)} ${rd.ecNo || ''}
                               ${rd.nagalNo || ''} ${rd.tpNo || ''} ${rd.docNo || ''} ${rd.nagar || ''}
                               ${rd.phone || ''} ${rd.reference || ''} ${rd.recordNo || ''}
                             `.toLowerCase();
                             return matchStr.includes(q);
                           });
                        }
                        return res;
                      };

                      const fEc = filterCustDocs(currentCustomer.ecRecords, "EC Records");
                      const fNagal = filterCustDocs(currentCustomer.nagalRecords, "Nagal Records");
                      const fAgr = filterCustDocs(currentCustomer.agreementRecords, "Agreements");
                      const fDeed = filterCustDocs(currentCustomer.deedRecords, "Deeds");

                      const hasRecords = fEc.length > 0 || fNagal.length > 0 || fAgr.length > 0 || fDeed.length > 0;
                      
                      if(!hasRecords) {
                        return <div className="text-center py-5 text-muted border rounded-4 bg-light my-4">No matching {customerDocTab} found.</div>;
                      }

                      return (
                        <>
                          {renderDocs(fEc, "EC Records", faMapMarkerAlt)}
                          {renderDocs(fNagal, "Nagal Records", faBook)}
                          {renderDocs(fAgr, "Agreements", faFileAlt)}
                          {renderDocs(fDeed, "Deeds", faScroll)}
                        </>
                      );
                    })()}
                  </div>

                  {/* Grand Summary Block */}
                  {(()=>{
                     const sums = getCustomerPaymentSummary(currentCustomer);
                     return(
                       <div className="grand-summary">
                         <div className="summary-col">
                           <div className="lbl">Total Overall Cost</div>
                           <div className="val">{formatCurrency(sums.cost)}</div>
                         </div>
                         <div className="summary-col">
                           <div className="lbl">Total Paid</div>
                           <div className="val text-success">{formatCurrency(sums.collected)}</div>
                         </div>
                         <div className="summary-col" style={{borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft:'24px'}}>
                           <div className="lbl text-warning">Overall Balance</div>
                           <div className="val highlight">{formatCurrency(sums.balance)}</div>
                         </div>
                       </div>
                     )
                  })()}

                </Modal.Body>
              </motion.div>
            </Modal>
          )}
        </AnimatePresence>

        {/* View Document Record Extracted Modal */}
        <AnimatePresence>
          {showDocModal && currentDoc && (
            <Modal show={showDocModal} onHide={() => setShowDocModal(false)} size="lg" centered contentClassName="custom-modal-content">
              <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit">
                <Modal.Header className="custom-modal-header" closeButton closeVariant="white">
                  <Modal.Title className="custom-modal-title"><FontAwesomeIcon icon={faFileAlt} className="me-3" /> Document Details</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4 p-md-5" style={{maxHeight:'80vh', overflowY:'auto'}}>
                  <div className="financial-summary-banner mb-4 d-flex justify-content-between align-items-center p-4 rounded-4 shadow-sm" style={{background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white'}}>
                    <div>
                      <div style={{fontSize: '0.8rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px'}}>Amount</div>
                      <div style={{fontSize: '1.8rem', fontWeight: 800}}>{formatCurrency(currentDoc.amount || 0)}</div>
                    </div>
                    <div className="text-center">
                      <div style={{fontSize: '0.8rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px'}}>Status</div>
                      <Badge bg={['Completed', 'Registered', 'Active'].includes(currentDoc.status) ? 'success' : 'warning'} className="px-3 py-2 rounded-pill fs-6">{currentDoc.status || "Pending"}</Badge>
                    </div>
                    <div className="text-end">
                      <div style={{fontSize: '0.8rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px'}}>Balance</div>
                      <div style={{fontSize: '1.8rem', fontWeight: 800, color: (currentDoc.balance || 0) > 0 ? '#fbbf24' : '#10b981'}}>{formatCurrency(currentDoc.balance || 0)}</div>
                    </div>
                  </div>

                  <Row className="g-4">
                    <Col md={6}>
                      <div className="p-4 rounded-4 border bg-light h-100 shadow-sm" style={{borderLeft: '4px solid #3b82f6 !important'}}>
                        <h6 className="mb-3 fw-bold text-primary"><FontAwesomeIcon icon={faUser} className="me-2"/> Participants & Record</h6>
                        <div className="mb-3">
                          <small className="text-muted d-block" style={{fontSize: '0.7rem', textTransform: 'uppercase'}}>Customer Name</small>
                          <span className="fw-bold" style={{fontSize: '1.1rem'}}>{currentDoc.customerName || "N/A"}</span>
                        </div>
                        <div className="mb-3">
                          <small className="text-muted d-block" style={{fontSize: '0.7rem', textTransform: 'uppercase'}}>Record No</small>
                          <span className="fw-semibold">{currentDoc.recordNo || currentDoc.ecNo || currentDoc.recordNo || "N/A"}</span>
                        </div>
                        <div>
                          <small className="text-muted d-block" style={{fontSize: '0.7rem', textTransform: 'uppercase'}}>Vendor / Ref</small>
                          <span className="fw-semibold">{currentDoc.vendor || currentDoc.reference || "N/A"}</span>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="p-4 rounded-4 border bg-light h-100 shadow-sm" style={{borderLeft: '4px solid #10b981 !important'}}>
                        <h6 className="mb-3 fw-bold text-success"><FontAwesomeIcon icon={faMapMarkerAlt} className="me-2"/> Property Details</h6>
                        <Row className="g-3">
                          <Col xs={6}><small className="text-muted d-block" style={{fontSize: '0.7rem', textTransform: 'uppercase'}}>TP No</small><span className="fw-semibold">{currentDoc.tpNo || "N/A"}</span></Col>
                          <Col xs={6}><small className="text-muted d-block" style={{fontSize: '0.7rem', textTransform: 'uppercase'}}>Plot No</small><span className="fw-semibold">{currentDoc.plotNo || "N/A"}</span></Col>
                          <Col xs={12}><small className="text-muted d-block" style={{fontSize: '0.7rem', textTransform: 'uppercase'}}>Location (Nagar/Office)</small><span className="fw-semibold">{currentDoc.nagar || "N/A"} ({currentDoc.office || "N/A"})</span></Col>
                          <Col xs={12}><small className="text-muted d-block" style={{fontSize: '0.7rem', textTransform: 'uppercase'}}>Deed / Type</small><span className="fw-semibold">{currentDoc.deed || currentDoc.documentType || "N/A"}</span></Col>
                        </Row>
                      </div>
                    </Col>
                  </Row>

                  {/* Payment Log Relocated Here */}
                  {currentDoc.payments && currentDoc.payments.length > 0 && (
                    <div className="mt-5">
                      <h6 className="mb-3 fw-bold text-muted d-flex align-items-center gap-2">
                        <FontAwesomeIcon icon={faHistory} /> Transaction History
                      </h6>
                      <div className="table-responsive rounded-4 border bg-white shadow-sm overflow-hidden">
                        <Table hover className="mb-0">
                          <thead className="bg-light">
                            <tr style={{fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b'}}>
                              <th className="px-4 py-3">Date & Time</th>
                              <th className="px-4 py-3">Method</th>
                              <th className="px-4 py-3">Amount</th>
                              <th className="px-4 py-3">Note</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentDoc.payments.map((p, i) => (
                              <tr key={i} style={{fontSize: '0.9rem', verticalAlign: 'middle'}}>
                                <td className="px-4 py-3 text-muted">{new Date(p.date).toLocaleDateString('en-GB')} | {p.time}</td>
                                <td className="px-4 py-3"><Badge bg="light" text="dark" className="border px-2 py-1">{p.method || 'Cash'}</Badge></td>
                                <td className="px-4 py-3 fw-bold text-success">₹{(p.amount || 0).toLocaleString()}</td>
                                <td className="px-4 py-3 text-muted italic" style={{fontSize: '0.85rem'}}>{p.note || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </div>
                  )}
                </Modal.Body>
                <Modal.Footer className="border-0 p-4 pt-0">
                  <Button variant="light" className="px-4 py-2" style={{borderRadius: '12px', fontWeight:600}} onClick={() => setShowDocModal(false)}>Close Window</Button>
                </Modal.Footer>
              </motion.div>
            </Modal>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default Vendor;

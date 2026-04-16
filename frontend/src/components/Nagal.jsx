import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal, Button, Form, Row, Col, Alert, Badge, Table } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus, faEye, faEdit, faTrash, faSearch,
  faFileAlt, faCheckCircle, faClock, faCalendarCheck, faCreditCard,
  faMapMarkerAlt, faBuilding, faUser, faMoneyBillWave,
  faTimes, faSortAmountDown, faFileContract, faWallet, faHandHoldingUsd, faBalanceScale,
  faBookOpen, faHistory, faCalendarAlt, faPrint
} from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import API_BASE_URL from "../config";

// Enhanced dummy data for Nagal records including received and balance
const dummyNagalData = [
  { id: 1, date: "2024-10-01", nagalNo: "NAG001", vendor: "Vendor A", customerName: "John Doe", office: "Office 1", nagar: "Nagar 1", surveyNo: "12345", amount: 50000, commission: 5000, others: 1000, totalFee: 56000, received: 50000, balance: 6000, status: "Pending" },
  { id: 2, date: "2024-10-05", nagalNo: "NAG002", vendor: "Vendor B", customerName: "Jane Smith", office: "Office 2", nagar: "Nagar 2", surveyNo: "67890", amount: 75000, commission: 7500, others: 2000, totalFee: 84500, received: 84500, balance: 0, status: "Completed" },
  { id: 3, date: "2024-10-10", nagalNo: "NAG003", vendor: "Vendor C", customerName: "Bob Johnson", office: "Office 1", nagar: "Nagar 3", surveyNo: "54321", amount: 60000, commission: 6000, others: 1500, totalFee: 67500, received: 67500, balance: 0, status: "Completed" },
  { id: 4, date: "2024-10-15", nagalNo: "NAG004", vendor: "Vendor D", customerName: "Alice Williams", office: "Office 3", nagar: "Nagar 4", surveyNo: "98765", amount: 45000, commission: 4500, others: 800, totalFee: 50300, received: 25000, balance: 25300, status: "Pending" },
  { id: 5, date: "2024-10-20", nagalNo: "NAG005", vendor: "Vendor A", customerName: "Charlie Brown", office: "Office 2", nagar: "Nagar 1", surveyNo: "11111", amount: 80000, commission: 8000, others: 2500, totalFee: 90500, received: 90500, balance: 0, status: "Completed" }
];

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } } };
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
  exit: { opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.2 } }
};

const Nagal = () => {
  const [activeTab, setActiveTab] = useState("nagal");
  const [nagalData, setNagalData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentNagal, setCurrentNagal] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ vendor: "", status: "", date: "" });
  const [sortOption, setSortOption] = useState("date-desc");
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printMonth, setPrintMonth] = useState(new Date().getMonth() + 1);
  const [printYear, setPrintYear] = useState(new Date().getFullYear());

  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    date: "", nagalNo: "", vendor: "", customerName: "", client: "",
    office: "", nagar: "", surveyNo: "",
    amount: "", commission: "", others: "", totalFee: "", received: "", balance: "", newPayment: "", paymentNote: ""
  });

  const totalNagal = nagalData.length;
  const completedNagal = nagalData.filter(d => d.status === "Completed").length;
  const totalReceived = nagalData.reduce((acc, curr) => acc + (Number(curr.received) || 0), 0);
  const totalBalance = nagalData.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0);

  const fetchData = async () => {
    try {
      const [res, clientsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/documents?documentType=Nagal`),
        fetch(`${API_BASE_URL}/api/clients`)
      ]);
      const data = await res.json();
      const clientsData = await clientsRes.json();
      setClients(clientsData);
      
      const formatted = data.map(d => ({
        ...d,
        id: d._id,
        date: d.date ? d.date.split('T')[0] : "",
        nagalNo: d.nagalNo || d.recordNo || "",
        vendor: d.vendor || "",
        customerName: d.customerName || "",
        office: d.office || "",
        nagar: d.nagar || "",
        surveyNo: d.surveyNo || "",
        amount: d.amount || 0,
        commission: d.commission || 0,
        others: d.others || 0,
        totalFee: d.totalFee || 0,
        received: d.received || 0,
        balance: d.balance || 0,
        status: d.status || "Pending"
      }));
      setNagalData(formatted);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = nagalData.filter(d =>
      (d.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
       d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
       d.nagalNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
       d.surveyNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
       d.nagar.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (filters.vendor) filtered = filtered.filter(d => d.vendor === filters.vendor);
    if (filters.status) filtered = filtered.filter(d => d.status === filters.status);
    if (filters.date) {
      filtered = filtered.filter(d => {
        const dDate = new Date(d.date).toISOString().split('T')[0];
        return dDate === filters.date;
      });
    }

    filtered.sort((a, b) => {
      const splitOption = sortOption.split("-");
      const key = splitOption[0];
      const direction = splitOption[1];
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredData(filtered);
  }, [nagalData, searchTerm, filters, sortOption]);

  const handleAddNew = () => {
    setIsEdit(false); setCurrentNagal(null);
    setFormData({ date: "", nagalNo: "", vendor: "", customerName: "", client: "", office: "", nagar: "", surveyNo: "", amount: "", commission: "", others: "", totalFee: "", received: "", balance: "", newPayment: "", paymentNote: "" });
    setShowModal(true);
  };
  const handleEdit = (nagal, e) => {
    e.stopPropagation(); setIsEdit(true); setCurrentNagal(nagal);
    setFormData({ 
      date: nagal.date, nagalNo: nagal.nagalNo, vendor: nagal.vendor, customerName: nagal.customerName, 
      client: nagal.client?._id || nagal.client || "", office: nagal.office, nagar: nagal.nagar, surveyNo: nagal.surveyNo, 
      amount: nagal.amount.toString(), commission: nagal.commission.toString(), others: nagal.others.toString(), 
      totalFee: nagal.totalFee.toString(), received: nagal.received.toString(), balance: nagal.balance.toString(),
      newPayment: "", paymentNote: ""
    });
    setShowModal(true);
  };
  const handleView = (nagal) => { setCurrentNagal(nagal); setShowViewModal(true); };
  const handleDelete = async (id, e) => { 
    e.stopPropagation(); 
    if (window.confirm("Are you sure you want to delete this record?")) { 
      try {
        const cleanId = id?.toString().split(':')[0]; // Sanitize ID
        await fetch(`${API_BASE_URL}/api/documents/${cleanId}`, { method: 'DELETE' });
        fetchData();
      } catch(e) { console.error(e); }
    } 
  };
  
  const handleSave = async () => {
    const amount = parseFloat(formData.amount) || 0;
    const commission = parseFloat(formData.commission) || 0;
    const others = parseFloat(formData.others) || 0;
    const received = parseFloat(formData.received) || 0;
    const newPayment = parseFloat(formData.newPayment) || 0;
    
    // Core payload
    const payload = {
       ...formData,
       date: formData.date || new Date().toISOString(),
       documentType: 'Nagal',
       recordNo: formData.nagalNo || `NAG-${Date.now()}`,
       amount, commission, others,
       editFee: 0, stamp: 0
    };

    if (isEdit) {
      if (newPayment > 0) {
        payload.newPayment = newPayment;
        payload.paymentNote = formData.paymentNote || "Part Payment";
      }
      delete payload.received; 
    } else {
      payload.received = received;
    }
    
    // Ensure client is just the ID if it was populated
    if (payload.client && typeof payload.client === 'object') {
       payload.client = payload.client._id;
    }
    if (!payload.client) delete payload.client;
    
    try {
        let res;
        if (isEdit) { 
           const cleanId = currentNagal.id?.toString().split(':')[0]; // Sanitize ID
           res = await fetch(`${API_BASE_URL}/api/documents/${cleanId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
           });
        } else { 
           res = await fetch(`${API_BASE_URL}/api/documents`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
           });
        }

        if (res && res.ok) {
           fetchData();
           setShowModal(false);
        } else {
           const errData = await res.json();
           alert(`Error: ${errData.message || 'Failed to save record'}`);
        }
    } catch(err) {
        console.error(err);
        alert('Network error - Please check your connection');
    }
  };
  const handleFilterChange = (field, value) => setFilters({ ...filters, [field]: value });
  const clearFilters = () => { setFilters({ vendor: "", status: "", date: "" }); setSearchTerm(""); setSortOption("date-desc"); };

  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const printYearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const handlePrint = () => {
    const monthDocs = nagalData.filter(d => {
      if (!d.date) return false;
      const dt = new Date(d.date);
      return dt.getMonth() + 1 === printMonth && dt.getFullYear() === printYear;
    });
    const monthLabel = `${MONTH_NAMES[printMonth - 1]} ${printYear}`;
    const rows = monthDocs.map((d, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${d.date ? new Date(d.date).toLocaleDateString('en-GB') : '-'}</td>
        <td>${d.nagalNo || '-'}</td>
        <td>${d.customerName || '-'}</td>
        <td>${d.surveyNo || '-'}</td>
        <td>${d.vendor || '-'}</td>
        <td>${d.nagar || '-'}</td>
        <td>₹${Number(d.totalFee||0).toLocaleString()}</td>
        <td>₹${Number(d.received||0).toLocaleString()}</td>
        <td style="color:${d.balance>0?'#dc2626':'#16a34a'}">₹${Number(d.balance||0).toLocaleString()}</td>
        <td>${d.status || '-'}</td>
      </tr>`).join('');
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>Nagal Report – ${monthLabel}</title>
      <style>body{font-family:Arial,sans-serif;padding:24px;color:#1e293b}h2{color:#d97706}table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}th{background:#0f172a;color:#fff;padding:10px 8px;text-align:left}td{padding:9px 8px;border-bottom:1px solid #e2e8f0}tr:nth-child(even){background:#f8fafc}.footer{margin-top:20px;font-size:12px;color:#94a3b8}</style>
      </head><body>
      <h2>Nagal Records – ${monthLabel}</h2>
      <p>Total records: <strong>${monthDocs.length}</strong> &nbsp;|&nbsp; Printed: <strong>${new Date().toLocaleString('en-GB')}</strong></p>
      <table><thead><tr><th>#</th><th>Date</th><th>Nagal No</th><th>Customer</th><th>Survey No</th><th>Vendor</th><th>Nagar</th><th>Total Fee</th><th>Received</th><th>Balance</th><th>Status</th></tr></thead><tbody>${rows || '<tr><td colspan=11 style="text-align:center;padding:20px;color:#94a3b8">No records for this month</td></tr>'}</tbody></table>
      <div class="footer">AJ Law Firm — Confidential Document</div>
      </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
    setShowPrintModal(false);
  };

  const getStatusBadge = (status) => {
    const config = status === "Completed" ? { bg: "#10b981", icon: faCheckCircle } : { bg: "#f59e0b", icon: faClock };
    return (
      <Badge style={{ background: `linear-gradient(135deg, ${config.bg} 0%, ${config.bg}dd 100%)`, color: "white", border: "none", padding: "6px 14px", borderRadius: "12px", fontWeight: "600", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "6px", boxShadow: `0 4px 10px rgba(0,0,0,0.3)` }}>
        <FontAwesomeIcon icon={config.icon} size="sm" /> {status}
      </Badge>
    );
  };

  const getThemeVars = () => {
    return `
      --bg-main: #f4f7f6;
      --bg-card: #ffffff;
      --bg-card-hover: #f8fafc;
      --bg-input: #ffffff;
      --border-input: #e2e8f0;
      --text-primary: #0f172a;
      --text-secondary: #475569;
      --border-glass: #e2e8f0;
      --modal-bg: #ffffff;
      --modal-header-bg: #f8fafc;
      --icon-bg: #f1f5f9;
      --action-bar: rgba(255, 255, 255, 0.95);
      --highlight: #d97706;
      --highlight-grad: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
      --btn-text: #0f172a;
      --shadow-main: rgba(0,0,0,0.08);
    `;
  };

  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  };

  return (
    <div className="layout-page">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-content">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
          
          .layout-page { ${getThemeVars()} background: var(--bg-main); min-height: 100vh; font-family: 'Inter', sans-serif; position: relative; overflow-x: hidden; color: var(--text-primary); transition: background 0.3s ease; }
          .layout-page::before { content: "📄"; position: fixed; font-size: 280px; opacity: 0.02; bottom: 100px; right: -50px; z-index: 0; transform: rotate(-25deg); pointer-events: none; }
          .main-content { margin-left: 280px; padding: 40px; position: relative; z-index: 1; }
          @media (max-width: 991px) { .main-content { margin-left: 0; padding: 20px; } }
          @media (max-width: 767px) {
            .page-title { font-size: 1.6rem !important; }
            .stat-number { font-size: 1.7rem !important; }
            .stat-card { padding: 18px 12px; }
            .controls-bar { padding: 16px; margin-bottom: 20px; }
            .search-bar, .filter-select { padding: 12px 14px; font-size: 0.88rem; }
            .search-bar { padding-left: 44px; }
            .add-record-btn { padding: 12px 20px; width: 100%; justify-content: center; }
          }
          @media (max-width: 575px) {
            .main-content { padding: 12px; }
            .page-title { font-size: 1.3rem !important; }
            .stat-number { font-size: 1.4rem !important; }
            .stat-icon-wrapper { width: 44px; height: 44px; margin-bottom: 12px; }
            .stat-icon { font-size: 1.2rem; }
            .stat-label { font-size: 0.75rem; }
          }

          .page-header { margin-bottom: 24px; }
          .page-title { font-family: 'Playfair Display', serif; font-size: 2.2rem; font-weight: 700; color: var(--highlight); margin-bottom: 8px; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          
          .stat-card { background: #0f172a; border-radius: 20px; padding: 24px 16px; text-align: center; position: relative; overflow: hidden; box-shadow: 0 15px 35px rgba(15,23,42,0.2); transition: all 0.4s ease; color: white; border: 1px solid rgba(255,255,255,0.05); }
          .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%); transform: scaleX(0); transition: 0.4s ease; }
          .stat-card:hover { transform: translateY(-5px); box-shadow: 0 25px 45px rgba(15,23,42,0.3); }
          .stat-card:hover::before { transform: scaleX(1); }

          .stat-icon-wrapper { width: 54px; height: 54px; border-radius: 16px; background: linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(217,119,6,0.2) 100%); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; border: 1px solid rgba(251,191,36,0.3); transition: all 0.3s ease; }
          .stat-card:hover .stat-icon-wrapper { transform: scale(1.1) rotate(5deg); background: rgba(251,191,36,0.2); }
          .stat-icon { font-size: 1.5rem; color: #fbbf24; }
          .stat-number { font-family: 'Playfair Display', serif; font-size: 2.2rem; font-weight: 700; color: #ffffff; margin-bottom: 4px; }
          .stat-label { font-size: 0.85rem; color: #94a3b8; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }
          
          .controls-bar { background: var(--action-bar); backdrop-filter: blur(24px); border-radius: 20px; padding: 24px; margin-bottom: 30px; box-shadow: 0 10px 40px var(--shadow-main); border: 1px solid var(--border-glass); }
          .search-container { position: relative; }
          .search-bar, .filter-select { background: var(--bg-input); border: 2px solid var(--border-input); border-radius: 14px; padding: 14px 18px; color: var(--text-primary); font-size: 0.95rem; font-weight: 500; width: 100%; transition: all 0.3s ease; }
          .search-bar { padding-left: 48px; }
          .search-bar:focus, .filter-select:focus { outline: none; border-color: var(--highlight); box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.15); color: var(--text-primary);}
          .search-bar::placeholder { color: var(--text-secondary); }
          .filter-select option { background: var(--bg-input); color: var(--text-primary); }
          .search-icon { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); font-size: 1.1rem; }
          
          .btn-gold { background: var(--highlight-grad); border: none; border-radius: 14px; padding: 14px 28px; font-weight: 600; color: var(--btn-text); font-size: 0.95rem; box-shadow: 0 8px 20px rgba(217,119,6,0.15); transition: all 0.3s ease; display: inline-flex; align-items: center; justify-content: center; width: 100%; text-transform: uppercase; letter-spacing: 0.5px; }
          .btn-gold:hover { transform: translateY(-3px); box-shadow: 0 12px 25px rgba(217,119,6,0.35); color: var(--btn-text);}
          .filter-toggle { background: var(--icon-bg); border: 1px solid var(--border-input); border-radius: 14px; padding: 14px 18px; color: var(--text-primary); font-weight: 600; cursor: pointer; transition: all 0.3s ease; width: 100%; text-align: center; }
          .filter-toggle:hover { filter: brightness(1.2); }
          
          .data-card { background: var(--bg-card); backdrop-filter: blur(10px); border-radius: 20px; padding: 24px; position: relative; overflow: hidden; border: 1px solid var(--border-glass); box-shadow: 0 10px 30px var(--shadow-main); transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); height: 100%; display: flex; flex-direction: column; cursor: pointer; color: var(--text-primary); }
          .data-card::before { content: ''; position: absolute; top: 0; left: 0; width: 5px; height: 100%; background: var(--highlight-grad); opacity: 0; transition: opacity 0.3s ease; }
          .data-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.2); background: var(--bg-card-hover); border-color:var(--highlight); }
          .data-card:hover::before { opacity: 1; }

          .data-card .actions-overlay { position: absolute; top: 16px; right: 16px; display: flex; gap: 8px; opacity: 0; transition: 0.3s ease; }
          .data-card:hover .actions-overlay { opacity: 1; }
          .circle-btn { width: 38px; height: 38px; border-radius: 50%; border: none; display: inline-flex; align-items: center; justify-content: center; background: var(--icon-bg); color: var(--text-secondary); font-size: 0.9rem; transition: all 0.2s ease; box-shadow: 0 2px 5px var(--shadow-main); }
          .circle-btn:hover { background: var(--highlight); color: #0f172a; }
          .circle-btn.del:hover { background: #ef4444; color: white; }

          .deed-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
          .deed-number { font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 700; color: var(--text-primary); padding-right: 80px;}
          .deed-body { flex-grow: 1; display: flex; flex-direction: column; gap: 10px; }
          .deed-info { font-size: 0.95rem; color: var(--text-secondary); font-weight: 500; display: flex; align-items: center; gap: 10px; }
          .deed-info svg { color: var(--highlight); width: 16px;}
          
          .card-stats { background: rgba(0,0,0,0.02); border-radius: 16px; padding: 16px; margin-top: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; border: 1px solid var(--border-glass); margin-top: 20px;}
          
          @media print {
            .sidebar, .page-header, .controls-bar, .actions-overlay, .btn-gold { display: none !important; }
            .main-content { margin-left: 0 !important; padding: 0 !important; }
            .glass-card { box-shadow: none !important; border: 1px solid #eee !important; }
            .data-card { break-inside: avoid; border: 1px solid #ddd !important; }
          }
          .stat-block .label { font-size: 0.75rem; text-transform: uppercase; color: var(--text-secondary); font-weight: 700; letter-spacing: 0.5px; margin-bottom: 6px; }
          .stat-block .val { font-size: 1.15rem; font-weight: 700; color: var(--text-primary); }
          .stat-block .val.success { color: #10b981; }
          .stat-block .val.warning { color: #ef4444; }

          /* Modals */
          .details-modal .modal-content {
            background: rgba(255, 255, 255, 0.98); backdrop-filter: blur(20px);
            border-radius: 28px; border: none; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3); overflow: hidden;
          }
          .details-modal .modal-header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border: none; padding: 24px 32px; color: white; display: flex; align-items: center; }
          .details-modal .modal-title { font-family: 'Playfair Display', serif; font-weight: 700; font-size: 1.6rem; letter-spacing: -0.5px; }
          .details-modal .btn-close { filter: invert(1) grayscale(100%) brightness(200%); opacity: 0.8; }
          .details-modal .modal-body { padding: 32px; }

          .form-label-modern { font-weight: 600; color: #475569; margin-bottom: 8px; font-size: 0.9rem; }
          .form-control-modern {
            border-radius: 14px; border: 2px solid #e2e8f0; background: #f8fafc;
            padding: 14px 18px; font-size: 0.95rem; font-weight: 500; color: #1e293b;
          }
          .form-control-modern:focus { border-color: #fbbf24; outline: none; background: #ffffff; box-shadow: 0 0 0 4px rgba(251,191,36,0.15); }

          .total-alert { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: none; border-radius: 16px; padding: 20px; font-weight: 700; color: #92400e; font-size: 1.2rem; text-align: center; }
          
          .modal-content, .modal-body { scrollbar-color: var(--highlight) transparent; scrollbar-width: thin; background: #ffffff !important; }
          /* Payment History Small Table */
          .history-table { width: 100%; border-collapse: separate; border-spacing: 0 4px; }
          .history-table th { font-size: 0.75rem; text-transform: uppercase; color: #94a3b8; padding: 8px 12px; }
          .history-table td { padding: 10px 12px; background: #f8fafc; font-size: 0.85rem; border: 1px solid #f1f5f9; }
          .history-table tr td:first-child { border-top-left-radius: 8px; border-bottom-left-radius: 8px; }
          .history-table tr td:last-child { border-top-right-radius: 8px; border-bottom-right-radius: 8px; }
        `}</style>

        <div className="page-header d-flex justify-content-between align-items-center">
          <div>
            <h2 className="page-title">Nagal Directory</h2>
            <p style={{color:'var(--text-secondary)'}} className="mb-0">Elegant Nagal document and billing management</p>
          </div>
        </div>

        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <Row className="mb-4 g-4">
            <Col lg={3} md={6}><motion.div variants={itemVariants}><div className="stat-card"><div className="stat-icon-wrapper"><FontAwesomeIcon icon={faBookOpen} className="stat-icon" /></div><div className="stat-number">{totalNagal}</div><div className="stat-label">Total Nagal</div></div></motion.div></Col>
            <Col lg={3} md={6}><motion.div variants={itemVariants}><div className="stat-card"><div className="stat-icon-wrapper"><FontAwesomeIcon icon={faCheckCircle} className="stat-icon" /></div><div className="stat-number">{completedNagal}</div><div className="stat-label">Completed</div></div></motion.div></Col>
            <Col lg={3} md={6}><motion.div variants={itemVariants}><div className="stat-card"><div className="stat-icon-wrapper"><FontAwesomeIcon icon={faHandHoldingUsd} className="stat-icon" /></div><div className="stat-number">{formatCurrency(totalReceived)}</div><div className="stat-label">Total Received</div></div></motion.div></Col>
            <Col lg={3} md={6}><motion.div variants={itemVariants}><div className="stat-card"><div className="stat-icon-wrapper"><FontAwesomeIcon icon={faBalanceScale} className="stat-icon" /></div><div className="stat-number">{formatCurrency(totalBalance)}</div><div className="stat-label">Total Balance</div></div></motion.div></Col>
          </Row>

          <motion.div variants={itemVariants}>
            <div className="controls-bar">
              <Row className="g-3 align-items-center">
                <Col lg={4} md={12}><div className="search-container"><FontAwesomeIcon icon={faSearch} className="search-icon" /><input className="search-bar" placeholder="Search Customer, Nagal No, Survey No..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></Col>
                <Col lg={2} md={4}><select className="filter-select" value={filters.vendor} onChange={(e) => handleFilterChange("vendor", e.target.value)}><option value="">All Vendors</option>{[...new Set(nagalData.map(d => d.vendor))].map(vendor => (<option key={vendor} value={vendor}>{vendor}</option>))}</select></Col>
                {/* <Col lg={2} md={4}><select className="filter-select" value={filters.status} onChange={(e) => handleFilterChange("status", e.target.value)}><option value="">All Statuses</option><option value="Completed">Completed</option><option value="Pending">Pending</option></select></Col> */}
                <Col lg={2} md={4}>
                  <div className="search-container">
                    <FontAwesomeIcon icon={faCalendarAlt} className="search-icon" />
                    <input 
                      type="date" 
                      className="search-bar border-0" 
                      value={filters.date} 
                      onChange={(e) => handleFilterChange("date", e.target.value)} 
                      style={{paddingLeft: '40px'}}
                    />
                  </div>
                </Col>
                <Col lg={1} md={4}>
                  <button 
                    className="filter-toggle" 
                    onClick={() => setShowPrintModal(true)}
                    style={{width: '100%', height: '48px', color: '#10b981', border: '1px solid #10b981', background: 'transparent'}}
                    title="Print Current View"
                  >
                    <FontAwesomeIcon icon={faPrint} />
                  </button>
                </Col>
                {/* <Col lg={1} md={4}>
                  <select className="filter-select" value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                    <option value="date-desc">Newest</option>
                    <option value="date-asc">Oldest</option>
                  </select>
                </Col> */}
                <Col lg={1} md={4}><button className="filter-toggle" onClick={clearFilters}><FontAwesomeIcon icon={faTimes}/></button></Col>
                <Col lg={1} md={8} className="text-lg-end"><button className="btn-gold px-4" onClick={handleAddNew}><FontAwesomeIcon icon={faPlus}/></button></Col>
              </Row>
            </div>
          </motion.div>

          <Row className="g-4 pb-5">
            <AnimatePresence>
              {filteredData.length > 0 ? filteredData.map((nagal) => (
                <Col lg={4} md={6} xl={3} key={nagal.id}>
                  <motion.div variants={itemVariants} initial="hidden" animate="visible" exit={{ opacity: 0, scale: 0.9 }} layout className="h-100">
                    <div className="data-card" onClick={() => handleView(nagal)}>
                      <div className="actions-overlay">
                        <button className="circle-btn edit" onClick={(e) => handleEdit(nagal, e)} title="Edit"><FontAwesomeIcon icon={faEdit}/></button>
                        <button className="circle-btn del" onClick={(e) => handleDelete(nagal.id, e)} title="Delete"><FontAwesomeIcon icon={faTrash}/></button>
                      </div>
                      <div className="deed-header">
                        <div className="deed-number text-truncate" title={nagal.nagalNo}>NO: {nagal.nagalNo}</div>
                      </div>
                      {getStatusBadge(nagal.status)}
                      <div className="deed-body mt-3">
                        <div className="deed-info text-truncate"><FontAwesomeIcon icon={faUser} /> <span style={{color:'var(--text-primary)'}} className="fw-bold">{nagal.customerName}</span></div>
                        <div className="deed-info text-truncate"><FontAwesomeIcon icon={faFileAlt} /> Survey: {nagal.surveyNo}</div>
                        <div className="deed-info text-truncate"><FontAwesomeIcon icon={faBuilding} /> {nagal.vendor}</div>
                        <div className="deed-info text-truncate"><FontAwesomeIcon icon={faMapMarkerAlt} /> {nagal.nagar}</div>
                      </div>
                      
                      <div className="card-stats">
                         <div className="stat-block"><div className="label">Total Fee</div><div className="val">{formatCurrency(nagal.totalFee)}</div></div>
                         <div className="stat-block"><div className="label">Received</div><div className="val success">{formatCurrency(nagal.received)}</div></div>
                         <div className="stat-block" style={{ gridColumn: 'span 2' }}><div className="label">Balance Remaining</div><div className="val warning">{formatCurrency(nagal.balance)}</div></div>
                      </div>
                      
                    </div>
                  </motion.div>
                </Col>
              )) : (
                <Col xs={12}>
                  <div className="text-center py-5">
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📄</div>
                    <h5 style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>No Nagal records found</h5>
                  </div>
                </Col>
              )}
            </AnimatePresence>
          </Row>
        </motion.div>

        <AnimatePresence>
          {showViewModal && currentNagal && (
            <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered size="xl" className="details-modal">
              <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit">
                <Modal.Header closeButton>
                  <Modal.Title><FontAwesomeIcon icon={faEye} className="me-2 text-warning"/> View Nagal Record: {currentNagal.nagalNo}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <div className="text-center mb-4">{getStatusBadge(currentNagal.status)}</div>
                  
                  <Row className="g-3">
                    <Col md={6}><Form.Group><Form.Label className="form-label-modern">Date</Form.Label><Form.Control type="text" className="form-control-modern" value={new Date(currentNagal.date).toLocaleDateString('en-GB')} disabled /></Form.Group></Col>
                    <Col md={6}><Form.Group><Form.Label className="form-label-modern">Customer Name</Form.Label><Form.Control type="text" className="form-control-modern" value={currentNagal.customerName} disabled /></Form.Group></Col>
                    <Col md={6}><Form.Group><Form.Label className="form-label-modern">Survey No</Form.Label><Form.Control type="text" className="form-control-modern" value={currentNagal.surveyNo} disabled /></Form.Group></Col>
                    <Col md={6}><Form.Group><Form.Label className="form-label-modern">Vendor</Form.Label><Form.Control type="text" className="form-control-modern" value={currentNagal.vendor} disabled /></Form.Group></Col>
                    <Col md={6}><Form.Group><Form.Label className="form-label-modern">Office</Form.Label><Form.Control type="text" className="form-control-modern" value={currentNagal.office} disabled /></Form.Group></Col>
                    <Col md={6}><Form.Group><Form.Label className="form-label-modern">Nagar</Form.Label><Form.Control type="text" className="form-control-modern" value={currentNagal.nagar} disabled /></Form.Group></Col>

                    <h5 className="mt-5 mb-3 fw-bold w-100" style={{color: '#475569'}}><FontAwesomeIcon icon={faWallet} className="me-2"/> Invoice Breakdown</h5>
                    
                    <Col md={4}><Form.Group><Form.Label className="form-label-modern">Amount</Form.Label><Form.Control type="text" className="form-control-modern" value={formatCurrency(currentNagal.amount)} disabled /></Form.Group></Col>
                    <Col md={4}><Form.Group><Form.Label className="form-label-modern">Commission</Form.Label><Form.Control type="text" className="form-control-modern" value={formatCurrency(currentNagal.commission)} disabled /></Form.Group></Col>
                    <Col md={4}><Form.Group><Form.Label className="form-label-modern">Others</Form.Label><Form.Control type="text" className="form-control-modern" value={formatCurrency(currentNagal.others)} disabled /></Form.Group></Col>

                    {/* Payment History Section */}
                    {currentNagal.payments && currentNagal.payments.length > 0 && (
                      <Col md={12} className="mt-4">
                        <h6 className="fw-bold mb-3"><FontAwesomeIcon icon={faHistory} className="me-2"/> Payment History</h6>
                        <Table responsive className="history-table">
                          <thead>
                            <tr>
                              <th>Date & Time</th>
                              <th>Amount</th>
                              <th>Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentNagal.payments.map((p, i) => (
                              <tr key={i}>
                                <td>{new Date(p.date).toLocaleDateString('en-GB')} | {p.time}</td>
                                <td className="fw-bold text-success">₹{(p.amount || 0).toLocaleString()}</td>
                                <td className="text-muted">{p.note || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </Col>
                    )}
                  </Row>
                  
                  <Row className="mt-4">
                    <Col md={4}><Alert className="total-alert border-0 p-3"><span style={{fontSize: '0.9rem', display: 'block', color:'#b45309'}}>Cost</span> ₹{(currentNagal.totalFee || 0).toLocaleString()}</Alert></Col>
                    <Col md={4}><Alert className="total-alert border-0 p-3" style={{background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', color: '#064e3b'}}><span style={{fontSize: '0.9rem', display: 'block', color:'#047857'}}>Received</span> ₹{(currentNagal.received || 0).toLocaleString()}</Alert></Col>
                    <Col md={4}><Alert className="total-alert border-0 p-3" style={{background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', color: '#7f1d1d'}}><span style={{fontSize: '0.9rem', display: 'block', color:'#b91c1c'}}>Balance</span> ₹{(currentNagal.balance || 0).toLocaleString()}</Alert></Col>
                  </Row>
                  
                </Modal.Body>
                <Modal.Footer className="border-0 px-4 pb-4">
                  <Button variant="light" className="px-4 py-2" onClick={() => setShowViewModal(false)} style={{borderRadius:'12px', fontWeight:600}}>Close</Button>
                </Modal.Footer>
              </motion.div>
            </Modal>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showModal && (
            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="xl" className="details-modal" backdrop="static">
              <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit">
                <Modal.Header closeButton>
                  <Modal.Title>{isEdit ? <><FontAwesomeIcon icon={faEdit} className="me-2 text-warning"/> Edit Nagal Record</> : <><FontAwesomeIcon icon={faPlus} className="me-2 text-warning"/> Add New Nagal Record</>}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Form>
                    <Row className="g-3">
                      <Col md={4}><Form.Group><Form.Label className="form-label-modern">Date</Form.Label><Form.Control type="date" className="form-control-modern" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} /></Form.Group></Col>
                      <Col md={4}><Form.Group><Form.Label className="form-label-modern">Nagal No</Form.Label><Form.Control type="text" className="form-control-modern" placeholder="Enter Nagal No" value={formData.nagalNo} onChange={(e) => setFormData({ ...formData, nagalNo: e.target.value })} /></Form.Group></Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="form-label-modern">Link to Client</Form.Label>
                          <select className="form-control-modern" value={formData.client} onChange={(e) => {
                             const sel = clients.find(c => c._id === e.target.value);
                             setFormData({
                               ...formData, 
                               client: e.target.value,
                               vendor: sel?.clientType === 'Vendor' ? sel.name : "",
                               customerName: sel?.clientType === 'Customer' ? sel.name : formData.customerName
                             });
                          }}>
                            <option value="">-- Select Client --</option>
                            {clients.map(c => <option key={c._id} value={c._id}>[{c.clientType}] {c.name} {c.phone ? `- ${c.phone}` : ''}</option>)}
                          </select>
                        </Form.Group>
                      </Col>
                      <Col md={4}><Form.Group><Form.Label className="form-label-modern">Customer Name</Form.Label><Form.Control type="text" className="form-control-modern" placeholder="Enter customer" value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} /></Form.Group></Col>
                      <Col md={4}><Form.Group><Form.Label className="form-label-modern">Survey No</Form.Label><Form.Control type="text" className="form-control-modern" placeholder="Enter Survey No" value={formData.surveyNo} onChange={(e) => setFormData({ ...formData, surveyNo: e.target.value })} /></Form.Group></Col>
                      <Col md={4}><Form.Group><Form.Label className="form-label-modern">Office</Form.Label><Form.Control type="text" className="form-control-modern" placeholder="Enter office" value={formData.office} onChange={(e) => setFormData({ ...formData, office: e.target.value })} /></Form.Group></Col>
                      <Col md={12}><Form.Group><Form.Label className="form-label-modern">Nagar</Form.Label><Form.Control type="text" className="form-control-modern" placeholder="Enter nagar" value={formData.nagar} onChange={(e) => setFormData({ ...formData, nagar: e.target.value })} /></Form.Group></Col>
                    </Row>
                    <Row className="g-3 mt-1">
                      <Col md={4}><Form.Group><Form.Label className="form-label-modern">Amount (₹)</Form.Label><Form.Control type="number" className="form-control-modern" placeholder="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} /></Form.Group></Col>
                      <Col md={4}><Form.Group><Form.Label className="form-label-modern">Commission (₹)</Form.Label><Form.Control type="number" className="form-control-modern" placeholder="0" value={formData.commission} onChange={(e) => setFormData({ ...formData, commission: e.target.value })} /></Form.Group></Col>
                      <Col md={4}><Form.Group><Form.Label className="form-label-modern">Others (₹)</Form.Label><Form.Control type="number" className="form-control-modern" placeholder="0" value={formData.others} onChange={(e) => setFormData({ ...formData, others: e.target.value })} /></Form.Group></Col>
                      {isEdit ? (
                        <>
                          <Col md={4}><Form.Group><Form.Label className="form-label-modern text-muted">Already Received (₹)</Form.Label><Form.Control type="text" className="form-control-modern" value={formatCurrency(formData.received)} disabled /></Form.Group></Col>
                          <Col md={4}><Form.Group><Form.Label className="form-label-modern text-success">Add New Payment (₹)</Form.Label><Form.Control type="number" className="form-control-modern" style={{borderColor:'#10b981'}} placeholder="0" value={formData.newPayment} onChange={(e) => setFormData({ ...formData, newPayment: e.target.value })} /></Form.Group></Col>
                          <Col md={4}><Form.Group><Form.Label className="form-label-modern">Payment Note</Form.Label><Form.Control type="text" className="form-control-modern" placeholder="e.g. Second installment" value={formData.paymentNote} onChange={(e) => setFormData({ ...formData, paymentNote: e.target.value })} /></Form.Group></Col>
                        </>
                      ) : (
                        <Col md={12}>
                          <Form.Group>
                            <Form.Label className="form-label-modern text-success">Actually Received (₹)</Form.Label>
                            <Form.Control type="number" className="form-control-modern" style={{borderColor:'#10b981'}} placeholder="0" value={formData.received} onChange={(e) => setFormData({ ...formData, received: e.target.value })} />
                          </Form.Group>
                        </Col>
                      )}
                    </Row>

                    {isEdit && currentNagal.payments && currentNagal.payments.length > 0 && (
                      <div className="mt-4 p-3 rounded" style={{background: '#f8fafc', border: '1px solid #e2e8f0'}}>
                         <h6 className="fw-bold fs-6 mb-2"><FontAwesomeIcon icon={faHistory} /> Payment History</h6>
                         <div style={{maxHeight:'150px', overflowY:'auto'}}>
                            <Table size="sm" className="mb-0">
                               <thead><tr style={{fontSize:'0.7rem', color:'#94a3b8'}}><th>Date</th><th>Amount</th><th>Note</th></tr></thead>
                               <tbody>
                                  {currentNagal.payments.map((p, i) => (
                                    <tr key={i} style={{fontSize:'0.85rem'}}>
                                      <td>{new Date(p.date).toLocaleDateString('en-GB')}</td>
                                      <td className="fw-bold">₹{p.amount.toLocaleString()}</td>
                                      <td className="text-muted">{p.note}</td>
                                    </tr>
                                  ))}
                               </tbody>
                            </Table>
                         </div>
                      </div>
                    )}

                    <Row className="mt-4 mb-2">
                       <Col md={6}>
                         <Alert className="total-alert border-0" style={{background:'#ffffff'}}><FontAwesomeIcon icon={faMoneyBillWave} className="me-2" /> Cost: {formatCurrency((parseFloat(formData.amount)||0) + (parseFloat(formData.commission)||0) + (parseFloat(formData.others)||0))}</Alert>
                       </Col>
                       <Col md={6}>
                         <Alert className="total-alert border-0" style={{background:'#ffffff', color: '#ef4444'}}><FontAwesomeIcon icon={faBalanceScale} className="me-2" /> Due Balance: {formatCurrency(((parseFloat(formData.amount)||0) + (parseFloat(formData.commission)||0) + (parseFloat(formData.others)||0)) - (parseFloat(formData.received)||0) - (parseFloat(formData.newPayment)||0))}</Alert>
                       </Col>
                    </Row>
                  </Form>
                </Modal.Body>
                <Modal.Footer className="border-0 px-4 pb-4">
                  <Button variant="light" className="px-4 py-2 border-secondary" onClick={() => setShowModal(false)} style={{borderRadius: '14px', fontWeight: 600}}>Cancel</Button>
                  <button className="btn-gold w-auto d-inline-flex" onClick={handleSave}><FontAwesomeIcon icon={isEdit ? faEdit : faPlus} className="me-2" /> {isEdit ? "Update Record" : "Save Record"}</button>
                </Modal.Footer>
              </motion.div>
            </Modal>
          )}
        </AnimatePresence>

        {/* ═══ PRINT MONTH PICKER MODAL ═══ */}
        <Modal show={showPrintModal} onHide={() => setShowPrintModal(false)} centered className="details-modal">
          <Modal.Header closeButton style={{background:'linear-gradient(135deg,#0f172a,#1e293b)',color:'white',borderRadius:'28px 28px 0 0'}}>
            <Modal.Title style={{fontFamily:"'Playfair Display',serif",fontSize:'1.3rem'}}>
              <FontAwesomeIcon icon={faPrint} className="me-2 text-warning" /> Print Nagal Report
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{padding:'28px 32px'}}>
            <p style={{color:'#475569',marginBottom:20}}>Select the month and year to print Nagal records for:</p>
            <Row className="g-3">
              <Col md={6}>
                <Form.Label className="form-label-modern">Month</Form.Label>
                <select className="form-control-modern" value={printMonth} onChange={e => setPrintMonth(Number(e.target.value))}>
                  {MONTH_NAMES.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
                </select>
              </Col>
              <Col md={6}>
                <Form.Label className="form-label-modern">Year</Form.Label>
                <select className="form-control-modern" value={printYear} onChange={e => setPrintYear(Number(e.target.value))}>
                  {printYearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-0 px-4 pb-4">
            <Button variant="light" className="px-4 py-2 border" onClick={() => setShowPrintModal(false)} style={{borderRadius:'12px',fontWeight:600}}>Cancel</Button>
            <button className="btn-gold w-auto px-4 py-2 d-inline-flex" onClick={handlePrint} style={{borderRadius:'12px'}}>
              <FontAwesomeIcon icon={faPrint} className="me-2" /> Print {MONTH_NAMES[printMonth-1]} {printYear}
            </button>
          </Modal.Footer>
        </Modal>

      </div>
    </div>
  );
};

export default Nagal;

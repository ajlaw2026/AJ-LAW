import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal, Button, Form, Row, Col, Badge, Alert } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine, faArrowTrendUp, faArrowTrendDown, faWallet,
  faPlus, faTrash, faCalendarAlt, faFileAlt, faMapMarkedAlt,
  faHandshake, faFileContract, faTimes, faBalanceScale,
  faCoins, faReceipt, faSyncAlt, faLock, faEye, faEyeSlash, faShieldAlt
} from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import API_BASE_URL from "../config";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } } };

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ─── Change this to update the password ───
const LOGS_PASSWORD = "123";

const Logs = () => {
  const [activeTab, setActiveTab] = useState("logs");

  // ─── Password Gate (resets every navigation) ───
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [shaking, setShaking] = useState(false);

  const handleUnlock = () => {
    if (pwInput === LOGS_PASSWORD) {
      setIsUnlocked(true);
      setPwError(false);
      setPwInput("");
    } else {
      setPwError(true);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      setPwInput("");
    }
  };

  // Month/Year Filter
  const now = new Date();
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1); // 1-based
  const [selYear, setSelYear] = useState(now.getFullYear());

  // Profit data from documents
  const [profitData, setProfitData] = useState({ EC: 0, Nagal: 0, Agreement: 0, Deed: 0 });
  const [loadingProfit, setLoadingProfit] = useState(false);

  // Expense data
  const [expenses, setExpenses] = useState([]);
  const [productNames, setProductNames] = useState([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expForm, setExpForm] = useState({ productName: "", amount: "", date: new Date().toISOString().split("T")[0], note: "" });
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredNames, setFilteredNames] = useState([]);
  const inputRef = useRef(null);

  // Generate year options (current year - 3 to current)
  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  // ─── Fetch Profit (writing fee from documents) ───
  const fetchProfit = async () => {
    setLoadingProfit(true);
    try {
      const types = ["EC", "Nagal", "Agreement", "Deed"];
      const results = await Promise.all(
        types.map(t => fetch(`${API_BASE_URL}/api/documents?documentType=${t}`).then(r => r.json()))
      );
      const totals = {};
      types.forEach((t, i) => {
        const docs = results[i] || [];
        totals[t] = docs
          .filter(d => {
            if (!d.date) return false;
            const date = new Date(d.date);
            return date.getMonth() + 1 === selMonth && date.getFullYear() === selYear;
          })
          .reduce((sum, d) => sum + (Number(d.writingFee) || 0), 0);
      });
      setProfitData(totals);
    } catch (err) {
      console.error(err);
    }
    setLoadingProfit(false);
  };

  // ─── Fetch Expenses ───
  const fetchExpenses = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/expenses?month=${selMonth}&year=${selYear}`);
      const data = await res.json();
      setExpenses(data);
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Fetch Product Names for autocomplete ───
  const fetchProductNames = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/expenses/products`);
      const data = await res.json();
      setProductNames(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProfit();
    fetchExpenses();
    fetchProductNames();
  }, [selMonth, selYear]);

  // Handle product name input for autocomplete
  const handleProductInput = (val) => {
    setExpForm({ ...expForm, productName: val });
    if (val.trim().length > 0) {
      const matches = productNames.filter(n => n.toLowerCase().includes(val.toLowerCase()));
      setFilteredNames(matches);
      setShowDropdown(matches.length > 0);
    } else {
      setFilteredNames(productNames);
      setShowDropdown(productNames.length > 0);
    }
  };

  const handleAddExpense = async () => {
    if (!expForm.productName.trim() || !expForm.amount) return;
    try {
      await fetch(`${API_BASE_URL}/api/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...expForm, amount: parseFloat(expForm.amount) })
      });
      setExpForm({ productName: "", amount: "", date: new Date().toISOString().split("T")[0], note: "" });
      setShowAddExpense(false);
      fetchExpenses();
      fetchProductNames();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    try {
      await fetch(`${API_BASE_URL}/api/expenses/${id}`, { method: "DELETE" });
      fetchExpenses();
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Calculations ───
  const totalProfit = Object.values(profitData).reduce((a, b) => a + b, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const netProfit = totalProfit - totalExpense;

  const formatCurrency = (val) =>
    Number(val || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

  const profitModules = [
    { key: "EC", label: "EC", icon: faMapMarkedAlt, color: "#3b82f6" },
    { key: "Nagal", label: "Nagal / Adangal", icon: faFileAlt, color: "#8b5cf6" },
    { key: "Agreement", label: "Agreement", icon: faHandshake, color: "#f59e0b" },
    { key: "Deed", label: "Deed Records", icon: faFileContract, color: "#10b981" },
  ];

  return (
    <div className="layout-page">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-content">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

          .layout-page {
            --bg-main: #f4f7f6; --bg-card: #ffffff; --bg-card-hover: #f8fafc;
            --bg-input: #ffffff; --border-input: #e2e8f0; --text-primary: #0f172a;
            --text-secondary: #475569; --border-glass: #e2e8f0; --modal-bg: #ffffff;
            --icon-bg: #f1f5f9; --action-bar: rgba(255,255,255,0.95);
            --highlight: #d97706;
            --highlight-grad: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
            --btn-text: #0f172a; --shadow-main: rgba(0,0,0,0.08);
            background: var(--bg-main); min-height: 100vh;
            font-family: 'Inter', sans-serif; color: var(--text-primary);
          }
          .main-content { margin-left: 280px; padding: 40px; position: relative; z-index: 1; }
          @media (max-width: 991px) { .main-content { margin-left: 0; padding: 20px; } }
          @media (max-width: 767px) {
            .page-title { font-size: 1.6rem !important; }
            .pw-card { width: 90%; padding: 30px 24px; }
            .pw-logo-circle { width: 80px; height: 80px; font-size: 2.5rem; }
            .summary-card { padding: 20px 16px; margin-bottom: 0; }
            .summary-card h3 { font-size: 1.5rem !important; }
            .controls-bar { padding: 16px; gap: 12px !important; }
            .expense-table-wrapper { overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch; }
            .expense-table { min-width: 600px; }
            .expense-table th, .expense-table td { white-space: nowrap; }
            .profit-comparison-card { padding: 20px 16px; }
            .prog-row { flex-direction: column; gap: 20px; }
            .prog-divider { width: 100%; height: 2px; }
          }
          @media (max-width: 575px) {
            .main-content { padding: 12px; }
            .page-title { font-size: 1.3rem !important; }
            .summary-icon-wrapper { width: 44px; height: 44px; font-size: 1.2rem; }
            .add-expense-btn { width: 100%; justify-content: center; }
          }

          .page-title { font-family: 'Playfair Display', serif; font-size: 2.2rem; font-weight: 700; color: var(--highlight); letter-spacing: -0.5px; }

          /* ─── Password Gate Overlay ─── */
          .pw-gate-overlay {
            position: fixed; inset: 0; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
            display: flex; align-items: center; justify-content: center;
            z-index: 9999; font-family: 'Inter', sans-serif;
          }
          .pw-gate-overlay::before {
            content: "🔒"; position: absolute; font-size: 300px; opacity: 0.04;
            top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none;
          }
          .pw-card {
            background: rgba(255,255,255,0.04); backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.1); border-radius: 28px;
            padding: 50px 44px; width: 100%; max-width: 420px;
            box-shadow: 0 30px 60px rgba(0,0,0,0.6); position: relative; text-align: center;
          }
          .pw-lock-icon {
            width: 72px; height: 72px; border-radius: 50%;
            background: linear-gradient(135deg, rgba(251,191,36,0.15), rgba(217,119,6,0.25));
            border: 2px solid rgba(251,191,36,0.4);
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 24px; font-size: 1.8rem; color: #fbbf24;
          }
          .pw-title { font-family: 'Playfair Display', serif; font-size: 1.7rem; font-weight: 700; color: #fff; margin-bottom: 6px; }
          .pw-subtitle { color: rgba(255,255,255,0.45); font-size: 0.85rem; margin-bottom: 32px; }
          .pw-input-wrap { position: relative; margin-bottom: 12px; }
          .pw-input {
            width: 100%; background: rgba(255,255,255,0.06); border: 2px solid rgba(255,255,255,0.12);
            border-radius: 14px; padding: 15px 50px 15px 18px; color: #fff;
            font-size: 1rem; font-weight: 500; transition: 0.3s; outline: none; letter-spacing: 2px;
          }
          .pw-input::placeholder { color: rgba(255,255,255,0.3); letter-spacing: 0; }
          .pw-input:focus { border-color: #fbbf24; box-shadow: 0 0 0 4px rgba(251,191,36,0.12); background: rgba(255,255,255,0.08); }
          .pw-input.error { border-color: #ef4444; box-shadow: 0 0 0 4px rgba(239,68,68,0.12); }
          .pw-eye-btn { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; color: rgba(255,255,255,0.4); cursor: pointer; padding: 4px; font-size: 1rem; transition: 0.2s; }
          .pw-eye-btn:hover { color: #fbbf24; }
          .pw-error-msg { color: #f87171; font-size: 0.82rem; font-weight: 600; margin-bottom: 16px; min-height: 20px; }
          .pw-submit-btn {
            width: 100%; background: linear-gradient(135deg,#fbbf24,#d97706); border: none;
            border-radius: 14px; padding: 15px; font-weight: 800; color: #0f172a;
            font-size: 1rem; text-transform: uppercase; letter-spacing: 1px;
            cursor: pointer; transition: 0.3s; box-shadow: 0 8px 24px rgba(217,119,6,0.3);
          }
          .pw-submit-btn:hover { transform: translateY(-2px); box-shadow: 0 14px 30px rgba(217,119,6,0.45); }
          @keyframes shake {
            0%,100% { transform: translateX(0); }
            20% { transform: translateX(-8px); }
            40% { transform: translateX(8px); }
            60% { transform: translateX(-6px); }
            80% { transform: translateX(6px); }
          }
          .shake { animation: shake 0.45s ease; }

          .page-title { font-family: 'Playfair Display', serif; font-size: 2.2rem; font-weight: 700; color: var(--highlight); letter-spacing: -0.5px; }

          /* Month/Year Filter Bar */
          .filter-bar { background: #0f172a; border-radius: 20px; padding: 20px 28px; margin-bottom: 32px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; border: 1px solid rgba(251,191,36,0.15); box-shadow: 0 8px 32px rgba(15,23,42,0.25); }
          .filter-bar label { color: #94a3b8; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0; }
          .filter-select-dark { background: rgba(255,255,255,0.06); border: 1px solid rgba(251,191,36,0.25); border-radius: 12px; padding: 10px 16px; color: #fff; font-weight: 600; font-size: 0.95rem; cursor: pointer; transition: 0.2s; }
          .filter-select-dark:focus { outline: none; border-color: #fbbf24; box-shadow: 0 0 0 3px rgba(251,191,36,0.15); }
          .filter-select-dark option { background: #1e293b; color: #fff; }
          .period-badge { background: linear-gradient(135deg,#fbbf24,#d97706); color: #0f172a; font-weight: 800; padding: 10px 20px; border-radius: 12px; font-size: 0.9rem; letter-spacing: 0.5px; }

          /* Summary Cards */
          .summary-card { border-radius: 22px; padding: 28px 24px; position: relative; overflow: hidden; box-shadow: 0 12px 35px rgba(0,0,0,0.12); transition: transform 0.3s; }
          .summary-card:hover { transform: translateY(-5px); }
          .summary-card .s-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; opacity: 0.75; margin-bottom: 8px; }
          .summary-card .s-value { font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 700; }
          .card-profit { background: linear-gradient(135deg, #064e3b, #065f46); color: #fff; }
          .card-expense { background: linear-gradient(135deg, #7f1d1d, #991b1b); color: #fff; }
          .card-net-pos { background: linear-gradient(135deg, #1e3a5f, #1e40af); color: #fff; }
          .card-net-neg { background: linear-gradient(135deg, #7c2d12, #9a3412); color: #fff; }

          /* Section Headers */
          .section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
          .section-title { font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 700; color: var(--text-primary); }
          .section-line { flex: 1; height: 2px; background: linear-gradient(90deg, var(--border-glass), transparent); }

          /* Profit Module Cards */
          .module-card { background: #fff; border-radius: 18px; padding: 20px 24px; border: 1px solid var(--border-glass); box-shadow: 0 4px 16px rgba(0,0,0,0.06); display: flex; align-items: center; gap: 16px; transition: 0.3s; }
          .module-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.12); }
          .module-icon { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; color: #fff; flex-shrink: 0; }
          .module-label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; }
          .module-value { font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 700; color: var(--text-primary); }

          /* Expense Table */
          .expense-table-wrap { background: #fff; border-radius: 20px; border: 1px solid var(--border-glass); box-shadow: 0 4px 20px rgba(0,0,0,0.06); overflow: hidden; }
          .expense-table { width: 100%; border-collapse: collapse; }
          .expense-table thead tr { background: #0f172a; }
          .expense-table thead th { padding: 14px 20px; color: #94a3b8; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
          .expense-table tbody tr { border-bottom: 1px solid #f1f5f9; transition: 0.2s; }
          .expense-table tbody tr:last-child { border-bottom: none; }
          .expense-table tbody tr:hover { background: #f8fafc; }
          .expense-table tbody td { padding: 14px 20px; font-size: 0.9rem; color: var(--text-primary); font-weight: 500; }
          .expense-footer { background: linear-gradient(135deg,#fef3c7,#fde68a); padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(0,0,0,0.06); }

          /* Net Bar */
          .net-bar { background: #0f172a; border-radius: 20px; padding: 28px; margin-top: 32px; border: 1px solid rgba(251,191,36,0.15); }
          .net-bar-title { color: #94a3b8; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
          .progress-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
          .progress-label { color: #fff; font-size: 0.85rem; font-weight: 600; width: 80px; flex-shrink: 0; }
          .progress-track { flex: 1; background: rgba(255,255,255,0.08); border-radius: 50px; height: 10px; overflow: hidden; }
          .progress-fill { height: 100%; border-radius: 50px; }
          .progress-amount { color: #fff; font-size: 0.85rem; font-weight: 700; width: 120px; text-align: right; flex-shrink: 0; }

          /* Add Expense FAB */
          .fab-btn { background: var(--highlight-grad); border: none; border-radius: 16px; padding: 14px 28px; font-weight: 700; color: #0f172a; font-size: 0.95rem; box-shadow: 0 8px 24px rgba(217,119,6,0.3); transition: 0.3s; display: inline-flex; align-items: center; gap: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
          .fab-btn:hover { transform: translateY(-3px); box-shadow: 0 12px 30px rgba(217,119,6,0.45); }

          /* Modal */
          .expense-modal .modal-content { border-radius: 24px; border: none; box-shadow: 0 25px 50px rgba(0,0,0,0.25); overflow: visible; }
          .expense-modal .modal-header { background: linear-gradient(135deg,#0f172a,#1e293b); border-radius: 24px 24px 0 0; border: none; padding: 24px 32px; color: white; }
          .expense-modal .modal-title { font-family: 'Playfair Display', serif; font-weight: 700; font-size: 1.4rem; }
          .expense-modal .btn-close { filter: invert(1); opacity: 0.8; }
          .expense-modal .modal-body { padding: 28px 32px; }
          .form-label-modern { font-weight: 600; color: #475569; font-size: 0.87rem; margin-bottom: 6px; }
          .form-control-modern { border-radius: 12px; border: 2px solid #e2e8f0; background: #f8fafc; padding: 12px 16px; font-size: 0.95rem; font-weight: 500; color: #1e293b; }
          .form-control-modern:focus { border-color: #fbbf24; outline: none; background: #fff; box-shadow: 0 0 0 4px rgba(251,191,36,0.15); }

          /* Autocomplete dropdown */
          .autocomplete-wrap { position: relative; }
          .autocomplete-list { position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); z-index: 9999; max-height: 180px; overflow-y: auto; margin-top: 4px; }
          .autocomplete-item { padding: 10px 16px; cursor: pointer; font-size: 0.9rem; font-weight: 500; transition: 0.15s; }
          .autocomplete-item:hover { background: #fef3c7; color: #92400e; }

          .del-btn { width: 32px; height: 32px; border-radius: 50%; border: none; background: #fee2e2; color: #ef4444; display: inline-flex; align-items: center; justify-content: center; font-size: 0.8rem; transition: 0.2s; cursor: pointer; }
          .del-btn:hover { background: #ef4444; color: #fff; }

          @media print {
            .sidebar, .filter-bar, .fab-btn { display: none !important; }
            .main-content { margin-left: 0 !important; padding: 0 !important; }
          }
        `}</style>

        {/* ─── PASSWORD GATE ─── */}
        {!isUnlocked && (
          <div className="pw-gate-overlay">
            <motion.div
              className="pw-card"
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
            >
              <div className="pw-lock-icon">
                <FontAwesomeIcon icon={faLock} />
              </div>
              <div className="pw-title">Restricted Access</div>
              <div className="pw-subtitle">Enter your password to view Profit & Expense Logs</div>

              <div className={`pw-input-wrap ${shaking ? "shake" : ""}`}>
                <input
                  className={`pw-input ${pwError ? "error" : ""}`}
                  type={showPw ? "text" : "password"}
                  placeholder="Enter password"
                  value={pwInput}
                  onChange={e => { setPwInput(e.target.value); setPwError(false); }}
                  onKeyDown={e => e.key === "Enter" && handleUnlock()}
                  autoFocus
                />
                <button className="pw-eye-btn" tabIndex={-1} onClick={() => setShowPw(p => !p)}>
                  <FontAwesomeIcon icon={showPw ? faEyeSlash : faEye} />
                </button>
              </div>

              <div className="pw-error-msg">
                {pwError ? "❌ Incorrect password. Please try again." : ""}
              </div>

              <button className="pw-submit-btn" onClick={handleUnlock}>
                <FontAwesomeIcon icon={faShieldAlt} className="me-2" /> Unlock
              </button>
            </motion.div>
          </div>
        )}

        {/* ─── MAIN PAGE (shown only after unlock) ─── */}
        {isUnlocked && (
          <>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="page-title mb-1">Profit & Expense Logs</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: 0 }}>Track writing fee income and operational expenses</p>
          </div>
          <button className="fab-btn" onClick={() => setShowAddExpense(true)}>
            <FontAwesomeIcon icon={faPlus} /> Add Expense
          </button>
        </div>

        {/* Month / Year Filter */}
        <div className="filter-bar mb-4">
          <FontAwesomeIcon icon={faCalendarAlt} style={{ color: "#fbbf24", fontSize: "1.1rem" }} />
          <div>
            <label className="d-block">Month</label>
            <select className="filter-select-dark" value={selMonth} onChange={e => setSelMonth(Number(e.target.value))}>
              {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="d-block">Year</label>
            <select className="filter-select-dark" value={selYear} onChange={e => setSelYear(Number(e.target.value))}>
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="ms-auto period-badge">
            {MONTH_NAMES[selMonth - 1]} {selYear}
          </div>
        </div>

        <motion.div variants={containerVariants} initial="hidden" animate="visible">

          {/* ═══ SUMMARY CARDS ═══ */}
          <motion.div variants={itemVariants}>
            <Row className="g-3 mb-4">
              <Col md={4}>
                <div className="summary-card card-profit">
                  <div className="s-label"><FontAwesomeIcon icon={faArrowTrendUp} className="me-2" />Total Profit (Writing Fee)</div>
                  <div className="s-value">{formatCurrency(totalProfit)}</div>
                </div>
              </Col>
              <Col md={4}>
                <div className="summary-card card-expense">
                  <div className="s-label"><FontAwesomeIcon icon={faArrowTrendDown} className="me-2" />Total Expenses</div>
                  <div className="s-value">{formatCurrency(totalExpense)}</div>
                </div>
              </Col>
              <Col md={4}>
                <div className={`summary-card ${netProfit >= 0 ? "card-net-pos" : "card-net-neg"}`}>
                  <div className="s-label"><FontAwesomeIcon icon={faBalanceScale} className="me-2" />Net Profit / Loss</div>
                  <div className="s-value">{netProfit >= 0 ? "+" : ""}{formatCurrency(netProfit)}</div>
                </div>
              </Col>
            </Row>
          </motion.div>

          {/* ═══ PROFIT SECTION ═══ */}
          <motion.div variants={itemVariants} className="mb-4">
            <div className="section-header">
              <FontAwesomeIcon icon={faChartLine} style={{ color: "#10b981", fontSize: "1.2rem" }} />
              <span className="section-title">Writing Fee Income (Profit)</span>
              <div className="section-line" />
              {loadingProfit && <FontAwesomeIcon icon={faSyncAlt} spin style={{ color: "#94a3b8" }} />}
            </div>
            <Row className="g-3">
              {profitModules.map(m => (
                <Col md={6} key={m.key}>
                  <motion.div variants={itemVariants}>
                    <div className="module-card">
                      <div className="module-icon" style={{ background: m.color }}>
                        <FontAwesomeIcon icon={m.icon} />
                      </div>
                      <div>
                        <div className="module-label">{m.label}</div>
                        <div className="module-value">{formatCurrency(profitData[m.key] || 0)}</div>
                      </div>
                      <div className="ms-auto">
                        <Badge style={{ background: m.color, borderRadius: "8px", padding: "6px 12px", fontSize: "0.75rem" }}>
                          Writing Fee
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                </Col>
              ))}
            </Row>
          </motion.div>

          {/* ═══ EXPENSE SECTION ═══ */}
          <motion.div variants={itemVariants} className="mb-4">
            <div className="section-header">
              <FontAwesomeIcon icon={faReceipt} style={{ color: "#ef4444", fontSize: "1.2rem" }} />
              <span className="section-title">Expenses</span>
              <div className="section-line" />
              <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem", fontWeight: 600 }}>
                {expenses.length} entries
              </span>
            </div>

            <div className="expense-table-wrap">
              {expenses.length === 0 ? (
                <div className="text-center py-5" style={{ color: "var(--text-secondary)" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>📋</div>
                  <div style={{ fontWeight: 600 }}>No expenses recorded for {MONTH_NAMES[selMonth - 1]} {selYear}</div>
                  <div style={{ fontSize: "0.85rem", marginTop: 6 }}>Click "Add Expense" to log one</div>
                </div>
              ) : (
                <>
                  <div className="expense-table-wrapper">
                    <table className="expense-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Date</th>
                          <th>Product / Description</th>
                          <th>Note</th>
                          <th style={{ textAlign: "right" }}>Amount</th>
                          <th style={{ textAlign: "center" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                          {expenses.map((exp, idx) => (
                            <motion.tr key={exp._id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              transition={{ delay: idx * 0.04 }}
                            >
                              <td style={{ color: "var(--text-secondary)" }}>{idx + 1}</td>
                              <td>{new Date(exp.date).toLocaleDateString("en-GB")}</td>
                              <td style={{ fontWeight: 600 }}>{exp.productName}</td>
                              <td style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{exp.note || "—"}</td>
                              <td style={{ textAlign: "right", fontWeight: 700, color: "#ef4444" }}>
                                ₹{Number(exp.amount || 0).toLocaleString()}
                              </td>
                              <td style={{ textAlign: "center" }}>
                                <button className="del-btn" onClick={() => handleDeleteExpense(exp._id)}>
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                  <div className="expense-footer">
                    <span style={{ fontWeight: 700, color: "#92400e" }}>
                      Total Expenses — {MONTH_NAMES[selMonth - 1]} {selYear}
                    </span>
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", fontWeight: 700, color: "#7f1d1d" }}>
                      {formatCurrency(totalExpense)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* ═══ COMPARISON BAR ═══ */}
          <motion.div variants={itemVariants}>
            <div className="net-bar">
              <div className="net-bar-title"><FontAwesomeIcon icon={faCoins} className="me-2" />Profit vs Expense Comparison — {MONTH_NAMES[selMonth - 1]} {selYear}</div>
              {(() => {
                const max = Math.max(totalProfit, totalExpense, 1);
                return (
                  <>
                    <div className="progress-row">
                      <span className="progress-label" style={{ color: "#10b981" }}>Profit</span>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${(totalProfit / max) * 100}%`, background: "linear-gradient(90deg,#10b981,#059669)" }} />
                      </div>
                      <span className="progress-amount" style={{ color: "#10b981" }}>{formatCurrency(totalProfit)}</span>
                    </div>
                    <div className="progress-row">
                      <span className="progress-label" style={{ color: "#ef4444" }}>Expense</span>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${(totalExpense / max) * 100}%`, background: "linear-gradient(90deg,#ef4444,#dc2626)" }} />
                      </div>
                      <span className="progress-amount" style={{ color: "#ef4444" }}>{formatCurrency(totalExpense)}</span>
                    </div>
                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#94a3b8", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px" }}>
                        Net Result
                      </span>
                      <span style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: "1.8rem", fontWeight: 700,
                        color: netProfit >= 0 ? "#10b981" : "#ef4444"
                      }}>
                        {netProfit >= 0 ? "+" : ""}{formatCurrency(netProfit)}
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
          </motion.div>

        </motion.div>

        {/* ═══ ADD EXPENSE MODAL ═══ */}
        <AnimatePresence>
          {showAddExpense && (
            <Modal show={showAddExpense} onHide={() => setShowAddExpense(false)} centered className="expense-modal" backdrop="static">
              <Modal.Header closeButton>
                <Modal.Title><FontAwesomeIcon icon={faPlus} className="me-2 text-warning" />Add Expense</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form>
                  <Row className="g-3">
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="form-label-modern">Product / Description *</Form.Label>
                        <div className="autocomplete-wrap" ref={inputRef}>
                          <Form.Control
                            type="text"
                            className="form-control-modern"
                            placeholder="e.g. Office Rent, Printer Ink..."
                            value={expForm.productName}
                            onChange={e => handleProductInput(e.target.value)}
                            onFocus={() => {
                              setFilteredNames(productNames);
                              if (productNames.length > 0) setShowDropdown(true);
                            }}
                            onBlur={() => setTimeout(() => setShowDropdown(false), 180)}
                            autoComplete="off"
                          />
                          {showDropdown && (
                            <div className="autocomplete-list">
                              {filteredNames.map((name, i) => (
                                <div key={i} className="autocomplete-item"
                                  onMouseDown={() => {
                                    setExpForm({ ...expForm, productName: name });
                                    setShowDropdown(false);
                                  }}
                                >
                                  {name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="form-label-modern">Amount (₹) *</Form.Label>
                        <Form.Control type="number" className="form-control-modern" placeholder="0" value={expForm.amount} onChange={e => setExpForm({ ...expForm, amount: e.target.value })} />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="form-label-modern">Date *</Form.Label>
                        <Form.Control type="date" className="form-control-modern" value={expForm.date} onChange={e => setExpForm({ ...expForm, date: e.target.value })} />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="form-label-modern">Note (optional)</Form.Label>
                        <Form.Control type="text" className="form-control-modern" placeholder="Additional details..." value={expForm.note} onChange={e => setExpForm({ ...expForm, note: e.target.value })} />
                      </Form.Group>
                    </Col>
                  </Row>
                </Form>
              </Modal.Body>
              <Modal.Footer className="border-0 px-4 pb-4">
                <Button variant="light" className="px-4 py-2 border" onClick={() => setShowAddExpense(false)} style={{ borderRadius: "12px", fontWeight: 600 }}>Cancel</Button>
                <button className="fab-btn py-2 px-4" onClick={handleAddExpense} style={{ textTransform: "none", letterSpacing: 0, fontSize: "0.95rem" }}>
                  <FontAwesomeIcon icon={faPlus} className="me-2" /> Save Expense
                </button>
              </Modal.Footer>
            </Modal>
          )}
        </AnimatePresence>

        </>
        )}

      </div>
    </div>
  );
};

export default Logs;

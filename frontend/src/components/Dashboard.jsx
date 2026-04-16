import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Row, Col, Card, Badge, Button, Nav } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapMarkedAlt,
  faFileAlt,
  faFolderOpen,
  faUserFriends,
  faChartLine,
  faChartBar,
  faChartPie,
  faWallet,
  faCalendarAlt,
  faMoneyCheckAlt,
  faClock,
  faCheckCircle,
  faArrowRight,
  faExclamationTriangle,
  faTasks,
  faMoneyBillWave,
  faBell
} from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";
import API_BASE_URL from "../config";

// Animation Variants
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } } };
const barVariants = { hidden: { height: 0 }, visible: (custom) => ({ height: custom, transition: { duration: 0.8, type: "spring", bounce: 0.3 } }) };

const Dashboard = () => {
  const [activityTab, setActivityTab] = useState("all");
  const [dashboardSummary, setDashboardSummary] = useState([
    { title: "Today Collection", value: 0, increase: "Live", icon: faCheckCircle, accent: "#10b981", prefix: "₹" },
    { title: "This Month Collection", value: 0, increase: "Live", icon: faWallet, accent: "#3b82f6", prefix: "₹" },
    { title: "Total Pending Amount", value: 0, increase: "Live", icon: faExclamationTriangle, accent: "#ef4444", prefix: "₹" }
  ]);
  const [recentActionsData, setRecentActionsData] = useState({ all: [], payments: [], documents: [] });
  const [pendingTasksState, setPendingTasksState] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [distributionData, setDistributionData] = useState([
    { label: "Sale Deeds", value: 0, color: "#f59e0b" },
    { label: "EC Records", value: 0, color: "#10b981" },
    { label: "Agreements", value: 0, color: "#0ea5e9" },
    { label: "Nagal/Adangal", value: 0, color: "#6366f1" }
  ]);

  // Insights State
  const [allDocs, setAllDocs] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [insightsData, setInsightsData] = useState({
    ec: 0, nagal: 0, agreement: 0, deed: 0,
    total: 0,
    topCollectors: []
  });

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const shortMonthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [clientsRes, docsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/clients`),
          fetch(`${API_BASE_URL}/api/documents`)
        ]);
        const clients = await clientsRes.json();
        const docs = await docsRes.json();
        setAllDocs(docs);
        
        const now = new Date();
        const currentMonthIdx = now.getMonth();
        const currentYear = now.getFullYear();

        let todaySum = 0;
        let monthSum = 0;
        let pendingSum = 0;

        docs.forEach(d => {
          pendingSum += (Number(d.totalFee) || 0) - (Number(d.received) || 0);
          
          const docDateObj = new Date(d.date);
          const isDocToday = docDateObj.getDate() === now.getDate() && 
                             docDateObj.getMonth() === now.getMonth() && 
                             docDateObj.getFullYear() === now.getFullYear();

          const isDocThisMonth = docDateObj.getMonth() === currentMonthIdx && docDateObj.getFullYear() === currentYear;

          // 1. Process Individual Payments
          if (d.payments && d.payments.length > 0) {
            d.payments.forEach(p => {
              const pDate = new Date(p.date || d.date);
              const isPDateToday = pDate.getDate() === now.getDate() && 
                                   pDate.getMonth() === now.getMonth() && 
                                   pDate.getFullYear() === now.getFullYear();
              
              if (isPDateToday) {
                todaySum += Number(p.amount || 0);
              }
              if (pDate.getMonth() === currentMonthIdx && pDate.getFullYear() === currentYear) {
                monthSum += Number(p.amount || 0);
              }
            });
          } else {
            // 2. Fallback for docs without individual payment items (Legacy/Direct)
            if (isDocToday) {
              todaySum += Number(d.received || 0);
            }
            if (isDocThisMonth) {
              monthSum += Number(d.received || 0);
            }
          }
        });

        setDashboardSummary([
          { title: "Today Collection", value: todaySum, increase: "Real-time", icon: faCheckCircle, accent: "#10b981", prefix: "₹" },
          { title: "This Month Collection", value: monthSum, increase: "Real-time", icon: faWallet, accent: "#3b82f6", prefix: "₹" },
          { title: "Total Pending Amount", value: pendingSum, increase: "Real-time", icon: faExclamationTriangle, accent: "#ef4444", prefix: "₹" }
        ]);

        // Computing Action Logs
        const sortedDocs = [...docs].sort((a,b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
        
        const mapDocToAction = (d, isPayment) => {
           let actionText = isPayment ? `Payment of ₹${(d.received||0).toLocaleString()} received for ${d.recordNo||d.documentType}` : `New ${d.documentType} record ${d.recordNo||''} registered`;
           let iconType = isPayment ? 'success' : (d.documentType==='Agreement'?'primary':(d.status==='Pending'?'warning':'info'));
           return {
             time: new Date(d.createdAt || d.date).toLocaleDateString(),
             action: actionText,
             user: d.customerName || d.vendor || "Unknown",
             type: iconType
           };
        };

        const allActions = sortedDocs.slice(0, 15).map(d => mapDocToAction(d, false));
        const paymentActions = sortedDocs.filter(d => d.received > 0).slice(0, 15).map(d => mapDocToAction(d, true));
        const docActions = sortedDocs.slice(0, 15).map(d => mapDocToAction(d, false));

        setRecentActionsData({ all: allActions, payments: paymentActions, documents: docActions });

        // Computing Pending Tasks
        const pendingArray = sortedDocs.filter(d => d.status === 'Pending').slice(0, 10).map((d, i) => ({
          id: d._id || i,
          doc: d.recordNo || d.documentType,
          desc: `Client: ${d.customerName || d.vendor || 'Unknown'}`,
          priority: (d.totalFee - (d.received||0)) > 5000 ? "High" : "Medium"
        }));
        setPendingTasksState(pendingArray);

        const typeCounts = docs.reduce((acc, doc) => {
           acc[doc.documentType] = (acc[doc.documentType] || 0) + 1;
           return acc;
        }, {});
        const totalDocs = docs.length || 1;
        
        setDistributionData([
          { label: "Sale Deeds", value: Math.round(((typeCounts['Deed'] || 0) / totalDocs) * 100) || 0, color: "#f59e0b" },
          { label: "EC Records", value: Math.round(((typeCounts['EC'] || 0) / totalDocs) * 100) || 0, color: "#10b981" },
          { label: "Agreements", value: Math.round(((typeCounts['Agreement'] || 0) / totalDocs) * 100) || 0, color: "#0ea5e9" },
          { label: "Nagal/Adangal", value: Math.round(((typeCounts['Nagal'] || 0) / totalDocs) * 100) || 0, color: "#6366f1" }
        ]);

        const monthlyRev = {};
        docs.forEach(d => {
           if (d.date) {
             const dDate = new Date(d.date);
             const key = `${dDate.getFullYear()}-${dDate.getMonth()}`;
             monthlyRev[key] = (monthlyRev[key] || 0) + (d.received || 0);
           }
        });
        
        const revData = [];
        const currentM = new Date().getMonth();
        const currentY = new Date().getFullYear();
        for (let i = 11; i >= 0; i--) {
           let targetMonth = currentM - i;
           let targetYear = currentY;
           if (targetMonth < 0) {
             targetMonth += 12;
             targetYear -= 1;
           }
           const key = `${targetYear}-${targetMonth}`;
           const val = monthlyRev[key] || 0;
           revData.push({
             month: shortMonthNames[targetMonth],
             rev: val > 0 ? Math.max((val / 100000) * 10, 5) : 2,
             label: `₹${val.toLocaleString()}`
           });
        }
        setRevenueData(revData);
        
      } catch (err) {
        console.error(err);
      }
    };
    fetchDashboardData();
  }, []);

  // Recalculate Insights when filter or docs change
  useEffect(() => {
    if (allDocs.length === 0) return;

    const filteredDocs = allDocs.filter(d => {
      const dDate = new Date(d.date);
      return dDate.getMonth() === selectedMonth && dDate.getFullYear() === selectedYear;
    });

    const breakdown = { EC: 0, Nagal: 0, Agreement: 0, Deed: 0 };
    const collectorsMap = {};

    filteredDocs.forEach(d => {
      const type = d.documentType;
      const amt = Number(d.received || 0);
      if (breakdown.hasOwnProperty(type)) {
        breakdown[type] += amt;
      }

      if (amt > 0) {
        let key, name, category;
        if (d.vendor) {
          key = `v_${d.vendor}`;
          name = d.vendor;
          category = 'Vendor';
        } else {
          const cName = d.customerName || "Direct Client";
          key = `c_${cName}`;
          name = cName;
          category = 'Customer';
        }

        if (!collectorsMap[key]) {
          collectorsMap[key] = { name, category, amount: 0 };
        }
        collectorsMap[key].amount += amt;
      }
    });

    const allCollectors = Object.values(collectorsMap)
      .sort((a, b) => b.amount - a.amount);

    setInsightsData({
      ec: breakdown.EC,
      nagal: breakdown.Nagal,
      agreement: breakdown.Agreement,
      deed: breakdown.Deed,
      total: breakdown.EC + breakdown.Nagal + breakdown.Agreement + breakdown.Deed,
      topCollectors: allCollectors
    });
  }, [allDocs, selectedMonth, selectedYear]);

  const getThemeVars = () => {
    return `
      --bg-main: #f4f7f6;
      --bg-card: #ffffff;
      --bg-card-hover: #f8fafc;
      --bg-input: #f8fafc;
      --border-input: #e2e8f0;
      --text-primary: #0f172a;
      --text-secondary: #475569;
      --border-glass: #e2e8f0;
      --highlight: #d97706;
      --highlight-grad: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
      --shadow-main: rgba(0,0,0,0.08);
      --icon-bg: #f1f5f9;
    `;
  };

  const getStatusBadge = (priority) => {
    const config = priority === "High" ? { bg: "#ef4444", text: "HIGH" } 
                 : priority === "Medium" ? { bg: "#f59e0b", text: "MED" } 
                 : { bg: "#3b82f6", text: "LOW" };
    return (
      <Badge style={{ background: config.bg, padding: "4px 8px", borderRadius: "8px", fontSize: "0.7rem", fontWeight: "700" }}>
        {config.text}
      </Badge>
    );
  };

  return (
    <div className="layout-page main-content dashboard-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
        
        .dashboard-shell {
          ${getThemeVars()}
          font-family: 'Inter', sans-serif;
          background: var(--bg-main);
          min-height: 100vh;
          margin-left: 280px;
          padding: 40px;
          position: relative;
          color: var(--text-primary);
          overflow-x: hidden;
        }

        .ambient-shape {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          z-index: 0;
          pointer-events: none;
        }
        .shape-1 { top: -100px; right: -50px; width: 400px; height: 400px; background: rgba(251, 191, 36, 0.08); animation: float 10s ease-in-out infinite; }
        .shape-2 { bottom: -150px; left: -100px; width: 500px; height: 500px; background: rgba(14, 165, 233, 0.05); animation: float 14s ease-in-out infinite reverse; }

        @keyframes float { 0% { transform: translate(0, 0); } 50% { transform: translate(20px, 30px); } 100% { transform: translate(0, 0); } }

        .page-header { margin-bottom: 24px; position:relative; z-index:1; }
        .page-title { font-family: 'Playfair Display', serif; font-size: 2.6rem; font-weight: 700; color: var(--highlight); margin-bottom: 8px; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }

        .glass-card {
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(16px);
          border-radius: 24px;
          border: 1px solid var(--border-glass);
          box-shadow: 0 15px 40px var(--shadow-main);
          position: relative;
          overflow: hidden;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .glass-card:hover { transform: translateY(-4px); box-shadow: 0 20px 50px rgba(0,0,0,0.12); }

        .stat-card {
          background: linear-gradient(145deg, #0f172a, #1e293b);
          border-radius: 20px; padding: 24px 20px; textAlign: left; position: relative; overflow: hidden;
          box-shadow: 0 15px 35px rgba(15,23,42,0.25); color: white; border: 1px solid rgba(255,255,255,0.08);
          transition: all 0.4s ease;
        }
        .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: var(--highlight-grad); transform: scaleX(0); transform-origin: left; transition: transform 0.4s ease; }
        .stat-card:hover { transform: translateY(-6px); box-shadow: 0 25px 45px rgba(15,23,42,0.4); }
        .stat-card:hover::before { transform: scaleX(1); }

        .stat-icon-wrapper { width: 48px; height: 48px; border-radius: 14px; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.05); transition: all 0.3s ease; }
        .stat-card:hover .stat-icon-wrapper { background: rgba(251,191,36,0.2); transform: scale(1.1) rotate(5deg); border-color: rgba(251,191,36,0.3); }
        
        .stat-number { font-family: 'Playfair Display', serif; font-size: 2.2rem; font-weight: 700; color: #ffffff; margin-bottom: 4px; line-height: 1; }
        .stat-label { font-size: 0.9rem; color: #94a3b8; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }
        .stat-increase { font-size: 0.8rem; color: #10b981; font-weight: 600; margin-top: 8px; display: inline-flex; align-items: center; gap: 4px; background: rgba(16,185,129,0.1); padding: 4px 8px; border-radius: 6px; }

        .card-header-styled { padding: 24px 24px 16px; border-bottom: 1px solid var(--border-glass); display: flex; justify-content: space-between; align-items: center; }
        .card-header-styled h4 { margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--text-primary); }
        .card-header-styled small { color: var(--text-secondary); font-weight: 500; font-size: 0.85rem;}

        .bar-chart-container { display: flex; align-items: flex-end; justify-content: space-between; height: 260px; padding: 30px; gap: 8px; }
        .bar-wrapper { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 12px; position: relative; height: 100%; justify-content: flex-end; }
        .bar-track { width: 100%; max-width: 25px; height: 100%; background: var(--bg-input); border-radius: 10px; position: relative; overflow: hidden; }
        .bar-fill { position: absolute; bottom: 0; left: 0; width: 100%; background: var(--highlight-grad); border-radius: 10px; transition: filter 0.3s; cursor: pointer;}
        .bar-fill:hover { filter: brightness(1.15); }
        .bar-label { font-size: 0.7rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; }
        .bar-tooltip { position: absolute; top: -35px; background: #0f172a; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; opacity: 0; transform: translateY(10px); transition: 0.2s ease; pointer-events: none; z-index: 100; white-space: nowrap;}
        .bar-wrapper:hover .bar-tooltip { opacity: 1; transform: translateY(0); }

        .dist-item { margin-bottom: 20px; }
        .dist-item-header { display: flex; justify-content: space-between; font-size: 0.9rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; }
        .dist-track { height: 10px; background: var(--bg-input); border-radius: 999px; overflow: hidden; }
        .dist-fill { height: 100%; border-radius: 999px; }

        .activity-nav { display: flex; gap: 10px; margin-bottom: 20px; padding: 0 24px;}
        .activity-tab { padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); background: transparent; border: 1px solid var(--border-glass); cursor: pointer; transition: 0.3s; }
        .activity-tab.active { background: #0f172a; color: white; border-color: #0f172a; }
        .activity-tab:hover:not(.active) { background: var(--bg-input); }

        .activity-list { padding: 0 24px 24px; height: 320px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--highlight) transparent; }
        .activity-item { display: flex; align-items: flex-start; gap: 16px; padding: 18px 0; border-bottom: 1px dashed var(--border-glass); transition: 0.2s ease; }
        .activity-item:hover { transform: translateX(4px); background: rgba(0,0,0,0.01); border-radius: 12px; padding: 18px 12px; margin: 0 -12px; border-bottom-color: transparent;}
        .activity-item:last-child { border-bottom: none; }
        
        .activity-icon-wrapper { width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; font-size: 1.1rem; flex-shrink: 0; box-shadow: 0 4px 10px rgba(0,0,0,0.05);}
        .icon-success { background: linear-gradient(135deg, #d1fae5, #a7f3d0); color: #059669; }
        .icon-primary { background: linear-gradient(135deg, #e0e7ff, #c7d2fe); color: #4338ca; }
        .icon-warning { background: linear-gradient(135deg, #fef3c7, #fde68a); color: #d97706; }
        .icon-info { background: linear-gradient(135deg, #e0f2fe, #bae6fd); color: #0284c7; }

        .activity-title { font-weight: 600; color: var(--text-primary); margin-bottom: 4px; font-size: 0.95rem; line-height: 1.4; }
        .activity-time { color: var(--text-secondary); font-size: 0.8rem; font-weight: 500; display: flex; align-items: center; gap: 6px; }

        .task-list-container { height: 320px; overflow-y: auto; padding: 0 24px 24px; scrollbar-width: thin; scrollbar-color: var(--highlight) transparent;}
        .task-item { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; margin-bottom: 12px; border-radius: 14px; border: 1px solid var(--border-glass); background: #ffffff; transition: 0.2s ease; cursor: pointer; }
        .task-item:hover { border-color: var(--highlight); box-shadow: 0 4px 15px rgba(217,119,6,0.1); transform: translateY(-2px); }

        /* Insight Section Styles */
        .insight-card { padding: 30px; }
        .insight-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .insight-box { background: var(--bg-input); padding: 20px; border-radius: 18px; border: 1px solid var(--border-glass); transition: 0.3s; }
        .insight-box:hover { background: white; border-color: #d97706; box-shadow: 0 10px 25px rgba(217,119,6,0.08); }
        .insight-box-label { font-size: 0.8rem; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 8px; }
        .insight-box-value { font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 700; color: #0f172a; }
        
        .leaderboard-item { display: flex; align-items: center; gap: 15px; padding: 15px; background: white; border-radius: 15px; margin-bottom: 12px; border: 1px solid var(--border-glass); position: relative; overflow: hidden;}
        .leaderboard-rank { width: 35px; height: 35px; border-radius: 50%; display: grid; place-items: center; font-weight: 800; font-size: 0.9rem; flex-shrink: 0; }
        .rank-1 { background: #fef3c7; color: #d97706; border: 2px solid #fbbf24; }
        .rank-2 { background: #f1f5f9; color: #64748b; border: 2px solid #cbd5e1; }
        .rank-3 { background: #fff7ed; color: #c2410c; border: 2px solid #fdba74; }
        .rank-default { background: #f8fafc; color: #94a3b8; border: 1px solid #e2e8f0; }

        .leaderboard-container {
           max-height: 380px; 
           overflow-y: auto; 
           padding-right: 10px;
           scrollbar-width: thin; 
           scrollbar-color: #d97706 transparent;
        }
        
        .custom-select {
          padding: 8px 16px; border-radius: 10px; border: 1px solid var(--border-glass); background: white; font-weight: 600; font-size: 0.9rem; color: #0f172a; outline: none; transition: 0.3s;
        }
        .custom-select:focus { border-color: #d97706; box-shadow: 0 0 0 3px rgba(217,119,6,0.1); }

        @media (max-width: 991px) {
          .dashboard-shell { margin-left: 0; padding: 20px; }
        }
        @media (max-width: 767px) {
          .page-title { font-size: 1.7rem !important; }
          .stat-number { font-size: 1.6rem !important; }
          .stat-card { padding: 18px 14px; }
          .bar-chart-container { height: 160px; padding: 16px 8px; gap: 4px; }
          .bar-label { font-size: 0.6rem; }
          .activity-nav { flex-wrap: wrap; gap: 6px; padding: 0 16px; }
          .activity-tab { font-size: 0.78rem; padding: 5px 10px; }
          .activity-list, .task-list-container { height: 240px; padding: 0 16px 16px; }
          .card-header-styled { padding: 16px 16px 12px; }
          .card-header-styled h4 { font-size: 1rem; }
          .insight-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
          .insight-box { padding: 14px; }
          .insight-box-value { font-size: 1.2rem; }
          .leaderboard-item { padding: 10px 12px; gap: 10px; }
          .insight-card { padding: 18px; }
          .custom-select { padding: 6px 10px; font-size: 0.82rem; }
        }
        @media (max-width: 575px) {
          .dashboard-shell { padding: 12px; }
          .page-title { font-size: 1.3rem !important; }
          .stat-number { font-size: 1.2rem !important; }
          .stat-card { padding: 14px 12px; }
          .insight-grid { grid-template-columns: 1fr; }
          .bar-chart-container { height: 120px; padding: 10px 4px; gap: 2px; }
          .bar-label { font-size: 0.55rem; }
          .leaderboard-rank { width: 28px; height: 28px; font-size: 0.75rem; }
        }
      `}</style>
      
      <div className="ambient-shape shape-1"></div>
      <div className="ambient-shape shape-2"></div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{position: 'relative', zIndex: 1}}>
        <div className="page-header d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h2 className="page-title">Workspace Dashboard</h2>
            <p style={{color:'var(--text-secondary)', fontSize: '1.05rem'}} className="mb-0">Unified law operations, billing analytics, and performance tracking.</p>
          </div>
          <div className="d-flex gap-3">
            {/* <Button variant="light" style={{borderRadius: '12px', padding: '12px 20px', fontWeight: 600, border: '1px solid var(--border-glass)', background: 'white', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 10px rgba(0,0,0,0.05)'}}>
              <FontAwesomeIcon icon={faBell} style={{color: '#d97706'}} /> Notifications <Badge bg="danger" style={{borderRadius: '50%'}}>3</Badge>
            </Button> */}
            <Button style={{background: 'var(--highlight-grad)', borderRadius: '12px', padding: '12px 24px', fontWeight: 600, border: 'none', boxShadow: '0 8px 20px rgba(217,119,6,0.2)'}}>
              <FontAwesomeIcon icon={faCalendarAlt} className="me-2" /> {new Date().toLocaleDateString('en-GB')}
            </Button>
          </div>
        </div>

        <Row className="g-4 mb-5 mt-2">
          {dashboardSummary.map((metric) => (
            <Col xl={4} lg={4} md={12} key={metric.title}>
              <motion.div variants={itemVariants}>
                <div className="stat-card">
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                    <div>
                      <div className="stat-number">{metric.prefix || ''}{metric.value?.toLocaleString('en-IN') || 0}</div>
                      <div className="stat-label">{metric.title}</div>
                    </div>
                    <div className="stat-icon-wrapper">
                      <FontAwesomeIcon icon={metric.icon} style={{color: metric.accent, fontSize: '1.2rem'}} />
                    </div>
                  </div>
                  <div className="stat-increase">{metric.increase}</div>
                </div>
              </motion.div>
            </Col>
          ))}
        </Row>

        <Row className="g-4 mb-5">
          <Col xl={8} lg={12}>
            <motion.div variants={itemVariants} className="h-100">
              <div className="glass-card h-100 d-flex flex-column">
                <div className="card-header-styled">
                  <div>
                    <h4>Revenue Intake Trend</h4>
                    <small>Monthly payment realizations (Last 1 Year)</small>
                  </div>
                  <Badge bg="light" text="dark" style={{fontWeight: 700, padding: "8px 12px", border: "1px solid var(--border-glass)", borderRadius: "10px"}}>12 Months Trend</Badge>
                </div>
                <div className="bar-chart-container">
                  {revenueData.map((data, index) => (
                    <div className="bar-wrapper" key={index}>
                      <div className="bar-tooltip">{data.label}</div>
                      <div className="bar-track">
                        <motion.div 
                          className="bar-fill"
                          variants={barVariants}
                          custom={`${(data.rev / 30) * 100}%`}
                        />
                      </div>
                      <div className="bar-label">{data.month}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </Col>

          <Col xl={4} lg={12}>
            <motion.div variants={itemVariants} className="h-100">
              <div className="glass-card h-100 d-flex flex-column">
                <div className="card-header-styled">
                  <div>
                    <h4>Record Distribution</h4>
                    <small>Volume by document type</small>
                  </div>
                  <FontAwesomeIcon icon={faChartPie} style={{color: '#d97706', fontSize: '1.2rem'}} />
                </div>
                
                <div style={{padding: '30px 24px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                  {distributionData.map((item, index) => (
                    <div className="dist-item" key={index}>
                      <div className="dist-item-header">
                        <span style={{display: 'flex', alignItems: 'center', gap: 8}}>
                          <span style={{width: 10, height: 10, borderRadius: '50%', background: item.color}}></span>
                          {item.label}
                        </span>
                        <span>{item.value}%</span>
                      </div>
                      <div className="dist-track">
                        <motion.div 
                          className="dist-fill" 
                          initial={{ width: 0 }}
                          animate={{ width: `${item.value}%` }}
                          transition={{ duration: 1, delay: 0.3 + (index * 0.1), ease: "easeOut" }}
                          style={{ background: item.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </Col>
        </Row>

        <Row className="g-4 mb-5">
          <Col xl={7} lg={12}>
            <motion.div variants={itemVariants} className="h-100">
              <div className="glass-card h-100">
                 <div className="card-header-styled" style={{borderBottom: 'none'}}>
                  <div>
                    <h4 style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>Live Action Log</h4>
                    <small style={{ color: '#64748b', fontWeight: 500 }}>Recent updates and activities</small>
                  </div>
                  <FontAwesomeIcon icon={faClock} style={{color: '#94a3b8'}} />
                </div>
                
                <div className="activity-nav">
                  <button className={`activity-tab ${activityTab === 'all' ? 'active' : ''}`} onClick={() => setActivityTab('all')}>All Updates</button>
                  <button className={`activity-tab ${activityTab === 'payments' ? 'active' : ''}`} onClick={() => setActivityTab('payments')}>Payments</button>
                  <button className={`activity-tab ${activityTab === 'documents' ? 'active' : ''}`} onClick={() => setActivityTab('documents')}>Documents</button>
                </div>

                <div className="activity-list">
                  <AnimatePresence mode="popLayout">
                    {recentActionsData[activityTab].map((item, index) => {
                      let icon, iconClass;
                      if (item.type === 'success') { icon = faCheckCircle; iconClass = 'icon-success'; }
                      else if (item.type === 'primary') { icon = faUserFriends; iconClass = 'icon-primary'; }
                      else if (item.type === 'warning') { icon = faExclamationTriangle; iconClass = 'icon-warning'; }
                      else { icon = faFileAlt; iconClass = 'icon-info'; }

                      return (
                        <motion.div 
                          className="activity-item" 
                          key={item.action + index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className={`activity-icon-wrapper ${iconClass}`}>
                            <FontAwesomeIcon icon={icon} />
                          </div>
                          <div className="activity-content">
                            <div className="activity-title">{item.action}</div>
                            <div className="activity-time">
                              <span style={{color: '#0f172a', fontWeight: 700}}>{item.user}</span> • {item.time}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </Col>

          <Col xl={5} lg={12}>
            <motion.div variants={itemVariants} className="h-100">
              <div className="glass-card h-100" style={{background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)'}}>
                 <div className="card-header-styled">
                  <div>
                    <h4 style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>Pending Actions</h4>
                    <small style={{ color: '#64748b', fontWeight: 500 }}>Tasks requiring attention</small>
                  </div>
                  <div style={{background: '#fee2e2', color: '#dc2626', padding: '8px', borderRadius: '10px'}}><FontAwesomeIcon icon={faTasks} /></div>
                </div>
                
                <div className="task-list-container">
                  {pendingTasksState.length === 0 ? (
                    <div className="text-center py-5 text-muted border rounded-4 bg-light" style={{borderStyle:'dashed'}}>No pending tasks! Current workflow is clear.</div>
                  ) : (
                    pendingTasksState.map((task, idx) => (
                      <motion.div 
                        key={task.id} 
                        className="task-item"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
                          <div style={{background: 'rgba(217,119,6,0.1)', color: '#d97706', width: 44, height: 44, borderRadius: '12px', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '0.85rem'}}>
                            {task.doc.split('-')[0].substring(0,3).toUpperCase()}
                          </div>
                          <div>
                            <div style={{fontWeight: 700, color: '#0f172a', fontSize: '0.95rem'}}>{task.doc}</div>
                            <div style={{color: '#475569', fontSize: '0.85rem'}}>{task.desc}</div>
                          </div>
                        </div>
                        <div>
                          {getStatusBadge(task.priority)}
                        </div>
                      </motion.div>
                    ))
                  )}
                  {pendingTasksState.length > 0 && (
                    <Button variant="outline-primary" style={{width: '100%', marginTop: '10px', borderRadius: '12px', fontWeight: 600, color: '#0f172a', borderColor: 'var(--border-glass)'}}>
                      View All Tasks →
                    </Button>
                  )}
                </div>

              </div>
            </motion.div>
          </Col>
        </Row>

        {/* Insights Section */}
        <Row className="g-4 mb-5">
          <Col xs={12}>
            <motion.div variants={itemVariants}>
              <div className="glass-card insight-card">
                <div className="d-flex justify-content-between align-items-center mb-0 flex-wrap gap-3">
                  <div>
                    <h4 style={{fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '1.8rem', color: '#d97706', margin: 0}}>Monthly Insights</h4>
                    <p className="text-muted mb-0">Deep dive into collection data and top performers.</p>
                  </div>
                  <div className="d-flex gap-2">
                    <select 
                      className="custom-select" 
                      value={selectedMonth} 
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    >
                      {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                    <select 
                      className="custom-select" 
                      value={selectedYear} 
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    >
                      {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>

                {/* Total Highlight */}
                <div style={{margin: '30px 0', padding: '25px', background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', borderRadius: '20px', border: '1px solid #fde68a', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                        <div style={{fontSize: '0.85rem', fontWeight: 600, color: '#92400e', textTransform: 'uppercase', letterSpacing: '1px'}}>Total Month Collection</div>
                        <div style={{fontSize: '2.4rem', fontWeight: 800, color: '#d97706', fontFamily: "'Playfair Display', serif"}}>₹{insightsData.total.toLocaleString()}</div>
                    </div>
                    <div style={{width: '60px', height: '60px', background: '#fbbf24', borderRadius: '50%', display: 'grid', placeItems: 'center', color: 'white', fontSize: '1.5rem', boxShadow: '0 8px 15px rgba(217,119,6,0.2)'}}>
                        <FontAwesomeIcon icon={faWallet} />
                    </div>
                </div>

                <Row className="g-4">
                  <Col lg={7}>
                    <div className="insight-grid">
                      <div className="insight-box">
                        <div className="d-flex align-items-center gap-3 mb-3">
                            <div style={{width: '35px', height: '35px', borderRadius: '10px', background: '#ecfdf5', color: '#10b981', display: 'grid', placeItems: 'center'}}><FontAwesomeIcon icon={faFileAlt} /></div>
                            <div className="insight-box-label" style={{margin: 0}}>EC Records</div>
                        </div>
                        <div className="insight-box-value">₹{insightsData.ec.toLocaleString()}</div>
                      </div>
                      <div className="insight-box">
                        <div className="d-flex align-items-center gap-3 mb-3">
                            <div style={{width: '35px', height: '35px', borderRadius: '10px', background: '#eef2ff', color: '#6366f1', display: 'grid', placeItems: 'center'}}><FontAwesomeIcon icon={faCheckCircle} /></div>
                            <div className="insight-box-label" style={{margin: 0}}>Nagal/Adangal</div>
                        </div>
                        <div className="insight-box-value">₹{insightsData.nagal.toLocaleString()}</div>
                      </div>
                      <div className="insight-box">
                        <div className="d-flex align-items-center gap-3 mb-3">
                            <div style={{width: '35px', height: '35px', borderRadius: '10px', background: '#f0f9ff', color: '#0ea5e9', display: 'grid', placeItems: 'center'}}><FontAwesomeIcon icon={faMoneyBillWave} /></div>
                            <div className="insight-box-label" style={{margin: 0}}>Agreements</div>
                        </div>
                        <div className="insight-box-value">₹{insightsData.agreement.toLocaleString()}</div>
                      </div>
                      <div className="insight-box">
                        <div className="d-flex align-items-center gap-3 mb-3">
                            <div style={{width: '35px', height: '35px', borderRadius: '10px', background: '#fffbeb', color: '#f59e0b', display: 'grid', placeItems: 'center'}}><FontAwesomeIcon icon={faClock} /></div>
                            <div className="insight-box-label" style={{margin: 0}}>Sale Deeds</div>
                        </div>
                        <div className="insight-box-value">₹{insightsData.deed.toLocaleString()}</div>
                      </div>
                    </div>
                  </Col>
                  <Col lg={5}>
                    <div style={{background: 'rgba(248, 250, 252, 0.5)', padding: '25px', borderRadius: '24px', border: '1px solid var(--border-glass)'}}>
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 style={{margin: 0, fontWeight: 700, color: '#0f172a'}}>Vendor Collections</h5>
                        <FontAwesomeIcon icon={faChartLine} style={{color: '#d1d5db'}} />
                      </div>
                      
                      <div className="leaderboard-container">
                        {insightsData.topCollectors.length === 0 ? (
                          <div className="text-center py-4 text-muted">No data for this period.</div>
                        ) : (
                          insightsData.topCollectors.map((c, i) => (
                            <motion.div 
                              key={c.name}
                              className="leaderboard-item"
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              whileHover={{ scale: 1.02, backgroundColor: '#fdfcfb' }}
                            >
                              <div className={`leaderboard-rank ${i < 3 ? `rank-${i+1}` : 'rank-default'}`}>{i + 1}</div>
                              <div style={{flexGrow: 1}}>
                                <div className="d-flex align-items-center gap-2">
                                  <div style={{fontWeight: 700, color: '#0f172a', fontSize: '0.95rem'}}>{c.name}</div>
                                  <Badge 
                                    bg={c.category === 'Vendor' ? "warning" : "info"} 
                                    style={{fontSize: '0.6rem', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase'}}
                                  >
                                    {c.category === 'Vendor' ? 'Vendor' : 'Customer'}
                                  </Badge>
                                </div>
                                <div style={{color: '#64748b', fontSize: '0.75rem'}}>Collection Impact</div>
                              </div>
                              <div style={{textAlign: 'right'}}>
                                <div style={{fontWeight: 800, color: '#d97706', fontSize: '0.95rem'}}>₹{c.amount.toLocaleString()}</div>
                              </div>
                              {/* Accent highlight for Rank 1 */}
                              {i === 0 && <div style={{position: 'absolute', right: 0, top: 0, bottom: 0, width: 4, background: '#fbbf24'}}></div>}
                            </motion.div>
                          ))
                        )}
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            </motion.div>
          </Col>
        </Row>
      </motion.div>
    </div>
  );
};

export default Dashboard;

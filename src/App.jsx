import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './styles/App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());
  const [searchTerm, setSearchTerm] = useState('');

  const fetchMasterData = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const res = await fetch('https://mutembei.pythonanywhere.com/api/master-data');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData(true);
    const interval = setInterval(() => fetchMasterData(false), 3000);
    return () => clearInterval(interval);
  }, []);

  const currentDataset = data?.[activeTab] || [];

  // Universal row filter
  const filteredData = currentDataset.filter((row) =>
    Object.values(row).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getStatusClass = (val) => {
    const s = String(val).toLowerCase();
    if (['completed', 'approved', 'delivered', 'resolved', 'closed', 'passed', 'present'].includes(s)) return 'status-completed';
    if (['shipped', 'in transit'].includes(s)) return 'status-shipped';
    if (['processing', 'pending', 'open', 'conditional'].includes(s)) return 'status-processing';
    return 'status-default';
  };

  const exportToCSV = () => {
    if (!filteredData || filteredData.length === 0) return;
    const headers = Object.keys(filteredData[0]);
    const rows = filteredData.map((row) => headers.map((f) => `"${row[f] ?? ''}"`));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `DDD_${activeTab.toUpperCase()}_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(43, 67, 110);
      doc.rect(0, 0, 210, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`DDD Executive Report: ${activeTab.replace('_', ' ').toUpperCase()}`, 14, 18);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleString()}`, 130, 18);

      if (filteredData.length > 0) {
        const tableHeaders = [Object.keys(filteredData[0]).map((h) => h.toUpperCase().replace('_', ' '))];
        const tableRows = filteredData.map((row) => Object.values(row));

        autoTable(doc, {
          startY: 36,
          head: tableHeaders,
          body: tableRows,
          theme: 'striped',
          headStyles: { fillColor: [43, 67, 110], textColor: [255, 255, 255] },
          alternateRowStyles: { fillColor: [241, 245, 249] },
        });
      }
      doc.save(`DDD_${activeTab.toUpperCase()}_Report.pdf`);
    } catch (err) {
      console.error('PDF Export Error:', err);
    }
  };

  const modulesList = [
    { category: 'Core Operations', items: [
      { key: 'inventory', label: '📦 Inventory Catalog' },
      { key: 'transactions', label: '📊 Live Transactions' },
      { key: 'users', label: '👥 User Management' },
      { key: 'suppliers', label: '🏢 Supplier Directory' }
    ]},
    { category: 'Supply Chain & Fulfillment', items: [
      { key: 'purchase_orders', label: '📝 Purchase Orders' },
      { key: 'shipments', label: '🚚 Shipments & Logistics' },
      { key: 'warehouse_locations', label: '🏬 Warehouse Locations' }
    ]},
    { category: 'Workforce & Analytics', items: [
      { key: 'productivity_logs', label: '⚡ Productivity Logs' },
      { key: 'attendance_tracker', label: '📅 Attendance Tracker' },
      { key: 'hardware_deployment', label: '💻 Hardware Assets' }
    ]},
    { category: 'Audit, Quality & Finance', items: [
      { key: 'quality_assurance', label: '🛡️ Quality Assurance' },
      { key: 'audit_logs', label: '📋 Audit Logs' },
      { key: 'revenue_summary', label: '💰 Revenue Summary' },
      { key: 'customer_feedback', label: '⭐ Customer Feedback' }
    ]}
  ];

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-logo">
              DDD
              <span className="logo-arc"></span>
            </div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Operations Hub</div>
              <div style={{ fontSize: '10px', color: '#9eb4c7' }}>14 Active Modules</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {modulesList.map((group, gIdx) => (
            <div key={gIdx}>
              <div className="nav-category">{group.category}</div>
              {group.items.map((mod) => (
                <button
                  key={mod.key}
                  className={`nav-item ${activeTab === mod.key ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(mod.key);
                    setSearchTerm('');
                  }}
                >
                  {mod.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div>● Live Google Sheet Engine</div>
          <div style={{ marginTop: '2px' }}>Polling Interval: 3s</div>
        </div>
      </aside>

      <div className="main-wrapper">
        <header className="top-header">
          <h2 className="page-title">{activeTab.replace('_', ' ').toUpperCase()} MODULE</h2>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Last Auto-Synced: {lastUpdated}</span>
        </header>

        <main className="content-body">
          {/* Top Metrics Cards */}
          <section className="metrics-grid">
            <div className="metric-card">
              <span className="metric-label">Active Module Records</span>
              <span className="metric-value value-blue">{currentDataset.length}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Total Catalog Items</span>
              <span className="metric-value value-blue">{data?.metrics?.total_catalog_items || 0}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Total Orders Logged</span>
              <span className="metric-value value-amber">{data?.metrics?.total_orders_logged || 0}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Registered System Users</span>
              <span className="metric-value value-blue">{data?.metrics?.registered_users || 0}</span>
            </div>
          </section>

          {/* Search Controls */}
          <section className="dashboard-controls">
            <input
              type="text"
              className="search-input"
              placeholder={`🔍 Search ${activeTab.replace('_', ' ')} records...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="export-group">
              <button className="btn-export btn-csv" onClick={exportToCSV}>
                📥 Download Filtered CSV ({filteredData.length})
              </button>
              <button className="btn-export btn-pdf" onClick={exportToPDF}>
                📄 Export Filtered PDF
              </button>
            </div>
          </section>

          {/* Dynamic Table */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ color: '#2b436e', fontSize: '16px' }}>{activeTab.replace('_', ' ').toUpperCase()} SHEET DATA</h3>
              <span className="badge-label">Showing {filteredData.length} of {currentDataset.length} Records</span>
            </div>

            <div className="table-wrapper">
              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#2b436e' }}>
                  <h3>Loading live Google Sheets data...</h3>
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      {filteredData.length > 0 ? (
                        Object.keys(filteredData[0]).map((head) => (
                          <th key={head}>{head.replace('_', ' ').toUpperCase()}</th>
                        ))
                      ) : (
                        <th>No Records Found</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((row, idx) => (
                      <tr key={idx}>
                        {Object.entries(row).map(([key, val], cellIdx) => (
                          <td key={cellIdx}>
                            {key.toLowerCase().includes('status') ? (
                              <span className={`status-badge ${getStatusClass(val)}`}>
                                {val}
                              </span>
                            ) : (
                              val
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
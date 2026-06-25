/**
 * Drop anywhere — Dashboard, a reports page, etc.
 * Usage:  <ExportAuditButton />
 */

import { useState } from "react";

const PERIODS = [
  { value: "today", label: "Today" },
  { value: "month", label: "This Month" },
  { value: "all",   label: "All Time" },
];

const ExportAuditButton = () => {
  const [period,  setPeriod]  = useState("today");
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access");
      const res   = await fetch(
        `http://127.0.0.1:8000/api/audit/export/?period=${period}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) {
        alert("Failed to generate report. Please try again.");
        return;
      }

      const disposition = res.headers.get("Content-Disposition") || "";
      const match       = disposition.match(/filename="(.+?)"/);
      const filename    = match
        ? match[1]
        : `audit_${period}_${new Date().toISOString().slice(0, 10)}.xlsx`;

      const blob    = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a       = document.createElement("a");
      a.href        = blobUrl;
      a.download    = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Export error:", err);
      alert("Something went wrong during export.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
      <style>{`
        .audit-period-btn {
          padding: 0.45rem 0.9rem;
          border: 1.5px solid #791f1f;
          background: #fff;
          color: #792d1f;
          border-radius: 6px 0 0 6px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .audit-period-btn:not(:first-child) { border-radius: 0; border-left: none; }
        .audit-period-btn:last-of-type { border-radius: 0; }
        .audit-period-btn.active {
          background: #79221f;
          color: #fff;
        }
        .audit-period-btn:hover:not(.active) { background: #e8f0f8; }
        .audit-export-btn {
          padding: 0.45rem 1.1rem;
          background: #791f1f;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          transition: background 0.15s;
          margin-left: 0.5rem;
        }
        .audit-export-btn:disabled { background: #aaa; cursor: not-allowed; }
        .audit-export-btn:hover:not(:disabled) { background: #163a5f; }
        .audit-spinner {
          width: 13px; height: 13px;
          border: 2px solid #fff;
          border-top-color: transparent;
          border-radius: 50%;
          display: inline-block;
          animation: audit-spin 0.7s linear infinite;
        }
        @keyframes audit-spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Period toggle */}
      <div style={{ display: "inline-flex" }}>
        {PERIODS.map((p) => (
          <button
            key={p.value}
            className={`audit-period-btn ${period === p.value ? "active" : ""}`}
            onClick={() => setPeriod(p.value)}
            disabled={loading}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Export button */}
      <button
        className="audit-export-btn"
        onClick={handleExport}
        disabled={loading}
      >
        {loading ? (
          <><span className="audit-spinner" /> Generating…</>
        ) : (
          <> ⬇ Export to Excel</>
        )}
      </button>
    </div>
  );
};

export default ExportAuditButton;
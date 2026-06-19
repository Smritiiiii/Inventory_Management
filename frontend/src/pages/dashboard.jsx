import { useState, useEffect } from "react";
import api from "../api/axios";
import { fetchAllPages } from "../utils/paginated";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');

  .db-root {
    font-family: 'DM Sans', sans-serif;
    background: #f4f1eb;
    min-height: 100vh;
    padding: 2rem 1.5rem;
    color: #1a1a1a;
  }

  /* ── header ── */
  .db-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 2.5rem;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .db-header h2 {
    font-family: 'DM Serif Display', serif;
    font-size: 2rem;
    margin: 0 0 .2rem;
    letter-spacing: -0.02em;
  }
  .db-header h2 span { color: #c0392b; }
  .db-header p {
    margin: 0;
    font-size: .85rem;
    color: #999;
  }
  .db-refresh {
    display: flex;
    align-items: center;
    gap: .4rem;
    background: transparent;
    border: 1.5px solid #ddd;
    padding: .5rem 1.1rem;
    border-radius: 50px;
    font-family: 'DM Sans', sans-serif;
    font-size: .82rem;
    color: #555;
    cursor: pointer;
    transition: border-color .2s, color .2s;
  }
  .db-refresh:hover { border-color: #1a1a1a; color: #1a1a1a; }

  /* ── stat grid ── */
  .db-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  @media (max-width: 900px) { .db-stats { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 500px) { .db-stats { grid-template-columns: 1fr; } }

  .db-stat {
    background: #fff;
    border-radius: 16px;
    padding: 1.4rem 1.5rem;
    box-shadow: 0 1px 8px rgba(0,0,0,.06);
    display: flex;
    flex-direction: column;
    gap: .3rem;
    position: relative;
    overflow: hidden;
  }
  .db-stat::after {
    content: '';
    position: absolute;
    right: -18px; bottom: -18px;
    width: 70px; height: 70px;
    border-radius: 50%;
    opacity: .07;
    background: currentColor;
  }
  .db-stat-icon {
    font-size: 1.1rem;
    margin-bottom: .2rem;
  }
  .db-stat-value {
    font-family: 'DM Serif Display', serif;
    font-size: 2rem;
    line-height: 1;
    color: #1a1a1a;
  }
  .db-stat-label {
    font-size: .75rem;
    text-transform: uppercase;
    letter-spacing: .06em;
    font-weight: 600;
    color: #aaa;
  }
  .db-stat-sub {
    font-size: .8rem;
    color: #bbb;
    margin-top: .1rem;
  }
  .db-stat.red   .db-stat-value { color: #c0392b; }
  .db-stat.green .db-stat-value { color: #1e8449; }
  .db-stat.blue  .db-stat-value { color: #1a6fa8; }
  .db-stat.amber .db-stat-value { color: #b7770d; }

  /* ── bottom row ── */
  .db-bottom {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  @media (max-width: 780px) { .db-bottom { grid-template-columns: 1fr; } }

  .db-card {
    background: #fff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 1px 8px rgba(0,0,0,.06);
  }
  .db-card-head {
    padding: 1.1rem 1.5rem;
    border-bottom: 1px solid #f0ede6;
    display: flex;
    align-items: center;
    gap: .6rem;
  }
  .db-card-head-icon {
    width: 28px; height: 28px;
    border-radius: 7px;
    background: #fdecea;
    color: #c0392b;
    display: flex; align-items: center; justify-content: center;
    font-size: .8rem;
  }
  .db-card-head h3 {
    font-family: 'DM Serif Display', serif;
    font-size: 1rem;
    margin: 0;
    letter-spacing: -.01em;
  }

  /* ── stock flow ── */
  .db-flow {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
  }
  .db-flow-row {}
  .db-flow-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: .5rem;
  }
  .db-flow-meta-label {
    font-size: .82rem;
    font-weight: 600;
    color: #555;
  }
  .db-flow-meta-val {
    font-size: .82rem;
    font-weight: 600;
    color: #1a1a1a;
  }
  .db-bar-track {
    height: 8px;
    background: #f0ede6;
    border-radius: 99px;
    overflow: hidden;
  }
  .db-bar-fill {
    height: 100%;
    border-radius: 99px;
    transition: width .6s ease;
  }

  .db-flow-summary {
    margin-top: .5rem;
    background: #faf8f4;
    border-radius: 12px;
    padding: 1rem 1.25rem;
    display: flex;
    justify-content: space-around;
    gap: 1rem;
    text-align: center;
  }
  .db-flow-summary-val {
    font-family: 'DM Serif Display', serif;
    font-size: 1.4rem;
    line-height: 1;
    margin-bottom: .2rem;
  }
  .db-flow-summary-lbl {
    font-size: .72rem;
    color: #aaa;
    text-transform: uppercase;
    letter-spacing: .05em;
    font-weight: 600;
  }

  .db-breakdown {
    margin-top: .5rem;
    padding-top: 1.25rem;
    border-top: 1px solid #f0ede6;
  }
  .db-breakdown-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: .75rem;
    flex-wrap: wrap;
  }
  .db-breakdown-title {
    font-size: .82rem;
    font-weight: 700;
    color: #1a1a1a;
    text-transform: uppercase;
    letter-spacing: .05em;
  }
  .db-breakdown-note {
    font-size: .75rem;
    color: #999;
  }
  .db-breakdown-table-wrap {
    overflow-x: auto;
    border: 1px solid #f0ede6;
    border-radius: 12px;
  }
  .db-breakdown-table {
    width: 100%;
    min-width: 430px;
    border-collapse: collapse;
    background: #fff;
  }
  .db-breakdown-table th,
  .db-breakdown-table td {
    padding: .85rem .95rem;
    text-align: left;
    border-bottom: 1px solid #f0ede6;
  }
  .db-breakdown-table th {
    background: #faf8f4;
    font-size: .73rem;
    color: #777;
    text-transform: uppercase;
    letter-spacing: .06em;
    font-weight: 700;
  }
  .db-breakdown-table tbody tr:last-child td {
    border-bottom: none;
  }
  .db-breakdown-table tbody tr:hover {
    background: #fcfbf8;
  }
  .db-breakdown-value {
    font-size: .95rem;
    font-weight: 700;
    color: #1a1a1a;
  }
  .db-breakdown-meta {
    font-size: .72rem;
    color: #999;
    margin-top: .15rem;
  }

  /* ── recent sales list ── */
  .db-sales-list {
    display: flex;
    flex-direction: column;
  }
  .db-sale-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: .9rem 1.5rem;
    border-bottom: 1px solid #f0ede6;
    transition: background .15s;
  }
  .db-sale-row:last-child { border-bottom: none; }
  .db-sale-row:hover { background: #faf8f4; }
  .db-sale-left {
    display: flex;
    align-items: center;
    gap: .75rem;
  }
  .db-sale-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .db-sale-type {
    font-size: .8rem;
    font-weight: 600;
    color: #1a1a1a;
    text-transform: capitalize;
  }
  .db-sale-date {
    font-size: .75rem;
    color: #bbb;
  }
  .db-sale-right {
    text-align: right;
  }
  .db-sale-amount {
    font-size: .9rem;
    font-weight: 600;
    color: #1a1a1a;
  }
  .db-sale-qty {
    font-size: .72rem;
    color: #bbb;
  }
  .db-badge {
    display: inline-block;
    padding: .15rem .6rem;
    border-radius: 50px;
    font-size: .68rem;
    font-weight: 600;
    margin-left: .4rem;
  }
  .db-badge-refill { background: #fef9e7; color: #b7770d; }

  .db-empty {
    padding: 2.5rem;
    text-align: center;
    color: #bbb;
    font-size: .9rem;
  }

  /* ── spinner ── */
  .db-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    gap: 1rem;
    color: #aaa;
    font-size: .9rem;
  }
  .db-spinner {
    width: 36px; height: 36px;
    border: 3px solid #e8e3da;
    border-top-color: #c0392b;
    border-radius: 50%;
    animation: db-spin .7s linear infinite;
  }
  @keyframes db-spin { to { transform: rotate(360deg); } }
`;

export default function Dashboard() {
  const sizeOrder = { Small: 0, Medium: 1, Large: 2 };
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalSuppliers: 0,
    currentStock: 0,
    totalReceived: 0,
    totalGiven: 0,
  });
  const [inventory, setInventory] = useState({
    totalReceivedFromSupplier: 0,
    totalGivenToCustomers: 0,
    totalReturnedFromCustomers: 0,
    totalSentToSupplier: 0,
    totalEmptyInStock: 0,
    totalFullInStock: 0,
  });
  const [inventoryBreakdown, setInventoryBreakdown] = useState([]);
  const [accessories, setAccessories] = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [suppliers, customers, invRes, allItems] = await Promise.all([
        fetchAllPages("/api/suppliers/"),
        fetchAllPages("/api/customers/"),
        api.get("/api/cylinder-transactions/current_inventory_summary/"),
        fetchAllPages("/api/item-types/"),
      ]);

      const invData = invRes.data;

      const totalReceived = invData.total_received_from_supplier || 0;
      const totalGiven    = invData.total_given_to_customers || 0;
      const currentStock  = invData.total_full_in_stock || 0;

      const accessoryItems = allItems
        .filter((item) => item.category_name?.trim().toLowerCase() === "accessory")
        .sort((a, b) => a.name.localeCompare(b.name));

      setStats({ totalCustomers: customers.length, totalSuppliers: suppliers.length, currentStock, totalReceived, totalGiven });
      setInventory({
        totalReceivedFromSupplier: invData.total_received_from_supplier || 0,
        totalGivenToCustomers: invData.total_given_to_customers || 0,
        totalReturnedFromCustomers: invData.total_returned_from_customers || 0,
        totalSentToSupplier: invData.total_sent_to_supplier || 0,
        totalEmptyInStock: invData.total_empty_in_stock || 0,
        totalFullInStock: invData.total_full_in_stock || 0,
      });
      setInventoryBreakdown(invData.breakdown || []);
      setAccessories(accessoryItems);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

const inventoryBreakdownRows = inventoryBreakdown
  .filter((item) => {
    const filled = item.full_in_stock || 0;
    const empty = item.empty_in_stock || 0;
    const inRefill = item.in_refill_quantity || 0;
    return filled + empty + inRefill > 0;  // ← this is fine, keep as is
  })
  .map((item) => ({
    ...item,
    item_type: item.item_type || "",
    cylinder_size: item.cylinder_size || "",
    full_in_stock: Number(item.full_in_stock || 0),     
  }))
  .sort(
    (a, b) =>
      (a.item_type || "").localeCompare(b.item_type || "") ||
      (sizeOrder[a.cylinder_size] ?? 99) - (sizeOrder[b.cylinder_size] ?? 99) ||
      (a.cylinder_size || "").localeCompare(b.cylinder_size || "")
  );

  if (loading) return (
    <>
      <style>{styles}</style>
      <div className="db-root">
        <div className="db-loading">
          <div className="db-spinner" />
          Loading dashboard…
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{styles}</style>
      <div className="db-root">

        {/* header */}
        <div className="db-header">
          <div>
            <h2>Welcome Back, <span>Smriti</span></h2>
            <p>Here's what's happening with your inventory today.</p>
          </div>
          <button className="db-refresh" onClick={fetchData}>
            <i className="bi bi-arrow-clockwise"></i> Refresh
          </button>
        </div>

        {/* 4 key stats */}
        <div className="db-stats">
          <div className="db-stat red">
            <span className="db-stat-icon">�</span>
            <div className="db-stat-value">{stats.totalReceived}</div>
            <div className="db-stat-label">Cylinders Received</div>
            <div className="db-stat-sub">from suppliers</div>
          </div>
          <div className="db-stat amber">
            <span className="db-stat-icon">🤝</span>
            <div className="db-stat-value">{stats.totalGiven}</div>
            <div className="db-stat-label">Cylinders Sold</div>
            <div className="db-stat-sub">to customers</div>
          </div>
          <div className="db-stat blue">
            <span className="db-stat-icon">👥</span>
            <div className="db-stat-value">{stats.totalCustomers}</div>
            <div className="db-stat-label">Customers</div>
            <div className="db-stat-sub">{stats.totalSuppliers} supplier{stats.totalSuppliers !== 1 ? "s" : ""}</div>
          </div>
          <div className="db-stat green">
            <span className="db-stat-icon">💾</span>
            <div className="db-stat-value">{stats.currentStock}</div>
            <div className="db-stat-label">In Stock</div>
            <div className="db-stat-sub">currently available</div>
          </div>
        </div>

        {/* bottom row */}
        <div className="db-bottom">

          {/* current inventory */}
          <div className="db-card">
            <div className="db-card-head">
              <div className="db-card-head-icon"><i className="bi bi-box-seam-fill"></i></div>
              <h3>Current Inventory</h3>
            </div>
            <div className="db-flow">
              <div className="db-flow-row">
                <div className="db-flow-meta">
                  <span className="db-flow-meta-label">Total received from supplier</span>
                  <span className="db-flow-meta-val">{inventory.totalReceivedFromSupplier} units</span>
                </div>
              </div>
              <div className="db-flow-row">
                <div className="db-flow-meta">
                  <span className="db-flow-meta-label">Total given to customers</span>
                  <span className="db-flow-meta-val">{inventory.totalGivenToCustomers} units</span>
                </div>
              </div>
              <div className="db-flow-row">
                <div className="db-flow-meta">
                  <span className="db-flow-meta-label">Total sent to supplier for refill</span>
                  <span className="db-flow-meta-val">{inventory.totalSentToSupplier} units</span>
                </div>
              </div>
              <div className="db-flow-row">
                <div className="db-flow-meta">
                  <span className="db-flow-meta-label">Total empty cylinder in stock</span>
                  <span className="db-flow-meta-val">{inventory.totalEmptyInStock} units</span>
                </div>
              </div>
              <div className="db-flow-row">
                <div className="db-flow-meta">
                  <span className="db-flow-meta-label">Total full cylinder in stock</span>
                  <span className="db-flow-meta-val">{inventory.totalFullInStock} units</span>
                </div>
              </div>

              <div className="db-breakdown">
                <div className="db-breakdown-head">
                  <div className="db-breakdown-title">Cylinder Breakdown</div>
                  <div className="db-breakdown-note">Full cylinders currently available in stock</div>
                </div>

                {inventoryBreakdownRows.length === 0 ? (
                  <div className="db-empty" style={{ padding: "1.25rem 0 0" }}>
                    No cylinder-wise stock available yet
                  </div>
                ) : (
                  <div className="db-breakdown-table-wrap">
                    <table className="db-breakdown-table">
                      <thead>
                        <tr>
                          <th>Type of Cylinder</th>
                          <th>Size</th>
                          <th>Total in Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryBreakdownRows.map((item, index) => (
                          <tr key={`${item.item_type}-${item.cylinder_size}-${index}`}>
                            <td>{item.item_type}</td>
                            <td>{item.cylinder_size}</td>
                            <td>
                              <div className="db-breakdown-value">{item.full_in_stock || 0}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* accessories list */}
          <div className="db-card">
            <div className="db-card-head">
              <div className="db-card-head-icon"><i className="bi bi-wrench"></i></div>
              <h3>Accessories Available</h3>
            </div>
            <div className="db-sales-list">
              {accessories.length === 0 ? (
                <div className="db-empty">No accessories in stock</div>
              ) : (
                accessories.map((acc, i) => (
                  <div className="db-sale-row" key={i}>
                    <div className="db-sale-left">
                      <div className="db-sale-dot" style={{ background: "#1e8449" }} />
                      <div>
                        <div className="db-sale-type" style={{ textTransform: "capitalize" }}>
                          {acc.name}
                        </div>
                      </div>
                    </div>
                    <div className="db-sale-right">
                      <div className="db-sale-amount" style={{ fontWeight: "600", color: "#1a1a1a" }}>
                        {acc.quantity} in stock
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  adminAPI,
  productAPI,
  orderAPI,
  productFlagsAPI,
  adminUserAPI,
  settingsAPI,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import "./AdminPage.css";

/* ─── tiny helpers ──────────────────────────────────── */
const Toggle = ({ value, onChange, label }) => (
  <label className="toggle-wrap">
    <div
      className={`toggle ${value ? "on" : ""}`}
      onClick={() => onChange(!value)}
    >
      <div className="toggle-knob" />
    </div>
    {label && <span className="toggle-label">{label}</span>}
  </label>
);
const Section = ({ title, children }) => (
  <div className="settings-section">
    <h3 className="settings-section-title">{title}</h3>
    {children}
  </div>
);

const Field = ({ label, note, children }) => (
  <div className="form-group">
    <label className="form-label">
      {label}
      {note && <span className="field-note-inline"> — {note}</span>}
    </label>
    {children}
  </div>
);

const StatusColors = {
  Pending: "#e65100",
  Confirmed: "#1565c0",
  Baking: "#f57f17",
  Ready: "#2e7d32",
  "Out for Delivery": "#7b1fa2",
  Delivered: "#1b5e20",
  Cancelled: "#c62828",
};
const STATUS_OPTIONS = [
  "Pending",
  "Confirmed",
  "Baking",
  "Ready",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

/* ─── Main component ───────────────────────────────── */
const AdminPage = () => {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("dashboard");
  const [dashboard, setDashboard] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [userSearch, setUserSearch] = useState("");

  // Product form
  const blankForm = {
    name: "",
    description: "",
    shortDescription: "",
    price: "",
    discountPrice: "",
    category: "Cakes",
    badge: "",
    weight: "",
    servings: "",
    ingredients: "",
    allergens: "",
    flavourOptions: "",
    sizeOptions: "",
    offerLabel: "",
    offerEndsAt: "",
    isAvailable: true,
    isFeatured: false,
    customizable: false,
    isTodaySpecial: false,
    isBestSeller: false,
    isNewArrival: false,
    isHamperFeatured: false,
    sortOrder: 0,
  };
  const [showForm, setShowForm] = useState(false);
  const [editProd, setEditProd] = useState(null);
  const [formData, setFormData] = useState(blankForm);
  const [images, setImages] = useState([]);
  const [imgPrev, setImgPrev] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin) navigate("/");
  }, [isAdmin, navigate]);

  const loadDashboard = useCallback(async () => {
    try {
      const r = await adminAPI.getDashboard();
      setDashboard(r.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  const loadProducts = useCallback(async () => {
    const r = await productAPI.getAll({ limit: 100 });
    setProducts(r.data.products);
  }, []);

  const loadOrders = useCallback(async () => {
    const params = { limit: 100 };
    if (orderStatus) params.status = orderStatus;
    if (orderSearch) params.search = orderSearch;
    const r = await orderAPI.getAll(params);
    setOrders(r.data.orders);
  }, [orderStatus, orderSearch]);

  const loadUsers = useCallback(async () => {
    const r = await adminUserAPI.getUsers({ search: userSearch, limit: 100 });
    setUsers(r.data.users);
  }, [userSearch]);

  useEffect(() => {
    if (tab === "dashboard") loadDashboard();
    if (tab === "products") loadProducts();
    if (tab === "orders") loadOrders();
    if (tab === "users") loadUsers();
  }, [tab, loadDashboard, loadProducts, loadOrders, loadUsers]);

  /* ── Quick flag toggle (no full form) ─────────────── */
  const quickFlag = async (productId, flags) => {
    try {
      await productFlagsAPI.updateFlags(productId, flags);
      toast.success("Updated!");
      loadProducts();
    } catch {
      toast.error("Update failed");
    }
  };

  /* ── Product form ─────────────────────────────────── */
  const openNew = () => {
    setEditProd(null);
    setFormData(blankForm);
    setImages([]);
    setImgPrev([]);
    setShowForm(true);
  };
  const openEdit = (p) => {
    setEditProd(p);
    setFormData({
      name: p.name,
      description: p.description,
      shortDescription: p.shortDescription || "",
      price: p.price,
      discountPrice: p.discountPrice || "",
      category: p.category,
      badge: p.badge || "",
      weight: p.weight || "",
      servings: p.servings || "",
      ingredients: (p.ingredients || []).join(", "),
      allergens: (p.allergens || []).join(", "),
      flavourOptions: (p.flavourOptions || []).join(", "),
      sizeOptions: JSON.stringify(p.sizeOptions || []),
      offerLabel: p.offerLabel || "",
      offerEndsAt: p.offerEndsAt ? p.offerEndsAt.split("T")[0] : "",
      isAvailable: !!p.isAvailable,
      isFeatured: !!p.isFeatured,
      customizable: !!p.customizable,
      isTodaySpecial: !!p.isTodaySpecial,
      isBestSeller: !!p.isBestSeller,
      isNewArrival: !!p.isNewArrival,
      isHamperFeatured: !!p.isHamperFeatured,
      sortOrder: p.sortOrder || 0,
    });
    setImages([]);
    setImgPrev(p.images?.map((i) => i.url) || []);
    setShowForm(true);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    setImgPrev(files.map((f) => URL.createObjectURL(f)));
  };

  const setF = (k, v) => setFormData((f) => ({ ...f, [k]: v }));

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      toast.error("Valid price is required");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      // Booleans
      const bools = [
        "isAvailable",
        "isFeatured",
        "customizable",
        "isTodaySpecial",
        "isBestSeller",
        "isNewArrival",
        "isHamperFeatured",
      ];
      Object.entries(formData).forEach(([k, v]) => {
        if (bools.includes(k)) fd.append(k, String(v));
        else if (v !== "" && v !== null && v !== undefined) fd.append(k, v);
      });
      images.forEach((img) => fd.append("images", img));
      if (editProd) await productAPI.update(editProd._id, fd);
      else await productAPI.create(fd);
      toast.success(editProd ? "✅ Product updated!" : "✅ Product created!");
      setShowForm(false);
      setEditProd(null);
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await productAPI.remove(id);
      toast.success("Product deleted");
      loadProducts();
    } catch {
      toast.error("Delete failed");
    }
  };

  /* ── Order status ─────────────────────────────────── */
  const handleStatusUpdate = async (orderId, status) => {
    try {
      await orderAPI.updateStatus(orderId, { status });
      toast.success(`Order → ${status}`);
      loadOrders();
    } catch {
      toast.error("Update failed");
    }
  };

  /* ── Users ────────────────────────────────────────── */
  const handleToggleBlock = async (uid, name, blocked) => {
    if (!window.confirm(`${blocked ? "Unblock" : "Block"} ${name}?`)) return;
    try {
      await adminUserAPI.toggleBlock(uid);
      toast.success(`${name} ${blocked ? "unblocked" : "blocked"}`);
      loadUsers();
    } catch {
      toast.error("Action failed");
    }
  };

  const handleRoleChange = async (uid, role, name) => {
    if (!window.confirm(`Make ${name} an ${role}?`)) return;
    try {
      await adminUserAPI.updateRole(uid, role);
      toast.success(`${name} is now ${role}`);
      loadUsers();
    } catch {
      toast.error("Role update failed");
    }
  };

  if (loading && tab === "dashboard")
    return (
      <div className="page-loader">
        <div className="spinner" />
      </div>
    );

  const tabs = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "homepage", icon: "🏠", label: "Homepage" },
    { id: "products", icon: "🎂", label: "Products" },
    { id: "orders", icon: "📦", label: "Orders" },
    { id: "users", icon: "👥", label: "Customers" },
    { id: "settings", icon: "⚙️", label: "Settings" },
  ];

  return (
    <div className="admin-page" style={{ paddingTop: 68 }}>
      {/* Header */}
      <div className="admin-header">
        <div className="container">
          <div className="admin-header-inner">
            <div>
              <h1 className="admin-title">⚡ Admin Panel</h1>
              <p className="admin-sub">Kirti's Kitchen — Manage your bakery</p>
            </div>
            <div className="admin-header-user">
              <div className="admin-avatar">{user?.name?.[0]}</div>
              <div>
                <p className="admin-user-name">{user?.name}</p>
                <p className="admin-user-role">Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container admin-layout">
        {/* Sidebar */}
        <div className="admin-sidebar">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`admin-tab-btn ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <span className="tab-icon">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
          <div className="sidebar-divider" />
          <button className="admin-tab-btn" onClick={() => navigate("/")}>
            <span className="tab-icon">🛍️</span>
            <span>View Store</span>
          </button>
        </div>

        {/* Content */}
        <div className="admin-content">
          {/* ═══ DASHBOARD ═══════════════════════════════ */}
          {tab === "dashboard" && dashboard && (
            <div className="tab-content">
              <h2 className="tab-title">Dashboard Overview</h2>
              <div className="stats-grid">
                {[
                  {
                    icon: "📦",
                    label: "Total Orders",
                    value: dashboard.stats?.totalOrders,
                    color: "var(--brown)",
                  },
                  {
                    icon: "💰",
                    label: "Total Revenue",
                    value: `₹${(dashboard.stats?.totalRevenue || 0).toLocaleString("en-IN")}`,
                    color: "var(--green)",
                  },
                  {
                    icon: "📅",
                    label: "This Month",
                    value: `₹${(dashboard.stats?.monthRevenue || 0).toLocaleString("en-IN")}`,
                    color: "var(--gold)",
                  },
                  {
                    icon: "⏳",
                    label: "Pending Orders",
                    value: dashboard.stats?.pendingOrders,
                    color: "#e65100",
                  },
                  {
                    icon: "🎂",
                    label: "Active Products",
                    value: dashboard.stats?.totalProducts,
                    color: "var(--pink-deep)",
                  },
                  {
                    icon: "👥",
                    label: "Customers",
                    value: dashboard.stats?.totalUsers,
                    color: "var(--brown-light)",
                  },
                ].map((s) => (
                  <div key={s.label} className="stat-card">
                    <span className="stat-icon">{s.icon}</span>
                    <p className="stat-value" style={{ color: s.color }}>
                      {s.value ?? "—"}
                    </p>
                    <p className="stat-label">{s.label}</p>
                  </div>
                ))}
              </div>

              <h3 className="section-heading">Recent Orders</h3>
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Phone</th>
                      <th>Amount</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.recentOrders?.map((o) => (
                      <tr
                        key={o._id}
                        onClick={() => navigate(`/orders/${o._id}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <td className="order-num">#{o.orderNumber}</td>
                        <td>{o.customerName}</td>
                        <td>{o.customerPhone}</td>
                        <td>₹{o.totalPrice?.toLocaleString("en-IN")}</td>
                        <td>{o.paymentMethod}</td>
                        <td>
                          <span
                            className="status-pill"
                            style={{
                              background: StatusColors[o.orderStatus] + "22",
                              color: StatusColors[o.orderStatus],
                            }}
                          >
                            {o.orderStatus}
                          </span>
                        </td>
                        <td className="date-cell">
                          {new Date(o.createdAt).toLocaleDateString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="status-breakdown">
                <h3 className="section-heading">Orders by Status</h3>
                <div className="status-bars">
                  {dashboard.ordersByStatus?.map((s) => (
                    <div key={s._id} className="status-bar-row">
                      <span className="status-bar-label">{s._id}</span>
                      <div className="status-bar-track">
                        <div
                          className="status-bar-fill"
                          style={{
                            width: `${Math.min(100, (s.count / (dashboard.stats?.totalOrders || 1)) * 100)}%`,
                            background: StatusColors[s._id],
                          }}
                        />
                      </div>
                      <span className="status-bar-count">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ HOMEPAGE CONTROLS ═══════════════════════ */}
          {tab === "homepage" && (
            <HomepageControls
              products={products}
              loadProducts={loadProducts}
              quickFlag={quickFlag}
            />
          )}

          {/* ═══ PRODUCTS ════════════════════════════════ */}
          {tab === "products" && (
            <div className="tab-content">
              <div className="tab-header">
                <h2 className="tab-title">Products ({products.length})</h2>
                <button className="btn-primary" onClick={openNew}>
                  + Add Product
                </button>
              </div>

              <div className="table-wrap">
                <table className="admin-table products-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Cat</th>
                      <th title="Available">Avail</th>
                      <th title="Featured">Feat</th>
                      <th title="Today's Special">Today</th>
                      <th title="Best Seller">Best</th>
                      <th title="New Arrival">New</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p._id}>
                        <td>
                          <div className="product-cell">
                            <div className="product-cell-img">
                              {p.images?.[0]?.url ? (
                                <img src={p.images[0].url} alt={p.name} />
                              ) : (
                                <span>🎂</span>
                              )}
                            </div>
                            <div>
                              <p className="product-cell-name">{p.name}</p>
                              <p className="product-cell-meta">
                                ₹{p.price} · ⭐{p.rating}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>₹{p.price.toLocaleString("en-IN")}</td>
                        <td>
                          <span className="cat-pill">{p.category}</span>
                        </td>
                        <td>
                          <Toggle
                            value={p.isAvailable}
                            onChange={(v) =>
                              quickFlag(p._id, { isAvailable: v })
                            }
                          />
                        </td>
                        <td>
                          <Toggle
                            value={p.isFeatured}
                            onChange={(v) =>
                              quickFlag(p._id, { isFeatured: v })
                            }
                          />
                        </td>
                        <td>
                          <Toggle
                            value={p.isTodaySpecial}
                            onChange={(v) =>
                              quickFlag(p._id, { isTodaySpecial: v })
                            }
                          />
                        </td>
                        <td>
                          <Toggle
                            value={p.isBestSeller}
                            onChange={(v) =>
                              quickFlag(p._id, { isBestSeller: v })
                            }
                          />
                        </td>
                        <td>
                          <Toggle
                            value={p.isNewArrival}
                            onChange={(v) =>
                              quickFlag(p._id, { isNewArrival: v })
                            }
                          />
                        </td>
                        <td>
                          <button
                            className="action-btn edit"
                            onClick={() => openEdit(p)}
                          >
                            Edit
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => handleDeleteProduct(p._id, p.name)}
                          >
                            Del
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ ORDERS ══════════════════════════════════ */}
          {tab === "orders" && (
            <div className="tab-content">
              <div className="tab-header">
                <h2 className="tab-title">Orders ({orders.length})</h2>
                <div className="order-filters">
                  <input
                    className="filter-input"
                    placeholder="Search name / phone / #"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                  />
                  <select
                    className="filter-select"
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value)}
                  >
                    <option value="">All Status</option>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button className="btn-sm" onClick={loadOrders}>
                    🔍 Filter
                  </button>
                </div>
              </div>
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Payment</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>WhatsApp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o._id}>
                        <td
                          className="order-num"
                          style={{ cursor: "pointer" }}
                          onClick={() => navigate(`/orders/${o._id}`)}
                        >
                          #{o.orderNumber}
                        </td>
                        <td>
                          <p style={{ fontWeight: 600, fontSize: 13 }}>
                            {o.customerName}
                          </p>
                          <p
                            style={{
                              fontSize: 11,
                              color: "var(--brown-light)",
                            }}
                          >
                            {o.customerPhone}
                          </p>
                        </td>
                        <td style={{ fontSize: 12 }}>
                          {o.orderItems?.length} item(s)
                        </td>
                        <td>₹{o.totalPrice?.toLocaleString("en-IN")}</td>
                        <td>{o.paymentMethod}</td>
                        <td className="date-cell">
                          {new Date(o.createdAt).toLocaleDateString("en-IN")}
                        </td>
                        <td>
                          <select
                            className="status-select"
                            value={o.orderStatus}
                            style={{
                              borderColor: StatusColors[o.orderStatus] + "88",
                              color: StatusColors[o.orderStatus],
                            }}
                            onChange={(e) =>
                              handleStatusUpdate(o._id, e.target.value)
                            }
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <button
                            className="wa-icon-btn"
                            onClick={() => {
                              const msg = `Hi ${o.customerName}! Your SweetCrumbs order #${o.orderNumber} status: ${o.orderStatus}. Total: ₹${o.totalPrice?.toLocaleString("en-IN")}. Thank you! 🍰`;
                              window.open(
                                `https://wa.me/91${o.customerPhone}?text=${encodeURIComponent(msg)}`,
                                "_blank",
                              );
                            }}
                          >
                            📱
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ CUSTOMERS ════════════════════════════════ */}
          {tab === "users" && (
            <div className="tab-content">
              <div className="tab-header">
                <h2 className="tab-title">Customers ({users.length})</h2>
                <div className="order-filters">
                  <input
                    className="filter-input"
                    placeholder="Search name / email / phone"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                  <button className="btn-sm" onClick={loadUsers}>
                    🔍 Search
                  </button>
                </div>
              </div>
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Phone</th>
                      <th>Orders</th>
                      <th>Joined</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u._id}
                        style={{ opacity: u.isBlocked ? 0.55 : 1 }}
                      >
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <div className="user-mini-avatar">
                              {u.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p style={{ fontWeight: 600, fontSize: 13 }}>
                                {u.name}
                              </p>
                              <p
                                style={{
                                  fontSize: 11,
                                  color: "var(--brown-light)",
                                }}
                              >
                                {u.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: 13 }}>
                          {u.phone ? `+91 ${u.phone}` : "—"}
                        </td>
                        <td style={{ fontWeight: 600, color: "var(--brown)" }}>
                          {u.orderCount ?? 0}
                        </td>
                        <td className="date-cell">
                          {new Date(u.createdAt).toLocaleDateString("en-IN")}
                        </td>
                        <td>
                          <span className={`role-pill ${u.role}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`status-pill ${u.isBlocked ? "blocked" : "active"}`}
                          >
                            {u.isBlocked ? "🚫 Blocked" : "✅ Active"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="action-btn wa"
                            onClick={() =>
                              window.open(
                                `https://wa.me/91${u.phone}`,
                                "_blank",
                              )
                            }
                            disabled={!u.phone}
                            title="WhatsApp"
                          >
                            📱
                          </button>
                          <button
                            className={`action-btn ${u.isBlocked ? "unblock" : "block"}`}
                            onClick={() =>
                              handleToggleBlock(u._id, u.name, u.isBlocked)
                            }
                          >
                            {u.isBlocked ? "Unblock" : "Block"}
                          </button>
                          {u.role !== "admin" && (
                            <button
                              className="action-btn promote"
                              onClick={() =>
                                handleRoleChange(u._id, "admin", u.name)
                              }
                            >
                              Admin
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {tab === "settings" && <SettingsPanel onSaved={loadDashboard} />}

      {/* ═══ PRODUCT FORM MODAL ══════════════════════════ */}
      {showForm && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target.classList.contains("modal-overlay"))
              setShowForm(false);
          }}
        >
          <div className="product-modal">
            <div className="modal-header">
              <h3>{editProd ? `Edit: ${editProd.name}` : "Add New Product"}</h3>
              <button
                className="modal-close"
                onClick={() => setShowForm(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveProduct} className="product-form">
              {/* Basic info */}
              <div className="form-section">
                <h4>📋 Basic Information</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Product Name *</label>
                    <input
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setF("name", e.target.value)}
                      required
                      maxLength={120}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      className="form-control"
                      value={formData.category}
                      onChange={(e) => setF("category", e.target.value)}
                    >
                      {[
                        "Cakes",
                        "Cupcakes",
                        "Brownies",
                        "Hampers",
                        "Custom",
                      ].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Short Description (shown on card)
                  </label>
                  <input
                    className="form-control"
                    value={formData.shortDescription}
                    onChange={(e) => setF("shortDescription", e.target.value)}
                    maxLength={200}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Full Description *</label>
                  <textarea
                    className="form-control"
                    value={formData.description}
                    onChange={(e) => setF("description", e.target.value)}
                    required
                    rows={3}
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="form-section">
                <h4>💰 Pricing & Offer</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Price (₹) *</label>
                    <input
                      className="form-control"
                      type="number"
                      min="1"
                      value={formData.price}
                      onChange={(e) => setF("price", e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Original Price (₹){" "}
                      <span style={{ fontWeight: 400, fontSize: 11 }}>
                        (for strike-through)
                      </span>
                    </label>
                    <input
                      className="form-control"
                      type="number"
                      min="0"
                      value={formData.discountPrice}
                      onChange={(e) => setF("discountPrice", e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Offer Label</label>
                    <input
                      className="form-control"
                      placeholder="e.g. 25% OFF Today Only"
                      value={formData.offerLabel}
                      onChange={(e) => setF("offerLabel", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Offer Ends At</label>
                    <input
                      className="form-control"
                      type="date"
                      value={formData.offerEndsAt}
                      onChange={(e) => setF("offerEndsAt", e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Badge</label>
                    <select
                      className="form-control"
                      value={formData.badge}
                      onChange={(e) => setF("badge", e.target.value)}
                    >
                      <option value="">None</option>
                      <option value="bestseller">🔥 Best Seller</option>
                      <option value="new">✨ New</option>
                      <option value="special">⭐ Special</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Sort Order{" "}
                      <span style={{ fontWeight: 400, fontSize: 11 }}>
                        (lower = first)
                      </span>
                    </label>
                    <input
                      className="form-control"
                      type="number"
                      min="0"
                      value={formData.sortOrder}
                      onChange={(e) => setF("sortOrder", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Homepage placement */}
              <div className="form-section">
                <h4>🏠 Homepage Placement</h4>
                <div className="flags-grid">
                  {[
                    {
                      key: "isAvailable",
                      label: "Available for Order",
                      icon: "✅",
                    },
                    {
                      key: "isFeatured",
                      label: "Featured Products",
                      icon: "⭐",
                    },
                    {
                      key: "isTodaySpecial",
                      label: "Today's Special",
                      icon: "🎂",
                      note: "Only one allowed",
                    },
                    {
                      key: "isBestSeller",
                      label: "Best Sellers Row",
                      icon: "🔥",
                    },
                    { key: "isNewArrival", label: "New Arrivals", icon: "✨" },
                    {
                      key: "isHamperFeatured",
                      label: "Featured Hamper",
                      icon: "🎁",
                    },
                    {
                      key: "customizable",
                      label: "Customizable Cake",
                      icon: "✏️",
                    },
                  ].map((f) => (
                    <div key={f.key} className="flag-item">
                      <Toggle
                        value={!!formData[f.key]}
                        onChange={(v) => setF(f.key, v)}
                      />
                      <div>
                        <span className="flag-icon">{f.icon}</span>
                        <span className="flag-label">{f.label}</span>
                        {f.note && (
                          <span className="flag-note"> ({f.note})</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Details */}
              <div className="form-section">
                <h4>📦 Product Details</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Weight</label>
                    <input
                      className="form-control"
                      placeholder="e.g. 500g"
                      value={formData.weight}
                      onChange={(e) => setF("weight", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Servings</label>
                    <input
                      className="form-control"
                      placeholder="e.g. 4-6 people"
                      value={formData.servings}
                      onChange={(e) => setF("servings", e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Ingredients{" "}
                    <span style={{ fontWeight: 400, fontSize: 11 }}>
                      (comma-separated)
                    </span>
                  </label>
                  <input
                    className="form-control"
                    placeholder="Chocolate, Butter, Eggs, Sugar"
                    value={formData.ingredients}
                    onChange={(e) => setF("ingredients", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Allergens{" "}
                    <span style={{ fontWeight: 400, fontSize: 11 }}>
                      (comma-separated)
                    </span>
                  </label>
                  <input
                    className="form-control"
                    placeholder="Gluten, Dairy, Nuts"
                    value={formData.allergens}
                    onChange={(e) => setF("allergens", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Flavour Options{" "}
                    <span style={{ fontWeight: 400, fontSize: 11 }}>
                      (comma-separated)
                    </span>
                  </label>
                  <input
                    className="form-control"
                    placeholder="Dark Chocolate, Milk Chocolate, White Chocolate"
                    value={formData.flavourOptions}
                    onChange={(e) => setF("flavourOptions", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Size Options{" "}
                    <span style={{ fontWeight: 400, fontSize: 11 }}>
                      (JSON: [{"{"}"label":"Half Kg","price":899{"}"}])
                    </span>
                  </label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder='[{"label":"Half Kg","price":899},{"label":"1 Kg","price":1599}]'
                    value={formData.sizeOptions}
                    onChange={(e) => setF("sizeOptions", e.target.value)}
                  />
                </div>
              </div>

              {/* Images */}
              <div className="form-section">
                <h4>📸 Product Images (Cloudinary)</h4>
                <input
                  type="file"
                  className="form-control"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imgPrev.length > 0 && (
                  <div className="img-preview-row">
                    {imgPrev.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt={`Preview ${i + 1}`}
                        className="img-preview"
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving
                    ? "Saving…"
                    : editProd
                      ? "✅ Update Product"
                      : "➕ Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Homepage Controls sub-component ─────────────── */
const HomepageControls = ({ products, loadProducts, quickFlag }) => {
  const todaySpecial = products.find((p) => p.isTodaySpecial);
  const bestSellers = products.filter((p) => p.isBestSeller);
  const newArrivals = products.filter((p) => p.isNewArrival);
  const featured = products.filter((p) => p.isFeatured);
  const hampers = products.filter((p) => p.isHamperFeatured);

  const setTodaySpecial = async (productId) => {
    // Remove from all, then set on selected
    try {
      await Promise.all(
        products.map(
          (p) =>
            p.isTodaySpecial &&
            productFlagsAPI.updateFlags(p._id, { isTodaySpecial: false }),
        ),
      );
      if (productId)
        await productFlagsAPI.updateFlags(productId, { isTodaySpecial: true });
      toast.success("Today's Special updated!");
      loadProducts();
    } catch {
      toast.error("Update failed");
    }
  };

  const sections = [
    {
      title: "🎂 Today's Special",
      desc: "Only ONE product shown in the hero countdown banner",
      items: todaySpecial ? [todaySpecial] : [],
      flag: "isTodaySpecial",
      single: true,
    },
    {
      title: "🔥 Best Sellers",
      desc: "Shown in the Best Sellers row on homepage (up to 6)",
      items: bestSellers,
      flag: "isBestSeller",
      single: false,
    },
    {
      title: "⭐ Featured Products",
      desc: "Shown in the Featured section (up to 6)",
      items: featured,
      flag: "isFeatured",
      single: false,
    },
    {
      title: "✨ New Arrivals",
      desc: "Shown in New Arrivals section (up to 4)",
      items: newArrivals,
      flag: "isNewArrival",
      single: false,
    },
    {
      title: "🎁 Featured Hampers",
      desc: "Shown in Gift Hampers section on homepage (up to 4)",
      items: hampers,
      flag: "isHamperFeatured",
      single: false,
    },
  ];

  return (
    <div className="tab-content">
      <h2 className="tab-title">🏠 Homepage Controls</h2>
      <p
        style={{ color: "var(--brown-light)", marginBottom: 28, fontSize: 14 }}
      >
        Control exactly what appears on each section of the homepage — no code
        needed.
      </p>

      {sections.map((sec) => (
        <div key={sec.title} className="homepage-section-card">
          <div className="hsc-header">
            <div>
              <h3 className="hsc-title">{sec.title}</h3>
              <p className="hsc-desc">{sec.desc}</p>
            </div>
            <span className="hsc-count">{sec.items.length} selected</span>
          </div>

          {/* Currently selected */}
          {sec.items.length > 0 && (
            <div className="hsc-selected">
              {sec.items.map((p) => (
                <div key={p._id} className="hsc-product-chip">
                  <img
                    src={p.images?.[0]?.url}
                    alt={p.name}
                    onError={(e) => (e.target.style.display = "none")}
                  />
                  <span>{p.name}</span>
                  <button
                    onClick={() => quickFlag(p._id, { [sec.flag]: false })}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add from dropdown */}
          <div className="hsc-add-row">
            <select
              className="filter-select"
              defaultValue=""
              onChange={(e) => {
                if (!e.target.value) return;
                if (sec.single) setTodaySpecial(e.target.value);
                else quickFlag(e.target.value, { [sec.flag]: true });
                e.target.value = "";
              }}
            >
              <option value="">+ Add a product to this section…</option>
              {products
                .filter((p) => !p[sec.flag])
                .map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} (₹{p.price})
                  </option>
                ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ─── Settings Panel ───────────────────────────────── */
const SettingsPanel = ({ onSaved }) => {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsAPI
      .get()
      .then((r) => setForm(r.data.settings))
      .catch(console.error);
  }, []);

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        storeOpen: form.storeOpen === true || form.storeOpen === "true",
        announcementActive:
          form.announcementActive === true ||
          form.announcementActive === "true",
        freeDeliveryAbove: Number(form.freeDeliveryAbove || 999),
        deliveryCharge: Number(form.deliveryCharge || 60),
        minOrderAmount: Number(form.minOrderAmount || 200),
      };
      console.log("Saving settings:", payload); // debug
      await settingsAPI.update(payload);
      toast.success("✅ Settings saved!");
      onSaved?.();
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <div className="spinner" />;

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2 className="tab-title">⚙️ Site Settings</h2>
        <p style={{ fontSize: 13, color: "var(--brown-light)" }}>
          Changes take effect immediately across the entire website.
        </p>
      </div>
      <form onSubmit={save}>
        <Section title="🏪 Brand & Contact">
          <div className="form-row">
            <Field label="Brand Name">
              <input
                className="form-control"
                value={form.brandName || ""}
                onChange={(e) => setF("brandName", e.target.value)}
              />
            </Field>
            <Field label="Owner Name">
              <input
                className="form-control"
                value={form.ownerName || ""}
                onChange={(e) => setF("ownerName", e.target.value)}
              />
            </Field>
          </div>
          <div className="form-row">
            <Field label="City">
              <input
                className="form-control"
                value={form.city || ""}
                onChange={(e) => setF("city", e.target.value)}
              />
            </Field>
            <Field label="WhatsApp Number" note="with country code, no +">
              <input
                className="form-control"
                placeholder="919876543210"
                value={form.whatsappNumber || ""}
                onChange={(e) => setF("whatsappNumber", e.target.value)}
              />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Email">
              <input
                className="form-control"
                type="email"
                value={form.email || ""}
                onChange={(e) => setF("email", e.target.value)}
              />
            </Field>
            <Field label="FSSAI Number">
              <input
                className="form-control"
                value={form.fssaiNumber || ""}
                onChange={(e) => setF("fssaiNumber", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Address">
            <input
              className="form-control"
              value={form.address || ""}
              onChange={(e) => setF("address", e.target.value)}
            />
          </Field>
          <div className="form-row">
            <Field label="Opening Hours">
              <input
                className="form-control"
                placeholder="Mon–Sun: 8 AM – 8 PM"
                value={form.openingHours || ""}
                onChange={(e) => setF("openingHours", e.target.value)}
              />
            </Field>
            <Field label="Instagram URL">
              <input
                className="form-control"
                placeholder="https://instagram.com/..."
                value={form.instagramUrl || ""}
                onChange={(e) => setF("instagramUrl", e.target.value)}
              />
            </Field>
          </div>
        </Section>

        <Section title="🏠 Hero Banner Text">
          <Field label="Badge Text" note="small text above title">
            <input
              className="form-control"
              value={form.heroBadgeText || ""}
              onChange={(e) => setF("heroBadgeText", e.target.value)}
            />
          </Field>
          <Field label="Hero Title" note="use \\n for line break">
            <input
              className="form-control"
              value={form.heroTitle || ""}
              onChange={(e) => setF("heroTitle", e.target.value)}
            />
          </Field>
          <Field label="Hero Subtitle">
            <textarea
              className="form-control"
              rows={2}
              value={form.heroSubtitle || ""}
              onChange={(e) => setF("heroSubtitle", e.target.value)}
            />
          </Field>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 14,
            }}
          >
            {[
              ["heroStatCustomers", "Customers stat"],
              ["heroStatVarieties", "Varieties stat"],
              ["heroStatRating", "Rating stat"],
              ["heroStatYears", "Years stat"],
            ].map(([k, l]) => (
              <Field key={k} label={l}>
                <input
                  className="form-control"
                  value={form[k] || ""}
                  onChange={(e) => setF(k, e.target.value)}
                />
              </Field>
            ))}
          </div>
        </Section>

        <Section title="🎂 Today's Special (Fallback Text)">
          <p
            style={{
              fontSize: 12,
              color: "var(--brown-light)",
              marginBottom: 14,
            }}
          >
            This text shows if no product has "Today's Special" toggled on in
            Products tab.
          </p>
          <div className="form-row">
            <Field label="Title">
              <input
                className="form-control"
                value={form.todaySpecialTitle || ""}
                onChange={(e) => setF("todaySpecialTitle", e.target.value)}
              />
            </Field>
            <Field label="Offer ends at" note="leave blank = midnight">
              <input
                className="form-control"
                type="datetime-local"
                value={
                  form.todaySpecialOfferEndsAt
                    ? new Date(form.todaySpecialOfferEndsAt)
                        .toISOString()
                        .slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  setF("todaySpecialOfferEndsAt", e.target.value)
                }
              />
            </Field>
          </div>
          <Field label="Description">
            <textarea
              className="form-control"
              rows={2}
              value={form.todaySpecialDesc || ""}
              onChange={(e) => setF("todaySpecialDesc", e.target.value)}
            />
          </Field>
        </Section>

        <Section title="🚚 Delivery & Order Rules">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 14,
            }}
          >
            <Field label="Free Delivery Above (₹)">
              <input
                className="form-control"
                type="number"
                value={form.freeDeliveryAbove || 999}
                onChange={(e) =>
                  setF("freeDeliveryAbove", Number(e.target.value))
                }
              />
            </Field>
            <Field label="Delivery Charge (₹)">
              <input
                className="form-control"
                type="number"
                value={form.deliveryCharge || 60}
                onChange={(e) => setF("deliveryCharge", Number(e.target.value))}
              />
            </Field>
            <Field label="Min Order Amount (₹)">
              <input
                className="form-control"
                type="number"
                value={form.minOrderAmount || 200}
                onChange={(e) => setF("minOrderAmount", Number(e.target.value))}
              />
            </Field>
          </div>
          <Field label="Delivery Areas" note="comma-separated">
            <input
              className="form-control"
              placeholder="Pune, Pimpri, Kothrud, Baner…"
              value={
                Array.isArray(form.deliveryCities)
                  ? form.deliveryCities.join(", ")
                  : form.deliveryCities || ""
              }
              onChange={(e) =>
                setF(
                  "deliveryCities",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
            />
          </Field>
          <Field
            label="Same-Day Order Cutoff Time"
            note="orders before this time get same-day delivery"
          >
            <input
              className="form-control"
              type="time"
              value={form.orderCutoffTime || "10:00"}
              onChange={(e) => setF("orderCutoffTime", e.target.value)}
            />
          </Field>
        </Section>

        <Section title="📢 Announcement & Store Status">
          <div className="flags-grid" style={{ marginBottom: 16 }}>
            <div className="flag-item">
              <Toggle
                value={form.storeOpen === true || form.storeOpen === "true"}
                onChange={(v) => setF("storeOpen", v)}
              />
              <div>
                <span className="flag-icon">
                  {form.storeOpen === true || form.storeOpen === "true"
                    ? "🟢"
                    : "🔴"}
                </span>
                <span className="flag-label">
                  {form.storeOpen === true || form.storeOpen === "true"
                    ? "Store is Open"
                    : "Store is Closed"}
                </span>
              </div>
            </div>
            <div className="flag-item">
              <Toggle
                value={!!form.announcementActive}
                onChange={(v) => setF("announcementActive", v)}
              />
              <div>
                <span className="flag-icon">📢</span>
                <span className="flag-label">Show Announcement Banner</span>
              </div>
            </div>
          </div>
          <Field label="Store Closed Message">
            <input
              className="form-control"
              placeholder="We are closed. Order via WhatsApp!"
              value={form.storeClosedMessage || ""}
              onChange={(e) => setF("storeClosedMessage", e.target.value)}
            />
          </Field>
          <Field
            label="Announcement Banner Text"
            note="shown at top of every page when active"
          >
            <input
              className="form-control"
              placeholder="🎉 Special Diwali offers! Use code DIWALI20 for 20% off."
              value={form.announcementBanner || ""}
              onChange={(e) => setF("announcementBanner", e.target.value)}
            />
          </Field>
        </Section>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            paddingTop: 8,
          }}
        >
          <button
            type="submit"
            className="btn-primary"
            disabled={saving}
            style={{ padding: "13px 32px" }}
          >
            {saving ? "Saving…" : "💾 Save All Settings"}
          </button>
        </div>
      </form>
    </div>
  );
};
export default AdminPage;

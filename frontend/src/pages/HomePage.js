import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { productFlagsAPI, settingsAPI } from "../services/api";
import ProductCard from "../components/common/ProductCard";
import "./HomePage.css";

/* ── Countdown hook ─────────────────────────────────── */
const useCountdown = (endsAt) => {
  const [time, setTime] = useState("--:--:--");
  useEffect(() => {
    const tick = () => {
      const end = endsAt
        ? new Date(endsAt)
        : (() => {
            const d = new Date();
            d.setHours(23, 59, 59, 0);
            return d;
          })();
      const diff = Math.max(0, end - new Date());
      if (diff === 0) {
        setTime("00:00:00");
        return;
      }
      const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
      setTime(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  return time;
};

const HomePage = () => {
  const navigate = useNavigate();

  // Data state
  const [settings, setSettings] = useState(null);
  const [todaySpecial, setTodaySpecial] = useState(null);
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [hampers, setHampers] = useState([]);

  const countdown = useCountdown(
    todaySpecial?.offerEndsAt || settings?.todaySpecialOfferEndsAt,
  );

  const loadAll = useCallback(async () => {
    try {
      const [settR, tsR, bsR, naR, hR] = await Promise.all([
        settingsAPI.get(),
        productFlagsAPI.getTodaySpecial(),
        productFlagsAPI.getBestSellers(),
        productFlagsAPI.getNewArrivals(),
        productFlagsAPI.getFeaturedHampers(),
      ]);
      setSettings(settR.data.settings);
      setTodaySpecial(tsR.data.product);
      setBestSellers(bsR.data.products);
      setNewArrivals(naR.data.products);
      setHampers(hR.data.products);
    } catch (e) {
      console.error(e);
    } finally {
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const openWA = (msg = "") => {
    const num =
      settings?.whatsappNumber || process.env.REACT_APP_WHATSAPP_NUMBER;
    window.open(
      `https://wa.me/${num}${msg ? "?text=" + encodeURIComponent(msg) : ""}`,
      "_blank",
    );
  };

  const S         = settings || {};
  const brandName = S.brandName || 'Kirtivyaa';
  const city      = S.city      || 'Pune';
  /* ── Announcement banner ──────────────────────────── */
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const showAnnouncement =
    S?.announcementActive && S?.announcementBanner && !announcementDismissed;

  /* ── Store closed ─────────────────────────────────── */
  const storeClosed = S?.storeOpen === false;

  return (
    <div className="home">
      {/* Announcement banner */}
      {showAnnouncement && (
        <div className="announcement-bar">
          <span>{S.announcementBanner}</span>
          <button onClick={() => setAnnouncementDismissed(true)}>✕</button>
        </div>
      )}

      {/* Store closed notice */}
      {storeClosed && (
        <div className="store-closed-bar">
          <span>
            🔴{" "}
            {S?.storeClosedMessage ||
              "We are currently closed. Order via WhatsApp!"}
          </span>
          <button
            className="btn-wa"
            style={{ padding: "6px 14px", fontSize: 12 }}
            onClick={() => openWA()}
          >
            📱 WhatsApp
          </button>
        </div>
      )}

      {/* ── HERO ──────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg-dots" />
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
        <div className="hero-content container">
          <div className="hero-text">
            <div className="hero-badge">
              {S?.heroBadgeText || `✨ Freshly Baked Daily in ${city}`}
            </div>
            <h1 className="hero-title">
              {(S?.heroTitle || "Freshly Baked\nHappiness 🍰")
                .split("\\n")
                .map((line, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <br />}
                    {line}
                  </React.Fragment>
                ))}
            </h1>
            <p className="hero-subtitle">
              {S?.heroSubtitle ||
                `Artisan chocolate cakes, cupcakes, brownies & luxurious gift hampers — made with love by ${S?.ownerName || "Kirti"} in ${city}, baked fresh every morning.`}
            </p>
            <div className="hero-ctas">
              <button
                className="btn-primary hero-btn-lg"
                onClick={() => navigate("/products")}
              >
                Browse Products
              </button>
              <button className="btn-wa hero-btn-lg" onClick={() => openWA()}>
                📱 WhatsApp Order
              </button>
            </div>
            <div className="hero-stats">
              {[
                [S?.heroStatCustomers || "1,000+", "Happy Customers"],
                [S?.heroStatVarieties || "30+", "Cake Varieties"],
                [S?.heroStatRating || "4.9 ★", "Avg Rating"],
                [S?.heroStatYears || "5+", "Years Baking"],
              ].map(([n, l]) => (
                <div key={l} className="hero-stat">
                  <span className="hero-stat-num">{n}</span>
                  <span className="hero-stat-label">{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-ring hero-ring-1" />
            <div className="hero-ring hero-ring-2" />
            <div className="hero-card">
              <span className="hero-emoji">🎂</span>
              <p className="hero-cake-name">{brandName} Signature Cake</p>
              <p className="hero-cake-price">From ₹899</p>
              <button
                className="hero-card-btn"
                onClick={() => navigate("/products")}
              >
                Order Now
              </button>
            </div>
            <div className="floating-tag tag-1">⭐ Best Seller</div>
            <div className="floating-tag tag-2">🎁 Gift Ready</div>
            <div className="floating-tag tag-3">🚚 Delivery in {city}</div>
          </div>
        </div>
      </section>

      {/* ── TODAY'S SPECIAL ───────────────────────────── */}
      {(todaySpecial || S) && (
        <section className="todays-special">
          <div className="ts-inner container">
            <div className="ts-text">
              <div className="ts-badge">🎂 Today's Special</div>
              <h2>
                {todaySpecial?.name ||
                  S?.todaySpecialTitle ||
                  "Today's Special Cake"}
              </h2>
              <p>
                {todaySpecial?.shortDescription ||
                  todaySpecial?.description?.slice(0, 140) ||
                  S?.todaySpecialDesc ||
                  ""}
              </p>
              <div className="ts-pricing">
                <span className="ts-price">
                  ₹{(todaySpecial?.price || 0).toLocaleString("en-IN")}
                </span>
                {todaySpecial?.discountPrice > todaySpecial?.price && (
                  <span className="ts-original">
                    ₹{todaySpecial.discountPrice.toLocaleString("en-IN")}
                  </span>
                )}
                {todaySpecial?.offerLabel && (
                  <span className="ts-save">{todaySpecial.offerLabel}</span>
                )}
              </div>
              <div className="ts-actions">
                {todaySpecial && (
                  <button
                    className="btn-primary"
                    onClick={() => navigate(`/products/${todaySpecial._id}`)}
                  >
                    Order Now
                  </button>
                )}
                <button
                  className="btn-wa"
                  onClick={() =>
                    openWA(
                      `Hi! I'd like to order today's special: ${todaySpecial?.name || "Today's Cake"} 🎂`,
                    )
                  }
                >
                  📱 WhatsApp
                </button>
              </div>
            </div>
            <div className="ts-visual">
              <div className="ts-cake-circle">
                {todaySpecial?.images?.[0]?.url ? (
                  <img
                    src={todaySpecial.images[0].url}
                    alt={todaySpecial.name}
                    className="ts-cake-img"
                  />
                ) : (
                  <span style={{ fontSize: 110 }}>🍫</span>
                )}
              </div>
              <div className="ts-timer-card">
                <p className="ts-timer-label">Offer ends in</p>
                <p className="ts-timer-time">{countdown}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── CATEGORIES ────────────────────────────────── */}
      <section className="section categories-section">
        <div className="container">
          <p className="section-label">Browse by Category</p>
          <h2 className="section-title">What Are You Craving?</h2>
          <div className="cat-grid">
            {[
              { emoji: "🎂", name: "Chocolate Cakes", cat: "Cakes" },
              { emoji: "🧁", name: "Cupcakes", cat: "Cupcakes" },
              { emoji: "🍫", name: "Brownies", cat: "Brownies" },
              { emoji: "🎁", name: "Gift Hampers", cat: "Hampers" },
            ].map((c) => (
              <div
                key={c.name}
                className="cat-card"
                onClick={() => navigate(`/products?category=${c.cat}`)}
              >
                <span className="cat-emoji">{c.emoji}</span>
                <p className="cat-name">{c.name}</p>
                <p className="cat-count">Tap to explore →</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BEST SELLERS ──────────────────────────────── */}
      {bestSellers.length > 0 && (
        <section className="section featured-section">
          <div className="container">
            <div className="section-header">
              <div>
                <p className="section-label">🔥 Best Sellers</p>
                <h2 className="section-title" style={{ marginBottom: 0 }}>
                  Our Most Loved Treats
                </h2>
              </div>
              <button
                className="btn-outline"
                onClick={() => navigate("/products")}
              >
                View All →
              </button>
            </div>
            <div className="products-grid">
              {bestSellers.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── NEW ARRIVALS ───────────────────────────────── */}
      {newArrivals.length > 0 && (
        <section
          className="section"
          style={{
            background: "var(--white)",
            paddingTop: 60,
            paddingBottom: 60,
          }}
        >
          <div className="container">
            <div className="section-header">
              <div>
                <p className="section-label">✨ New Arrivals</p>
                <h2 className="section-title" style={{ marginBottom: 0 }}>
                  Fresh off the Tray
                </h2>
              </div>
              <button
                className="btn-outline"
                onClick={() => navigate("/products")}
              >
                See All →
              </button>
            </div>
            <div className="products-grid">
              {newArrivals.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── GIFT HAMPERS ──────────────────────────────── */}
      {hampers.length > 0 && (
        <section className="section hampers-section">
          <div className="container">
            <p className="section-label">🎁 Surprise Gift Hampers</p>
            <h2 className="section-title">Beautifully Curated Gift Boxes</h2>
            <p
              style={{
                color: "var(--brown-light)",
                marginBottom: 36,
                maxWidth: 500,
                fontSize: 15,
              }}
            >
              Perfect for birthdays, anniversaries, and festive seasons. Each
              hamper is hand-assembled with love by Kirti.
            </p>
            <div className="hampers-grid">
              {hampers.map((h) => (
                <div
                  key={h._id}
                  className="hamper-card"
                  onClick={() => navigate(`/products/${h._id}`)}
                >
                  <div className="hamper-visual">
                    {h.images?.[0]?.url ? (
                      <img
                        src={h.images[0].url}
                        alt={h.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <span>🎁</span>
                    )}
                  </div>
                  <div className="hamper-info">
                    <p className="hamper-tag">🎁 {h.category}</p>
                    <h3 className="hamper-name">{h.name}</h3>
                    <p className="hamper-includes">
                      {h.shortDescription || h.description?.slice(0, 100)}
                    </p>
                    <p className="hamper-price">
                      ₹{h.price.toLocaleString("en-IN")}
                    </p>
                    <button
                      className="btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/products/${h._id}`);
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── ABOUT KIRTI ───────────────────────────────── */}
      <section className="about-strip">
        <div className="container about-strip-inner">
          <div className="about-strip-visual">
            <div className="about-strip-circle">👩‍🍳</div>
            <div className="about-strip-badge">
              <span>{S?.heroStatYears || "5+"}yrs</span>
              <span>of Baking</span>
            </div>
          </div>
          <div className="about-strip-text">
            <p className="section-label">Meet the Baker</p>
            <h2 className="section-title">
              Hi, I'm {S?.ownerName || "Kirti Agarwal"} 👋
            </h2>
            <p>
              {brandName} is my home bakery in {city}, born from a lifelong
              passion for creating desserts that bring genuine joy. Every cake
              that leaves my kitchen is made from scratch using the finest
              Belgian chocolate, real butter and fresh cream. 100% pure
              vegetarian. No preservatives, no shortcuts — just pure love baked
              into every bite.
            </p>
            <div className="about-strip-values">
              {[
                ["🍫", "Premium Ingredients"],
                ["🌅", "Baked Same Day"],
                ["📱", "WhatsApp Updates"],
                ["🔒", "FSSAI Certified"],
              ].map(([i, l]) => (
                <div key={l} className="about-value-chip">
                  <span>{i}</span>
                  <span>{l}</span>
                </div>
              ))}
            </div>
            <button className="btn-outline" onClick={() => navigate("/about")}>
              Our Full Story →
            </button>
          </div>
        </div>
      </section>

      {/* ── CUSTOMIZE ─────────────────────────────────── */}
      <section className="customize-section">
        <div className="container">
          <div className="customize-inner">
            <p className="section-label">✏️ Customize</p>
            <h2 className="section-title">Design Your Dream Cake</h2>
            <p>
              Tell Kirti exactly what you want — flavour, size, theme, message.
              She'll make it happen!
            </p>
            <div className="customize-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Cake Flavour</label>
                  <select className="form-control" id="c-flavour">
                    <option>Belgian Dark Chocolate</option>
                    <option>Milk Chocolate Truffle</option>
                    <option>White Chocolate Raspberry</option>
                    <option>Choco-Hazelnut Nutella</option>
                    <option>Red Velvet Chocolate</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Cake Size</label>
                  <select className="form-control" id="c-size">
                    <option>Half Kg (serves 4–6)</option>
                    <option>1 Kg (serves 8–10)</option>
                    <option>1.5 Kg (serves 12–15)</option>
                    <option>2 Kg (serves 18–22)</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Frosting Type</label>
                  <select className="form-control">
                    <option>Chocolate Ganache</option>
                    <option>Buttercream</option>
                    <option>Whipped Cream</option>
                    <option>Fondant</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">🗓️ Delivery Date</label>
                  <input
                    type="date"
                    className="form-control"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">🎂 Custom Message on Cake</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Happy Birthday Priya! 🎉"
                  id="c-msg"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Special Instructions / Theme
                </label>
                <textarea
                  className="form-control"
                  placeholder="Theme, allergies, design references, delivery instructions…"
                  id="c-notes"
                />
              </div>
              <button
                className="btn-wa"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  padding: "16px",
                  fontSize: "15px",
                }}
                onClick={() => {
                  const flavour =
                    document.getElementById("c-flavour")?.value || "";
                  const size = document.getElementById("c-size")?.value || "";
                  const msg = document.getElementById("c-msg")?.value || "";
                  const notes = document.getElementById("c-notes")?.value || "";
                  openWA(
                    `🎂 Custom Cake Order for ${brandName}\n\nFlavour: ${flavour}\nSize: ${size}\nMessage on cake: ${msg}\nInstructions: ${notes}`,
                  );
                }}
              >
                📱 Send Custom Order via WhatsApp
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────── */}
      <section className="testimonials-section section">
        <div className="container">
          <p className="section-label">💬 Testimonials</p>
          <h2 className="section-title">What Pune Says About Kirti</h2>
          <div className="testi-grid">
            {[
              {
                init: "P",
                name: "Priyanka Joshi",
                loc: `${city} · 2 weeks ago`,
                color: "var(--brown-mid)",
                text: `"${brandName}'s chocolate truffle cake was the star of my daughter's birthday! Everyone asked where it was from. Absolutely divine and beautifully presented."`,
              },
              {
                init: "R",
                name: "Rahul Kulkarni",
                loc: `${city} · 1 month ago`,
                color: "var(--pink-deep)",
                text: `"Ordered the anniversary hamper for my wife — she was in tears (happy ones!). Kirti's packaging and cake quality are genuinely premium. Highly recommend!"`,
              },
              {
                init: "S",
                name: "Sneha Deshmukh",
                loc: `${city} · 3 weeks ago`,
                color: "var(--brown-light)",
                text: `"Those salted caramel brownies are dangerously addictive. My entire office devoured them. ${brandName} is my go-to for every celebration in Pune now!"`,
              },
            ].map((t) => (
              <div key={t.name} className="testi-card card">
                <div className="testi-stars">★★★★★</div>
                <p className="testi-text">{t.text}</p>
                <div className="testi-author">
                  <div className="testi-avatar" style={{ background: t.color }}>
                    {t.init}
                  </div>
                  <div>
                    <p className="testi-name">{t.name}</p>
                    <p className="testi-loc">{t.loc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────── */}
      <section className="cta-banner">
        <div className="container">
          <span className="cta-emoji">🎉</span>
          <h2 className="cta-title">Ready to Order Your Perfect Cake?</h2>
          <p>
            Browse our full menu or send Kirti a message on WhatsApp — she's
            happy to help you plan the perfect treat! Delivery across{" "}
            {Array.isArray(S?.deliveryCities) && S.deliveryCities.length > 0
              ? S.deliveryCities.join(", ")
              : city}
            .
          </p>
          <div className="cta-btns">
            <button className="btn-wa cta-btn" onClick={() => openWA()}>
              📱 WhatsApp: +91{" "}
              {(S?.whatsappNumber || "919876543210").replace(/^91/, "")}
            </button>
            <button
              className="btn-outline cta-btn"
              onClick={() => navigate("/products")}
            >
              Browse All Products
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

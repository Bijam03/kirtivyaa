import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { settingsAPI } from '../services/api';

const useSettings = () => {
  const [s, setS] = useState(null);
  useEffect(() => { settingsAPI.get().then(r => setS(r.data.settings)).catch(() => {}); }, []);
  return s;
};

export const AboutPage = () => {
  const navigate = useNavigate();
  const s = useSettings();
  const brand = s?.brandName || 'Kirtivyaa';
  const owner = s?.ownerName || 'Kirti Agarwal';
  const city  = s?.city      || 'Pune';
  const wa    = s?.whatsappNumber || process.env.REACT_APP_WHATSAPP_NUMBER;
  const openWA = () => window.open(`https://wa.me/${wa}`, '_blank');

  return (
    <div style={{ paddingTop:68, background:'var(--cream)', minHeight:'100vh' }}>
      {/* Hero */}
      <div style={{ background:'linear-gradient(135deg,var(--cream-dark),var(--pink-light))', padding:'80px 0' }}>
        <div className="container" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'center' }}>
          <div>
            <p className="section-label">Our Story</p>
            <h1 className="section-title">Baked with Love,<br/>Served with Joy</h1>
            <p style={{ fontSize:15, color:'var(--brown-mid)', lineHeight:1.8, marginBottom:16 }}>
              {brand} is a home bakery in {city}, founded by <strong>{owner}</strong> — a passionate baker who discovered her love for chocolate cakes and desserts at age 14.
              What started as weekend experiments for family gatherings quickly became the most anticipated part of every celebration in the neighbourhood.
            </p>
            <p style={{ fontSize:15, color:'var(--brown-mid)', lineHeight:1.8, marginBottom:28 }}>
              Today, every cake that leaves {owner.split(' ')[0]}'s kitchen carries that same warmth and attention to detail.
              We use only the finest Belgian chocolate and real Amul butter — no preservatives, no artificial flavours, no shortcuts.
              Because you and your loved ones deserve the very best.
            </p>
            <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
              <button className="btn-primary" onClick={() => navigate('/products')}>Explore Our Menu</button>
              <button className="btn-wa" onClick={openWA}>📱 Chat with {owner.split(' ')[0]}</button>
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'center', position:'relative' }}>
            <div style={{ width:300, height:300, background:'linear-gradient(135deg,var(--cream-mid),var(--pink))', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:120, boxShadow:'0 20px 60px rgba(61,30,15,0.15)' }}>👩‍🍳</div>
            <div style={{ position:'absolute', bottom:10, right:10, background:'var(--brown)', borderRadius:16, padding:'14px 20px', textAlign:'center' }}>
              <span style={{ display:'block', fontFamily:'var(--ff-display)', fontSize:28, fontWeight:700, color:'var(--gold-light)' }}>{s?.heroStatYears || '5+'}yrs</span>
              <span style={{ fontSize:10, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color:'rgba(253,246,236,0.7)' }}>of Baking</span>
            </div>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="section" style={{ background:'var(--white)' }}>
        <div className="container">
          <p className="section-label">Our Promise</p>
          <h2 className="section-title">Why {city} Loves {brand}</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, marginTop:36 }}>
            {[
              { icon:'🍫', title:'100% Premium Ingredients', desc:'Belgian chocolate, real Amul butter, fresh cream & natural ingredients. 100% vegetarian, no artificial flavours — ever.' },
              { icon:'🌅', title:'Baked Fresh Every Day',    desc:'Every cake is baked on the morning of delivery. Freshness is non-negotiable.' },
              { icon:'💌', title:'Made with Personal Care',  desc:`Every order is personally handled by ${owner.split(' ')[0]}. From batter to box, each one is like family.` },
              { icon:'🚚', title:`Delivery Across ${city}`,  desc:`We deliver to ${(s?.deliveryCities || ['Kothrud','Baner','Aundh','Viman Nagar']).join(', ')} and more.` },
              { icon:'🎨', title:'Fully Customisable',        desc:'Custom flavours, themes, sizes and messages. Your dream cake, brought to life.' },
              { icon:'🔒', title:'FSSAI Certified Kitchen',  desc:`Hygienic home kitchen with all safety standards. ${s?.fssaiNumber ? 'FSSAI: ' + s.fssaiNumber : 'FSSAI Certified.'}` },
            ].map(v => (
              <div key={v.title} style={{ background:'var(--cream)', borderRadius:20, padding:28, boxShadow:'var(--shadow-sm)' }}>
                <span style={{ fontSize:32, display:'block', marginBottom:12 }}>{v.icon}</span>
                <p style={{ fontFamily:'var(--ff-display)', fontSize:16, fontWeight:600, color:'var(--brown)', marginBottom:8 }}>{v.title}</p>
                <p style={{ fontSize:13, color:'var(--brown-light)', lineHeight:1.6 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ background:'var(--brown)', padding:'60px 0' }}>
        <div className="container" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20, textAlign:'center' }}>
          {[
            [s?.heroStatCustomers||'1,000+','Happy Customers'],
            [s?.heroStatVarieties||'30+',   'Cake Varieties'],
            [s?.heroStatRating   ||'4.9 ★', 'Average Rating'],
            [s?.heroStatYears    ||'5+',    'Years of Joy'],
          ].map(([n,l]) => (
            <div key={l}>
              <p style={{ fontFamily:'var(--ff-display)', fontSize:36, fontWeight:700, color:'var(--gold-light)', marginBottom:6 }}>{n}</p>
              <p style={{ fontSize:12, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(253,246,236,0.55)' }}>{l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ContactPage = () => {
  const s = useSettings();
  const brand = s?.brandName || 'Kirtivyaa';
  const wa    = s?.whatsappNumber || process.env.REACT_APP_WHATSAPP_NUMBER;
  const phone = wa?.replace(/^91/, '') || '9876543210';
  const openWA = (msg='') => window.open(`https://wa.me/${wa}${msg?'?text='+encodeURIComponent(msg):''}`, '_blank');

  return (
    <div style={{ paddingTop:68, background:'var(--cream)', minHeight:'100vh' }}>
      <div style={{ background:'linear-gradient(135deg,var(--cream-dark),var(--pink-light))', padding:'60px 0 40px' }}>
        <div className="container">
          <p className="section-label">Get in Touch</p>
          <h1 className="page-title">Contact {brand}</h1>
          <p style={{ color:'var(--brown-light)', marginTop:6 }}>We're just a WhatsApp message away!</p>
        </div>
      </div>
      <div className="container" style={{ padding:'50px 5vw 80px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:20, marginBottom:28 }}>
          {[
            { icon:'📱', bg:'#dcf5e8', title:'WhatsApp (Preferred)', detail:`+91 ${phone}\n${s?.openingHours || 'Mon–Sun: 8 AM – 8 PM'}`, action:() => openWA(), label:'💬 Chat Now', btnBg:'var(--green)' },
            { icon:'📧', bg:'#e8f0fe', title:'Email',                detail:`${s?.email || 'hello@kirtivyaa.in'}\nWe reply within a few hours`, action:() => window.open(`mailto:${s?.email||'hello@kirtivyaa.in'}`), label:'✉️ Send Email', btnBg:'var(--brown)' },
            { icon:'📍', bg:'var(--cream-dark)', title:'Location',   detail:`${s?.address || 'Kothrud, Pune, Maharashtra — 411038'}\n\nHome delivery available!`, action: null },
            { icon:'⏰', bg:'var(--cream-dark)', title:'Timings',    detail:`${s?.openingHours || 'Monday – Sunday, 8 AM – 8 PM'}\n\nOrder by 10 AM for same-day delivery.`, action: null },
          ].map(c => (
            <div key={c.title} style={{ background:'var(--white)', borderRadius:20, padding:28, boxShadow:'var(--shadow-sm)' }}>
              <div style={{ width:50, height:50, borderRadius:14, background:c.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:14 }}>{c.icon}</div>
              <p style={{ fontFamily:'var(--ff-display)', fontSize:17, fontWeight:600, color:'var(--brown)', marginBottom:8 }}>{c.title}</p>
              <p style={{ fontSize:14, color:'var(--brown-mid)', lineHeight:1.7, whiteSpace:'pre-line', marginBottom: c.action ? 14 : 0 }}>{c.detail}</p>
              {c.action && <button onClick={c.action} style={{ padding:'8px 18px', background:c.btnBg, color:'#fff', border:'none', borderRadius:'999px', fontSize:12, fontWeight:600, fontFamily:'var(--ff-body)', cursor:'pointer' }}>{c.label}</button>}
            </div>
          ))}
        </div>

        <div style={{ background:'var(--white)', borderRadius:20, padding:32, boxShadow:'var(--shadow-sm)', maxWidth:700 }}>
          <h3 style={{ fontFamily:'var(--ff-display)', fontSize:22, color:'var(--brown)', marginBottom:22 }}>📬 Send a Message</h3>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Your Name</label><input className="form-control" placeholder="Priyanka Joshi" id="ct-name" /></div>
            <div className="form-group"><label className="form-label">Phone / WhatsApp</label><input className="form-control" type="tel" placeholder="98765 43210" id="ct-phone" /></div>
          </div>
          <div className="form-group"><label className="form-label">Message</label><textarea className="form-control" style={{ minHeight:110 }} placeholder={`What can ${brand} help you with? Cake enquiries, custom orders, feedback…`} id="ct-msg" /></div>
          <button className="btn-wa" style={{ width:'100%', justifyContent:'center', padding:14, fontSize:15 }}
            onClick={() => {
              const n = document.getElementById('ct-name')?.value || '';
              const p = document.getElementById('ct-phone')?.value || '';
              const m = document.getElementById('ct-msg')?.value || '';
              openWA(`Hi ${brand}! 👋\nI'm ${n} (${p}).\n\n${m}`);
            }}>
            📱 Send via WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

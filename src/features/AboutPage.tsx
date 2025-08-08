import React, { useEffect, useState, useRef } from "react";

export default function AboutPage() {
  const [data, setData] = useState(null);
  const sectionRefs = {
    Home: useRef(null),
    Services: useRef(null),
    Products: useRef(null),
    Signup: useRef(null)
  };

  useEffect(() => {
    fetch("content.json")
      .then(res => res.json())
      .then(setData);
  }, []);

  const scrollTo = (section) => {
    sectionRefs[section].current.scrollIntoView({ behavior: "smooth" });
  };

  if (!data) return <div>Loading…</div>;

  return (
    <div style={{ fontFamily: "Inter, sans-serif", color: "#23235b" }}>
     
      {/* Home Section */}
      <section ref={sectionRefs.Home} style={{ padding: "70px 0 40px", textAlign: "center", background: "#f8f9fe" }}>
        <h1 style={{ fontSize: "2.2em", fontWeight: 800, marginBottom: 16 }}>{data.home.headline}</h1>
        <p style={{ fontSize: "1.1em", color: "#444", margin: "0 auto", maxWidth: 420 }}>{data.home.text}</p>
      </section>

      {/* Services Section */}
      <section ref={sectionRefs.Services} style={{ padding: "60px 0 40px", background: "#fff" }}>
        <h2 style={{ textAlign: "center", fontWeight: 700, fontSize: "1.6em" }}>Our Services</h2>
        <div style={{ display: "flex", justifyContent: "center", gap: 32, marginTop: 32, flexWrap: "wrap" }}>
          {data.services.map(srv => (
            <div key={srv.name} style={{
              background: "#f8f9fe", borderRadius: 10, boxShadow: "0 2px 8px #eee",
              padding: 24, minWidth: 220, maxWidth: 280
            }}>
              <div style={{ fontWeight: 700, marginBottom: 12, fontSize: "1.11em" }}>{srv.name}</div>
              <div style={{ color: "#555" }}>{srv.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Products Section */}
      <section ref={sectionRefs.Products} style={{ padding: "60px 0 40px", background: "#f8f9fe" }}>
        <h2 style={{ textAlign: "center", fontWeight: 700, fontSize: "1.6em" }}>Products</h2>
        <div style={{ display: "flex", justifyContent: "center", gap: 32, marginTop: 32, flexWrap: "wrap" }}>
          {data.products.map(prod => (
            <div key={prod.title} style={{
              background: "#fff", borderRadius: 10, boxShadow: "0 2px 10px #e0e0ef",
              padding: 24, minWidth: 220, maxWidth: 280
            }}>
              <div style={{ fontWeight: 700, marginBottom: 12, fontSize: "1.08em" }}>{prod.title}</div>
              <div style={{ color: "#555" }}>{prod.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Signup Section */}
      <section ref={sectionRefs.Signup} style={{ padding: "70px 0 40px", textAlign: "center", background: "#fff" }}>
        <h2 style={{ fontWeight: 700, fontSize: "1.4em" }}>Sign Up for Updates</h2>
        <form style={{ marginTop: 24, display: "inline-block" }} onSubmit={e => e.preventDefault()}>
          <input type="email" placeholder="Your Email" required
            style={{
              padding: "10px 20px",
              border: "1px solid #bbb", borderRadius: "6px 0 0 6px",
              minWidth: 220, fontSize: 16
            }} />
          <button type="submit"
            style={{
              padding: "10px 28px", background: "#23235b", color: "#fff",
              border: "none", borderRadius: "0 6px 6px 0", fontSize: 16,
              cursor: "pointer"
            }}>
            Sign Up
          </button>
        </form>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: "center", color: "#888", fontSize: 15, padding: "32px 0 14px", background: "#f8f9fe" }}>
        {data.footer}
      </footer>
    </div>
  );
}

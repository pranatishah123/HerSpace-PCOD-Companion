import React, { useState } from "react";
import emailjs from "@emailjs/browser";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/**
 * EmailJS setup (dashboard.emailjs.com):
 * 1. Create Email Service + Email Template.
 * 2. In the template body, use: {{from_name}}, {{from_email}}, {{message}}
 *    (or rename keys below to match your template variable names.)
 * 3. Add to .env:
 *    VITE_EMAILJS_PUBLIC_KEY=your_public_key
 *    VITE_EMAILJS_SERVICE_ID=your_service_id
 *    VITE_EMAILJS_TEMPLATE_ID=your_template_id
 */

const S = {
  page: { textAlign: "center" },
  pageTitle: { fontSize: "clamp(24px, 3.5vw, 40px)", fontWeight: "900", color: "#1a1a2e", marginBottom: "10px" },
  pink: { color: "#CD2C58" },
  pageSubtext: { fontSize: "15px", color: "#555", marginBottom: "28px" },
  glassCard: {
    background: "rgba(255,255,255,0.45)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    border: "1px solid rgba(255,255,255,0.85)",
    borderRadius: "24px",
    padding: "36px",
    textAlign: "left",
    boxShadow: "0 8px 32px rgba(205,44,88,0.12)",
  },
  label: { display: "block", fontSize: "13px", fontWeight: "600", color: "#333", marginBottom: "6px" },
  input: {
    width: "100%",
    padding: "11px 14px",
    border: "1.5px solid rgba(205,44,88,0.2)",
    borderRadius: "12px",
    fontSize: "14px",
    outline: "none",
    background: "rgba(255,255,255,0.65)",
    backdropFilter: "blur(8px)",
    boxSizing: "border-box",
    fontFamily: "'Segoe UI', sans-serif",
  },
  primaryBtn: {
    padding: "13px 32px",
    border: "none",
    borderRadius: "30px",
    background: "linear-gradient(135deg, #E06C9F, #CD2C58)",
    color: "white",
    fontWeight: "700",
    fontSize: "15px",
    cursor: "pointer",
    boxShadow: "0 6px 20px rgba(205,44,88,0.4)",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  },
};

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      toast.error("Please fill in your name, email, and message.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!publicKey || !serviceId || !templateId) {
      toast.error(
        "Email is not configured yet. Add VITE_EMAILJS_PUBLIC_KEY, VITE_EMAILJS_SERVICE_ID, and VITE_EMAILJS_TEMPLATE_ID to your .env file."
      );
      return;
    }

    setSubmitting(true);
    try {
      await emailjs.send(
        serviceId,
        templateId,
        {
          from_name: trimmedName,
          from_email: trimmedEmail,
          message: trimmedMessage,
        },
        publicKey
      );
      toast.success("Message sent! We'll get back to you soon. 💕");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      console.error("EmailJS error:", err);
      const msg =
        typeof err?.text === "string"
          ? err.text
          : err?.message || "Could not send message. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section style={{ ...S.page, maxWidth: "500px", margin: "0 auto" }}>
      <ToastContainer position="top-center" autoClose={3800} toastStyle={{ borderRadius: "16px", fontFamily: "'Segoe UI', sans-serif" }} />
      <h2 style={S.pageTitle}>
        Get In <span style={S.pink}>Touch</span>
      </h2>
      <p style={S.pageSubtext}>We&apos;d love to hear from you.</p>
      <form style={S.glassCard} onSubmit={handleSubmit} noValidate>
        <div style={{ marginBottom: "16px" }}>
          <label style={S.label} htmlFor="contact-name">
            Your Name
          </label>
          <input
            id="contact-name"
            name="from_name"
            type="text"
            autoComplete="name"
            placeholder="e.g. Priya Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={S.input}
            disabled={submitting}
          />
        </div>
        <div style={{ marginBottom: "16px" }}>
          <label style={S.label} htmlFor="contact-email">
            Email Address
          </label>
          <input
            id="contact-email"
            name="from_email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={S.input}
            disabled={submitting}
          />
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label style={S.label} htmlFor="contact-message">
            Message
          </label>
          <textarea
            id="contact-message"
            name="message"
            rows={5}
            placeholder="Your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{ ...S.input, height: "auto", minHeight: "100px", resize: "vertical" }}
            disabled={submitting}
          />
        </div>
        <button type="submit" style={{ ...S.primaryBtn, opacity: submitting ? 0.75 : 1, cursor: submitting ? "wait" : "pointer" }} disabled={submitting}>
          {submitting ? "Sending…" : "Send Message"} 💌
        </button>
      </form>
    </section>
  );
}

"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import {
  compressImageFile,
  formatFileSize,
} from "@/lib/compressImage";
import {
  createMetaEventId,
  META_EVENT_INITIATE_CHECKOUT,
  trackMetaEvent,
} from "@/lib/metaTracking";

type PayMethod = "bank" | "easy";

export default function PayPageClient() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [method, setMethod] = useState<PayMethod>("bank");
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [sizeNote, setSizeNote] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fields, setFields] = useState({
    fn: "",
    ln: "",
    phone: "",
    phoneCountry: "PK",
    email: "",
    city: "",
  });

  function copyText(id: string) {
    const el = document.getElementById(id);
    if (!el?.textContent) return;
    void navigator.clipboard.writeText(el.textContent);
  }

  function validateStep1() {
    const next: Record<string, string> = {};
    if (!fields.fn.trim()) next.fn = "Please enter your first name.";
    if (!fields.ln.trim()) next.ln = "Please enter your last name.";
    if (!fields.phone.trim()) next.phone = "Please enter your phone number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))
      next.email = "Please enter a valid email address.";
    if (!fields.city.trim()) next.city = "Please enter your city.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function goNext() {
    if (validateStep1()) setStep(2);
  }

  function clearScreenshot() {
    setScreenshotFile(null);
    setPreview(null);
    setFileName("");
    setSizeNote(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onFileChange(file: File | undefined) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        screenshot: "Screenshot must be 5MB or smaller.",
      }));
      return;
    }
    setCompressing(true);
    setSubmitError(null);
    try {
      const { file: compressed, originalBytes, compressedBytes } =
        await compressImageFile(file);
      setScreenshotFile(compressed);
      setFileName(compressed.name);
      setSizeNote(
        `Compressed: ${formatFileSize(originalBytes)} → ${formatFileSize(compressedBytes)}`,
      );
      setErrors((prev) => {
        const { screenshot: _, ...rest } = prev;
        return rest;
      });
      const reader = new FileReader();
      reader.onload = () => setPreview(String(reader.result));
      reader.readAsDataURL(compressed);
    } catch {
      setErrors((prev) => ({
        ...prev,
        screenshot: "Could not process image. Try another JPG or PNG.",
      }));
      clearScreenshot();
    } finally {
      setCompressing(false);
    }
  }

  async function submitConfirmation(e: FormEvent) {
    e.preventDefault();
    if (submitSuccess) return;
    if (!screenshotFile || !fileName) {
      setErrors((prev) => ({
        ...prev,
        screenshot: "Please upload payment screenshot.",
      }));
      return;
    }

    const checkoutEventId = createMetaEventId();
    const checkoutEventSourceUrl = window.location.href;
    trackMetaEvent(META_EVENT_INITIATE_CHECKOUT, {
      eventId: checkoutEventId,
      eventSourceUrl: checkoutEventSourceUrl,
      userData: {
        email: fields.email || null,
        phone: fields.phone || null,
        firstName: fields.fn || null,
        lastName: fields.ln || null,
      },
      customData: {
        currency: "PKR",
        value: 4500,
      },
    });

    setSubmitting(true);
    setSubmitError(null);
    try {
      const formData = new FormData();
      formData.append("fn", fields.fn);
      formData.append("ln", fields.ln);
      formData.append("phone", fields.phone);
      formData.append("phoneCountry", fields.phoneCountry);
      formData.append("email", fields.email);
      formData.append("city", fields.city);
      formData.append("payment_method", method);
      formData.append("currency", "PKR");
      formData.append("event_name", "payment_screenshot_submitted");
      formData.append("screenshot", screenshotFile);

      const res = await fetch("/api/enroll-stub", {
        method: "POST",
        body: formData,
      });
      let json: { ok?: boolean; error?: string; hint?: string } = {};
      try {
        json = (await res.json()) as typeof json;
      } catch {
        setSubmitError("Server returned an invalid response. Try again.");
        return;
      }
      if (!res.ok || !json.ok) {
        const message =
          [json.error, json.hint].filter(Boolean).join(" — ") ||
          "Could not save enrollment. Check Supabase setup.";
        setSubmitError(message);
        return;
      }
      setSubmitSuccess(true);
      setModalOpen(true);
    } catch {
      setSubmitError("Network error. Check that npm run dev is running.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <header className="pay-topbar">
        <Link className="pay-topbar__back" href="/" aria-label="Back to home">
          Back
        </Link>
        <h1 className="pay-topbar__title">Enroll Now</h1>
      </header>

      <main>
        <section
          className="pay-step pay-step--details"
          id="pay-step-contact"
          aria-labelledby="pay-step-1-title"
          hidden={step !== 1}
        >
          <div className="pay-step__inner">
            <header className="pay-step__head">
              <span className="pay-step__num" aria-hidden="true">
                1
              </span>
              <div>
                <p className="pay-step__kicker">Step 1</p>
                <h2 id="pay-step-1-title" className="pay-step__title">
                  Your Details
                </h2>
              </div>
            </header>

            <div className="confirm-card">
              <div className="d-field">
                <span className="d-field__label">Name *</span>
                <div className="pay-name-row">
                  <div>
                    <label className="sr-only" htmlFor="c-fn">
                      First name
                    </label>
                    <input
                      className="d-field__input"
                      type="text"
                      id="c-fn"
                      value={fields.fn}
                      onChange={(e) =>
                        setFields((f) => ({ ...f, fn: e.target.value }))
                      }
                      placeholder="First name"
                      autoComplete="given-name"
                      maxLength={60}
                    />
                    {!errors.fn ? null : (
                      <p className="form-error" role="alert">
                        {errors.fn}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="sr-only" htmlFor="c-ln">
                      Last name
                    </label>
                    <input
                      className="d-field__input"
                      type="text"
                      id="c-ln"
                      value={fields.ln}
                      onChange={(e) =>
                        setFields((f) => ({ ...f, ln: e.target.value }))
                      }
                      placeholder="Last name"
                      autoComplete="family-name"
                      maxLength={60}
                    />
                    {!errors.ln ? null : (
                      <p className="form-error" role="alert">
                        {errors.ln}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="d-field">
                <label className="d-field__label" htmlFor="c-phone">
                  Phone Number *
                </label>
                <div className="pay-phone-row">
                  <select
                    className="d-field__input pay-phone-country"
                    id="c-phone-country"
                    aria-label="Phone country"
                    value={fields.phoneCountry}
                    onChange={(e) =>
                      setFields((f) => ({ ...f, phoneCountry: e.target.value }))
                    }
                  >
                    <option value="PK">Pakistan</option>
                    <option value="SA">Saudi Arabia</option>
                    <option value="AE">United Arab Emirates</option>
                    <option value="QA">Qatar</option>
                    <option value="OM">Oman</option>
                    <option value="GB">United Kingdom</option>
                  </select>
                  <input
                    className="d-field__input pay-phone-number"
                    type="tel"
                    id="c-phone"
                    value={fields.phone}
                    onChange={(e) =>
                      setFields((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="0300 XXXXXXX"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={20}
                  />
                </div>
                {!errors.phone ? null : (
                  <p className="form-error" role="alert">
                    {errors.phone}
                  </p>
                )}
              </div>

              <div className="d-field">
                <label className="d-field__label" htmlFor="c-email">
                  Email *
                </label>
                <input
                  className="d-field__input"
                  type="email"
                  id="c-email"
                  value={fields.email}
                  onChange={(e) =>
                    setFields((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                  maxLength={120}
                />
                {!errors.email ? null : (
                  <p className="form-error" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="d-field">
                <label className="d-field__label" htmlFor="c-city">
                  City *
                </label>
                <input
                  className="d-field__input"
                  type="text"
                  id="c-city"
                  value={fields.city}
                  onChange={(e) =>
                    setFields((f) => ({ ...f, city: e.target.value }))
                  }
                  placeholder="e.g. Karachi"
                  autoComplete="address-level2"
                  maxLength={80}
                />
                {!errors.city ? null : (
                  <p className="form-error" role="alert">
                    {errors.city}
                  </p>
                )}
              </div>

              <button
                className="submit-pay-btn"
                id="contact-next-btn"
                type="button"
                onClick={goNext}
              >
                <span className="btn-text">Next</span>
              </button>
            </div>
          </div>
        </section>

        <section
          className="pay-step pay-step--method-panel"
          id="payment-section"
          aria-labelledby="pay-step-2-title"
          hidden={step !== 2}
        >
          <div className="pay-step__inner">
            <header className="pay-step__head">
              <span className="pay-step__num" aria-hidden="true">
                2
              </span>
              <div>
                <p className="pay-step__kicker">Step 2</p>
                <h2 id="pay-step-2-title" className="pay-step__title">
                  Payment Method
                </h2>
              </div>
            </header>

            <div className="pay-tabs" role="tablist">
              <button
                type="button"
                className={`pay-tab ${method === "bank" ? "active" : ""}`}
                id="tab-bank"
                role="tab"
                aria-selected={method === "bank"}
                onClick={() => setMethod("bank")}
              >
                <span className="tab-emoji" aria-hidden="true">
                  🏦
                </span>
                Bank Transfer
              </button>
              <button
                type="button"
                className={`pay-tab ${method === "easy" ? "active" : ""}`}
                id="tab-easy"
                role="tab"
                aria-selected={method === "easy"}
                onClick={() => setMethod("easy")}
              >
                <span className="tab-emoji" aria-hidden="true">
                  📱
                </span>
                EasyPaisa
              </button>
            </div>

            {method === "bank" ? (
              <div className="pay-detail" id="detail-bank">
                <div className="detail-row">
                  <span className="detail-lbl">Bank</span>
                  <span className="detail-val">HBL</span>
                </div>
                <div className="detail-row">
                  <span className="detail-lbl">Account Name</span>
                  <span className="detail-val">Ahmed Ali</span>
                </div>
                <div className="detail-row">
                  <span className="detail-lbl">Account No.</span>
                  <span className="detail-val">
                    <span id="bank-acc">00537900951003</span>
                    <button
                      type="button"
                      className="copy-btn"
                      onClick={() => copyText("bank-acc")}
                    >
                      Copy
                    </button>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-lbl">IBAN</span>
                  <span className="detail-val">
                    <span id="bank-iban">PK02HABB0000537900951003</span>
                    <button
                      type="button"
                      className="copy-btn"
                      onClick={() => copyText("bank-iban")}
                    >
                      Copy
                    </button>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-lbl">Amount</span>
                  <span className="detail-val detail-val--accent">Rs. 4,500</span>
                </div>
                <div className="method-note">
                  💡 After transfer, take a screenshot and upload it below.
                </div>
              </div>
            ) : (
              <div className="pay-detail" id="detail-easy">
                <div className="detail-row">
                  <span className="detail-lbl">EasyPaisa No.</span>
                  <span className="detail-val">
                    <span id="easy-num">03321319363</span>
                    <button
                      type="button"
                      className="copy-btn"
                      onClick={() => copyText("easy-num")}
                    >
                      Copy
                    </button>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-lbl">Account Name</span>
                  <span className="detail-val">Ahmed Ali</span>
                </div>
                <div className="detail-row">
                  <span className="detail-lbl">Amount</span>
                  <span className="detail-val detail-val--accent">Rs. 4,500</span>
                </div>
                <div className="method-note">
                  💚 Use EasyPaisa app or *786# to send. Take a screenshot and
                  upload below.
                </div>
              </div>
            )}

            <button
              type="button"
              className="submit-pay-btn"
              style={{ marginTop: 20 }}
              onClick={() => setStep(3)}
            >
              <span className="btn-text">Continue to upload</span>
            </button>
          </div>
        </section>

        <section
          className="pay-step pay-step--upload"
          id="pay-step-upload"
          aria-labelledby="pay-step-3-title"
          hidden={step !== 3}
        >
          <div className="pay-step__inner">
            <header className="pay-step__head">
              <span className="pay-step__num" aria-hidden="true">
                3
              </span>
              <div>
                <p className="pay-step__kicker">Step 3</p>
                <h2 id="pay-step-3-title" className="pay-step__title">
                  Upload Payment Screenshot / Image
                </h2>
              </div>
            </header>

            <form className="confirm-card" onSubmit={submitConfirmation}>
              <div className="d-field">
                <label className="d-field__label" htmlFor="c-screenshot">
                  Payment Screenshot *
                </label>
                <div
                  className={`upload-area${compressing ? " upload-area--busy" : ""}`}
                  id="upload-area"
                  hidden={Boolean(preview) && !compressing}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = "var(--color-primary)";
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = "";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = "";
                    const file = e.dataTransfer.files?.[0];
                    if (file) onFileChange(file);
                  }}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    id="c-screenshot"
                    accept="image/jpeg,image/png,image/webp"
                    aria-label="Upload payment screenshot"
                    onChange={(e) => {
                      onFileChange(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                  <span className="upload-icon" aria-hidden="true">
                    📸
                  </span>
                  <p className="upload-text">Click or drag & drop here</p>
                  <p className="upload-hint">
                    {compressing
                      ? "Compressing image…"
                      : "JPG, PNG — Max 5MB (auto-compressed before upload)"}
                  </p>
                </div>
                {preview ? (
                  <div className="upload-preview visible" id="upload-preview">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      id="preview-img"
                      className="pay-preview-thumb"
                      src={preview}
                      alt="Screenshot preview"
                      onClick={() => setLightboxOpen(true)}
                    />
                    <p className="upload-filename" id="upload-filename">
                      {fileName}
                    </p>
                    {sizeNote ? (
                      <p className="upload-preview__meta">{sizeNote}</p>
                    ) : null}
                    <div className="upload-preview__actions">
                      <button
                        type="button"
                        className="upload-preview__btn"
                        onClick={() => setLightboxOpen(true)}
                      >
                        View full size
                      </button>
                      <button
                        type="button"
                        className="upload-preview__btn upload-preview__btn--danger"
                        disabled={submitSuccess || submitting}
                        onClick={clearScreenshot}
                      >
                        Remove image
                      </button>
                    </div>
                  </div>
                ) : null}
                {!errors.screenshot ? null : (
                  <p className="form-error" role="alert">
                    {errors.screenshot}
                  </p>
                )}
              </div>

              <button
                className="submit-pay-btn"
                id="confirm-btn"
                type="submit"
                disabled={
                  submitting ||
                  submitSuccess ||
                  compressing ||
                  !screenshotFile
                }
              >
                <span className="btn-text">
                  {submitSuccess
                    ? "Confirmation sent"
                    : submitting
                      ? "Sending…"
                      : "Send Confirmation"}
                </span>
              </button>
              {submitError ? (
                <p
                  className="form-error"
                  role="alert"
                  style={{ marginTop: 12, whiteSpace: "pre-wrap" }}
                >
                  {submitError}
                </p>
              ) : null}
              <p className="c-form__note" style={{ marginTop: 12 }}>
                Your details are saved to Supabase when you confirm payment.
              </p>
            </form>
          </div>
        </section>
      </main>

      <footer className="pay-footer">
        <p>
          © 2026 <Link href="/">AI Web Crafts</Link>. All rights reserved.
        </p>
      </footer>

      <div
        className="pay-image-lightbox"
        hidden={!lightboxOpen || !preview}
        role="dialog"
        aria-modal="true"
        aria-label="Enlarged screenshot"
        onClick={() => setLightboxOpen(false)}
      >
        <button
          type="button"
          className="pay-image-lightbox__close"
          aria-label="Close"
          onClick={() => setLightboxOpen(false)}
        >
          ×
        </button>
        {preview ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            className="pay-image-lightbox__img"
            src={preview}
            alt="Full size screenshot"
            onClick={(e) => e.stopPropagation()}
          />
        ) : null}
      </div>

      <div
        className="thank-modal"
        id="paymentSuccessModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payModalTitle"
        hidden={!modalOpen}
      >
        <div
          className="thank-modal__backdrop"
          id="payModalBackdrop"
          onClick={() => setModalOpen(false)}
        />
        <div className="thank-modal__dialog" role="document">
          <span className="thank-modal__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="1.5"
                opacity="0.25"
              />
              <path
                d="M8 12.5l2.75 2.75L16 9.5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <h2 className="thank-modal__title" id="payModalTitle">
            Payment Submitted!
          </h2>
          <p className="thank-modal__text">
            Thank you! We will verify your payment and confirm your enrollment
            within 24 hours.
          </p>
          <button
            type="button"
            className="thank-modal__close"
            id="payModalCloseBtn"
            onClick={() => setModalOpen(false)}
          >
            Got it!
          </button>
        </div>
      </div>
    </>
  );
}
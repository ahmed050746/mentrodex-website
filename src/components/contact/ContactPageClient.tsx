"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

const QUIZ = [
  {
    id: "q1",
    name: "c-q1-reason",
    legend: "Aap E-commerce kyun seekhna chahte hain?",
    question: "Aap E-commerce kyun seekhna chahte hain?",
    options: [
      "Apna online business start karna hai",
      "Existing business ko online grow karna hai",
      "Part-time income source banana hai",
      "Sirf information lena chahta/chahti hoon",
    ],
  },
  {
    id: "q2",
    name: "c-q2-experience",
    legend: "Aapka E-commerce/Shopify ka experience kitna hai?",
    question: "Aapka E-commerce/Shopify ka experience kitna hai?",
    options: [
      "Bilkul beginner hoon",
      "Thora bohat experience hai",
      "Pehle Shopify/Dropshipping try ki hai",
      "Already online business kar raha/rahi hoon",
    ],
  },
  {
    id: "q3",
    name: "c-q3-timeline",
    legend: "Aap training kab start karna chahte hain?",
    question: "Aap training kab start karna chahte hain?",
    options: [
      "Abhi / isi week",
      "1–2 weeks mein",
      "Is month mein",
      "Abhi sirf information chahiye",
    ],
  },
  {
    id: "q4",
    name: "c-q4-budget",
    legend:
      "1-on-1 mentorship ki fee Rs. 4,500 hai. Kya aap is investment ke liye ready hain?",
    question:
      "1-on-1 mentorship ki fee Rs. 4,500 hai. Agar training aapke liye suitable ho, kya aap is investment ke liye ready hain?",
    options: [
      "Ji, main serious hoon",
      "Pehle complete details samajhna chahta/chahti hoon",
      "Abhi budget available nahi hai",
    ],
  },
] as const;

export default function ContactPageClient() {
  const [openQuiz, setOpenQuiz] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const answeredCount = useMemo(
    () => QUIZ.filter((q) => answers[q.name]).length,
    [answers],
  );

  function toggleQuiz(index: number) {
    setOpenQuiz((current) => (current === index ? -1 : index));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Please enter your name.";
    if (!phone.trim() || !/^\d+$/.test(phone.replace(/\s/g, "")))
      next.phone = "Please enter a valid phone number.";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "Please enter a valid email.";
    QUIZ.forEach((q) => {
      if (!answers[q.name]) next[q.name] = "Please select an option.";
    });
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/contact-stub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email: email || null,
          quiz_answers: answers,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; hint?: string };
      if (!res.ok || !json.ok) {
        window.alert(
          [json.error, json.hint].filter(Boolean).join("\n\n") ||
            "Could not save your details. Check Supabase setup.",
        );
        return;
      }
      setModalOpen(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <header className="c-topbar">
        <Link className="c-topbar__back" href="/" aria-label="Back to home">
          Back
        </Link>
        <Link className="c-topbar__brand" href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/logo.png" alt="" />
          <span>AI Web Crafts</span>
        </Link>
      </header>

      <main>
        <section className="c-hero" aria-labelledby="c-hero-title">
          <p className="c-hero__eyebrow">
            <span className="c-hero__eyebrow-dot" aria-hidden="true" />
            1-on-1 Mentorship
          </p>
          <h1 className="c-hero__title" id="c-hero-title">
            Contact Us
          </h1>
          <p className="c-hero__sub">
            Book your consultation below and let’s discuss how you can start and
            grow your e-commerce journey.
          </p>
        </section>

        <div className="c-wrap">
          <section className="c-card c-form-card" aria-labelledby="c-form-title">
            <div className="c-form__head">
              <div>
                <h2 className="c-form__title" id="c-form-title">
                  Fill the Form
                </h2>
                <p className="c-form__sub">Sirf 1 minute lagega.</p>
              </div>
              <span className="c-progress" aria-live="polite">
                {answeredCount} / 4 answered
              </span>
            </div>

            <form className="c-form" id="contactForm" onSubmit={onSubmit} noValidate>
              <div className="c-form__row">
                <div className="d-field">
                  <label className="d-field__label" htmlFor="c-name">
                    Name <em>*</em>
                  </label>
                  <input
                    className="d-field__input"
                    type="text"
                    id="c-name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    autoComplete="name"
                    maxLength={120}
                  />
                  {errors.name ? (
                    <p className="form-error" role="alert">
                      {errors.name}
                    </p>
                  ) : null}
                </div>
                <div className="d-field">
                  <label className="d-field__label" htmlFor="c-phone">
                    Phone <em>*</em>
                  </label>
                  <input
                    className="d-field__input"
                    type="tel"
                    id="c-phone"
                    name="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="03001234567"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={20}
                  />
                  {errors.phone ? (
                    <p className="form-error" role="alert">
                      {errors.phone}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="d-field">
                <label className="d-field__label" htmlFor="c-email">
                  Email{" "}
                  <span style={{ color: "var(--color-text-subtle)", fontWeight: 400 }}>
                    (optional)
                  </span>
                </label>
                <input
                  className="d-field__input"
                  type="email"
                  id="c-email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  maxLength={120}
                />
                {errors.email ? (
                  <p className="form-error" role="alert">
                    {errors.email}
                  </p>
                ) : null}
              </div>

              <div className="c-form__divider">A few quick questions</div>

              {QUIZ.map((q, index) => {
                const open = openQuiz === index;
                const answered = Boolean(answers[q.name]);
                return (
                  <fieldset
                    key={q.id}
                    className={`quiz-field${open ? " is-open" : ""}${answered ? " is-answered" : ""}`}
                  >
                    <legend className="sr-only">{q.legend}</legend>
                    <button
                      type="button"
                      className="quiz-field__header"
                      aria-expanded={open}
                      aria-controls={`c-quiz-panel-${index + 1}`}
                      onClick={() => toggleQuiz(index)}
                    >
                      <span className="quiz-field__num" aria-hidden="true">
                        {index + 1}
                      </span>
                      <span className="quiz-field__qtext">
                        {q.question} <em>*</em>
                        <span className="quiz-field__answer">
                          {answers[q.name] ?? ""}
                        </span>
                      </span>
                      <svg
                        className="quiz-field__chevron"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M6 9l6 6 6-6"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <div
                      className="quiz-panel"
                      id={`c-quiz-panel-${index + 1}`}
                      hidden={!open}
                    >
                      <div className="quiz-panel__inner">
                        <div className="quiz-options">
                          {q.options.map((opt) => (
                            <label key={opt} className="quiz-option">
                              <input
                                type="radio"
                                name={q.name}
                                value={opt}
                                checked={answers[q.name] === opt}
                                onChange={() => {
                                  setAnswers((a) => ({ ...a, [q.name]: opt }));
                                  if (index < QUIZ.length - 1)
                                    setOpenQuiz(index + 1);
                                }}
                                required
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    {errors[q.name] ? (
                      <p className="form-error" role="alert">
                        {errors[q.name]}
                      </p>
                    ) : null}
                  </fieldset>
                );
              })}

              <button
                type="submit"
                className="c-submit form-submit"
                id="contactSubmit"
                disabled={submitting}
                aria-busy={submitting}
              >
                <span className="form-submit__text">
                  {submitting ? "Submitting…" : "Submit"}
                </span>
              </button>
              <p className="c-form__note">
                Aapki details sirf aap se contact karne ke liye use hongi.
              </p>
            </form>
          </section>

          <aside className="c-info" aria-labelledby="c-info-title">
            <div className="c-info__head">
              <p className="c-info__eyebrow">Prefer to talk?</p>
              <div className="c-info__title-row">
                <h2 className="c-info__title" id="c-info-title">
                  Get in touch directly
                </h2>
                <span className="c-online">
                  <span className="c-online__dot" aria-hidden="true" />
                  WhatsApp par available
                </span>
              </div>
              <p className="c-info__sub">
                Form ke ilawa aap direct WhatsApp ya call par bhi baat kar
                sakte hain.
              </p>
            </div>

            <ul className="c-methods">
              <li>
                <a
                  className="c-method"
                  href="https://wa.me/923293412618"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="c-method__icon c-method__icon--wa" aria-hidden="true">
                    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                      <path
                        fill="currentColor"
                        d="M16.003 3C9.374 3 4 8.373 4 14.883c0 2.496.65 4.93 1.887 7.073L4 29l7.16-1.87a11.9 11.9 0 005.84 1.51h.005c6.63 0 12.003-5.372 12.003-11.882C28.008 8.373 22.633 3 16.003 3zm6.96 16.9c-.3.84-1.68 1.55-2.33 1.65-.6.1-1.37.11-2.22-.1-.51-.11-1.17-.35-2.02-.69-3.56-1.53-5.87-5.1-6.05-5.34-.18-.24-1.45-1.93-1.45-3.68s.92-2.62 1.25-2.98c.33-.36.72-.45.96-.45s.48 0 .69.01c.22 0 .52-.08.81.62l1.11 2.7c.07.15.12.33-.02.53-.14.2-.26.33-.51.51l-.69.48c-.21.16-.45.35-.19.69.26.33 1.15 1.9 2.48 3.06 1.7 1.52 3.13 2 3.57 2.23.44.22.7.19.96-.12.26-.31 1.1-1.28 1.39-1.72.29-.44.48-.37.81-.22.33.15 2.1.99 2.46 1.17.36.18.6.27.69.42.09.15.09.88-.21 1.72z"
                      />
                    </svg>
                  </span>
                  <span>
                    <span className="c-method__label">WhatsApp</span>
                    <span className="c-method__value">+92 329 3412618</span>
                  </span>
                  <span className="c-method__cta">Chat now</span>
                </a>
              </li>
              <li>
                <a className="c-method" href="tel:+923321319363">
                  <span className="c-method__icon c-method__icon--call" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span>
                    <span className="c-method__label">Call</span>
                    <span className="c-method__value">+92 332 1319363</span>
                  </span>
                  <span className="c-method__cta">Call now</span>
                </a>
              </li>
              <li>
                <div className="c-method">
                  <span className="c-method__icon c-method__icon--loc" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M12 21s-7-6.2-7-11.5A7 7 0 0119 9.5C19 14.8 12 21 12 21z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="9.5"
                        r="2.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                    </svg>
                  </span>
                  <span>
                    <span className="c-method__label">Location</span>
                    <span className="c-method__value">Karachi, Pakistan</span>
                  </span>
                </div>
              </li>
            </ul>

            <div className="c-steps-box">
              <h3 className="c-steps__title">What happens next?</h3>
              <ol className="c-steps">
                <li className="c-step">
                  <p className="c-step__title">Form submit karein</p>
                  <p className="c-step__text">
                    Apni details aur 4 chhote sawalon ke jawab dein.
                  </p>
                </li>
                <li className="c-step">
                  <p className="c-step__title">Team contact karegi</p>
                  <p className="c-step__text">
                    Aapke goals samajh kar mentorship ki details share karegi.
                  </p>
                </li>
                <li className="c-step">
                  <p className="c-step__title">Mentorship start</p>
                  <p className="c-step__text">
                    Enrollment confirm hone par aapki 1-on-1 training shuru.
                  </p>
                </li>
              </ol>
            </div>
          </aside>
        </div>
      </main>

      <footer className="c-footer">
        <p>
          © 2026 <Link href="/">AI Web Crafts</Link>. All rights reserved.
        </p>
      </footer>

      <div
        className="thank-modal"
        id="thankYouModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="thankModalTitle"
        hidden={!modalOpen}
      >
        <div
          className="thank-modal__backdrop"
          onClick={() => setModalOpen(false)}
        />
        <div className="thank-modal__dialog" role="document">
          <span style={{ fontSize: 44, display: "block", marginBottom: 8 }} aria-hidden="true">
            ✅
          </span>
          <h2 className="thank-modal__title" id="thankModalTitle">
            Thank You!
          </h2>
          <p className="thank-modal__text">
            We have received your details and our team will contact you shortly.
          </p>
          <button
            type="button"
            className="thank-modal__close"
            onClick={() => setModalOpen(false)}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
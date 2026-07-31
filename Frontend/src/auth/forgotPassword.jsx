import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, CheckCircle2, Lock, Mail, NotebookPen, ArrowLeftIcon } from "lucide-react";
import { forgotPasswordUser, clearAuthError } from "../store/slices/authSlice";
import "./forgot.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      await dispatch(forgotPasswordUser({ email })).unwrap();
      setSubmitted(true);
    } catch (err) {
      // Error is handled in Redux state
    }
  };

  return (
    <div className="forgot-page">
      <div className="forgot-container">

        {/* ================= LEFT SIDE ================= */}

        <section className="forgot-left">
          <div className="forgot-left-content">

            {/* Logo */}
            <div className="forgot-logo">
              <div className="forgot-logo-icon">
                <NotebookPen size={21} strokeWidth={1.8} className="text-white" />
              </div>

              <span>notes</span>
            </div>

            {/* Hero */}
            <div className="forgot-hero">

              <div className="forgot-badge">
                <span className="forgot-badge-dot"></span>
                We've got you covered
              </div>

              <h1>
                Don't worry,
                <br />
                we've all been
                <br />
                <span>there.</span>
              </h1>

              <p>
                Forgetting a password happens. Enter your
                email address and we'll help you get back
                into your account.
              </p>

              {/* Steps */}
              <div className="forgot-steps">

                <div className="forgot-step">
                  <div className="forgot-step-number">
                    1
                  </div>

                  <div>
                    <h3>Enter your email</h3>
                    <p>
                      Tell us the email connected to your
                      Notes account.
                    </p>
                  </div>
                </div>

                <div className="forgot-step-line"></div>

                <div className="forgot-step">
                  <div className="forgot-step-number">
                    2
                  </div>

                  <div>
                    <h3>Check your inbox</h3>
                    <p>
                      We'll send you a secure password
                      reset link.
                    </p>
                  </div>
                </div>

                <div className="forgot-step-line"></div>

                <div className="forgot-step">
                  <div className="forgot-step-number">
                    3
                  </div>

                  <div>
                    <h3>Create a new password</h3>
                    <p>
                      Choose a new password and you're
                      ready to go.
                    </p>
                  </div>
                </div>

              </div>

              {/* Decorative note */}
              <div className="forgot-note">

                <div className="forgot-note-icon">
                  ✦
                </div>

                <div>
                  <span>Little reminder</span>

                  <p>
                    Your ideas are worth keeping.
                  </p>
                </div>

              </div>

            </div>

            <p className="forgot-copyright">
              © 2026 Notes. All rights reserved.
            </p>

          </div>
        </section>

        {/* ================= RIGHT SIDE ================= */}

        <section className="forgot-right">

          <div className="forgot-form-wrapper">

            {/* Mobile Logo */}
            <div className="forgot-mobile-logo">

              <div className="forgot-logo-icon">
                <NotebookPen size={21} strokeWidth={1.8} className="text-white" />
              </div>

              <span>notes</span>

            </div>

            {/* Card */}
            <div className="forgot-card">

              {!submitted ? (
                <>
                  {/* Icon */}
                  <div className="forgot-card-icon">
                    <Lock size={28} strokeWidth={1.7} />
                  </div>

                  {/* Heading */}
                  <div className="forgot-heading">

                    <h2>Forgot your password?</h2>

                    <p>
                      No worries. Enter your email and we'll
                      send you a reset link.
                    </p>

                  </div>

                  {error && (
                    <div style={{ color: "#e11d48", backgroundColor: "#ffe4e6", padding: "10px 14px", borderRadius: "10px", marginBottom: "16px", fontSize: "14px", border: "1px solid #fecdd3" }}>
                      {error}
                    </div>
                  )}

                  {/* Form */}
                  <form
                    className="forgot-form"
                    onSubmit={handleSubmit}
                  >

                    <div className="forgot-field">

                      <label htmlFor="forgot-email">
                        Email address
                      </label>

                      <div className="forgot-input-wrapper">

                        <span className="forgot-input-icon">
                          <Mail size={18} strokeWidth={1.8} />
                        </span>

                        <input
                          id="forgot-email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) =>
                            setEmail(e.target.value)
                          }
                          required
                        />

                      </div>

                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="forgot-submit-button"
                    >
                      {loading ? "Sending..." : "Send reset link"}
                    </button>

                  </form>

                  {/* Back to login */}
                  <Link
                    to="/login"
                    className="forgot-back-button"
                  >
                    <ArrowLeftIcon />
                    Back to sign in
                  </Link>
                </>
              ) : (
                /* ================= SUCCESS STATE ================= */

                <div className="forgot-success">

                  <div className="forgot-success-icon">
                    <CheckCircle2 size={28} strokeWidth={2} />
                  </div>

                  <h2>
                    Check your inbox
                  </h2>

                  <p>
                    We've sent a password reset link to
                    <strong>{email}</strong>
                  </p>

                  <p className="forgot-success-small">
                    Didn't receive the email? Check your
                    spam folder or try again.
                  </p>

                  <button
                    type="button"
                    className="forgot-submit-button"
                    onClick={() => setSubmitted(false)}
                  >
                    Try another email
                  </button>

                  <Link
                    to="/login"
                    className="forgot-back-button"
                  >
                    <ArrowLeftIcon />
                    Back to sign in
                  </Link>

                </div>
              )}

            </div>

            {/* Security */}
            <div className="forgot-security">

              <Lock size={18} strokeWidth={1.8} />

              <span>
                Your account and notes are protected
              </span>

            </div>

          </div>

        </section>

      </div>
    </div>
  );
}


export default ForgotPassword;
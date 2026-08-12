import { useState, useEffect } from "react";
import { Link } from "react-router";
import { ArrowLeft, CheckCircle2, Lock, Mail, NotebookPen, ArrowLeftIcon } from "lucide-react";
import "./forgot.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    console.log("Email submitted:", email);
   
  };

  return (
    <div className="forgot-page">
      <div className="forgot-container">
          <section className="forgot-left">
          <div className="forgot-left-content">
           <div className="forgot-logo">
              <div className="forgot-logo-icon">
                <NotebookPen size={21} strokeWidth={1.8} className="text-white" />
              </div>
              <span>notes</span>
            </div>
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
                   </div>
        </section>
        <section className="forgot-right">
          <div className="forgot-form-wrapper">
                     <div className="forgot-mobile-logo">              <div className="forgot-logo-icon">
                <NotebookPen size={21} strokeWidth={1.8} className="text-white" />
              </div>
              <span>notes</span>
            </div>
            <div className="forgot-card">
              {!submitted ? (
                <>
                                  <div className="forgot-card-icon">
                    <Lock size={28} strokeWidth={1.7} />
                  </div>
                               <div className="forgot-heading">

                    <h2>Forgot your password?</h2>
                    <p>
                      No worries. Enter your email and we'll
                      send you a reset link.
                    </p>
                 </div>
                

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
                      className="forgot-submit-button"
                    >
                      Send reset link
                    </button>
                  </form>
                  <Link
                    to="/login"
                    className="forgot-back-button"
                  >
                    <ArrowLeftIcon />
                    Back to sign in
                  </Link>
                </>
              ) : (
               
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
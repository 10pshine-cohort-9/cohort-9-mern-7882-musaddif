import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, CheckCircle2, Lock, NotebookPen ,Eye, EyeOff,} from "lucide-react";
import "./forgot.css";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    return () => {
      console.log("ResetPassword component unmounted, clearing local error.");
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (!token) {
      setLocalError("Missing reset token in URL.");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

  console.log("Resetting password with token:", token, "and new password:",)
  };

  return (
    <div className="forgot-page">
      <div className="forgot-container">

        {/* LEFT SIDE */}
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
                Secure Account Access
              </div>
              <h1>Set your new<br />account <span>password.</span></h1>
              <p>Please enter your new password below to regain full access to your Notes account.</p>
            </div>

            <p className="forgot-copyright">© 2026 Notes. All rights reserved.</p>
          </div>
        </section>

        {/* RIGHT SIDE */}
        <section className="forgot-right">
          <div className="forgot-form-wrapper">
            <div className="forgot-card">
              {!resetSuccess ? (
                <>
                  <div className="forgot-heading">
                    <h2>Reset Password</h2>
                    <p>Enter and confirm your new password below.</p>
                  </div>

                  {(localError || error || !token) && (
                    <div style={{ color: "#e11d48", backgroundColor: "#ffe4e6", padding: "10px 14px", borderRadius: "10px", marginBottom: "16px", fontSize: "14px", border: "1px solid #fecdd3" }}>
                      {localError || error || (!token && "Invalid or missing password reset link.")}
                    </div>
                  )}

                  <form className="forgot-form" onSubmit={handleSubmit}>
                    <div className="forgot-field">
                      <label htmlFor="reset-password">New Password</label>
                      <div className="forgot-input-wrapper">
                        <span className="forgot-input-icon">
                          <Lock size={18} strokeWidth={1.8} />
                        </span>
                        <input
                          id="reset-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="At least 6 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                         onClick={() => setShowPassword(!showPassword)}
                       aria-label="Toggle password visibility"
                     >
                       {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      </div>
                    </div>

                    <div className="forgot-field">
                      <label htmlFor="confirm-reset-password">Confirm New Password</label>
                      <div className="forgot-input-wrapper">
                        <span className="forgot-input-icon">
                          <Lock size={18} strokeWidth={1.8} />
                        </span>
                        <input
                          id="confirm-reset-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !token}
                      className="forgot-submit-button"
                    >
                      {loading ? "Resetting password..." : "Reset Password"}
                    </button>
                  </form>

                  <Link to="/login" className="forgot-back-button">
                    <ArrowLeft size={16} strokeWidth={1.8} />
                    Back to sign in
                  </Link>
                </>
              ) : (
                <div className="forgot-success">
                  <div className="forgot-success-icon">
                    <CheckCircle2 size={28} strokeWidth={2} />
                  </div>
                  <h2>Password Updated!</h2>
                  <p>Your password has been successfully reset. You can now log in with your new password.</p>
                  <button
                    type="button"
                    className="forgot-submit-button"
                    onClick={() => navigate("/login")}
                  >
                    Go to Sign In
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ResetPassword;

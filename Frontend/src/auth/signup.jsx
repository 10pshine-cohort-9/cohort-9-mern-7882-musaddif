import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { NotebookPen, UserRound, Mail, Lock, Eye, EyeOff, LockIcon  } from "lucide-react";
import "./signup.css";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError("");

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    // Here you would typically send the signup data to your backend API
    // For now, we'll just navigate to the login page after "successful" signup
    navigate("/login");
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <section className="signup-left">
          <div className="signup-left-content">
            <div className="signup-logo">
              <div className="signup-logo-icon">
                <NotebookPen size={21} strokeWidth={1.8} className="text-white" />
              </div>
              <span>notes</span>
            </div>
            <div className="signup-hero">
              <div className="signup-badge">
                <span className="signup-badge-dot"></span>
                Start your journey
              </div>
              <h1>
                Turn your ideas
                <br />
                into something
                <br />
                <span>meaningful.</span>
              </h1>
              <p>
                Create your free account and start capturing
                your ideas, thoughts, and everything that
                matters to you.
              </p>
              <div className="signup-features">
                <Feature
                  icon="✦"
                  title="Write freely"
                  description="Capture your thoughts without distractions."
                />
                <Feature
                  icon="⌁"
                  title="Stay organized"
                  description="Keep all your ideas neatly in one place."
                />
                <Feature
                  icon="✓"
                  title="Never lose an idea"
                  description="Your notes are always there when you need them."
                />
              </div>
              <div className="signup-notebook">
                <div className="signup-notebook-top"></div>
                <p>
                  "The best ideas often start
                  <br />
                  with a simple note."
                </p>
                <div className="signup-notebook-lines">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

                <div className="signup-notebook-star">
                  ✨
                </div>
              </div>
            </div>      
          </div>
        </section>

        <section className="signup-right">
          <div className="signup-form-wrapper">
            <div className="signup-mobile-logo">
              <div className="signup-logo-icon">
                <NotebookPen size={21} strokeWidth={1.8} className="text-white" />
              </div>
              <span>notes</span>
            </div>
            <div className="signup-card">
              <div className="signup-card-icon">
                <UserRound size={28} strokeWidth={1.7} className="text-current" />
              </div>
              <div className="signup-heading">
                <h2>
                  Create your account
                </h2>
                <p>
                  Start organizing your thoughts today
                </p>
              </div>

              

              {(localError ) && (
                <div style={{ color: "#e11d48", backgroundColor: "#ffe4e6", padding: "10px 14px", borderRadius: "10px", marginBottom: "16px", fontSize: "14px", border: "1px solid #fecdd3" }}>
                  {localError }
                </div>
              )}
              <form
                onSubmit={handleSubmit}
                className="signup-form"
              >              
                <div className="signup-field">
                  <label htmlFor="name">
                    Full name
                  </label>
                  <div className="signup-input-wrapper">
                    <span className="signup-input-icon">
                      <UserRound size={18} strokeWidth={1.8} />
                    </span>
                    <input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="signup-field">
                  <label htmlFor="email">
                    Email address
                  </label>
                  <div className="signup-input-wrapper">
                    <span className="signup-input-icon">
                      <Mail size={18} strokeWidth={1.8} />
                    </span>
                    <input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="signup-field">
                  <label htmlFor="password">
                    Password
                  </label>
                  <div className="signup-input-wrapper">
                    <span className="signup-input-icon">
                      <LockIcon />
                    </span>
                    <input
                      id="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="signup-password-button"
                       aria-label="Toggle password visibility"
                      onClick={() =>
                        setShowPassword(!showPassword)
                      }
                    >
                      {showPassword
                        ? <EyeOff size={18} strokeWidth={1.8} />
                        : <Eye size={18} strokeWidth={1.8} />
                      }
                    </button>
                  </div>
                </div>
                <div className="signup-field">
                  <label htmlFor="confirmPassword">
                    Confirm password
                  </label>
                  <div className="signup-input-wrapper">
                    <span className="signup-input-icon">
                      <LockIcon />
                    </span>
                    <input
                      id="confirmPassword"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />

                    <button
                      type="button"
                      className="signup-password-button"
                      onClick={() =>
                        setShowConfirmPassword(
                          !showConfirmPassword
                        )
                      }
                    >
                      {showConfirmPassword
                        ? <EyeOff size={18} strokeWidth={1.8} />
                        : <Eye size={18} strokeWidth={1.8} />
                      }
                    </button>
                  </div>
                </div>
                 <button
                  type="submit"
                  className="signup-submit-button"
                >
                  Create account
                </button>
              </form>
              <p className="signup-login-text">
                Already have an account?{" "}
                <Link to="/login">
                  Sign in
                </Link>
              </p>
            </div>
            <div className="signup-security">
              <LockIcon />
              <span>
                Your notes are private and secure
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}



function Feature({
  icon,
  title,
  description,
}) {
  return (
    <div className="signup-feature">

      <div className="signup-feature-icon">
        {icon}
      </div>

      <div>
        <h3>{title}</h3>

        <p>{description}</p>
      </div>

    </div>
  );
}



export default Signup;
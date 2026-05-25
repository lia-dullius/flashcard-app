import { useState } from "react";
import api from "../services/api";

function AuthForm({ onAuthSuccess }) {
  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [message, setMessage] = useState("");

  const isRegisterMode = mode === "register";

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!formData.email || !formData.password || (isRegisterMode && !formData.name)) {
      setMessage("Please fill in all required fields.");
      return;
    }

    try {
      const endpoint = isRegisterMode ? "/auth/register" : "/auth/login";

      const payload = isRegisterMode
        ? formData
        : {
            email: formData.email,
            password: formData.password
          };

      const response = await api.post(endpoint, payload);

      localStorage.setItem("pensieveToken", response.data.token);
      localStorage.setItem("pensieveUser", JSON.stringify(response.data.user));

      onAuthSuccess(response.data.user);
    } catch (error) {
      console.error("Authentication error:", error);
      setMessage(
        error.response?.data?.message || "Authentication failed. Please try again."
      );
    }
  }

  return (
    <main className="app auth-page">
      <section className="top-layout">
        <header className="app-header">
          <div className="hero-copy">
            <p className="eyebrow">Welcome to your study space</p>
            <h1>🪄 Pensieve Cards</h1>
            <p className="hero-text">
              Log in to manage your flashcards, study sessions and learning history.
            </p>
          </div>
        </header>

        <section className="card form-section">
          <h2>{isRegisterMode ? "Create account" : "Log in"}</h2>

          <form className="flashcard-form" onSubmit={handleSubmit}>
            {isRegisterMode && (
              <div className="field">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="e.g. Lia"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            )}

            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="e.g. lia@test.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            {message && <p className="auth-message">{message}</p>}

            <button className="primary-btn" type="submit">
              {isRegisterMode ? "Create account" : "Log in"}
            </button>

            <button
              className="secondary-btn"
              type="button"
              onClick={() => {
                setMode(isRegisterMode ? "login" : "register");
                setMessage("");
              }}
            >
              {isRegisterMode
                ? "Already have an account? Log in"
                : "Need an account? Register"}
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}

export default AuthForm;
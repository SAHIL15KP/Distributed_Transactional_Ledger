import { useEffect, useState } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api/v1";
const TOKEN_KEY = "ledger-token";

const emptySignupForm = {
  firstName: "",
  lastName: "",
  username: "",
  password: "",
};

const emptySigninForm = {
  username: "",
  password: "",
};

const emptyTransferForm = {
  to: "",
  amount: "",
};

async function apiRequest(path, options = {}, token) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Cannot reach the server. Make sure the backend is running.");
    }

    throw error;
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
}

function App() {
  const [mode, setMode] = useState("signin");
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [signupForm, setSignupForm] = useState(emptySignupForm);
  const [signinForm, setSigninForm] = useState(emptySigninForm);
  const [transferForm, setTransferForm] = useState(emptyTransferForm);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [balance, setBalance] = useState(null);
  const [authMessage, setAuthMessage] = useState("");
  const [transferMessage, setTransferMessage] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [sendingMoney, setSendingMoney] = useState(false);

  useEffect(() => {
    if (!token) {
      localStorage.removeItem(TOKEN_KEY);
      setBalance(null);
      setUsers([]);
      return;
    }

    localStorage.setItem(TOKEN_KEY, token);
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    async function loadBalance() {
      setLoadingBalance(true);

      try {
        const data = await apiRequest("/account/balance", {}, token);

        if (!cancelled) {
          setBalance(data.balance);
        }
      } catch (error) {
        if (!cancelled) {
          setBalance(null);
          setTransferMessage(error.message);
        }
      } finally {
        if (!cancelled) {
          setLoadingBalance(false);
        }
      }
    }

    loadBalance();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    async function loadUsers() {
      setLoadingUsers(true);

      try {
        const data = await apiRequest(
          `/user/bulk?filter=${encodeURIComponent(search)}`,
          {},
          token
        );

        if (!cancelled) {
          setUsers(Array.isArray(data.user) ? data.user : []);
        }
      } catch (error) {
        if (!cancelled) {
          setUsers([]);
          setTransferMessage(error.message);
        }
      } finally {
        if (!cancelled) {
          setLoadingUsers(false);
        }
      }
    }

    const timer = window.setTimeout(loadUsers, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [search, token]);

  async function handleSignup(event) {
    event.preventDefault();
    setLoadingAuth(true);
    setAuthMessage("");

    try {
      const data = await apiRequest("/user/signup", {
        method: "POST",
        body: JSON.stringify({
          ...signupForm,
          firstName: signupForm.firstName.trim(),
          lastName: signupForm.lastName.trim(),
          username: signupForm.username.trim().toLowerCase(),
        }),
      });

      setToken(data.token);
      setSignupForm(emptySignupForm);
      setAuthMessage("Account created successfully.");
    } catch (error) {
      setAuthMessage(error.message);
    } finally {
      setLoadingAuth(false);
    }
  }

  async function handleSignin(event) {
    event.preventDefault();
    setLoadingAuth(true);
    setAuthMessage("");

    try {
      const data = await apiRequest("/user/signin", {
        method: "POST",
        body: JSON.stringify({
          ...signinForm,
          username: signinForm.username.trim().toLowerCase(),
        }),
      });

      setToken(data.token);
      setSigninForm(emptySigninForm);
      setAuthMessage("Signed in successfully.");
    } catch (error) {
      setAuthMessage(error.message);
    } finally {
      setLoadingAuth(false);
    }
  }

  async function handleTransfer(event) {
    event.preventDefault();

    if (!transferForm.to) {
      setTransferMessage("Select a recipient first.");
      return;
    }

    if (!Number(transferForm.amount) || Number(transferForm.amount) <= 0) {
      setTransferMessage("Enter a valid amount.");
      return;
    }

    setSendingMoney(true);
    setTransferMessage("");

    try {
      const data = await apiRequest(
        "/account/transfer",
        {
          method: "POST",
          body: JSON.stringify({
            to: transferForm.to,
            amount: Number(transferForm.amount),
          }),
        },
        token
      );

      setTransferForm(emptyTransferForm);
      setTransferMessage(data.message || "Transfer successful.");

      const updatedBalance = await apiRequest("/account/balance", {}, token);
      setBalance(updatedBalance.balance);
    } catch (error) {
      setTransferMessage(error.message);
    } finally {
      setSendingMoney(false);
    }
  }

  function selectRecipient(user) {
    setTransferForm((current) => ({
      ...current,
      to: user._id,
    }));
    setTransferMessage(`Ready to send money to ${user.firstName} ${user.lastName}.`);
  }

  function signOut() {
    setToken("");
    setSearch("");
    setTransferForm(emptyTransferForm);
    setAuthMessage("");
    setTransferMessage("");
    setMode("signin");
  }

  const selectedUser = users.find((user) => user._id === transferForm.to);

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow">Distributed Transactional Ledger</span>
          <h1>Welcome to SPI Payments</h1>
          <p>
            Sign in, check balance, find a user, and transfer funds without
            changing backend behavior.
          </p>
        </div>

        {!token ? (
          <div className="panel auth-panel">
            <div className="tab-row" role="tablist" aria-label="Authentication">
              <button
                type="button"
                className={mode === "signin" ? "tab active" : "tab"}
                onClick={() => setMode("signin")}
              >
                Sign in
              </button>
              <button
                type="button"
                className={mode === "signup" ? "tab active" : "tab"}
                onClick={() => setMode("signup")}
              >
                Create account
              </button>
            </div>

            {mode === "signin" ? (
              <form className="form-stack" onSubmit={handleSignin}>
                <label className="field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={signinForm.username}
                    onChange={(event) =>
                      setSigninForm((current) => ({
                        ...current,
                        username: event.target.value,
                      }))
                    }
                    placeholder="you@example.com"
                    required
                  />
                </label>
                <label className="field">
                  <span>Password</span>
                  <input
                    type="password"
                    value={signinForm.password}
                    onChange={(event) =>
                      setSigninForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    placeholder="Enter password"
                    required
                  />
                </label>
                <button type="submit" className="primary-button" disabled={loadingAuth}>
                  {loadingAuth ? "Signing in..." : "Sign in"}
                </button>
              </form>
            ) : (
              <form className="form-stack" onSubmit={handleSignup}>
                <label className="field">
                  <span>First name</span>
                  <input
                    type="text"
                    value={signupForm.firstName}
                    onChange={(event) =>
                      setSignupForm((current) => ({
                        ...current,
                        firstName: event.target.value,
                      }))
                    }
                    placeholder="Sahil"
                    maxLength="50"
                    required
                  />
                </label>
                <label className="field">
                  <span>Last name</span>
                  <input
                    type="text"
                    value={signupForm.lastName}
                    onChange={(event) =>
                      setSignupForm((current) => ({
                        ...current,
                        lastName: event.target.value,
                      }))
                    }
                    placeholder="Kumar"
                    maxLength="50"
                    required
                  />
                </label>
                <label className="field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={signupForm.username}
                    onChange={(event) =>
                      setSignupForm((current) => ({
                        ...current,
                        username: event.target.value,
                      }))
                    }
                    placeholder="you@example.com"
                    maxLength="254"
                    required
                  />
                </label>
                <label className="field">
                  <span>Password</span>
                  <input
                    type="password"
                    value={signupForm.password}
                    onChange={(event) =>
                      setSignupForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    placeholder="Create password"
                    minLength="6"
                    required
                  />
                </label>
                <button type="submit" className="primary-button" disabled={loadingAuth}>
                  {loadingAuth ? "Creating..." : "Create account"}
                </button>
              </form>
            )}

            {authMessage ? <p className="status-text">{authMessage}</p> : null}
          </div>
        ) : (
          <div className="panel summary-panel">
            <div className="balance-block">
              <span className="balance-label">Available balance</span>
              <strong>{loadingBalance ? "Loading..." : formatCurrency(balance)}</strong>
            </div>
            <p className="muted-text">
              Search for any user and send money using the existing transfer API.
            </p>
            <button type="button" className="ghost-button" onClick={signOut}>
              Sign out
            </button>
          </div>
        )}
      </section>

      {token ? (
        <section className="workspace-grid">
          <div className="panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Recipients</span>
                <h2>Find a user</h2>
              </div>
              <span className="chip">
                {loadingUsers ? "Searching..." : `${users.length} users`}
              </span>
            </div>


            <div className="user-list">
              {users.length ? (
                users.map((user) => (
                  <button
                    type="button"
                    key={user._id}
                    className={
                      transferForm.to === user._id ? "user-card selected" : "user-card"
                    }
                    onClick={() => selectRecipient(user)}
                  >
                    <div>
                      <strong>
                        {user.firstName} {user.lastName}
                      </strong>
                      <span>{user.username}</span>
                    </div>
                    <span className="user-action">Select</span>
                  </button>
                ))
              ) : (
                <div className="empty-state">
                  {loadingUsers ? "Loading users..." : "No users found."}
                </div>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Transfer</span>
                <h2>Send money</h2>
              </div>
            </div>

            <form className="form-stack" onSubmit={handleTransfer}>
              <label className="field">
                <span>Selected recipient</span>
                <input
                  type="text"
                  value={
                    selectedUser
                      ? `${selectedUser.firstName} ${selectedUser.lastName}`
                      : ""
                  }
                  placeholder="Choose a user from the list"
                  readOnly
                />
              </label>

              <label className="field">
                <span>Amount</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={transferForm.amount}
                  onChange={(event) =>
                    setTransferForm((current) => ({
                      ...current,
                      amount: event.target.value,
                    }))
                  }
                  placeholder="500"
                  required
                />
              </label>

              <button type="submit" className="primary-button" disabled={sendingMoney}>
                {sendingMoney ? "Sending..." : "Send money"}
              </button>
            </form>

            {transferMessage ? <p className="status-text">{transferMessage}</p> : null}
          </div>
        </section>
      ) : null}
    </main>
  );
}

export default App;

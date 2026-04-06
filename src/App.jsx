// App is the routing shell for ZenCode.
// It also restores the logged-in session once at startup so route guards can behave correctly.
import { useEffect, useRef, useState } from 'react'
import './App.css'
import Homepage from './pages/Homepage';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from './authSlice';
import Problemset from './pages/Problemset';
import Adminpage from './pages/Adminpage';
import Problempage from './pages/Problempage';
import Profile from './pages/Profile';
import BackendWakeScreen from './components/BackendWakeScreen';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const API_HOSTNAME = (() => {
  try {
    return new URL(API_BASE_URL).hostname;
  } catch (error) {
    return "";
  }
})();
const COLD_START_WAIT_SECONDS = 60;
const BACKEND_POLL_INTERVAL_MS = 3000;
const BACKEND_REQUEST_TIMEOUT_MS = 5000;

async function pingBackendHealth() {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), BACKEND_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}/`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    });

    return response.ok;
  } catch (error) {
    return false;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function App() {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const hasStartedAuthCheckRef = useRef(false);
  const [backendReady, setBackendReady] = useState(!/(?:^|\.)(?:onrender|render)\.com/i.test(API_HOSTNAME));
  const [secondsRemaining, setSecondsRemaining] = useState(COLD_START_WAIT_SECONDS);

  useEffect(() => {
    if (backendReady || hasStartedAuthCheckRef.current) return;

    let isCancelled = false;
    let pollTimeoutId = null;
    let countdownIntervalId = null;

    const checkBackend = async () => {
      const isLive = await pingBackendHealth();
      if (isCancelled) return;

      if (isLive) {
        setBackendReady(true);
        return;
      }

      pollTimeoutId = window.setTimeout(checkBackend, BACKEND_POLL_INTERVAL_MS);
    };

    countdownIntervalId = window.setInterval(() => {
      setSecondsRemaining((previous) => Math.max(0, previous - 1));
    }, 1000);

    checkBackend();

    return () => {
      isCancelled = true;
      if (pollTimeoutId) {
        window.clearTimeout(pollTimeoutId);
      }
      if (countdownIntervalId) {
        window.clearInterval(countdownIntervalId);
      }
    };
  }, [backendReady]);

  useEffect(() => {
    if (!backendReady || hasStartedAuthCheckRef.current) return;

    hasStartedAuthCheckRef.current = true;

    // We ask the backend once on app boot whether the cookie still represents a live session.
    dispatch(checkAuth());
  }, [backendReady, dispatch]);

  if (!backendReady) {
    return <BackendWakeScreen secondsRemaining={secondsRemaining} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-600 flex items-center justify-center">
        <div className="glass-panel px-6 py-4 rounded-2xl border border-slate-200">Checking session...</div>
      </div>
    );
  }

  return (
    <div className='app'>
      <Routes>
        <Route path="/" element={<Navigate to="/problemset" />} />
        <Route path="/login" element={<Navigate to="/problemset" />} />
        <Route path="/signup" element={<Navigate to="/problemset" />} />
        <Route path="/problemset" element={<Problemset />} />
        <Route path="/admin" element={<Adminpage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/problem/:id" element={<Problempage />} />
      </Routes>
    </div>

  );
}

export default App;

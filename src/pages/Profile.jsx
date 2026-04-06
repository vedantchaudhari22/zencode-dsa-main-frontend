// Profile pulls together identity settings and progress analytics.
// It is where users can see momentum, edit basics, and change their password.
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateProfile, resetPassword } from "../authSlice";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import Navbar from "../components/Navbar";
import axiosClient from "../utils/axiosClient";
import {
  AcademicCapIcon,
  CodeBracketIcon,
  CalendarDaysIcon,
  FireIcon,
  PencilSquareIcon,
  KeyIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";

const RING_RADIUS = 74;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function Profile() {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [solvedCount, setSolvedCount] = useState(0);
  const [totalProblems, setTotalProblems] = useState(0);
  const [recentSolved, setRecentSolved] = useState([]);
  const [solvedLoading, setSolvedLoading] = useState(true);
  const [solvedError, setSolvedError] = useState(null);

  const [animatedSolvedCount, setAnimatedSolvedCount] = useState(0);
  const [animatedPercent, setAnimatedPercent] = useState(0);

  const progressCircleRef = useRef(null);
  const tweenValuesRef = useRef({ solved: 0, percent: 0 });

  const initials = `${user?.firstname?.[0] || ""}${user?.lastname?.[0] || ""}`.toUpperCase() || "U";

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);

  // Edit Profile Form state
  const [editFormData, setEditFormData] = useState({
    firstname: "",
    lastname: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  // Reset Password Form state
  const [passFormData, setPassFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");

  // Populate edit form when modal opens
  useEffect(() => {
    if (isEditProfileOpen && user) {
      setEditFormData({
        firstname: user.firstname || "",
        lastname: user.lastname || "",
      });
      setEditError("");
      setEditSuccess("");
    }
  }, [isEditProfileOpen, user]);

  useEffect(() => {
    if (isResetPasswordOpen) {
      setPassFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setPassError("");
      setPassSuccess("");
    }
  }, [isResetPasswordOpen]);

  const handleEditProfile = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");
    setEditSuccess("");

    try {
      await dispatch(updateProfile(editFormData)).unwrap();
      setEditSuccess("Profile updated successfully!");
      setTimeout(() => setIsEditProfileOpen(false), 2000);
    } catch (err) {
      setEditError(err || "Failed to update profile");
    } finally {
      setEditLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setPassLoading(true);
    setPassError("");
    setPassSuccess("");

    if (passFormData.newPassword !== passFormData.confirmPassword) {
      setPassError("New passwords do not match");
      setPassLoading(false);
      return;
    }

    try {
      await dispatch(resetPassword({
        oldPassword: passFormData.oldPassword,
        newPassword: passFormData.newPassword
      })).unwrap();
      setPassSuccess("Password reset successfully!");
      setTimeout(() => setIsResetPasswordOpen(false), 2000);
    } catch (err) {
      setPassError(err || "Failed to reset password");
    } finally {
      setPassLoading(false);
    }
  };

  const progressPercent = useMemo(() => {
    if (!totalProblems) return 0;
    return Math.round((solvedCount / totalProblems) * 100);
  }, [solvedCount, totalProblems]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isCancelled = false;

    const fetchSolvedStats = async () => {
      try {
        const res = await axiosClient.get("/problem/user");
        if (isCancelled) return;

        setSolvedCount(Number(res.data?.solvedCount) || 0);
        setTotalProblems(Number(res.data?.totalProblems) || 0);
        setRecentSolved(Array.isArray(res.data?.recentSolved) ? res.data.recentSolved : []);
        setSolvedError(null);
      } catch (error) {
        if (isCancelled) return;
        const data = error?.response?.data;
        const message =
          (typeof data === "string" && data) ||
          data?.message ||
          "Unable to load solved stats.";
        setSolvedError(message);
      } finally {
        if (!isCancelled) {
          setSolvedLoading(false);
        }
      }
    };

    fetchSolvedStats();

    const intervalId = setInterval(fetchSolvedStats, 15000);

    const handleFocus = () => {
      fetchSolvedStats();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchSolvedStats();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const targetPercent = Math.max(0, Math.min(100, progressPercent));
    const targetSolved = Math.max(0, solvedCount);
    const values = tweenValuesRef.current;

    const tween = gsap.to(values, {
      solved: targetSolved,
      percent: targetPercent,
      duration: 0.9,
      ease: "power2.out",
      onUpdate: () => {
        const currentSolved = Math.round(values.solved);
        const currentPercent = Math.round(values.percent);
        setAnimatedSolvedCount(currentSolved);
        setAnimatedPercent(currentPercent);

        if (progressCircleRef.current) {
          const dashOffset = RING_CIRCUMFERENCE * (1 - values.percent / 100);
          progressCircleRef.current.style.strokeDashoffset = `${dashOffset}`;
        }
      },
    });

    return () => {
      tween.kill();
    };
  }, [solvedCount, progressPercent]);

  const stats = [
    { label: "Problems Solved", value: animatedSolvedCount, icon: CodeBracketIcon, color: "text-emerald-600" },
    { label: "Total Problems", value: totalProblems, icon: AcademicCapIcon, color: "text-cyan-600" },
    { label: "Current Streak", value: "--", icon: FireIcon, color: "text-amber-500" },
    { label: "Days Active", value: "--", icon: CalendarDaysIcon, color: "text-blue-500" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-indigo-500/20">
      <Navbar />

      <div className="relative pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 left-[-10%] w-[50%] h-[50%] bg-indigo-200/40 blur-[140px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-200/40 blur-[140px] rounded-full" />
        </div>

        <div className="relative z-10 container mx-auto px-6">
          <div className="glass-panel rounded-3xl border border-slate-200 p-8 md:p-10 mb-8 shadow-sm">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="relative">
                <div className="h-28 w-28 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-5xl font-bold text-white shadow-lg">
                  {initials}
                </div>
                <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-emerald-500 border-4 border-white flex items-center justify-center">
                  <span className="text-[10px] font-bold">OK</span>
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                  {user?.firstname} {user?.lastname}
                </h1>
                <p className="text-slate-500 mt-1 text-lg">{user?.emailId}</p>
                <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600 text-xs uppercase tracking-[0.25em] font-semibold">
                    {user?.role || "Member"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-100 text-slate-500 text-xs">
                    <CalendarDaysIcon className="h-3.5 w-3.5" />
                    Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Recently"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <div key={stat.label} className="glass-panel rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`h-9 w-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-xs uppercase tracking-[0.15em] text-slate-500">{stat.label}</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <AcademicCapIcon className="h-5 w-5 text-indigo-500" />
                <span className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">Solved Progress</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative h-44 w-44 shrink-0">
                  <svg className="h-44 w-44 -rotate-90" viewBox="0 0 180 180" role="img" aria-label="Solved progress">
                    <circle
                      cx="90"
                      cy="90"
                      r={RING_RADIUS}
                      fill="none"
                      stroke="rgba(148, 163, 184, 0.2)"
                      strokeWidth="12"
                    />
                    <circle
                      ref={progressCircleRef}
                      cx="90"
                      cy="90"
                      r={RING_RADIUS}
                      fill="none"
                      stroke="url(#solvedProgressGradient)"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={RING_CIRCUMFERENCE}
                      strokeDashoffset={RING_CIRCUMFERENCE}
                    />
                    <defs>
                      <linearGradient id="solvedProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="50%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                    </defs>
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-4xl font-bold text-slate-900">{animatedPercent}%</div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Complete</div>
                  </div>
                </div>

                <div className="w-full">
                  <div className="text-4xl font-bold text-slate-900 mb-1">{animatedSolvedCount}</div>
                  <div className="text-sm text-slate-500 mb-5">
                    {totalProblems ? `${animatedSolvedCount} of ${totalProblems} questions solved` : "No problems created yet"}
                  </div>

                  <Link
                    to="/problemset"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Continue Practice
                  </Link>
                </div>
              </div>

              {solvedLoading && (
                <p className="text-xs text-slate-400 mt-4">Refreshing solved stats...</p>
              )}
              {solvedError && (
                <p className="text-xs text-rose-300 mt-4">{solvedError}</p>
              )}
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-200 relative shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">Account Details</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditProfileOpen(true)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 transition-colors"
                    title="Edit Profile"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setIsResetPasswordOpen(true)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 transition-colors"
                    title="Reset Password"
                  >
                    <KeyIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <div className="text-xs text-slate-500 mb-1">First Name</div>
                  <div className="text-lg font-semibold">{user?.firstname || "--"}</div>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <div className="text-xs text-slate-500 mb-1">Last Name</div>
                  <div className="text-lg font-semibold">{user?.lastname || "--"}</div>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <div className="text-xs text-slate-500 mb-1">Email</div>
                  <div className="text-lg font-semibold break-all">{user?.emailId || "--"}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-200 mt-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">
                Last 5 Solved Questions
              </div>
              <span className="text-xs text-slate-400">Updates every 15s</span>
            </div>

            {recentSolved.length > 0 ? (
              <div className="space-y-3">
                {recentSolved.map((item, index) => (
                  <div
                    key={`${item.problemId}-${item.solvedAt}-${index}`}
                    className="rounded-xl bg-white border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="h-7 w-7 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-semibold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 truncate">{item.title}</div>
                        <div className="text-xs text-slate-400">Solved</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-xs sm:text-sm text-slate-500">
                        {item.solvedAt
                          ? new Date(item.solvedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                          : "--"}
                      </div>
                      {item.problemId && (
                        <Link
                          to={`/problem/${item.problemId}`}
                          className="btn btn-xs bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                        >
                          Open
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-slate-400 text-sm">
                No solved questions yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 p-6 relative shadow-lg bg-white">
            <button
              onClick={() => setIsEditProfileOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold mb-6 text-slate-900">Edit Identity</h2>

            {editSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                {editSuccess}
              </div>
            )}
            {editError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditProfile} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.firstname}
                  onChange={(e) => setEditFormData({ ...editFormData, firstname: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.lastname}
                  onChange={(e) => setEditFormData({ ...editFormData, lastname: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Email <span className="text-slate-400">(Cannot be changed)</span></label>
                <input
                  type="email"
                  disabled
                  value={user?.emailId || ""}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-400 cursor-not-allowed"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-medium text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 p-6 relative shadow-lg bg-white">
            <button
              onClick={() => setIsResetPasswordOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold mb-6 text-slate-900">Reset Password</h2>

            {passSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                {passSuccess}
              </div>
            )}
            {passError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                {passError}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={passFormData.oldPassword}
                  onChange={(e) => setPassFormData({ ...passFormData, oldPassword: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={passFormData.newPassword}
                  onChange={(e) => setPassFormData({ ...passFormData, newPassword: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={passFormData.confirmPassword}
                  onChange={(e) => setPassFormData({ ...passFormData, confirmPassword: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-medium text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {passLoading ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

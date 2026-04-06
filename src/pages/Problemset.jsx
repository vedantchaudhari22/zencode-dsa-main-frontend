// Problemset is the user's practice lobby.
// It loads every problem, groups them into a friendlier study view, and highlights solved progress.
import { useSelector } from "react-redux";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../utils/axiosClient";
import Navbar from "../components/Navbar";
import Loader from "../components/Loader";

const DIFFICULTY_ORDER = ["easy", "medium", "hard"];

const DIFFICULTY_STYLES = {
  easy: "bg-emerald-50 text-emerald-600 border-emerald-200",
  medium: "bg-amber-50 text-amber-600 border-amber-200",
  hard: "bg-red-50 text-red-600 border-red-200",
};

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (data?.message) return data.message;
  return fallback;
};

const toTopicArray = (tags) => {
  const values = Array.isArray(tags) ? tags : [tags];
  const cleaned = values
    .filter((tag) => typeof tag === "string" && tag.trim())
    .map((tag) => tag.trim());
  if (!cleaned.length) return ["Uncategorized"];
  return Array.from(new Set(cleaned));
};

function AccordionChevron({ open }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${open ? "rotate-90" : ""}`}
    >
      <path
        fillRule="evenodd"
        d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 1 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function Problemset() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);

  const [problems, setProblems] = useState([]);
  const [favorites, setFavorites] = useState({});
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [solvedProblemMap, setSolvedProblemMap] = useState({});
  const [solvedFetchError, setSolvedFetchError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deletingProblemId, setDeletingProblemId] = useState(null);
  const [openTopics, setOpenTopics] = useState({});
  const [openDifficultyGroups, setOpenDifficultyGroups] = useState({});

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    let isCancelled = false;

    const fetchAllProblems = async () => {
      setIsFetching(true);
      setFetchError(null);

      try {
        const allProblems = [];
        let nextPage = 1;
        let shouldFetchMore = true;

        // The backend paginates in small chunks, so we keep pulling until there is nothing left.
        while (shouldFetchMore) {
          const res = await axiosClient.get(`/problem/getAllProblems?page=${nextPage}`);
          const fetchedProblems = Array.isArray(res.data?.problems) ? res.data.problems : [];
          allProblems.push(...fetchedProblems);

          shouldFetchMore = Boolean(res.data?.hasMore);
          nextPage += 1;
        }

        if (!isCancelled) {
          setProblems(allProblems);
        }
      } catch (error) {
        if (!isCancelled) {
          setFetchError(getErrorMessage(error, "Unable to load problems."));
        }
      } finally {
        if (!isCancelled) {
          setIsFetching(false);
        }
      }
    };

    fetchAllProblems();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const fetchSolvedProblems = async () => {
      if (!isAuthenticated) return;
      setSolvedFetchError(null);

      try {
        const res = await axiosClient.get("/problem/user");
        const solvedProblems = Array.isArray(res.data?.problems) ? res.data.problems : [];
        const nextSolvedMap = {};

        solvedProblems.forEach((problemDoc) => {
          if (problemDoc?._id) {
            nextSolvedMap[problemDoc._id] = true;
          }
        });

        if (!isCancelled) {
          setSolvedProblemMap(nextSolvedMap);
        }
      } catch (error) {
        if (!isCancelled) {
          setSolvedFetchError(getErrorMessage(error, "Unable to load solved progress."));
        }
      }
    };

    fetchSolvedProblems();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated]);

  const groupedProblems = useMemo(() => {
    const groupedByTopic = new Map();

    problems.forEach((prob) => {
      // A single problem can belong to multiple study buckets when it has multiple tags.
      const topics = toTopicArray(prob.tags);

      topics.forEach((topic) => {
        const topicKey = topic.toLowerCase();
        if (!groupedByTopic.has(topicKey)) {
          groupedByTopic.set(topicKey, {
            topic,
            total: 0,
            byDifficulty: { easy: [], medium: [], hard: [], other: [] },
          });
        }

        const topicGroup = groupedByTopic.get(topicKey);
        const difficultyKey = prob.difficulty?.toLowerCase();
        if (DIFFICULTY_ORDER.includes(difficultyKey)) {
          topicGroup.byDifficulty[difficultyKey].push(prob);
        } else {
          topicGroup.byDifficulty.other.push(prob);
        }
        topicGroup.total += 1;
      });
    });

    return Array.from(groupedByTopic.values()).sort((a, b) => a.topic.localeCompare(b.topic));
  }, [problems]);

  useEffect(() => {
    if (!groupedProblems.length) return;

    const firstTopicKey = groupedProblems[0].topic.toLowerCase();

    setOpenTopics((prev) => {
      if (Object.keys(prev).length) return prev;
      return { [firstTopicKey]: true };
    });

    setOpenDifficultyGroups((prev) => {
      if (Object.keys(prev).length) return prev;
      return { [`${firstTopicKey}-easy`]: true };
    });
  }, [groupedProblems]);

  const stats = useMemo(() => {
    const counts = { total: problems.length, easy: 0, medium: 0, hard: 0 };
    problems.forEach((prob) => {
      const level = prob.difficulty?.toLowerCase();
      if (level === "easy") counts.easy += 1;
      if (level === "medium") counts.medium += 1;
      if (level === "hard") counts.hard += 1;
    });
    return counts;
  }, [problems]);

  const solvedCount = useMemo(() => {
    return problems.reduce((count, prob) => (solvedProblemMap[prob._id] ? count + 1 : count), 0);
  }, [problems, solvedProblemMap]);

  const solvedProgress = useMemo(() => {
    if (!stats.total) return 0;
    return Math.round((solvedCount / stats.total) * 100);
  }, [solvedCount, stats.total]);

  const handleAdmin = () => {
    navigate("/admin");
  };

  const handleOpenRandomQuestion = () => {
    if (!problems.length) return;
    const randomIndex = Math.floor(Math.random() * problems.length);
    const randomProblem = problems[randomIndex];

    if (randomProblem?._id) {
      navigate(`/problem/${randomProblem._id}`);
    }
  };

  const toggleFavorite = (id) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleTopic = (topicKey) => {
    setOpenTopics((prev) => ({ ...prev, [topicKey]: !prev[topicKey] }));
  };

  const toggleDifficultyGroup = (topicKey, level) => {
    const key = `${topicKey}-${level}`;
    setOpenDifficultyGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDeleteProblem = async (problemId, title) => {
    if (user?.role !== "admin") return;

    // Native confirm is simple here and hard to miss for a destructive admin action.
    const shouldDelete = window.confirm(`Delete "${title}" permanently? This action cannot be undone.`);
    if (!shouldDelete) return;

    setDeletingProblemId(problemId);
    setDeleteError(null);

    try {
      await axiosClient.delete(`/problem/delete/${problemId}`);
      setProblems((prev) => prev.filter((prob) => prob._id !== problemId));
      setFavorites((prev) => {
        const next = { ...prev };
        delete next[problemId];
        return next;
      });
      setSolvedProblemMap((prev) => {
        if (!prev[problemId]) return prev;
        const next = { ...prev };
        delete next[problemId];
        return next;
      });
    } catch (error) {
      setDeleteError(getErrorMessage(error, "Unable to delete the problem."));
    } finally {
      setDeletingProblemId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Navbar />

      <div className="container mx-auto px-5 pt-24 pb-10">
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Problems</h2>
              <p className="text-slate-500">Curated list of challenges to sharpen your DSA skills.</p>
            </div>
            <div className="flex items-center gap-3">
              {user?.role === "admin" && (
                <button
                  className="btn btn-sm bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-none hover:from-indigo-600 hover:to-purple-700"
                  onClick={handleAdmin}
                >
                  Admin Panel
                </button>
              )}
              <button
                className="btn btn-sm bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                onClick={handleOpenRandomQuestion}
                disabled={!problems.length || isFetching}
              >
                Open Random Question
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-2xl border border-slate-200">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Total</div>
              <div className="text-2xl font-semibold text-slate-900">{stats.total}</div>
            </div>
            <div className="glass-panel p-4 rounded-2xl border border-slate-200">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Easy</div>
              <div className="text-2xl font-semibold text-emerald-600">{stats.easy}</div>
            </div>
            <div className="glass-panel p-4 rounded-2xl border border-slate-200">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Medium</div>
              <div className="text-2xl font-semibold text-amber-600">{stats.medium}</div>
            </div>
            <div className="glass-panel p-4 rounded-2xl border border-slate-200">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Hard</div>
              <div className="text-2xl font-semibold text-red-600">{stats.hard}</div>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Progress</div>
                <div className="text-sm text-slate-500 mt-1">
                  {solvedCount} solved out of {stats.total}
                </div>
              </div>
              <div className="text-2xl font-semibold text-emerald-600">{solvedProgress}%</div>
            </div>
            <div className="mt-3 h-3 w-full rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-green-400 to-teal-400 transition-all duration-500"
                style={{ width: `${solvedProgress}%` }}
              />
            </div>
          </div>

          <div className="text-sm text-slate-500">Showing {stats.total} problems</div>

          {fetchError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {fetchError}
            </div>
          )}
          {deleteError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {deleteError}
            </div>
          )}
          {solvedFetchError && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              {solvedFetchError}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {isFetching && !problems.length ? (
            <Loader message="Loading problems..." />
          ) : groupedProblems.length > 0 ? (
            groupedProblems.map((topicGroup) => {
              const topicKey = topicGroup.topic.toLowerCase();
              const isTopicOpen = Boolean(openTopics[topicKey]);

              return (
                <div key={topicKey} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  <button
                    type="button"
                    onClick={() => toggleTopic(topicKey)}
                    className="w-full px-5 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-slate-900">{topicGroup.topic}</h3>
                        <p className="text-xs text-slate-500 uppercase tracking-[0.2em] mt-1">
                          {topicGroup.total} {topicGroup.total === 1 ? "Problem" : "Problems"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Topic</span>
                        <AccordionChevron open={isTopicOpen} />
                      </div>
                    </div>
                  </button>

                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${isTopicOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-5 pb-5 pt-1 space-y-3">
                        {DIFFICULTY_ORDER.map((level) => {
                          const difficultyProblems = topicGroup.byDifficulty[level];
                          const difficultyKey = `${topicKey}-${level}`;
                          const isDifficultyOpen = Boolean(openDifficultyGroups[difficultyKey]);

                          return (
                            <div key={difficultyKey} className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                              <button
                                type="button"
                                onClick={() => toggleDifficultyGroup(topicKey, level)}
                                className="w-full px-4 py-3 hover:bg-slate-100 transition-colors"
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-3">
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-semibold border uppercase ${DIFFICULTY_STYLES[level]}`}
                                    >
                                      {level}
                                    </span>
                                    <span className="text-sm text-slate-500">
                                      {difficultyProblems.length} {difficultyProblems.length === 1 ? "problem" : "problems"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">Difficulty</span>
                                    <AccordionChevron open={isDifficultyOpen} />
                                  </div>
                                </div>
                              </button>

                              <div
                                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${isDifficultyOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                              >
                                <div className="overflow-hidden">
                                  <div className="px-4 pb-4">
                                    {difficultyProblems.length > 0 ? (
                                      <div className="space-y-2">
                                        {difficultyProblems.map((prob) => (
                                          <div
                                            key={prob._id}
                                            className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between shadow-sm"
                                          >
                                            <div className="min-w-0">
                                              <div className="flex flex-wrap items-center gap-2">
                                                <div className="font-medium text-slate-900 truncate">{prob.title}</div>
                                                <span
                                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${solvedProblemMap[prob._id]
                                                      ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                                      : "bg-slate-100 text-slate-500 border-slate-200"
                                                    }`}
                                                >
                                                  <span
                                                    className={`h-4 w-4 rounded border flex items-center justify-center ${solvedProblemMap[prob._id]
                                                        ? "border-emerald-300 bg-emerald-100 text-emerald-600"
                                                        : "border-slate-300"
                                                      }`}
                                                  >
                                                    {solvedProblemMap[prob._id] && (
                                                      <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth={2}
                                                        stroke="currentColor"
                                                        className="h-3 w-3"
                                                      >
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                                      </svg>
                                                    )}
                                                  </span>
                                                  {solvedProblemMap[prob._id] ? "Solved" : "Unsolved"}
                                                </span>
                                              </div>
                                              <div className="mt-2 flex flex-wrap gap-2">
                                                {toTopicArray(prob.tags).map((topic, idx) => (
                                                  <span
                                                    key={`${prob._id}-${topic}-${idx}`}
                                                    className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600 border border-slate-200"
                                                  >
                                                    {topic}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                                              <button
                                                onClick={() => toggleFavorite(prob._id)}
                                                className={`h-9 w-9 rounded-full border flex items-center justify-center transition-colors ${favorites[prob._id]
                                                    ? "border-amber-300 bg-amber-50 text-amber-500"
                                                    : "border-slate-200 text-slate-400 hover:text-amber-500 hover:border-amber-300"
                                                  }`}
                                                title="Bookmark"
                                              >
                                                <svg
                                                  xmlns="http://www.w3.org/2000/svg"
                                                  fill={favorites[prob._id] ? "currentColor" : "none"}
                                                  viewBox="0 0 24 24"
                                                  strokeWidth={1.5}
                                                  stroke="currentColor"
                                                  className="w-5 h-5"
                                                >
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.18v15.183a.75.75 0 0 1-1.241.572L12 17.25l-6.259 4.007a.75.75 0 0 1-1.241-.572V5.502c0-1.103.806-2.052 1.907-2.18a48.507 48.507 0 0 1 11.186 0Z" />
                                                </svg>
                                              </button>

                                              {user?.role === "admin" && (
                                                <button
                                                  className="btn btn-sm bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                                                  onClick={() => handleDeleteProblem(prob._id, prob.title)}
                                                  disabled={deletingProblemId === prob._id}
                                                >
                                                  {deletingProblemId === prob._id ? "Deleting..." : "Delete"}
                                                </button>
                                              )}

                                              <button
                                                className="btn btn-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-none shadow-sm transition-all font-medium"
                                                onClick={() => navigate(`/problem/${prob._id}`)}
                                              >
                                                Solve Challenge
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-400">
                                        No {level} problems in this topic.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-slate-400 text-lg shadow-sm">
              No problems found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

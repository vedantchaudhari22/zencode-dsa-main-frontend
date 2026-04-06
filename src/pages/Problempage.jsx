// Problempage is the heart of the product.
// It brings together the prompt, editor, judge results, submissions, and AI assistant in one IDE-style layout.
import { useState, useEffect, useMemo } from "react";
import axiosClient from "../utils/axiosClient";
import { useParams, useNavigate } from "react-router-dom";
import Timer from "../components/Timer";
import { Panel, Group, Separator } from "react-resizable-panels";
import LeftPanel from "../components/LeftPanel";
import UpperRightPanel from "../components/UpperRightPanel";
import BottomRight from "../components/BottomRight";
import { runCodeApi, submitCodeApi } from "../api/submission";

export default function Problempage() {
    let { id } = useParams();
    const navigate = useNavigate();
    const [problemData, setProblemData] = useState(null);
    const [code, setCode] = useState("// Write your code here");
    const [language, setLanguage] = useState("cpp");
    const [output, setOutput] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [submissionPopup, setSubmissionPopup] = useState(null);
    const [problemSequence, setProblemSequence] = useState([]);

    useEffect(() => {
        const fetchProblemData = async () => {
            try {
                const res = await axiosClient.get(`/problem/problemById/${id}`)
                setProblemData(res.data);

                // We immediately hydrate the editor with the starter template for the current language.
                if (res.data?.initialCode) {
                    const codeObj = res.data.initialCode.find((obj) => obj.language === language);
                    if (codeObj) setCode(codeObj.code);
                }
            }
            catch (error) {
                console.error("Error occured while fetching the data " + error.message);
            }
        }
        fetchProblemData();
    }, [id])

    useEffect(() => {
        let isCancelled = false;

        const fetchProblemSequence = async () => {
            try {
                const allProblemIds = [];
                let page = 1;
                let hasMore = true;

                // Previous/next navigation is built from the same paginated list the problemset uses.
                while (hasMore) {
                    const res = await axiosClient.get(`/problem/getAllProblems?page=${page}`);
                    const fetchedProblems = Array.isArray(res.data?.problems) ? res.data.problems : [];
                    fetchedProblems.forEach((problemDoc) => {
                        if (problemDoc?._id) allProblemIds.push(problemDoc._id);
                    });
                    hasMore = Boolean(res.data?.hasMore);
                    page += 1;
                }

                if (!isCancelled) {
                    setProblemSequence(allProblemIds);
                }
            } catch (error) {
                if (!isCancelled) {
                    setProblemSequence([]);
                }
            }
        };

        fetchProblemSequence();

        return () => {
            isCancelled = true;
        };
    }, []);

    const currentProblemIndex = useMemo(
        () => problemSequence.findIndex((problemId) => problemId === id),
        [problemSequence, id]
    );

    const hasPreviousProblem = currentProblemIndex > 0;
    const hasNextProblem =
        currentProblemIndex !== -1 && currentProblemIndex < problemSequence.length - 1;

    const handlePreviousProblem = () => {
        if (!hasPreviousProblem) return;
        navigate(`/problem/${problemSequence[currentProblemIndex - 1]}`);
    };

    const handleNextProblem = () => {
        if (!hasNextProblem) return;
        navigate(`/problem/${problemSequence[currentProblemIndex + 1]}`);
    };

    useEffect(() => {
        if (problemData?.initialCode) {
            // Changing language should feel like switching tabs, not like opening a blank editor.
            const codeObj = problemData.initialCode.find((obj) => obj.language === language);
            if (codeObj) {
                setCode(codeObj.code);
            } else {
                setCode("// Write your code here");
            }
        }
    }, [language, problemData]);

    const getErrorMessage = (error, fallback) => {
        if (!error) return fallback;
        if (typeof error === "string") return error;
        if (typeof error === "object") {
            return (
                error.message ||
                error.errorMessage ||
                error.error ||
                (typeof error.data === "string" ? error.data : null) ||
                fallback
            );
        }
        return String(error) || fallback;
    };

    const handleRun = async () => {
        setIsRunning(true);
        setOutput(null);
        try {
            const res = await runCodeApi(id, code, language);
            setOutput({ ...res, type: 'run' });
        } catch (error) {
            console.error(error);
            setOutput({ errorMessage: getErrorMessage(error, "Error running code"), type: 'error' });
        } finally {
            setIsRunning(false);
        }
    };

    const handleSubmit = async () => {
        setIsRunning(true);
        setOutput(null);
        try {
            const res = await submitCodeApi(id, code, language);
            if (res && typeof res === "object") {
                // The popup UI expects plain renderable values, so we normalize everything before storing it.
                const safePayload = {
                    type: 'submit',
                    problemStatus: res.problemStatus ? String(res.problemStatus) : null,
                    status: res.status ? String(res.status) : null,
                    message: res.message ? String(res.message) : null,
                    errorMessage: res.errorMessage ? String(res.errorMessage) : null,
                    runtime: res.runtime != null ? Number(res.runtime) : null,
                    memory: res.memory != null ? Number(res.memory) : null,
                    testCasesPassed: res.testCasesPassed != null ? Number(res.testCasesPassed) : null,
                    testCasesTotal: res.testCasesTotal != null ? Number(res.testCasesTotal) : null,
                };
                setOutput(safePayload);
                setSubmissionPopup({ ...safePayload, language, timestamp: Date.now() });
            } else {
                const payload = { message: String(res || "Problem submitted successfully"), type: 'submit' };
                setOutput(payload);
                setSubmissionPopup({ ...payload, language, timestamp: Date.now() });
            }
        } catch (error) {
            console.error(error);
            const errorMessage = getErrorMessage(error, "Error submitting code");
            setOutput({ errorMessage, type: 'error' });
            setSubmissionPopup({ errorMessage, type: "error", language, timestamp: Date.now() });
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <>
            <div className="h-screen w-full overflow-hidden">

                {/*IDE Navbar*/}
                <div className="flex h-16 bg-white/95 backdrop-blur-md items-center justify-between px-4 border-b border-slate-200 relative z-20 shadow-sm">
                    {/* Left: Navigation */}
                    <div className="flex gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent mr-4">ZenCode</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button onClick={() => navigate('/problemset')} className="btn btn-sm btn-ghost text-slate-600 hover:text-slate-900 flex items-center gap-2 hover:bg-slate-100">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0 4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0-5.571 3-5.571-3" />
                                </svg>
                                Problem List
                            </button>

                            <div className="join">
                                <button
                                    className="btn btn-sm btn-ghost join-item text-slate-400 hover:bg-slate-100 disabled:opacity-40"
                                    onClick={handlePreviousProblem}
                                    disabled={!hasPreviousProblem}
                                    title="Previous problem"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                                    </svg>
                                </button>
                                <button
                                    className="btn btn-sm btn-ghost join-item text-slate-400 hover:bg-slate-100 disabled:opacity-40"
                                    onClick={handleNextProblem}
                                    disabled={!hasNextProblem}
                                    title="Next problem"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Middle: Actions */}
                    <div className="flex gap-3">
                        <button
                            className={`btn btn-sm bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 gap-2 transition-all duration-300 ${isRunning ? "opacity-70 cursor-not-allowed" : "hover:scale-[1.02] active:scale-[0.97]"}`}
                            onClick={handleRun}
                            disabled={isRunning}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                            </svg>
                            {isRunning ? "Running..." : "Run"}
                        </button>

                        <button
                            className={`btn btn-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-none gap-2 px-6 shadow-lg transition-all duration-300 ${isRunning ? "opacity-70 cursor-not-allowed" : "hover:scale-[1.02] active:scale-[0.97]"}`}
                            onClick={handleSubmit}
                            disabled={isRunning}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                            </svg>
                            {isRunning ? "Submitting..." : "Submit"}
                        </button>
                    </div>

                    {/* Right: Timer */}
                    <div className="text-slate-600 font-mono px-3 py-1 rounded">
                        <Timer></Timer>
                    </div>
                </div>


                <div className="bg-slate-50 h-[calc(100vh-64px)] w-full overflow-hidden relative">
                    {/* Ambient Glow removed for clean black theme */}

                    <Group orientation="horizontal" className="z-10 relative p-1 h-full w-full min-h-0 min-w-0">

                        <Panel defaultSize="40%" minSize="25%" className="m-1 rounded-xl overflow-hidden border border-slate-200 shadow-sm min-h-0 min-w-0">
                            <LeftPanel prop={problemData} code={code} language={language} />
                        </Panel>
                        <Separator className="w-1 cursor-col-resize bg-transparent hover:bg-indigo-400/60 transition-colors" />

                        <Panel defaultSize="60%" minSize="30%" className="min-h-0 min-w-0">
                            <Group orientation="vertical" className="h-full min-h-0">
                                <Panel defaultSize="65%" minSize="20%" className="m-1 rounded-xl border border-slate-200 overflow-hidden shadow-sm min-h-0">
                                    <UpperRightPanel
                                        prop={problemData}
                                        code={code}
                                        setCode={setCode}
                                        language={language}
                                        setLanguage={setLanguage}
                                    />
                                </Panel>
                                <Separator className="bg-transparent h-1 cursor-row-resize hover:bg-indigo-400/60 transition-colors" />
                                <Panel defaultSize="35%" minSize="15%" className="m-1 rounded-xl border border-slate-200 shadow-sm min-h-0">
                                    <BottomRight prop={problemData} output={output} />
                                </Panel>
                            </Group>
                        </Panel>

                    </Group>

                </div>

            </div>

            {submissionPopup && (
                <div className="fixed left-4 top-20 z-50 w-[min(380px,calc(100vw-2rem))] animate-slide-in-left">
                    <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`h-12 w-12 rounded-2xl flex items-center justify-center ${submissionPopup.type === "error"
                                        ? "bg-red-50 text-red-500"
                                        : (submissionPopup.problemStatus || submissionPopup.status) === "accepted"
                                            ? "bg-emerald-50 text-emerald-500"
                                            : "bg-amber-50 text-amber-500"
                                        }`}
                                >
                                    <span className="text-xl font-bold">
                                        {submissionPopup.type === "error"
                                            ? "!"
                                            : (submissionPopup.problemStatus || submissionPopup.status) === "accepted"
                                                ? "OK"
                                                : ">"}
                                    </span>
                                </div>
                                <div>
                                    <div className="text-xs uppercase tracking-[0.25em] text-slate-500">
                                        Submission Result
                                    </div>
                                    <div className="text-xl font-semibold text-slate-900">
                                        {submissionPopup.type === "error"
                                            ? "Submission Failed"
                                            : String(submissionPopup.problemStatus || submissionPopup.status || "Submitted").replace(/_/g, " ")}
                                    </div>
                                </div>
                            </div>
                            <button
                                className="btn btn-sm btn-ghost text-slate-400"
                                onClick={() => setSubmissionPopup(null)}
                            >
                                Close
                            </button>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <div className="text-xs text-slate-500 uppercase">Language</div>
                                <div className="font-mono text-slate-800">{submissionPopup.language}</div>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <div className="text-xs text-slate-500 uppercase">Time</div>
                                <div className="text-slate-800">
                                    {new Date(submissionPopup.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                        </div>

                        {submissionPopup.errorMessage && (
                            <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-200 text-sm font-mono whitespace-pre-wrap break-all">
                                {String(submissionPopup.errorMessage)}
                            </div>
                        )}

                        {submissionPopup.message && (
                            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-200 text-sm">
                                {String(submissionPopup.message)}
                            </div>
                        )}

                        {(submissionPopup.testCasesPassed != null || submissionPopup.runtime != null || submissionPopup.memory != null) && (
                            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                {submissionPopup.testCasesPassed != null && (
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 col-span-2">
                                        <div className="text-xs text-slate-500 uppercase">Test Cases</div>
                                        <div className="font-mono text-slate-800">{submissionPopup.testCasesPassed} / {submissionPopup.testCasesTotal}</div>
                                    </div>
                                )}
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <div className="text-xs text-slate-500 uppercase">Runtime</div>
                                    <div className="text-slate-800">{submissionPopup.runtime ?? "-"} ms</div>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <div className="text-xs text-slate-500 uppercase">Memory</div>
                                    <div className="text-slate-800">{submissionPopup.memory ?? "-"} KB</div>
                                </div>
                            </div>
                        )}

                        <div className="mt-4 text-xs text-slate-400">
                            Saved to your submissions history.
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

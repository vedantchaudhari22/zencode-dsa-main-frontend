// The AI assistant is intentionally scoped to the current page session.
// It now talks to the backend proxy so deployed environments do not rely on browser-side Gemini calls.
import React from "react";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import axiosClient from "../utils/axiosClient";

const DEFAULT_WELCOME_TEXT =
    "Hi! I'm **ZenCode AI**, your DSA tutor. Ask me anything about this problem or your code. I won't give you the answer right away - let's think through it together!";

const QUICK_ACTIONS = [
    { label: "Give me a hint", prompt: "Can you give me a hint for this problem without revealing the solution?" },
    { label: "Explain the approach", prompt: "Can you explain the optimal approach to solve this problem step by step?" },
    { label: "Review my code", prompt: "Can you review my current code and point out any issues or improvements?" },
];

function createMessage(role, text) {
    return { id: crypto.randomUUID(), role, text };
}

function createDefaultMessages() {
    return [createMessage("assistant", DEFAULT_WELCOME_TEXT)];
}

function isDefaultWelcomeMessage(message) {
    return message?.role === "assistant" && message?.text === DEFAULT_WELCOME_TEXT;
}

function serializeConversation(messages) {
    if (!Array.isArray(messages)) return [];

    return messages
        .filter(
            (message) =>
                (message?.role === "user" || message?.role === "assistant") &&
                typeof message?.text === "string" &&
                message.text.trim().length > 0
        )
        .filter((message) => !isDefaultWelcomeMessage(message))
        .map((message) => ({
            role: message.role,
            text: message.text,
        }));
}

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-500">
                    <p className="font-bold">Chatbot failed to load</p>
                    <p className="mt-2 font-mono text-sm">{this.state.error?.message}</p>
                </div>
            );
        }

        return this.props.children;
    }
}

function ChatbotInner({ prop, code, language }) {
    const propSafeguard = prop || {};
    const messagesRef = useRef(null);

    const [prompt, setPrompt] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [messages, setMessages] = useState(() => createDefaultMessages());

    useEffect(() => {
        setMessages(createDefaultMessages());
    }, [propSafeguard.description, propSafeguard.title]);

    useEffect(() => {
        const messageList = messagesRef.current;
        if (!messageList) return;
        messageList.scrollTop = messageList.scrollHeight;
    }, [isSending, messages]);

    function appendMessage(role, text) {
        setMessages((prev) => [...prev, createMessage(role, text)]);
    }

    async function sendPrompt(overridePrompt) {
        const trimmedPrompt = (overridePrompt || prompt).trim();
        if (!trimmedPrompt || isSending) return;

        const conversationHistory = serializeConversation(messages);

        appendMessage("user", trimmedPrompt);
        if (!overridePrompt) setPrompt("");
        setIsSending(true);

        try {
            const { data } = await axiosClient.post("/ai/chat", {
                messages: conversationHistory,
                prompt: trimmedPrompt,
                code,
                language,
                problemTitle: propSafeguard.title || "No Title",
                problemDescription: propSafeguard.description || "No Description",
            });

            appendMessage(
                "assistant",
                data?.reply?.trim() ||
                    "I'm ready to help you think through this. Could you tell me what approach you're considering?"
            );
        } catch (error) {
            console.error("Error sending message to backend AI route:", error);
            const message =
                error?.response?.data?.error ||
                error?.message ||
                "I could not get a response right now.";
            appendMessage("assistant", message);
        } finally {
            setIsSending(false);
        }
    }

    function handleSubmit(event) {
        if (event) event.preventDefault();
        sendPrompt();
    }

    function handleComposerKeyDown(event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendPrompt();
        }
    }

    function handleQuickAction(actionPrompt) {
        sendPrompt(actionPrompt);
    }

    return (
        <div className="flex h-full flex-col bg-white">
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4" ref={messagesRef}>
                {messages.map((message) => (
                    <div key={message.id} className={`chat ${message.role === "assistant" ? "chat-start" : "chat-end"}`}>
                        <div
                            className={`chat-bubble max-w-[90%] text-sm leading-relaxed ${
                                message.role === "assistant"
                                    ? "border border-slate-200 bg-slate-50 text-slate-700"
                                    : "border border-indigo-200 bg-indigo-50 text-indigo-800"
                            }`}
                        >
                            <div className="whitespace-pre-wrap break-words">
                                <Markdown>{message.text}</Markdown>
                            </div>
                        </div>
                    </div>
                ))}

                {isSending && (
                    <div className="chat chat-start">
                        <div className="chat-bubble border border-slate-200 bg-slate-50 text-slate-400">
                            <span className="loading loading-dots loading-sm"></span>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex shrink-0 gap-2 overflow-x-auto border-t border-slate-200 px-4 py-2">
                {QUICK_ACTIONS.map((action) => (
                    <button
                        key={action.label}
                        onClick={() => handleQuickAction(action.prompt)}
                        disabled={isSending}
                        className="whitespace-nowrap rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {action.label}
                    </button>
                ))}
            </div>

            <div className="shrink-0 bg-white p-3 border-t border-slate-100">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <textarea
                        className="h-12 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        value={prompt}
                        onChange={(event) => setPrompt(event.target.value)}
                        onKeyDown={handleComposerKeyDown}
                        placeholder="Ask about this DSA problem..."
                        rows="1"
                    />
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!prompt.trim() || isSending}
                        className="btn h-12 rounded-xl border-none bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:opacity-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function Chatbot(props) {
    return (
        <ErrorBoundary>
            <ChatbotInner {...props} />
        </ErrorBoundary>
    );
}

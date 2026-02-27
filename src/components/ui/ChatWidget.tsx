import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { sendChatMessage } from "../../services/api";
import type { ChatHistoryMessage } from "../../services/api";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Message {
    id: string;
    sender: "user" | "bot";
    text: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline Markdown Renderer — renders bold, inline code, and line breaks
// Supports: **bold**, `code`, numbered lists, bullet lists, newlines
// No external library needed
// ─────────────────────────────────────────────────────────────────────────────
function renderMarkdown(text: string): React.ReactElement[] {
    const lines = text.split("\n");
    const output: React.ReactElement[] = [];
    let listItems: string[] = [];
    let numberedItems: { num: string; text: string }[] = [];
    let key = 0;

    const flushList = () => {
        if (listItems.length) {
            output.push(
                <ul key={key++} className="list-none space-y-1 my-1">
                    {listItems.map((li, i) => (
                        <li key={i} className="flex gap-2 text-sm leading-snug">
                            <span style={{ color: "var(--brand-primary, #6366f1)" }} className="flex-shrink-0 font-bold">•</span>
                            <span>{renderInline(li)}</span>
                        </li>
                    ))}
                </ul>
            );
            listItems = [];
        }
        if (numberedItems.length) {
            output.push(
                <ol key={key++} className="list-none space-y-1.5 my-1">
                    {numberedItems.map((item, i) => (
                        <li key={i} className="flex gap-2 text-sm leading-snug">
                            <span
                                className="flex-shrink-0 w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center font-bold"
                                style={{ background: "var(--brand-primary, #6366f1)", minWidth: "1.25rem" }}
                            >
                                {item.num}
                            </span>
                            <span className="flex-1">{renderInline(item.text)}</span>
                        </li>
                    ))}
                </ol>
            );
            numberedItems = [];
        }
    };

    for (const line of lines) {
        const trimmed = line.trim();

        // Headings (## or **heading**)
        const h2 = trimmed.match(/^#{1,2}\s+(.+)/);
        if (h2) {
            flushList();
            output.push(
                <p key={key++} className="font-semibold text-sm mt-2 mb-0.5" style={{ color: "var(--text-primary, #111)" }}>
                    {renderInline(h2[1])}
                </p>
            );
            continue;
        }

        // Numbered list (1. text or 1- text)
        const numbered = trimmed.match(/^(\d+)[.\-]\s+(.+)/);
        if (numbered) {
            listItems.length && flushList();
            numberedItems.push({ num: numbered[1], text: numbered[2] });
            continue;
        }

        // Bullet list (- or *)
        const bullet = trimmed.match(/^[-*•]\s+(.+)/);
        if (bullet) {
            numberedItems.length && flushList();
            listItems.push(bullet[1]);
            continue;
        }

        // Table row (| col | col |)
        if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
            flushList();
            if (trimmed.replace(/[\s|-]/g, "") === "") continue; // separator row

            const cells = trimmed.split("|").filter((c) => c.trim() !== "");
            const isHeader = output.length === 0 || (output[output.length - 1] as React.ReactElement)?.type !== "table";
            output.push(
                <div key={key++} className={`flex gap-2 text-sm py-1 ${isHeader ? "font-semibold border-b" : "border-b border-dashed"}`}
                    style={{ borderColor: "var(--brand-accent, #e5e7eb)" }}>
                    {cells.map((c, i) => (
                        <span key={i} className="flex-1">{renderInline(c.trim())}</span>
                    ))}
                </div>
            );
            continue;
        }

        // Flush any pending list
        flushList();

        // Empty line → spacer
        if (!trimmed) {
            output.push(<div key={key++} className="h-1" />);
            continue;
        }

        // Regular paragraph
        output.push(
            <p key={key++} className="text-sm leading-relaxed">
                {renderInline(trimmed)}
            </p>
        );
    }

    flushList();
    return output;
}

function renderInline(text: string): (string | React.ReactElement)[] {
    const parts: (string | React.ReactElement)[] = [];
    // Match **bold**, `code`, or plain text
    const regex = /\*\*(.+?)\*\*|`(.+?)`/g;
    let last = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > last) parts.push(text.slice(last, match.index));
        if (match[1] !== undefined) {
            parts.push(
                <strong key={match.index} className="font-semibold" style={{ color: "var(--text-primary, #111)" }}>
                    {match[1]}
                </strong>
            );
        } else if (match[2] !== undefined) {
            parts.push(
                <code key={match.index} className="px-1 py-0.5 rounded text-[11px] font-mono"
                    style={{ background: "var(--bg-secondary, #f3f4f6)", color: "var(--brand-primary, #6366f1)" }}>
                    {match[2]}
                </code>
            );
        }
        last = match.index + match[0].length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts;
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick Chip Config — dynamic per role × page
// ─────────────────────────────────────────────────────────────────────────────
function getQuickChips(role: string, page: string): string[] {
    const p = page.toLowerCase();

    if (p === "/" || p === "") return ["What is EventLive?", "How do I sign up?", "What features are available?"];
    if (p === "/login") return ["I forgot my password", "Sign in with Google", "Create a new account"];
    if (p === "/get-started") return ["Information required to sign up", "Is Google sign-up supported?"];
    if (p === "/onboarding") return ["What is an Organizer?", "What is an Attendee?", "Which role should I choose?"];
    if (p === "/forgot-password") return ["Password reset link help", "How long is the link valid?"];

    if (p === "/all-events" || p === "/dashboard/all-events") {
        if (role === "Organizer") return ["How to create my own event", "Event types overview"];
        return ["How to register for an event", "How to join a live session", "Where to find session codes"];
    }

    if (p === "/dashboard") {
        if (role === "Organizer") return ["How to create an event", "Dashboard features overview", "How to start a session"];
        return ["My enrolled events", "How to join a live session", "Dashboard features overview"];
    }

    if (p === "/dashboard/create-event")
        return ["Walkthrough of the 5 steps", "How to add speakers", "Save as draft help"];

    if (p === "/dashboard/events") {
        if (role === "Organizer") return ["How to publish an event", "Status badge meanings", "How to start a session"];
        return ["Manage my enrollments", "How to join an upcoming event"];
    }

    if (p === "/dashboard/drafts")
        return ["How to continue a draft", "How to publish a draft", "Deleting unwanted drafts"];

    if (p === "/dashboard/requests")
        return ["How to approve requests", "How to reject attendees", "Managing join requests"];

    if (p.includes("/attendees"))
        return ["Viewing attendee details", "Managing event registrations"];

    if (p.startsWith("/dashboard/events/"))
        return ["Start the live session", "Editing event details", "Viewing attendee list"];

    if (p.startsWith("/join/")) {
        if (role === "Organizer") return ["Recording the session", "Ending the session", "Host controls overview"];
        return ["How to raise my hand", "Using the session chat", "Attendee controls overview"];
    }

    if (p === "/event-lobby") return ["When will the session start?", "Wait in lobby features"];
    if (p === "/dashboard/settings") return ["Updating my profile", "Updating my password"];

    return ["What can I do on this page?", "Tell me about EventLive", "Platform help"];
}

// ─────────────────────────────────────────────────────────────────────────────
// Opening greeting — dynamic per role × page
// ─────────────────────────────────────────────────────────────────────────────
function getGreeting(role: string, page: string, name?: string): string {
    const firstName = name ? name.split(" ")[0] : "";
    const hi = firstName ? `Hi ${firstName}.` : "Hi there.";
    const p = page.toLowerCase();

    if (p === "/dashboard/create-event") return "I am ready to help you build your event. I can guide you through each of the five steps.";
    if (p.startsWith("/join/")) {
        if (role === "Organizer") return "You are currently in a live session. I can provide information on managing your broadcast and attendees.";
        return "Welcome to the live session. I can provide information on participating, using the chat, or managing your audio/video settings.";
    }
    if (p === "/dashboard") {
        if (role === "Organizer") return `${hi} You can manage your events and attendees here. How can I assist you today?`;
        return `${hi} You can browse and join events from your dashboard. Do you have any questions?`;
    }
    if (p === "/dashboard/drafts") return "You are viewing your unpublished drafts. I can explain how to resume or publish them.";
    if (p === "/dashboard/requests") return "You are viewing pending join requests. I can guide you through the approval process.";
    if (p === "/onboarding") return "Please select your role to proceed. I can explain the differences between Organizer and Attendee accounts.";
    if (p === "/login" || p === "/get-started") return "If you require assistance with your account or authentication, please ask.";
    if (role === "Organizer") return `${hi} I am your EventLive assistant. I can help with event creation, management, and analytics.`;
    if (role === "Attendee") return `${hi} I am here to assist you with finding and joining events. How can I help?`;
    return "Hello. I am the EventLive assistant. Please ask any questions regarding the platform.";
}

// ─────────────────────────────────────────────────────────────────────────────
// Typing indicator — bouncing dots
// ─────────────────────────────────────────────────────────────────────────────
const TypingDots = () => (
    <div className="flex items-center gap-1 px-1">
        {[0, 1, 2].map((i) => (
            <motion.span
                key={i}
                className="block w-2 h-2 rounded-full"
                style={{ background: "var(--text-secondary, #9ca3af)" }}
                animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.16, ease: "easeInOut" }}
            />
        ))}
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Bot avatar icon
// ─────────────────────────────────────────────────────────────────────────────
const BotAvatar = ({ size = 6 }: { size?: number }) => (
    <div
        className={`flex-shrink-0 w-${size} h-${size} rounded-full flex items-center justify-center`}
        style={{ background: "var(--brand-primary, #6366f1)" }}
    >
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-${Math.floor(size * 0.5)} w-${Math.floor(size * 0.5)} text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// ChatWidget — Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function ChatWidget() {
    const { user } = useAuth();
    const location = useLocation();
    const page = location.pathname;
    const role = user?.role || "Guest";
    const userName = user?.name;

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [history, setHistory] = useState<ChatHistoryMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [initialised, setInitialised] = useState(false);

    const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Default chips are used if there are no dynamic suggestions
    const defaultChips = getQuickChips(role, page);
    const displaySuggestions = currentSuggestions.length > 0 ? currentSuggestions : defaultChips;

    // Inject greeting on first open
    useEffect(() => {
        if (isOpen && !initialised) {
            setMessages([{ id: "greeting", sender: "bot", text: getGreeting(role, page, userName) }]);
            setInitialised(true);
        }
    }, [isOpen, initialised, role, page, userName]);

    // Reset context on page change
    useEffect(() => {
        setMessages([]);
        setHistory([]);
        setCurrentSuggestions([]);
        setInitialised(false);
    }, [page]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    // Focus input when panel opens
    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 150);
    }, [isOpen]);

    // ── Send message ────────────────────────────────────────────────────────────
    const sendMessage = useCallback(async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed || loading) return;

        setMessages((prev) => [...prev, { id: `u-${Date.now()}`, sender: "user", text: trimmed }]);
        setInput("");
        setLoading(true);

        try {
            const { reply, suggestions } = await sendChatMessage(trimmed, role, page, history);
            setMessages((prev) => [...prev, { id: `b-${Date.now()}`, sender: "bot", text: reply }]);
            setCurrentSuggestions(suggestions || []);
            setHistory((prev) => [
                ...prev,
                { role: "user" as const, content: trimmed },
                { role: "assistant" as const, content: reply },
            ]);
        } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : "";
            const errText = errMsg.includes("backend is likely down") || errMsg.includes("Unable to connect")
                ? "Cannot reach the server. Please ensure the backend is running."
                : errMsg.includes("OPENROUTER")
                    ? "The AI service is not configured. Please contact the administrator."
                    : "I was unable to retrieve a response. Please try again.";
            setMessages((prev) => [...prev, { id: `err-${Date.now()}`, sender: "bot", text: errText }]);
            setCurrentSuggestions([]);
        } finally {
            setLoading(false);
        }
    }, [loading, role, page, history]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
    };

    // Page label for header
    const pageLabel = (() => {
        if (page === "/") return "Home";
        const clean = page.replace(/^\/dashboard\//, "").replace(/-/g, " ").replace(/\//g, " › ");
        return clean.charAt(0).toUpperCase() + clean.slice(1);
    })();

    const showChips = displaySuggestions.length > 0 && !loading;

    // ── Render ──────────────────────────────────────────────────────────────────
    return (
        <>
            {/* Floating trigger button */}
            <motion.button
                onClick={() => setIsOpen((v) => !v)}
                className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-2xl focus:outline-none focus:ring-4"
                style={{ background: "#4338CA", color: "#fff", boxShadow: "0 8px 32px rgba(67,56,202,0.3)" }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Toggle EventLive assistant"
            >
                <AnimatePresence mode="wait" initial={false}>
                    {isOpen ? (
                        <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </motion.span>
                    ) : (
                        <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </motion.span>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Chat panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="panel"
                        initial={{ opacity: 0, y: 24, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
                        style={{
                            background: "#FFFFFF",
                            border: "1px solid rgba(67,56,202,0.15)",
                            height: "560px",
                            boxShadow: "0 24px 64px rgba(67,56,202,0.12), 0 2px 12px rgba(0,0,0,0.06)",
                        }}
                    >
                        {/* ── Header ── */}
                        <div
                            className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
                            style={{ background: "#4338CA" }}
                        >
                            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white/20 flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-semibold text-sm leading-tight">EventLive Assistant</p>
                                <p className="text-white/70 text-[10px] uppercase tracking-wider font-medium truncate">
                                    {role !== "Guest" && `${role} • `}{pageLabel}
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-white/70 text-[11px] font-medium">Online</span>
                            </div>
                        </div>

                        {/* ── Messages ── */}
                        <div
                            className="flex-1 overflow-y-auto px-3 py-3 space-y-3"
                            style={{ background: "#F8F9FC" }}
                        >
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} items-end gap-2`}
                                >
                                    {msg.sender === "bot" && <BotAvatar size={6} />}

                                    <div
                                        className="max-w-[84%] rounded-2xl overflow-hidden"
                                        style={
                                            msg.sender === "user"
                                                ? {
                                                    background: "#4338CA",
                                                    color: "#fff",
                                                    borderBottomRightRadius: "4px",
                                                    padding: "10px 14px",
                                                }
                                                : {
                                                    background: "#FFFFFF",
                                                    color: "#111111",
                                                    border: "1px solid rgba(67,56,202,0.12)",
                                                    borderBottomLeftRadius: "6px",
                                                    padding: "10px 14px",
                                                }
                                        }
                                    >
                                        {msg.sender === "user" ? (
                                            <p className="text-sm leading-relaxed">{msg.text}</p>
                                        ) : (
                                            <div className="space-y-1 text-sm">
                                                {renderMarkdown(msg.text)}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {/* Typing indicator */}
                            {loading && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start items-end gap-2">
                                    <BotAvatar size={6} />
                                    <div
                                        className="px-4 py-3 rounded-2xl"
                                        style={{
                                            background: "#FFFFFF",
                                            border: "1px solid rgba(67,56,202,0.12)",
                                            borderBottomLeftRadius: "6px",
                                        }}
                                    >
                                        <TypingDots />
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* ── Quick chips ── */}
                        <AnimatePresence>
                            {showChips && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="px-3 pt-1 pb-3 flex flex-wrap gap-1.5 flex-shrink-0 overflow-hidden"
                                    style={{ background: "#FFFFFF" }}
                                >
                                    {displaySuggestions.map((chip) => (
                                        <motion.button
                                            key={chip}
                                            onClick={() => sendMessage(chip)}
                                            whileHover={{ y: -1, background: "rgba(67,56,202,0.1)" }}
                                            whileTap={{ scale: 0.98 }}
                                            className="px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all focus:outline-none"
                                            style={{
                                                background: "rgba(67,56,202,0.05)",
                                                color: "#4338CA",
                                                border: "1px solid rgba(67,56,202,0.15)",
                                            }}
                                        >
                                            {chip}
                                        </motion.button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ── Input row ── */}
                        <div
                            className="flex items-center gap-2 px-3 py-2.5 flex-shrink-0"
                            style={{ borderTop: "1px solid rgba(67,56,202,0.1)", background: "#FFFFFF" }}
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask me anything about EventLive…"
                                disabled={loading}
                                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none disabled:opacity-50 transition-all"
                                style={{
                                    background: "#F3F4F6",
                                    color: "#111111",
                                    border: "1px solid rgba(67,56,202,0.15)",
                                }}
                            />
                            <motion.button
                                onClick={() => sendMessage(input)}
                                disabled={loading || !input.trim()}
                                whileTap={{ scale: 0.92 }}
                                aria-label="Send message"
                                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white transition-opacity disabled:opacity-40 focus:outline-none"
                                style={{ background: "#4338CA" }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                </svg>
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

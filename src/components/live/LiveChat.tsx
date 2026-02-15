import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '../../hooks/useRealtimeChat';
import { toast } from 'sonner';
import { ChevronDownIcon, FaceSmileIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'; // Using outline for consistency

/**
 * LiveChat Component
 * Real-time chat with message history and auto-scroll
 */
interface LiveChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading?: boolean;
}

export const LiveChat: React.FC<LiveChatProps> = ({
  messages,
  onSendMessage,
  isLoading = false,
}) => {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if user is near bottom
  const isNearBottom = () => {
    if (!containerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    return scrollHeight - scrollTop - clientHeight < 100;
  };

  // Scroll Handler
  const handleScroll = () => {
    if (isNearBottom()) {
      setShowScrollButton(false);
      setUnreadCount(0);
    } else {
      setShowScrollButton(true);
    }
  };

  // Auto-scroll effect
  useEffect(() => {
    if (isNearBottom()) {
      scrollToBottom();
    } else {
      setUnreadCount(prev => prev + 1);
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setUnreadCount(0);
    setShowScrollButton(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    try {
      setIsSending(true);
      await onSendMessage(input.trim());
      setInput('');
      scrollToBottom();
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden bg-transparent`}>

      {/* Messages Area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth relative custom-scrollbar"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <FaceSmileIcon className="w-8 h-8 text-white/50" />
            </div>
            <p className="text-sm font-bold text-white">No messages yet</p>
            <p className="text-xs text-zinc-400">Be the first to say hello!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <MessageRow
              key={msg._id || idx}
              message={msg}
              isConsecutive={idx > 0 && messages[idx - 1].senderId === msg.senderId}
            />
          ))
        )}
        <div ref={messagesEndRef} />

        {/* Scroll Button / Unread Notch */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className={`absolute bottom-4 left-1/2 -translate-x-1/2 shadow-xl shadow-black/50 rounded-full px-4 py-2 text-xs font-bold flex items-center gap-2 transition-all transform hover:scale-105 z-10 border border-white/10 ${unreadCount > 0 ? 'bg-brand-600 text-white' : 'bg-zinc-800 text-white'}`}
          >
            {unreadCount > 0 ? (
              <span>{unreadCount} new message{unreadCount > 1 ? 's' : ''}</span>
            ) : (
              <span>Scroll to bottom</span>
            )}
            <ChevronDownIcon className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Input Area */}
      <div className={`shrink-0 p-4 border-t border-white/5 bg-zinc-900`}>
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-zinc-950 border border-zinc-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
            disabled={isSending || isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending || isLoading}
            className={`p-3 rounded-xl transition-all ${input.trim() ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20 hover:bg-brand-500' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

const MessageRow: React.FC<{ message: ChatMessage; isConsecutive: boolean }> = ({ message, isConsecutive }) => {
  const isSystem = message.messageType === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/5">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 group ${isConsecutive ? 'mt-1' : 'mt-4'}`}>
      {!isConsecutive ? (
        message.senderAvatar ? (
          <img src={message.senderAvatar} alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10 bg-zinc-800" />
        ) : (
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-br from-zinc-700 to-zinc-800 text-white ring-1 ring-white/10 shadow-inner">
            {message.senderName?.charAt(0).toUpperCase()}
          </div>
        )
      ) : (
        <div className="w-8" />
      )}

      <div className="flex-1 min-w-0">
        {!isConsecutive && (
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-xs font-bold text-zinc-300">
              {message.senderName}
            </span>
            <span className="text-[10px] text-zinc-500">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
        <div className={`text-sm break-words leading-relaxed text-zinc-100 ${!isConsecutive ? 'bg-white/5 p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl border border-white/5' : 'pl-1'}`}>
          {message.content}
        </div>
      </div>
    </div>
  );
};

export default LiveChat;

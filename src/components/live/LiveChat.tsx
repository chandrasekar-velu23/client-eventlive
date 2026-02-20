import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '../../hooks/useRealtimeChat';
import { toast } from 'sonner';
import { ChevronDownIcon, FaceSmileIcon, PaperAirplaneIcon, PaperClipIcon } from '@heroicons/react/24/outline'; // Using outline for consistency

/**
 * LiveChat Component
 * Real-time chat with message history and auto-scroll
 */
interface LiveChatProps {
  messages: ChatMessage[];
  currentUserId?: string;
  onSendMessage: (message: string) => Promise<void>;
  onSendFile?: (file: File) => Promise<void>;
  isLoading?: boolean;
}

export const LiveChat: React.FC<LiveChatProps> = ({
  messages,
  currentUserId,
  onSendMessage,
  onSendFile,
  isLoading = false,
}) => {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!onSendFile) {
      toast.error('File sharing is not enabled in this session');
      return;
    }

    // Simple validation (e.g. max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size limit is 50MB');
      return;
    }

    try {
      await onSendFile(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error(err);
      toast.error('Failed to send file');
    }
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden bg-transparent`}>

      {/* Messages Area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg-secondary scroll-smooth relative custom-scrollbar"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <FaceSmileIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm font-bold text-gray-700">No messages yet</p>
            <p className="text-xs text-gray-500">Be the first to say hello!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <MessageRow
              key={msg._id || idx}
              message={msg}
              currentUserId={currentUserId}
              isConsecutive={idx > 0 && messages[idx - 1].senderId === msg.senderId}
            />
          ))
        )}
        <div ref={messagesEndRef} />

        {/* Scroll Button / Unread Notch */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className={`absolute bottom-4 left-1/2 -translate-x-1/2 shadow-xl shadow-black/50 rounded-full px-4 py-2 text-xs font-bold flex items-center gap-2 transition-all transform hover:scale-105 z-10 border border-gray-200 ${unreadCount > 0 ? 'bg-brand-600 text-white' : 'bg-white text-gray-700'}`}
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
      <div className="p-4 bg-white border-t border-gray-200">
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2"
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-all"
            title="Attach File"
          >
            <PaperClipIcon className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-bg-secondary border border-gray-200 rounded-xl px-4 py-3 text-base md:text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
            disabled={isSending || isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending || isLoading}
            className={`p-3 rounded-xl transition-all ${input.trim() ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20 hover:bg-brand-500' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

const MessageRow: React.FC<{ message: ChatMessage; isConsecutive: boolean; currentUserId?: string }> = ({ message, isConsecutive, currentUserId }) => {
  const isSystem = message.messageType === 'system';
  const isSelf = !!currentUserId && message.senderId === currentUserId;

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 group ${isConsecutive ? 'mt-1' : 'mt-4'} ${isSelf ? 'justify-end' : ''}`}>
      {!isSelf && !isConsecutive ? (
        message.senderAvatar ? (
          <img src={message.senderAvatar} alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200 bg-gray-100" />
        ) : (
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700 ring-1 ring-gray-200 shadow-inner">
            {message.senderName?.charAt(0).toUpperCase()}
          </div>
        )
      ) : (
        <div className="w-8" />
      )}

      <div className="flex-1 min-w-0">
        {!isConsecutive && (
          <div className={`flex items-baseline gap-2 mb-1 ${isSelf ? 'justify-end' : ''}`}>
            <span className={`text-xs font-bold ${isSelf ? 'text-brand-700' : 'text-gray-700'}`}>
              {message.senderName}
            </span>
            <span className={`text-[10px] ${isSelf ? 'text-brand-400' : 'text-gray-500'}`}>
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
        <div className={`text-sm break-words leading-relaxed ${isSelf ? 'bg-brand-50 text-text-primary border border-brand-100' : 'bg-white text-text-primary border border-gray-200 shadow-sm'} p-3 rounded-xl ${isSelf ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
          {message.content}
        </div>
      </div>
    </div>
  );
};
export default LiveChat;

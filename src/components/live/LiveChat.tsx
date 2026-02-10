import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '../../hooks/useRealtimeChat';
import { toast } from 'sonner';

interface LiveChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading?: boolean;
}

/**
 * LiveChat Component
 * Real-time chat with message history and auto-scroll
 */
export const LiveChat: React.FC<LiveChatProps> = ({
  messages,
  onSendMessage,
  isLoading = false,
}) => {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) {
      toast.error('Message cannot be empty');
      return;
    }

    if (isSending || isLoading) return;

    try {
      setIsSending(true);
      await onSendMessage(input.trim());
      setInput('');
      toast.success('Message sent');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send message';
      toast.error(message);
      console.error('Send message error:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 bg-gray-900">
        <h3 className="text-white font-semibold">Live Chat</h3>
        <p className="text-xs text-gray-400">{messages.length} messages</p>
      </div>

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <ChatMessageRow
              key={message._id || index}
              message={message}
              isConsecutive={
                index > 0 && messages[index - 1].senderId === message.senderId
              }
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSend}
        className="px-4 py-3 border-t border-gray-700 bg-gray-900 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(e as unknown as React.FormEvent);
            }
          }}
          disabled={isSending || isLoading}
          placeholder="Type a message..."
          maxLength={500}
          className="flex-1 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isSending || isLoading || !input.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

/**
 * Chat Message Row Component
 */
interface ChatMessageRowProps {
  message: ChatMessage;
  isConsecutive?: boolean;
}

const ChatMessageRow: React.FC<ChatMessageRowProps> = ({ message, isConsecutive = false }) => {
  // Format time
  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Determine message styling
  const isSystem = message.messageType === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <p className="text-xs text-gray-500 bg-gray-700 px-3 py-1 rounded">
          {message.content}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex gap-2 ${isConsecutive ? 'mt-0.5' : 'mt-2'}`}>
      {!isConsecutive && (
        <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-400 to-blue-600 shrink-0 flex items-center justify-center text-white text-xs font-bold">
          {message.senderName?.charAt(0).toUpperCase()}
        </div>
      )}

      {isConsecutive && <div className="w-8 shrink-0" />}

      <div className="flex-1 min-w-0">
        {!isConsecutive && (
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-sm font-semibold text-white">{message.senderName}</span>
            <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
          </div>
        )}

        <div className="bg-gray-700 rounded px-3 py-2 wrap-break-words">
          <p className="text-sm text-gray-100">{message.content}</p>
        </div>

        {message.reactions && message.reactions.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {message.reactions.map((reaction: { emoji: string; count: number }, idx: number) => (
              <button
                key={idx}
                className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-0.5 rounded-full transition-colors"
              >
                {reaction.emoji} {reaction.count}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveChat;

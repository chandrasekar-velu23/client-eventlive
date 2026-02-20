import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import type { Question } from '../../hooks/useQA';
import { HandThumbUpIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpIconSolid } from '@heroicons/react/24/solid';

interface QAPanelProps {
  questions: Question[];
  currentUserId: string;
  onAskQuestion: (question: string) => Promise<void>;
  onUpvoteQuestion: (questionId: string) => Promise<void>;
  onAnswerQuestion?: (questionId: string, answer: string) => Promise<void>;
  isLoading?: boolean;
  userRole?: 'organizer' | 'speaker' | 'attendee';
}

export const QAPanel: React.FC<QAPanelProps> = ({
  questions,
  currentUserId,
  onAskQuestion,
  onUpvoteQuestion,
  onAnswerQuestion,
  isLoading = false,
  userRole = 'attendee',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(null);
  const [answerInputValue, setAnswerInputValue] = useState('');
  const questionsEndRef = useRef<HTMLDivElement>(null);
  const MAX_QUESTION_LENGTH = 500;
  const MAX_ANSWER_LENGTH = 1000;

  // Auto-scroll to latest question
  useEffect(() => {
    if (questionsEndRef.current) {
      questionsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [questions.length]);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim()) {
      toast.error('Please enter a question');
      return;
    }

    if (inputValue.length > MAX_QUESTION_LENGTH) {
      toast.error(`Question must be ${MAX_QUESTION_LENGTH} characters or less`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onAskQuestion(inputValue);
      setInputValue('');
      toast.success('Question asked');
    } catch (err) {
      console.error(err);
      toast.error('Failed to ask question');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (questionId: string) => {
    try {
      await onUpvoteQuestion(questionId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnswerSubmit = async (questionId: string) => {
    if (!answerInputValue.trim()) {
      toast.error('Please enter an answer');
      return;
    }

    if (answerInputValue.length > MAX_ANSWER_LENGTH) {
      toast.error(`Answer must be ${MAX_ANSWER_LENGTH} characters or less`);
      return;
    }

    try {
      setIsSubmitting(true);
      if (onAnswerQuestion) {
        await onAnswerQuestion(questionId, answerInputValue);
        setAnswerInputValue('');
        setAnsweringQuestionId(null);
        toast.success('Answer submitted');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedQuestions = [...questions].sort((a, b) => {
    // Sort by answered status (pending first), then upvotes
    if (a.isAnswered !== b.isAnswered) {
      return a.isAnswered ? 1 : -1;
    }
    return (b.upvotes?.length || 0) - (a.upvotes?.length || 0);
  });

  const canAnswer = userRole === 'organizer' || userRole === 'speaker';

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-white/50 backdrop-blur-sm">
        <h2 className="text-lg font-bold text-gray-900">Q&A</h2>
        <p className="text-xs text-gray-500">{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Questions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
            <span className="text-4xl mb-3">💬</span>
            <p className="text-gray-400 font-medium">No questions yet</p>
            <p className="text-xs text-gray-400 mt-1">Be the first to ask!</p>
          </div>
        ) : (
          sortedQuestions.map((question) => (
            <div key={question._id} className={`rounded-xl p-3 border ${question.isAnswered ? 'bg-brand-50 border-brand-100' : 'bg-white border-gray-200 shadow-sm'}`}>

              {/* Question Header — avatar + name + time + content */}
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {question.askedByName?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-700">{question.askedByName}</span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(question.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 leading-relaxed break-words">{question.content}</p>
                </div>
              </div>

              {/* Actions Bar */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                <button
                  onClick={() => handleUpvote(question._id)}
                  disabled={isLoading}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all ${question.upvotes?.includes(currentUserId)
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                >
                  {question.upvotes?.includes(currentUserId) ? (
                    <HandThumbUpIconSolid className="h-3.5 w-3.5" />
                  ) : (
                    <HandThumbUpIcon className="h-3.5 w-3.5" />
                  )}
                  <span>{question.upvotes?.length || 0}</span>
                </button>

                {question.isAnswered ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                    <CheckCircleIcon className="h-3.5 w-3.5" /> Answered
                  </span>
                ) : (
                  canAnswer && (
                    <button
                      onClick={() => setAnsweringQuestionId(prev => prev === question._id ? null : question._id)}
                      className="text-xs font-medium text-brand-600 hover:text-brand-500 transition-colors"
                    >
                      {answeringQuestionId === question._id ? 'Cancel' : 'Reply'}
                    </button>
                  )
                )}
              </div>

              {/* Answer Display */}
              {question.isAnswered && question.answer && (
                <div className="mt-3 pl-3 border-l-2 border-green-500/40">
                  <p className="text-xs font-bold text-green-600 mb-1">Answered by {question.answeredBy || 'Host'}</p>
                  <p className="text-sm text-gray-700">{question.answer}</p>
                </div>
              )}

              {/* Answer Input (For Host/Speaker) */}
              {answeringQuestionId === question._id && canAnswer && (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={answerInputValue}
                    onChange={(e) => setAnswerInputValue(e.target.value)}
                    placeholder="Type your answer..."
                    maxLength={MAX_ANSWER_LENGTH}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none resize-none"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleAnswerSubmit(question._id)}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-500 text-white hover:bg-brand-400 transition-all shadow-lg disabled:opacity-50"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Answer'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          ))
        )}
        <div ref={questionsEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <form onSubmit={handleAskQuestion} className="relative">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a question..."
            maxLength={MAX_QUESTION_LENGTH}
            disabled={isSubmitting || isLoading}
            className="w-full pl-4 pr-12 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all resize-none shadow-inner"
            rows={1}
            style={{ minHeight: '46px', maxHeight: '120px' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAskQuestion(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={isSubmitting || isLoading || !inputValue.trim()}
            className="absolute right-2 top-2 p-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-400 disabled:opacity-50 disabled:bg-zinc-700 transition-all"
            title="Send Question"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
            </svg>
          </button>
        </form>
        <p className="text-[10px] text-gray-400 text-center mt-2">
          Questions are visible to everyone in the session.
        </p>
      </div>
    </div>
  );
};

export default QAPanel;

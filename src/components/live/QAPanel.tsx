import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';

interface Question {
  _id: string;
  text: string;
  asker: {
    _id: string;
    name: string;
    avatar?: string;
  };
  answers: {
    _id: string;
    text: string;
    responder: {
      _id: string;
      name: string;
      avatar?: string;
    };
    createdAt: string;
  }[];
  upvotes: number;
  upvoters: string[];
  status: 'pending' | 'answered' | 'rejected';
  createdAt: string;
}

interface QAPanelProps {
  questions: Question[];
  currentUserId: string;
  onAskQuestion: (question: string) => Promise<void>;
  onUpvoteQuestion: (questionId: string) => Promise<void>;
  onAnswerQuestion?: (questionId: string, answer: string) => Promise<void>;
  isLoading?: boolean;
  userRole?: 'organizer' | 'speaker' | 'attendee';
}

/**
 * QAPanel Component
 * Real-time Q&A interface with questions, answers, and upvotes
 */
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
  }, [questions]);

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
      const message = err instanceof Error ? err.message : 'Failed to ask question';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (questionId: string) => {
    try {
      await onUpvoteQuestion(questionId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upvote';
      toast.error(message);
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
      const message = err instanceof Error ? err.message : 'Failed to submit answer';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedQuestions = [...questions].sort((a, b) => {
    // Sort by status (pending first), then by upvotes (descending)
    if (a.status !== b.status) {
      const statusOrder = { pending: 0, answered: 1, rejected: 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return b.upvotes - a.upvotes;
  });

  const canAnswer = userRole === 'organizer' || userRole === 'speaker';

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 bg-gray-800">
        <h2 className="text-lg font-bold text-white">Questions & Answers</h2>
        <p className="text-xs text-gray-400">{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Questions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="text-4xl mb-2">❓</span>
            <p className="text-gray-400">No questions yet</p>
            <p className="text-xs text-gray-500 mt-1">Be the first to ask a question</p>
          </div>
        ) : (
          sortedQuestions.map((question) => (
            <div key={question._id} className="space-y-2">
              {/* Question Card */}
              <div className="bg-gray-800 rounded-lg p-3 space-y-2 border border-gray-700">
                {/* Question Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    {/* Avatar */}
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{
                        backgroundColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
                        color: 'white',
                      }}
                    >
                      {question.asker.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-300">{question.asker.name}</p>
                      <p className="text-sm text-gray-100 wrap-break-words">{question.text}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(question.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium shrink-0 ${
                      question.status === 'answered'
                        ? 'bg-green-900 text-green-200'
                        : question.status === 'rejected'
                          ? 'bg-red-900 text-red-200'
                          : 'bg-yellow-900 text-yellow-200'
                    }`}
                  >
                    {question.status === 'answered' ? '✓ Answered' : question.status === 'rejected' ? '✗ Rejected' : 'Pending'}
                  </span>
                </div>

                {/* Upvote Button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpvote(question._id)}
                    disabled={isLoading}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                      question.upvoters.includes(currentUserId)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span>👍</span>
                    <span>{question.upvotes}</span>
                  </button>
                </div>

                {/* Answer Section */}
                {question.answers.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
                    {question.answers.map((answer) => (
                      <div key={answer._id} className="bg-gray-900 rounded p-2 space-y-1">
                        <div className="flex items-start gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                            style={{
                              backgroundColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
                              color: 'white',
                            }}
                          >
                            {answer.responder.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-green-400">{answer.responder.name}</p>
                            <p className="text-xs text-gray-200 wrap-break-words">{answer.text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Answer Button */}
                {canAnswer && question.status === 'pending' && (
                  <button
                    onClick={() => setAnsweringQuestionId(question._id)}
                    disabled={isLoading}
                    className="w-full mt-2 px-2 py-1 rounded text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Answer
                  </button>
                )}

                {/* Answer Input */}
                {answeringQuestionId === question._id && canAnswer && (
                  <div className="mt-2 space-y-2 bg-gray-900 rounded p-2">
                    <textarea
                      value={answerInputValue}
                      onChange={(e) => setAnswerInputValue(e.target.value)}
                      placeholder="Type your answer..."
                      maxLength={MAX_ANSWER_LENGTH}
                      className="w-full px-2 py-2 rounded bg-gray-800 text-gray-100 text-xs placeholder-gray-500 border border-gray-700 focus:border-blue-500 focus:outline-none resize-none"
                      rows={2}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-400">
                        {answerInputValue.length}/{MAX_ANSWER_LENGTH}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setAnsweringQuestionId(null);
                            setAnswerInputValue('');
                          }}
                          disabled={isSubmitting}
                          className="px-2 py-1 rounded text-xs font-medium bg-gray-700 hover:bg-gray-600 text-gray-100 transition-all disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleAnswerSubmit(question._id)}
                          disabled={isSubmitting}
                          className="px-2 py-1 rounded text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50"
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={questionsEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleAskQuestion} className="border-t border-gray-700 p-3 bg-gray-800 space-y-2">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask a question..."
          maxLength={MAX_QUESTION_LENGTH}
          disabled={isSubmitting || isLoading}
          className="w-full px-3 py-2 rounded bg-gray-900 text-gray-100 text-sm placeholder-gray-500 border border-gray-700 focus:border-blue-500 focus:outline-none resize-none disabled:opacity-50"
          rows={2}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-gray-400">
            {inputValue.length}/{MAX_QUESTION_LENGTH}
          </span>
          <button
            type="submit"
            disabled={isSubmitting || isLoading || !inputValue.trim()}
            className="px-4 py-2 rounded text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Asking...' : 'Ask'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QAPanel;

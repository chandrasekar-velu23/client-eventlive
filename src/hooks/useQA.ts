import { useState, useCallback, useEffect } from 'react';
import { Socket } from 'socket.io-client';

export interface Question {
  _id: string;
  askedBy: string;
  askedByName: string;
  content: string;
  isAnswered: boolean;
  answeredBy?: string;
  answer?: string;
  upvotes: string[];
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
}

// Socket event data interfaces
interface NewQuestionData {
  _id: string;
  userId: string;
  askedByName: string;
  content: string;
  timestamp: string;
}

interface QuestionAnsweredData {
  questionId: string;
  answer: string;
  answeredBy: string;
}

interface QuestionUpvotedData {
  questionId: string;
  upvotes: string[];
}

interface QuestionDeletedData {
  questionId: string;
}

interface UseQAReturn {
  questions: Question[];
  loading: boolean;
  error: string | null;
  askQuestion: (content: string) => Promise<void>;
  answerQuestion: (questionId: string, answer: string) => Promise<void>;
  upvoteQuestion: (questionId: string) => Promise<void>;
  deleteQuestion: (questionId: string) => Promise<void>;
}

/**
 * Hook for Q&A management in a session
 * Handles question submission, answering, and voting
 */
export const useQA = (
  sessionId: string | null,
  socket: Socket | null,
  userId?: string
): UseQAReturn => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real-time Q&A events
  useEffect(() => {
    if (!socket) return;

    socket.on('new-question', (data: NewQuestionData) => {
      setQuestions((prev) => [
        {
          _id: data._id,
          askedBy: data.userId,
          askedByName: data.askedByName,
          content: data.content,
          isAnswered: false,
          upvotes: [],
          priority: 'low',
          timestamp: new Date(data.timestamp),
        },
        ...prev,
      ]);
    });

    socket.on('question-answered', (data: QuestionAnsweredData) => {
      setQuestions((prev) =>
        prev.map((q) =>
          q._id === data.questionId
            ? {
                ...q,
                isAnswered: true,
                answer: data.answer,
                answeredBy: data.answeredBy,
              }
            : q
        )
      );
    });

    socket.on('question-upvoted', (data: QuestionUpvotedData) => {
      setQuestions((prev) =>
        prev.map((q) =>
          q._id === data.questionId
            ? {
                ...q,
                upvotes: data.upvotes,
              }
            : q
        )
      );
    });

    socket.on('question-deleted', (data: QuestionDeletedData) => {
      setQuestions((prev) => prev.filter((q) => q._id !== data.questionId));
    });

    return () => {
      socket.off('new-question');
      socket.off('question-answered');
      socket.off('question-upvoted');
      socket.off('question-deleted');
    };
  }, [socket]);

  // Ask a question
  const askQuestion = useCallback(
    async (content: string) => {
      if (!socket || !sessionId) {
        setError('Not connected to session');
        return;
      }

      try {
        setError(null);

        socket.emit('ask-question', { sessionId, content });

        // Wait for confirmation
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Question timeout')), 5000);

          socket.once('question-asked', () => {
            clearTimeout(timeout);
            resolve(null);
          });
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to ask question';
        setError(message);
        throw err;
      }
    },
    [socket, sessionId]
  );

  // Answer a question (speaker/organizer only)
  const answerQuestion = useCallback(
    async (questionId: string, answer: string) => {
      if (!socket || !sessionId) {
        setError('Not connected to session');
        return;
      }

      try {
        setError(null);

        socket.emit('answer-question', { sessionId, questionId, answer });

        // Wait for confirmation
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Answer timeout')), 5000);

          socket.once('answer-submitted', () => {
            clearTimeout(timeout);
            resolve(null);
          });
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to answer question';
        setError(message);
        throw err;
      }
    },
    [socket, sessionId]
  );

  // Upvote a question
  const upvoteQuestion = useCallback(
    async (questionId: string) => {
      if (!socket || !sessionId || !userId) {
        setError('Not connected to session');
        return;
      }

      try {
        setError(null);

        socket.emit('upvote-question', { sessionId, questionId, userId });

        // Wait for confirmation
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Upvote timeout')), 5000);

          socket.once('question-upvoted', () => {
            clearTimeout(timeout);
            resolve(null);
          });
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to upvote question';
        setError(message);
        throw err;
      }
    },
    [socket, sessionId, userId]
  );

  // Delete question
  const deleteQuestion = useCallback(
    async (questionId: string) => {
      if (!socket || !sessionId) {
        setError('Not connected to session');
        return;
      }

      try {
        setError(null);

        socket.emit('delete-question', { sessionId, questionId });

        // Wait for confirmation
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Delete timeout')), 5000);

          socket.once('question-deleted', () => {
            clearTimeout(timeout);
            resolve(null);
          });
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete question';
        setError(message);
        throw err;
      }
    },
    [socket, sessionId]
  );

  return {
    questions,
    loading,
    error,
    askQuestion,
    answerQuestion,
    upvoteQuestion,
    deleteQuestion,
  };
};

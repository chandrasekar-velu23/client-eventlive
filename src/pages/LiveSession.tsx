import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useWebRTC } from '../hooks/useWebRTC';
import { VideoGrid } from '../components/live/VideoGrid';
import { SessionSidebar } from '../components/live/SessionSidebar';
import { useRealtimeChat } from '../hooks/useRealtimeChat';
import { usePolls } from '../hooks/usePolls';
import { useQA } from '../hooks/useQA';
import { useRecording } from '../hooks/useRecording';
import { useFileTransfer } from '../hooks/useFileTransfer';
import { joinEventSession, submitSessionFeedback, enrollEvent } from '../services/api';
import { toast } from 'sonner';

// UI Components
import Button from '../components/ui/Button';
import Textarea from '../components/ui/Textarea';
import { CountdownTimer } from '../components/live/CountdownTimer';

import {
  VideoCameraIcon,
  MicrophoneIcon,
  VideoCameraSlashIcon,
  PhoneXMarkIcon,
  ChatBubbleLeftRightIcon,
  UsersIcon,
  ChartBarIcon,
  StarIcon as StarIconOutline,
  CheckCircleIcon,
  LockClosedIcon,
  ArrowLeftIcon,
  ComputerDesktopIcon,
  StopIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

export default function LiveSession() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [event, setEvent] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inLobby, setInLobby] = useState(true);
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Feedback State
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [requestTranscript, setRequestTranscript] = useState(false);
  const [requestRecording, setRequestRecording] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Media State
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [activeSidebar, setActiveSidebar] = useState<'chat' | 'participants' | 'polls' | 'qa' | 'none'>('none');

  // WebRTC
  const {
    localStream,
    remoteStreams,
    startLocalStream,
    toggleAudio,
    toggleVideo,
    shareScreen,
    stopScreenShare,
    isScreenSharing,
    socket
  } = useWebRTC({
    sessionId: session?._id,
    isHost: event?.organizerId === user?.id,
    enabled: !inLobby && !isSessionEnded && !!session && !!user
  });

  // Chat Hook
  const { messages, sendMessage } = useRealtimeChat(session?._id, socket);

  // Polls Hook
  const { polls, activePoll, createPoll, votePoll } = usePolls(socket, session?._id);

  // Q&A Hook
  const { questions, askQuestion, upvoteQuestion, answerQuestion } = useQA(session?._id, socket, user?.id);

  // Recording Hook
  const { isRecording, startRecording, stopRecording } = useRecording();

  // File Transfer Hook
  const { sendFile, handleDataMessage } = useFileTransfer((data) => {
    if (socket && session?._id) {
      socket.emit('file-transfer', { sessionId: session._id, transferData: data });
    }
  });

  // Listen for file transfers
  useEffect(() => {
    if (!socket) return;

    const onFileTransfer = (data: { transferData: any, fromUserId: string }) => {
      handleDataMessage(data.transferData, data.fromUserId);
    };

    socket.on('file-transfer', onFileTransfer);

    return () => {
      socket.off('file-transfer', onFileTransfer);
    };
  }, [socket, handleDataMessage]);

  // Fetch Event & Session details
  useEffect(() => {
    if (!code) return;

    const loadSession = async () => {
      try {
        const { event: eventData, session: sessionData } = await joinEventSession(code);

        // Time Validation
        const now = new Date();
        const endTime = new Date(eventData.endTime);

        if (now > endTime) {
          setIsSessionEnded(true);
        }

        setEvent(eventData);
        setSession(sessionData);
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Failed to load session");
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [code, navigate]);

  // Initial stream for lobby (Only if authenticated)
  useEffect(() => {
    if (inLobby && user) {
      startLocalStream(videoEnabled, audioEnabled);
    }
  }, [inLobby, user, startLocalStream]);

  // Update stream when toggles change
  useEffect(() => {
    toggleAudio(audioEnabled);
  }, [audioEnabled, toggleAudio]);

  useEffect(() => {
    toggleVideo(videoEnabled);
  }, [videoEnabled, toggleVideo]);

  const handleJoin = async () => {
    if (!user) {
      navigate(`/login?returnUrl=/join/${code}`);
      return;
    }

    if (!event) return;

    const now = new Date();
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);
    const isHost = event.organizerId === user.id;

    // Strict Time Validation
    const isValidEnd = endTime instanceof Date && !isNaN(endTime.getTime());
    const isValidStart = startTime instanceof Date && !isNaN(startTime.getTime());

    if (isValidEnd && now > endTime) {
      toast.error("This event has already ended.");
      setIsSessionEnded(true);
      return;
    }

    if (!isHost && isValidStart && now < startTime) {
      const timeDiff = startTime.getTime() - now.getTime();
      const minutes = Math.ceil(timeDiff / (1000 * 60));
      toast.error(`Event hasn't started yet. Starts in ${minutes} minutes.`);
      return;
    }

    // Check enrollment
    const isEnrolled = event.attendees?.includes(user.id);

    if (!isHost && !isEnrolled) {
      setIsEnrolling(true);
      try {
        await enrollEvent(event._id || event.id);
        toast.success("Registration confirmed! Joining session...");
        // Optimistically update attendees
        setEvent((prev: any) => ({
          ...prev,
          attendees: [...(prev.attendees || []), user.id]
        }));
        setInLobby(false);
      } catch (err) {
        console.error(err);
        toast.error("Failed to register for this event. Please try again.");
      } finally {
        setIsEnrolling(false);
      }
    } else {
      setInLobby(false);
      toast.success("Joined session");
    }
  };

  const handleLeave = () => {
    if (confirm("Are you sure you want to leave the session?")) {
      // Cleanup local stream
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      setIsSessionEnded(true);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!event?._id) return;
    setSubmittingFeedback(true);
    try {
      await submitSessionFeedback(event._id, feedback, rating, { transcript: requestTranscript, recording: requestRecording });
      toast.success("Feedback submitted! Thank you.");
      // Small delay to show success
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit feedback");
      setSubmittingFeedback(false);
    }
  };

  // Convert remoteStreams dict to array for VideoGrid
  const remoteStreamArray = Object.entries(remoteStreams).map(([userId, stream]) => ({
    userId,
    stream
  }));

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-900">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold animate-pulse text-brand-600">Connecting to session...</p>
      </div>
    </div>
  );

  // ------------------------------------------------------------------
  // VIEW: POST-SESSION FEEDBACK
  // ------------------------------------------------------------------
  if (isSessionEnded) {
    return (
      <div className={`flex h-screen w-full items-center justify-center p-6 font-sans transition-colors duration-300 bg-bg-secondary text-text-primary`}>
        <div className="w-full max-w-lg rounded-3xl p-8 shadow-2xl bg-bg-primary border border-gray-200 relative overflow-hidden">
          {/* Decorative gradients */}
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center mb-8 relative z-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full mb-6 bg-green-500/10 ring-1 ring-green-500/30">
              <CheckCircleIcon className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold font-display mb-2 text-text-primary">Session Ended</h2>
            <p className="text-text-secondary">Thank you for attending <strong>{event?.title}</strong>.</p>
          </div>

          <div className="space-y-8 relative z-10">
            {/* Rating */}
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">How was the experience?</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`transition-all duration-200 hover:scale-110 p-1 ${rating >= star ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-gray-300'}`}
                  >
                    {rating >= star ? <StarIconSolid className="h-10 w-10" /> : <StarIconOutline className="h-10 w-10" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Requests */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
              <p className="text-sm font-bold text-gray-500">I would like to receive:</p>
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-100 transition-colors group">
                <input
                  type="checkbox"
                  checked={requestTranscript}
                  onChange={e => setRequestTranscript(e.target.checked)}
                  className="rounded border-gray-300 bg-white text-brand-500 focus:ring-brand-500 transition-all"
                />
                <span className="font-medium text-gray-700 group-hover:text-gray-900 transition-colors">Session Transcript</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-white/5 transition-colors group">
                <input
                  type="checkbox"
                  checked={requestRecording}
                  onChange={e => setRequestRecording(e.target.checked)}
                  className="rounded border-gray-300 bg-white text-brand-500 focus:ring-brand-500 transition-all"
                />
                <span className="font-medium text-text-primary group-hover:text-text-primary transition-colors">Recorded Video</span>
              </label>
            </div>

            {/* Feedback */}
            <div>
              <Textarea
                label="Additional Comments"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your thoughts with the organizer..."
                className="bg-gray-50 border-gray-200 focus:bg-bg-primary text-text-primary min-h-[100px]"
              />
            </div>

            <div className="flex gap-4 pt-2">
              <Button
                variant="secondary"
                onClick={() => navigate('/dashboard')}
                className="flex-1 bg-transparent border-gray-200 text-text-secondary hover:bg-gray-50 hover:text-text-primary"
              >
                Skip
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmitFeedback}
                disabled={submittingFeedback}
                className="flex-1 shadow-lg shadow-brand-500/20"
              >
                {submittingFeedback ? 'Sending...' : 'Submit Feedback'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // VIEW: LOBBY (Unauthenticated & Authenticated)
  // ------------------------------------------------------------------
  if (inLobby) {
    const start = event?.startTime ? new Date(event.startTime) : null;
    const isLate = start && !isNaN(start.getTime()) ? new Date() > start : false;

    return (
      <div className="flex h-screen w-full flex-col font-sans transition-colors duration-300 bg-bg-secondary text-text-primary">
        <header className="flex h-20 shrink-0 items-center justify-between border-b px-8 border-gray-200 bg-bg-primary/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img src="/EventLive.png" alt="EventLive" className="h-12 w-auto shrink-0" />
              {/* Removed text if logo is full brand logic, or keep it? User said "EventLive.svg" is logo. */}
              {/* If using full logo (EventLive.svg), we might not need text "EventLive". */}
              {/* Previous code had iconEventLive.svg + Text. */}
              {/* I'll switch to full logo `EventLive.svg` and maybe hide text or keep it? */}
              {/* Replaced iconEventLive with EventLive.svg as requested "whereever i user the logo". */}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold leading-tight text-gray-900">{user.name}</p>
                </div>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-9 w-9 rounded-full object-cover ring-2 ring-brand-500/20" />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-brand-600 flex items-center justify-center font-bold text-white shadow-inner text-sm">
                    {user.name?.charAt(0) || "U"}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={() => navigate(`/login?returnUrl=/join/${code}`)} className="text-xs h-9 px-4">Log in</Button>
              </div>
            )}
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center p-6 lg:p-12 overflow-y-auto">
          <div className={`flex w-full max-w-6xl gap-8 lg:gap-16 flex-col-reverse lg:flex-row items-center`}>

            {/* Left/Bottom: Info & Controls */}
            <div className="flex-1 w-full space-y-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-block rounded-full bg-brand-500/10 px-3 py-1 text-xs font-bold text-brand-500 uppercase tracking-wider ring-1 ring-brand-500/20">
                    {event?.category || "Live Event"}
                  </span>
                  {isLate && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-500 uppercase tracking-wider ring-1 ring-red-500/20 animate-pulse">
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" /> Live Now
                    </span>
                  )}
                </div>
                <h1 className="text-4xl lg:text-6xl font-black font-display leading-tight mb-6 text-gray-900">
                  {event?.title}
                </h1>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                  {event?.organizerLogo ? (
                    <img src={event.organizerLogo} className="h-14 w-14 rounded-full object-cover ring-2 ring-brand-500/20" alt="Organizer" />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-brand-100 flex items-center justify-center ring-2 ring-brand-500/20">
                      <span className="text-xl font-bold text-brand-600">{event?.organizerDisplayName?.charAt(0) || "O"}</span>
                    </div>
                  )}
                  <div>
                    <p className={`text-sm font-bold uppercase tracking-wider text-gray-500`}>Hosted by</p>
                    <p className="text-lg font-bold text-gray-900">{event?.organizerDisplayName || "Event Organizer"}</p>
                  </div>
                </div>

                {/* Countdown for Logged In Users */}
                {user && event?.startTime && !isLate && (
                  <div className="mt-8 p-6 bg-brand-50 rounded-2xl border border-brand-100">
                    <p className="text-center font-bold text-brand-900 mb-4 uppercase tracking-widest text-sm">Event Starts In</p>
                    <div className="flex justify-center">
                      <CountdownTimer targetDate={new Date(event.startTime)} />
                    </div>
                  </div>
                )}
              </div>

              {user ? (
                <div className="space-y-4">
                  <Button
                    variant="primary"
                    onClick={handleJoin}
                    disabled={isEnrolling}
                    className="w-full h-14 text-lg shadow-xl shadow-brand-500/30"
                  >
                    {isEnrolling ? "Booking your spot..." : "Join Event Now"}
                  </Button>
                  <p className="text-center text-sm opacity-60 flex items-center justify-center gap-2">
                    <UsersIcon className="h-4 w-4" />
                    {session?.participants?.length > 0 ? (
                      <span><strong>{session.participants.length}</strong> people waiting</span>
                    ) : (
                      <span>Be the first to join</span>
                    )}
                  </p>
                </div>
              ) : (
                <div className="space-y-6 p-6 rounded-2xl bg-brand-50 border border-brand-100">
                  <div className="space-y-2">
                    <p className="font-bold text-lg text-gray-900">
                      {isLate ? "Session in Progress" : "Starting Soon"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {isLate ? "The event has not started yet or you are early." : "The event will begin shortly."}
                    </p>
                  </div>

                  {event?.startTime && !isLate && (
                    <div className="py-4 flex justify-center">
                      <CountdownTimer targetDate={new Date(event.startTime)} />
                    </div>
                  )}

                  <p className="text-sm text-gray-600 border-t border-brand-200 pt-4">
                    You need to be logged in to access this private session.
                  </p>
                  <div className="flex gap-3">
                    <Button variant="primary" onClick={() => navigate(`/login?returnUrl=/join/${code}`)} className="flex-1">Log in</Button>
                    <Button variant="secondary" onClick={() => navigate(`/signup?returnUrl=/join/${code}`)} className="flex-1">Create Account</Button>
                  </div>
                </div>
              )}
            </div>

            {/* Right/Top: Video Preview */}
            <div className="flex-1 w-full max-w-xl">
              <div className="aspect-[4/3] w-full rounded-3xl overflow-hidden bg-gray-900 relative shadow-2xl ring-1 ring-black/5 group">
                {user ? (
                  <>
                    {localStream && (
                      <video
                        ref={el => { if (el) el.srcObject = localStream }}
                        autoPlay
                        muted
                        playsInline
                        className="h-full w-full object-cover transform scale-x-[-1]"
                      />
                    )}
                    {!videoEnabled && (
                      <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                        <div className="text-center">
                          <div className="h-24 w-24 mx-auto rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center border-4 border-zinc-800 shadow-xl mb-4">
                            <span className="text-4xl font-bold text-white">{user?.name?.charAt(0) || "U"}</span>
                          </div>
                          <p className="text-white font-bold opacity-50">Camera Off</p>
                        </div>
                      </div>
                    )}

                    {/* Controls */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                      <button
                        onClick={() => setAudioEnabled(!audioEnabled)}
                        className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${audioEnabled ? 'bg-white text-black hover:bg-white/90' : 'bg-red-500 text-white hover:bg-red-600'}`}
                      >
                        {audioEnabled ? <MicrophoneIcon className="h-6 w-6" /> : <MicrophoneIcon className="h-6 w-6 opacity-80" />}
                      </button>
                      <button
                        onClick={() => setVideoEnabled(!videoEnabled)}
                        className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${videoEnabled ? 'bg-white text-black hover:bg-white/90' : 'bg-red-500 text-white hover:bg-red-600'}`}
                      >
                        {videoEnabled ? <VideoCameraIcon className="h-6 w-6" /> : <VideoCameraSlashIcon className="h-6 w-6 opacity-80" />}
                      </button>
                    </div>

                    <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/40 backdrop-blur text-xs font-bold text-white border border-white/10">
                      Preview
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="text-center p-8">
                      <LockClosedIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Authenticated Access</h3>
                      <p className="text-gray-500 max-w-xs mx-auto">Please sign in to verify your identity and access the camera preview.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    );
  }


  return (
    <div className={`flex h-screen w-full flex-col font-sans transition-colors duration-300 bg-bg-secondary text-text-primary overflow-hidden relative`}>
      {/* Immersive Header - Sticky on Mobile, Absolute on Desktop if needed, but sticky is safer for layout */}
      <header className={`flex h-16 shrink-0 items-center justify-between px-4 md:px-6 bg-bg-primary/95 backdrop-blur-sm border-b border-gray-200 z-40 absolute top-0 left-0 right-0`}>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="text-text-secondary hover:bg-bg-secondary p-2 -ml-2" onClick={() => navigate('/dashboard')}>
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold font-display tracking-tight text-text-primary max-w-[150px] md:max-w-md truncate">{event?.title}</h1>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">Live</span>
              <span className="text-[10px] text-gray-400 hidden sm:inline">•</span>
              <span className="text-[10px] text-gray-500 hidden sm:inline">{session?.participants?.length || 1} watching</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Participant Count for space saving */}
          <div className="md:hidden flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1">
            <UsersIcon className="h-3 w-3 text-gray-500" />
            <span className="text-xs font-bold text-gray-700">{session?.participants?.length || 1}</span>
          </div>

          <div className="hidden md:flex -space-x-2">
            {[...Array(Math.min(3, session?.participants?.length || 0))].map((_, i) => (
              <div key={i} className="h-8 w-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-700">
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main Stage - Sidebar Awareness moved to parent flex container */}
      <div className="flex flex-1 pt-16 h-full relative overflow-hidden">

        {/* Content Area (Video Grid) */}
        <div className={`flex-1 flex flex-col items-center justify-center relative bg-bg-secondary transition-all duration-300 ${activeSidebar !== 'none' ? 'hidden md:flex md:w-[calc(100%-20rem)]' : 'w-full'}`}>
          {/* Video Grid takes available space - accounting for bottom bar on mobile */}
          <div className="w-full h-full pb-20 md:pb-0 px-2 md:px-4 py-2 flex items-center justify-center">
            <div className="w-full h-full max-w-[1600px] flex items-center justify-center">
              <VideoGrid
                localStream={localStream}
                remoteStreams={remoteStreamArray}
                isSelf={true}
              />
            </div>
          </div>
        </div>

        {/* Floating Controls Bar - Bottom Sheet on Mobile / Floating Pill on Desktop */}
        <div className={`
            fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 backdrop-blur-md border-t border-gray-200 
            md:absolute md:bottom-8 md:left-1/2 md:-translate-x-1/2 md:w-auto md:bg-white/90 md:rounded-2xl md:border md:shadow-2xl md:p-2
            flex justify-between md:justify-center items-center gap-2 md:gap-4 transition-all duration-300
            ${activeSidebar !== 'none' ? 'md:left-[calc(50%-10rem)]' : ''} /* Adjust center when sidebar open on desktop */
        `}>

          {/* Main Actions Group */}
          <div className="flex items-center gap-2 md:gap-4 flex-1 justify-center md:flex-none">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`h-10 w-10 md:h-12 md:w-12 rounded-full md:rounded-xl flex items-center justify-center transition-all ${audioEnabled ? 'bg-gray-100 text-text-primary hover:bg-gray-200' : 'bg-red-500 text-white hover:bg-red-600'}`}
              title="Toggle Mic"
            >
              {audioEnabled ? <MicrophoneIcon className="h-5 w-5" /> : <MicrophoneIcon className="h-5 w-5 opacity-70" />}
            </button>
            <button
              onClick={() => setVideoEnabled(!videoEnabled)}
              className={`h-10 w-10 md:h-12 md:w-12 rounded-full md:rounded-xl flex items-center justify-center transition-all ${videoEnabled ? 'bg-gray-100 text-text-primary hover:bg-gray-200' : 'bg-red-500 text-white hover:bg-red-600'}`}
              title="Toggle Camera"
            >
              {videoEnabled ? <VideoCameraIcon className="h-5 w-5" /> : <VideoCameraSlashIcon className="h-5 w-5 opacity-70" />}
            </button>

            <div className="w-px h-6 md:h-8 bg-gray-200 mx-1 md:mx-2" />

            {/* Feature Toggles - Hidden on very small screens if needed, or scrollable */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSidebar(prev => prev === 'chat' ? 'none' : 'chat')}
                className={`h-10 w-10 md:h-12 md:w-12 rounded-full md:rounded-xl flex items-center justify-center relative transition-all ${activeSidebar === 'chat' ? 'bg-brand-600 text-white' : 'bg-gray-50 text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                title="Chat"
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5" />
                {/* Unread dot could go here */}
              </button>
              <button
                onClick={() => setActiveSidebar(prev => prev === 'participants' ? 'none' : 'participants')}
                className={`h-10 w-10 md:h-12 md:w-12 rounded-full md:rounded-xl flex items-center justify-center transition-all ${activeSidebar === 'participants' ? 'bg-brand-600 text-white' : 'bg-gray-50 text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                title="Participants"
              >
                <UsersIcon className="h-5 w-5" />
              </button>
              {/* Hidden on small mobile to save space, maybe put in a 'More' menu later? Keeping for now. */}
              <button
                onClick={() => setActiveSidebar(prev => prev === 'polls' ? 'none' : 'polls')}
                className={`hidden xs:flex h-10 w-10 md:h-12 md:w-12 rounded-full md:rounded-xl items-center justify-center transition-all ${activeSidebar === 'polls' ? 'bg-brand-600 text-white' : 'bg-gray-50 text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                title="Polls"
              >
                <ChartBarIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setActiveSidebar(prev => prev === 'qa' ? 'none' : 'qa')}
                className={`hidden xs:flex h-10 w-10 md:h-12 md:w-12 rounded-full md:rounded-xl items-center justify-center transition-all ${activeSidebar === 'qa' ? 'bg-brand-600 text-white' : 'bg-gray-50 text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                title="Q&A"
              >
                <QuestionMarkCircleIcon className="h-5 w-5" />
              </button>
            </div>


            <div className="hidden md:block w-px h-8 bg-gray-200 mx-2" />

            {/* Desktop Only Sharing */}
            <button
              onClick={isScreenSharing ? stopScreenShare : shareScreen}
              className={`hidden md:flex h-12 w-12 rounded-xl items-center justify-center transition-all ${isScreenSharing ? 'bg-brand-600 text-white' : 'bg-gray-50 text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
              title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
            >
              {isScreenSharing ? <StopIcon className="h-5 w-5" /> : <ComputerDesktopIcon className="h-5 w-5" />}
            </button>

            {/* Host Only Recording */}
            {event?.organizerId === user?.id && (
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`hidden md:flex h-12 w-12 rounded-xl items-center justify-center transition-all ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-50 text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                title={isRecording ? "Stop Recording" : "Start Recording"}
              >
                <span className={`h-4 w-4 rounded-full ${isRecording ? 'bg-white' : 'bg-red-500 border-2 border-zinc-400'}`} />
              </button>
            )}

            {/* End Button */}
            <button
              onClick={handleLeave}
              className="h-10 px-4 md:h-12 md:px-6 rounded-full md:rounded-xl bg-red-600 text-white font-bold text-xs md:text-sm tracking-wide hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20 whitespace-nowrap"
            >
              End
            </button>
          </div>
        </div>

        {/* Responsive Sidebar - Fullscreen on Mobile, Side Panel on Desktop */}
        <div className={`
            fixed inset-0 z-[60] bg-white transition-transform duration-300 ease-in-out
            md:relative md:z-20 md:w-80 md:border-l md:border-gray-200 md:translate-x-0
            ${activeSidebar !== 'none' ? 'translate-x-0' : 'translate-x-full md:w-0 md:border-none'}
        `}>
          <div className="h-full flex flex-col w-full md:w-80 bg-white">
            <div className="h-16 md:h-14 flex items-center justify-between px-4 border-b border-gray-100 shrink-0">
              <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500">
                {activeSidebar === 'chat' && 'Live Chat'}
                {activeSidebar === 'participants' && 'Attendees'}
                {activeSidebar === 'polls' && 'Polls'}
                {activeSidebar === 'qa' && 'Q&A'}
              </h3>
              <button onClick={() => setActiveSidebar('none')} className="p-2 text-gray-400 hover:text-gray-900 bg-gray-50 rounded-full md:bg-transparent">
                <PhoneXMarkIcon className="h-5 w-5 md:h-4 md:w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden relative">
              <SessionSidebar
                open={true}
                activeView={activeSidebar === 'none' ? null : activeSidebar as any}
                messages={messages}
                onSendMessage={sendMessage}
                onSendFile={sendFile}
                polls={polls}
                activePoll={activePoll}
                createPoll={createPoll}
                votePoll={votePoll}
                isHost={event?.organizerId === user?.id}
                questions={questions}
                onAskQuestion={askQuestion}
                onUpvoteQuestion={upvoteQuestion}
                onAnswerQuestion={answerQuestion}
                currentUserId={user?.id || ''}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

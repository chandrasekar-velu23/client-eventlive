import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useWebRTC } from '../hooks/useWebRTC';
import { VideoGrid } from '../components/live/VideoGrid';
import { LiveChat } from '../components/live/LiveChat';
import { PollsWidget } from '../components/live/PollsWidget';
import { useRealtimeChat } from '../hooks/useRealtimeChat';
import { usePolls } from '../hooks/usePolls';
import { joinEventSession, submitSessionFeedback, enrollEvent } from '../services/api';
import { toast } from 'sonner';
import { useTheme } from '../context/ThemeContext';

// UI Components
import Button from '../components/ui/Button';
import Textarea from '../components/ui/Textarea';

import {
  VideoCameraIcon,
  MicrophoneIcon,
  VideoCameraSlashIcon,
  PhoneXMarkIcon,
  ChatBubbleLeftRightIcon,
  UsersIcon,
  ChartBarIcon,
  SunIcon,
  MoonIcon,
  UserCircleIcon,
  StarIcon as StarIconOutline,
  CheckCircleIcon,
  LockClosedIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

export default function LiveSession() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

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
  const [activeSidebar, setActiveSidebar] = useState<'chat' | 'participants' | 'polls' | 'none'>('none');

  // WebRTC
  const {
    localStream,
    remoteStreams,
    startLocalStream,
    toggleAudio,
    toggleVideo,
    socket
  } = useWebRTC({
    sessionId: session?._id,
    isHost: event?.organizerId === user?.id,
    enabled: !inLobby && !isSessionEnded && !!session && !!user
  });

  // Chat Hook
  const { messages, sendMessage, loading: chatLoading } = useRealtimeChat(session?._id, socket);

  // Polls Hook
  const { polls, activePoll, createPoll, votePoll } = usePolls(socket, session?._id);

  // Fetch Event & Session details
  useEffect(() => {
    if (!code) return;

    const loadSession = async () => {
      try {
        const { event: eventData, session: sessionData } = await joinEventSession(code);
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

    // Check enrollment
    const isHost = event.organizerId === user.id;
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
    <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold animate-pulse">Connecting to session...</p>
      </div>
    </div>
  );

  // ------------------------------------------------------------------
  // VIEW: POST-SESSION FEEDBACK
  // ------------------------------------------------------------------
  if (isSessionEnded) {
    return (
      <div className={`flex h-screen w-full items-center justify-center p-6 font-sans transition-colors duration-300 bg-zinc-950 text-white`}>
        <div className="w-full max-w-lg rounded-3xl p-8 shadow-2xl bg-zinc-900 border border-white/10 relative overflow-hidden">
          {/* Decorative gradients */}
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center mb-8 relative z-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full mb-6 bg-green-500/10 ring-1 ring-green-500/30">
              <CheckCircleIcon className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold font-display mb-2">Session Ended</h2>
            <p className="text-zinc-400">Thank you for attending <strong>{event?.title}</strong>.</p>
          </div>

          <div className="space-y-8 relative z-10">
            {/* Rating */}
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm font-bold text-zinc-400 uppercase tracking-wide">How was the experience?</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`transition-all duration-200 hover:scale-110 p-1 ${rating >= star ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-zinc-700'}`}
                  >
                    {rating >= star ? <StarIconSolid className="h-10 w-10" /> : <StarIconOutline className="h-10 w-10" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Requests */}
            <div className="bg-zinc-950/50 p-6 rounded-2xl border border-white/5 space-y-4">
              <p className="text-sm font-bold text-zinc-300">I would like to receive:</p>
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-white/5 transition-colors group">
                <input
                  type="checkbox"
                  checked={requestTranscript}
                  onChange={e => setRequestTranscript(e.target.checked)}
                  className="rounded border-zinc-600 bg-zinc-800 text-brand-500 focus:ring-brand-500 transition-all"
                />
                <span className="font-medium group-hover:text-white transition-colors">Session Transcript</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-white/5 transition-colors group">
                <input
                  type="checkbox"
                  checked={requestRecording}
                  onChange={e => setRequestRecording(e.target.checked)}
                  className="rounded border-zinc-600 bg-zinc-800 text-brand-500 focus:ring-brand-500 transition-all"
                />
                <span className="font-medium group-hover:text-white transition-colors">Recorded Video</span>
              </label>
            </div>

            {/* Feedback */}
            <div>
              <Textarea
                label="Additional Comments"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your thoughts with the organizer..."
                className="bg-zinc-950/50 border-white/10 focus:bg-zinc-950 text-white min-h-[100px]"
              />
            </div>

            <div className="flex gap-4 pt-2">
              <Button
                variant="secondary"
                onClick={() => navigate('/dashboard')}
                className="flex-1 bg-transparent border-white/10 text-white hover:bg-white/5 hover:border-white/20"
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
    const isLate = event?.startTime ? new Date() > new Date(event.startTime) : false;

    return (
      <div className={`flex h-screen w-full flex-col font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-surface-50 text-brand-950'}`}>
        <header className={`flex h-20 shrink-0 items-center justify-between border-b px-8 ${theme === 'dark' ? 'border-white/10 bg-zinc-900/50 backdrop-blur-md' : 'border-surface-200 bg-white/50 backdrop-blur-md'}`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img src="/icon-EventLive.svg" alt="EventLive" className="h-8 w-8 text-brand-600 shrink-0" />
              <span className={`text-xl font-bold font-display tracking-tight ${theme === 'dark' ? 'text-white' : 'text-brand-950'}`}>EventLive</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-yellow-400' : 'bg-surface-100 hover:bg-surface-200 text-muted'}`}
              title="Toggle Theme"
            >
              {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>

            {user ? (
              <div className={`flex items-center gap-3 pl-6 border-l ${theme === 'dark' ? 'border-white/10' : 'border-surface-200'}`}>
                <div className="text-right hidden sm:block">
                  <p className={`text-sm font-bold leading-tight ${theme === 'dark' ? 'text-white' : 'text-brand-950'}`}>{user.name}</p>
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
                <h1 className={`text-4xl lg:text-6xl font-black font-display leading-tight mb-6 ${theme === 'dark' ? 'text-white' : 'text-brand-950 px-px'}`}>
                  {event?.title}
                </h1>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  {event?.organizerLogo ? (
                    <img src={event.organizerLogo} className="h-14 w-14 rounded-full object-cover ring-2 ring-brand-500/20" alt="Organizer" />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-brand-500/20 flex items-center justify-center ring-2 ring-brand-500/20">
                      <UserCircleIcon className="h-8 w-8 text-brand-500" />
                    </div>
                  )}
                  <div>
                    <p className={`text-sm font-bold uppercase tracking-wider opacity-60`}>Hosted by</p>
                    <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-brand-950'}`}>{event?.organizerDisplayName || "Event Organizer"}</p>
                  </div>
                </div>
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
                <div className="space-y-4 p-6 rounded-2xl bg-brand-500/5 border border-brand-500/10">
                  <p className={`font-bold text-lg mb-2 ${theme === 'dark' ? 'text-white' : 'text-brand-950'}`}>Ready to join?</p>
                  <p className="text-sm opacity-70 mb-4">You need to be logged in to access this private session.</p>
                  <div className="flex gap-3">
                    <Button variant="primary" onClick={() => navigate(`/login?returnUrl=/join/${code}`)} className="flex-1">Log in</Button>
                    <Button variant="secondary" onClick={() => navigate(`/signup?returnUrl=/join/${code}`)} className="flex-1">Create Account</Button>
                  </div>
                </div>
              )}
            </div>

            {/* Right/Top: Video Preview */}
            <div className="flex-1 w-full max-w-xl">
              <div className="aspect-[4/3] w-full rounded-3xl overflow-hidden bg-black relative shadow-2xl ring-1 ring-white/10 group">
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
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                    <div className="text-center p-8">
                      <LockClosedIcon className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">Authenticated Access</h3>
                      <p className="text-zinc-500 max-w-xs mx-auto">Please sign in to verify your identity and access the camera preview.</p>
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

  // ------------------------------------------------------------------
  // VIEW: LIVE ROOM (Immersive)
  // ------------------------------------------------------------------
  return (
    <div className={`flex h-screen w-full flex-col font-sans transition-colors duration-300 bg-zinc-950 text-white overflow-hidden`}>
      {/* Immersive Header */}
      <header className={`flex h-16 shrink-0 items-center justify-between px-6 bg-zinc-950/80 backdrop-blur-sm border-b border-white/5 z-20 absolute top-0 left-0 right-0 hover:opacity-100 transition-opacity`}>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-white hover:bg-white/10 p-2" onClick={() => navigate('/dashboard')}>
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-sm font-bold font-display tracking-tight text-white/90">{event?.title}</h1>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">Live</span>
              <span className="text-[10px] text-zinc-500">•</span>
              <span className="text-[10px] text-zinc-400">{session?.participants?.length || 1} watching</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme toggle could be here but usually dark for live is standard */}
          <div className="hidden md:flex -space-x-2">
            {[...Array(Math.min(3, session?.participants?.length || 0))].map((_, i) => (
              <div key={i} className="h-8 w-8 rounded-full bg-zinc-800 border-2 border-zinc-950 flex items-center justify-center text-xs font-bold">
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main Stage */}
      <div className="flex flex-1 pt-16 h-full relative">
        <div className="flex-1 p-4 flex items-center justify-center relative bg-zinc-950">
          {/* Video Grid takes full space */}
          <div className="w-full h-full max-w-[1600px] flex items-center justify-center">
            <VideoGrid
              localStream={localStream}
              remoteStreams={remoteStreamArray}
              isSelf={true}
            />
          </div>
        </div>

        {/* Floating Controls Bar */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
          <div className="flex items-center gap-2 p-2 rounded-2xl bg-zinc-900/90 backdrop-blur-md border border-white/10 shadow-2xl">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all ${audioEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white hover:bg-red-600'}`}
              title="Toggle Mic"
            >
              {audioEnabled ? <MicrophoneIcon className="h-5 w-5" /> : <MicrophoneIcon className="h-5 w-5 opacity-70" />}
            </button>
            <button
              onClick={() => setVideoEnabled(!videoEnabled)}
              className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all ${videoEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white hover:bg-red-600'}`}
              title="Toggle Camera"
            >
              {videoEnabled ? <VideoCameraIcon className="h-5 w-5" /> : <VideoCameraSlashIcon className="h-5 w-5 opacity-70" />}
            </button>

            <div className="w-px h-8 bg-white/10 mx-2" />

            <button
              onClick={() => setActiveSidebar(prev => prev === 'chat' ? 'none' : 'chat')}
              className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all ${activeSidebar === 'chat' ? 'bg-brand-600 text-white' : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'}`}
              title="Chat"
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setActiveSidebar(prev => prev === 'participants' ? 'none' : 'participants')}
              className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all ${activeSidebar === 'participants' ? 'bg-brand-600 text-white' : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'}`}
              title="Participants"
            >
              <UsersIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setActiveSidebar(prev => prev === 'polls' ? 'none' : 'polls')}
              className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all ${activeSidebar === 'polls' ? 'bg-brand-600 text-white' : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'}`}
              title="Polls"
            >
              <ChartBarIcon className="h-5 w-5" />
            </button>

            <div className="w-px h-8 bg-white/10 mx-2" />

            <button
              onClick={handleLeave}
              className="h-12 px-6 rounded-xl bg-red-600 text-white font-bold text-sm tracking-wide hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
            >
              End
            </button>
          </div>
        </div>

        {/* Collapsible Sidebar */}
        <div className={`transition-all duration-300 ease-in-out border-l border-white/5 bg-zinc-900 z-20 ${activeSidebar !== 'none' ? 'w-80 translate-x-0' : 'w-0 translate-x-full opacity-0'}`}>
          <div className="h-full flex flex-col w-80">
            <div className="h-14 flex items-center justify-between px-4 border-b border-white/5">
              <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-400">
                {activeSidebar === 'chat' && 'Live Chat'}
                {activeSidebar === 'participants' && 'Attendees'}
                {activeSidebar === 'polls' && 'Polls & Q&A'}
              </h3>
              <button onClick={() => setActiveSidebar('none')} className="p-2 text-zinc-500 hover:text-white">
                <PhoneXMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              {activeSidebar === 'chat' && (
                <LiveChat messages={messages} onSendMessage={sendMessage} isLoading={chatLoading} />
              )}
              {activeSidebar === 'participants' && (
                <div className="p-4 space-y-4 overflow-y-auto h-full custom-scrollbar">
                  {session?.participants?.map((p: any) => (
                    <div key={p.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                      <div className="h-8 w-8 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold shadow-inner">
                        {p.userName?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-200">{p.userName}</p>
                        <p className="text-xs text-zinc-500">{p.userId === user?.id ? '(You)' : 'Attendee'}</p>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-white/5">
                    <p className="text-xs text-center text-zinc-500">Invite others with the event link!</p>
                  </div>
                </div>
              )}
              {activeSidebar === 'polls' && (
                <div className="h-full p-2">
                  <PollsWidget
                    polls={polls}
                    activePoll={activePoll}
                    createPoll={createPoll}
                    votePoll={votePoll}
                    isHost={event?.organizerId === user?.id}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

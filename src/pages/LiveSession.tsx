import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useWebRTC } from '../hooks/useWebRTC';
import { VideoGrid } from '../components/live/VideoGrid';
import { joinEventSession, submitSessionFeedback, enrollEvent } from '../services/api';
import { toast } from 'sonner';
import {
  VideoCameraIcon,
  MicrophoneIcon,
  VideoCameraSlashIcon,
  PhoneXMarkIcon,
  ChatBubbleLeftRightIcon,
  UsersIcon,
  Cog6ToothIcon,
  SunIcon,
  MoonIcon,
  UserCircleIcon,
  StarIcon as StarIconOutline,
  CheckCircleIcon,
  LockClosedIcon,
  CalendarIcon,
  ArrowRightOnRectangleIcon
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
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // WebRTC
  const {
    localStream,
    remoteStreams,
    startLocalStream,
    toggleAudio,
    toggleVideo
  } = useWebRTC({
    sessionId: session?._id,
    isHost: event?.organizerId === user?.id,
    enabled: !inLobby && !isSessionEnded && !!session && !!user
  });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inLobby, user]);

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

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-900 text-white">Loading session...</div>;

  // ------------------------------------------------------------------
  // VIEW: POST-SESSION FEEDBACK
  // ------------------------------------------------------------------
  if (isSessionEnded) {
    return (
      <div className={`flex h-screen w-full items-center justify-center p-6 font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className={`w-full max-w-lg rounded-2xl p-8 shadow-2xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
          <div className="text-center mb-8">
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-4 ${theme === 'dark' ? 'bg-green-500/10' : 'bg-green-100'}`}>
              <CheckCircleIcon className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Session Ended</h2>
            <p className="opacity-70">Thank you for attending <strong>{event?.title}</strong>.</p>
          </div>

          <div className="space-y-6">
            {/* Rating */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm font-medium opacity-80">How would you rate this session?</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`transition-transform hover:scale-110 ${rating >= star ? 'text-yellow-400' : 'text-gray-400 opacity-30'}`}
                  >
                    {rating >= star ? <StarIconSolid className="h-8 w-8" /> : <StarIconOutline className="h-8 w-8" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Requests */}
            <div className={`p-4 rounded-xl space-y-3 ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
              <p className="text-sm font-bold opacity-80 mb-2">I would like to receive:</p>
              <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <input
                  type="checkbox"
                  checked={requestTranscript}
                  onChange={e => setRequestTranscript(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                />
                <span>Session Transcript</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <input
                  type="checkbox"
                  checked={requestRecording}
                  onChange={e => setRequestRecording(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                />
                <span>Recorded Video</span>
              </label>
            </div>

            {/* Feedback */}
            <div>
              <label className="block text-sm font-medium opacity-80 mb-2">Any additional feedback?</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your thoughts with the organizer..."
                className={`w-full rounded-lg h-24 p-3 outline-none ring-1 focus:ring-2 ring-brand-primary/50 ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => navigate('/dashboard')}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
              >
                Skip
              </button>
              <button
                onClick={handleSubmitFeedback}
                disabled={submittingFeedback}
                className="flex-1 py-3 rounded-lg font-bold text-white bg-brand-primary hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingFeedback ? 'Sending...' : 'Submit Feedback'}
              </button>
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
      <div className={`flex h-screen w-full flex-col font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <header className={`flex h-20 shrink-0 items-center justify-between border-b px-8 ${theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white shadow-sm'}`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-primary to-purple-600 text-white shadow-lg shadow-brand-primary/20">
              <VideoCameraIcon className="h-6 w-6" />
            </div>
            <span className={`text-2xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>EventLive</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
              title="Toggle Theme"
            >
              {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>

            {user ? (
              <div className={`flex items-center gap-3 pl-6 border-l ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
                <div className="text-right hidden sm:block">
                  <p className={`text-sm font-bold leading-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user.name}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
                </div>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-10 w-10 rounded-full object-cover ring-2 ring-brand-primary/20" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white shadow-inner text-lg">
                    {user.name?.charAt(0) || "U"}
                  </div>
                )}
              </div>
            ) : (
              <div className={`flex items-center gap-3 pl-6 border-l ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
                <button
                  onClick={() => navigate(`/login?returnUrl=/join/${code}`)}
                  className={`hidden sm:block px-4 py-2 text-sm font-semibold transition-colors rounded-lg ${theme === 'dark' ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                >
                  Log in
                </button>
                <button
                  onClick={() => navigate(`/signup?returnUrl=/join/${code}`)}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-brand-primary rounded-lg shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/90 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center p-6 overflow-y-auto">
          <div className={`flex w-full max-w-5xl flex-col gap-8 rounded-2xl p-8 shadow-2xl md:flex-row ${theme === 'dark' ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>

            {/* Logic split: Authenticated vs Guest */}
            {user ? (
              /* AUTHENTICATED LOBBY VIEW */
              <>
                <div className="flex-1 space-y-4">
                  <h2 className="text-xl font-bold">Check your hair</h2>
                  <div className="aspect-video w-full overflow-hidden rounded-xl bg-black relative shadow-lg ring-1 ring-white/10">
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
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                        {user?.avatar ? (
                          <img src={user.avatar} alt={user.name} className="h-24 w-24 rounded-full object-cover border-4 border-gray-800" />
                        ) : (
                          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-4 border-gray-800">
                            <span className="text-3xl font-bold text-white">{user?.name?.charAt(0) || "G"}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Media Controls Overlay */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                      <button
                        onClick={() => setAudioEnabled(!audioEnabled)}
                        className={`p-4 rounded-full shadow-lg transition-all transform hover:scale-105 ${audioEnabled ? 'bg-gray-700/90 hover:bg-gray-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'} backdrop-blur-sm ring-1 ring-white/10`}
                        title={audioEnabled ? "Mute Microphone" : "Unmute Microphone"}
                      >
                        {audioEnabled ? <MicrophoneIcon className="h-6 w-6" /> : <MicrophoneIcon className="h-6 w-6 opacity-50" />}
                      </button>
                      <button
                        onClick={() => setVideoEnabled(!videoEnabled)}
                        className={`p-4 rounded-full shadow-lg transition-all transform hover:scale-105 ${videoEnabled ? 'bg-gray-700/90 hover:bg-gray-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'} backdrop-blur-sm ring-1 ring-white/10`}
                        title={videoEnabled ? "Stop Camera" : "Start Camera"}
                      >
                        {videoEnabled ? <VideoCameraIcon className="h-6 w-6" /> : <VideoCameraSlashIcon className="h-6 w-6" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-center space-y-6">
                  {/* Event & Host Info */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-block rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-bold text-brand-primary uppercase tracking-wider ring-1 ring-brand-primary/20">
                        {event?.category || "Live Event"}
                      </span>
                      {isLate && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-500 uppercase tracking-wider ring-1 ring-red-500/20 animate-pulse">
                          <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" /> Live Now
                        </span>
                      )}
                    </div>
                    <h1 className={`text-3xl lg:text-4xl font-extrabold leading-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {event?.title}
                    </h1>

                    <div className="mt-6 flex items-center gap-4 bg-gray-500/5 p-4 rounded-xl border border-gray-500/10">
                      {event?.organizerLogo ? (
                        <img src={event.organizerLogo} className="h-12 w-12 rounded-full object-cover ring-2 ring-brand-primary/20" alt="Organizer" />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-brand-primary/20 flex items-center justify-center ring-2 ring-brand-primary/20">
                          <UserCircleIcon className="h-8 w-8 text-brand-primary" />
                        </div>
                      )}
                      <div>
                        <p className={`text-base font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{event?.organizerDisplayName || "Event Organizer"}</p>
                        <p className={`text-xs uppercase tracking-wider font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Host</p>
                      </div>
                    </div>
                  </div>

                  {/* Join Action */}
                  <div className="pt-2 space-y-4">
                    <button
                      onClick={handleJoin}
                      disabled={isEnrolling}
                      className="w-full rounded-xl bg-brand-primary py-4 text-lg font-bold text-white shadow-lg shadow-brand-primary/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isEnrolling ? "Registering..." : (event.attendees?.includes(user?.id) || event.organizerId === user?.id ? "Join Session Now" : "Register & Join Now")}
                    </button>
                    {!event.attendees?.includes(user?.id) && event.organizerId !== user?.id && (
                      <p className={`text-center text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        Clicking Join will automatically register you for this event.
                      </p>
                    )}
                    <p className={`text-center text-xs flex items-center justify-center gap-1.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      <UsersIcon className="h-3.5 w-3.5" />
                      {session?.participants?.length > 0 ? (
                        <span className="font-medium">{session.participants.length} others are already in the session</span>
                      ) : (
                        <span>You'll be the first to join</span>
                      )}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              /* GUEST / UNAUTHENTICATED VIEW */
              <>
                <div className="flex-1 flex flex-col justify-center items-start space-y-6 md:pr-12">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary font-bold text-xs uppercase tracking-wider mb-4">
                      <LockClosedIcon className="h-4 w-4" />
                      Authenticated Access Only
                    </div>
                    <h1 className={`text-4xl lg:text-5xl font-extrabold leading-tight mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {event?.title}
                    </h1>
                    <div className="flex items-center gap-2 text-sm opacity-70 mb-8">
                      <CalendarIcon className="h-5 w-5" />
                      <span>{event?.startTime ? new Date(event.startTime).toLocaleString() : 'Scheduled Event'}</span>
                    </div>
                    <p className={`text-lg leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      Join <strong>{event?.organizerDisplayName}</strong> and others in this exclusive live session. Please log in to verify your registration and access the event.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 w-full">
                    <button
                      onClick={() => navigate(`/login?returnUrl=/join/${code}`)}
                      className={`flex-1 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${theme === 'dark' ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      Log In to Join
                    </button>
                    <button
                      onClick={() => navigate(`/signup?returnUrl=/join/${code}`)}
                      className="flex-1 py-3.5 rounded-xl font-bold border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white transition-all"
                    >
                      Create Account
                    </button>
                  </div>
                </div>

                {/* Decorative Side (Mock Preview) */}
                <div className="flex-1 hidden md:flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 to-purple-600/20 rounded-2xl blur-3xl opacity-50" />
                  {event?.coverImage ? (
                    <img src={event.coverImage} className="relative w-full aspect-video object-cover rounded-2xl shadow-2xl ring-1 ring-white/10" alt="Event Cover" />
                  ) : (
                    <div className={`relative w-full aspect-video rounded-2xl shadow-2xl flex items-center justify-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <VideoCameraSlashIcon className="h-24 w-24 opacity-10" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <LockClosedIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="font-bold opacity-50">Stream Locked</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

          </div>
        </main>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // VIEW: LIVE ROOM
  // ------------------------------------------------------------------
  return (
    <div className={`flex h-screen w-full flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className={`flex h-16 shrink-0 items-center justify-between border-b px-4 ${theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white shadow-sm'}`}>
        <div className="flex items-center gap-4">
          <h1 className={`text-lg font-bold truncate max-w-[200px] md:max-w-md ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{event?.title}</h1>
          <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs font-bold text-red-500 uppercase tracking-wider animate-pulse flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            Live
          </span>
        </div>

        {/* Header Actions */}
        <div className="flex gap-4 items-center">
          {/* Participant Count */}
          <div className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
            <UsersIcon className="h-3.5 w-3.5" />
            <span>{session?.participants?.length ? session.participants.length + (remoteStreamArray.length > 0 ? 0 : 1) : 1} Online</span>
          </div>

          <button
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
            title="Toggle Theme"
          >
            {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Main Content (Stage) */}
      <div className="relative flex-1 overflow-hidden p-4">
        <div className={`w-full h-full rounded-2xl overflow-hidden shadow-2xl ${theme === 'dark' ? 'bg-gray-900' : 'bg-white border border-gray-200 shadow-inner'}`}>
          <VideoGrid
            localStream={localStream}
            remoteStreams={remoteStreamArray}
            isSelf={true}
          />
        </div>
      </div>

      {/* Footer Controls */}
      <footer className={`flex h-20 shrink-0 items-center justify-center gap-4 border-t px-4 pb-2 transition-colors ${theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        <button
          onClick={() => setAudioEnabled(!audioEnabled)}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors shadow-sm ${audioEnabled ? (theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300 text-gray-900') : 'bg-red-500 hover:bg-red-600 text-white'}`}
          title={audioEnabled ? "Mute" : "Unmute"}
        >
          {audioEnabled ? <MicrophoneIcon className="h-6 w-6" /> : <MicrophoneIcon className="h-6 w-6 opacity-50" />}
        </button>

        <button
          onClick={() => setVideoEnabled(!videoEnabled)}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors shadow-sm ${videoEnabled ? (theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300 text-gray-900') : 'bg-red-500 hover:bg-red-600 text-white'}`}
          title={videoEnabled ? "Stop Video" : "Start Video"}
        >
          {videoEnabled ? <VideoCameraIcon className="h-6 w-6" /> : <VideoCameraSlashIcon className="h-6 w-6" />}
        </button>

        <div className={`mx-4 h-8 w-px ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`} />

        <button className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors shadow-sm ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}>
          <ChatBubbleLeftRightIcon className="h-6 w-6" />
        </button>
        <button className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors shadow-sm ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}>
          <UsersIcon className="h-6 w-6" />
        </button>
        <button className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors shadow-sm ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}>
          <Cog6ToothIcon className="h-6 w-6" />
        </button>

        <div className={`mx-4 h-8 w-px ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`} />

        <button
          onClick={handleLeave}
          className="flex h-12 items-center gap-2 rounded-full bg-red-600 px-6 font-bold text-white hover:bg-red-700 transition-colors shadow-md hover:shadow-lg"
        >
          <PhoneXMarkIcon className="h-6 w-6" />
          <span className="hidden sm:inline">End Session</span>
        </button>
      </footer>
    </div>
  );
}

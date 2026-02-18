import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { useSession } from '../hooks/useSession';
import DashboardLayout from '../components/layout/DashboardLayout';
import RequestSupportModal from '../components/dashboard/RequestSupportModal';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { formatEventDate, formatEventTime, isEventUpcoming, getRelativeTime } from "../utils/date";

interface EventDetails {
  _id: string;
  title: string;
  description: string;
  startTime: string;
  speakers: {
    _id: string;
    name: string;
    avatar?: string;
  }[];
  category: string;
  thumbnail?: string;
  participantCount?: number;
}

/**
 * EventLobby Page
 * Pre-session interface with audio/video preview and session details
 */
const EventLobby: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const { joinSession } = useSession(sessionId || null);

  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [permissionsAccepted, setPermissionsAccepted] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Support Modal State
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  // Fetch event details
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setIsLoading(true);
        // Replace with actual API call
        const response = await fetch(`/api/sessions/${sessionId}`);
        if (!response.ok) throw new Error('Failed to fetch event details');
        const data = await response.json();
        setEventDetails(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load event details';
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionId) {
      fetchEventDetails();
    }
  }, [sessionId]);

  // Get local stream on mount
  useEffect(() => {
    const initStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: !isMuted,
          video: videoEnabled,
        });
        setLocalStream(stream);

        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to access camera/microphone';
        setError(message);
        toast.error(message);
      }
    };

    initStream();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isMuted, videoEnabled, localStream]);

  // Update video element when stream changes
  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const handleJoinSession = async () => {
    if (!permissionsAccepted) {
      toast.error('Please accept permissions to continue');
      return;
    }

    if (!sessionId || !user) {
      toast.error('Missing session or user information');
      return;
    }

    try {
      setIsJoining(true);
      await joinSession(sessionId);
      navigate(`/sessions/${sessionId}/live`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join session';
      toast.error(message);
      setError(message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    navigate(-1);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen bg-bg-secondary">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4" />
            <p className="text-text-secondary">Loading event details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !eventDetails) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen bg-bg-secondary">
          <div className="text-center max-w-md">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-xl font-bold text-text-primary mb-2">Error Loading Event</p>
            <p className="text-text-secondary mb-6">{error || 'Event details not found'}</p>
            <button
              onClick={handleLeave}
              className="px-6 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white font-medium transition-all"
            >
              Go Back
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isEventStarted = !isEventUpcoming(eventDetails.startTime);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-bg-secondary p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <button
                onClick={handleLeave}
                className="text-text-secondary hover:text-text-primary flex items-center gap-2 transition-all mb-6 group"
              >
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                <span>Back to Events</span>
              </button>
              <h1 className="text-4xl font-bold text-text-primary">{eventDetails.title}</h1>
              <p className="text-text-secondary mt-2">{eventDetails.category}</p>
            </div>

            <button
              onClick={() => setIsSupportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-text-primary transition-colors shadow-sm"
            >
              <QuestionMarkCircleIcon className="h-5 w-5 text-brand-primary" />
              Help & Support
            </button>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Video Preview */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video Preview Card */}
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <div className="aspect-video bg-black relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {!localStream && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="text-center">
                        <div className="text-4xl mb-2">📹</div>
                        <p className="text-white">Camera disabled</p>
                        <p className="text-gray-400 text-sm mt-1">Enable in settings below</p>
                      </div>
                    </div>
                  )}

                  {/* Status Indicators */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${isMuted ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                      }`}>
                      <span>{isMuted ? '🔇' : '🔊'}</span>
                      {isMuted ? 'Muted' : 'Unmuted'}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${videoEnabled ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      }`}>
                      <span>{videoEnabled ? '✓' : '✗'}</span>
                      {videoEnabled ? 'Camera On' : 'Camera Off'}
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="p-6 bg-white border-t border-gray-100 space-y-4">
                  <h3 className="text-text-primary font-semibold">Audio & Video Settings</h3>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${isMuted
                        ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                        : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                        }`}
                    >
                      {isMuted ? '🔇 Enable Microphone' : '🔊 Disable Microphone'}
                    </button>
                    <button
                      onClick={() => setVideoEnabled(!videoEnabled)}
                      className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${videoEnabled
                        ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                        : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                        }`}
                    >
                      {videoEnabled ? '📹 Disable Camera' : '📹 Enable Camera'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Event Description */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold text-text-primary mb-4">Event Details</h3>
                <p className="text-text-secondary leading-relaxed">{eventDetails.description}</p>
              </div>
            </div>

            {/* Right Column - Session Info & Join */}
            <div className="space-y-6">
              {/* Session Info Card */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold text-text-primary mb-6">Session Information</h3>

                <div className="space-y-4">
                  {/* Participants */}
                  <div>
                    <p className="text-text-secondary text-sm mb-2">Participants</p>
                    <p className="text-2xl font-bold text-text-primary">{eventDetails.participantCount || 0}</p>
                  </div>

                  {/* Start Time */}
                  <div>
                    <p className="text-text-secondary text-sm mb-2">Start Time</p>
                    <p className="text-text-primary font-medium">
                      {formatEventDate(eventDetails.startTime)} • {formatEventTime(eventDetails.startTime)}
                    </p>
                    {!isEventStarted && (
                      <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
                        <span>⏱️</span>
                        Event starts {getRelativeTime(eventDetails.startTime)}
                      </p>
                    )}
                  </div>

                  {/* Speakers */}
                  {eventDetails.speakers.length > 0 && (
                    <div>
                      <p className="text-text-secondary text-sm mb-3">Speakers</p>
                      <div className="space-y-2">
                        {eventDetails.speakers.map((speaker) => (
                          <div key={speaker._id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 border border-gray-100">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm"
                              style={{
                                backgroundColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
                              }}
                            >
                              {speaker.name.charAt(0)}
                            </div>
                            <p className="text-text-primary text-sm font-medium">{speaker.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Permissions Card */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-text-primary mb-4">Permissions</h3>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissionsAccepted}
                    onChange={(e) => setPermissionsAccepted(e.target.checked)}
                    className="w-5 h-5 rounded bg-white border-gray-300 text-brand-primary focus:ring-2 focus:ring-brand-primary mt-1 cursor-pointer"
                  />
                  <span className="text-text-secondary text-sm leading-relaxed">
                    I agree to allow access to my camera and microphone during this session
                  </span>
                </label>

                <p className="text-text-tertiary text-xs mt-4 leading-relaxed">
                  Your audio and video will only be shared with other session participants. You can disable them at any time during the session.
                </p>
              </div>

              {/* Join Button */}
              <button
                onClick={handleJoinSession}
                disabled={!permissionsAccepted || isJoining || !isEventStarted}
                className={`w-full py-4 rounded-xl font-bold text-white transition-all text-lg shadow-lg ${permissionsAccepted && isEventStarted
                  ? 'bg-brand-primary hover:bg-brand-primary/90 cursor-pointer shadow-brand-primary/20'
                  : 'bg-gray-300 cursor-not-allowed opacity-70'
                  }`}
              >
                {isJoining ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Joining...
                  </span>
                ) : !isEventStarted ? (
                  '⏳ Event Not Started Yet'
                ) : !permissionsAccepted ? (
                  '✓ Accept Permissions to Join'
                ) : (
                  '🎯 Join Session'
                )}
              </button>

              {/* Leave Button */}
              <button
                onClick={handleLeave}
                className="w-full py-3 rounded-xl font-medium text-text-secondary bg-transparent border border-gray-200 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <RequestSupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        eventId={sessionId}
      />
    </DashboardLayout>
  );
};

export default EventLobby;

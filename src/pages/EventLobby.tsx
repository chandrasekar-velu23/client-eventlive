import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { useSession } from '../hooks/useSession';
import DashboardLayout from '../components/layout/DashboardLayout';

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
        <div className="flex items-center justify-center h-screen bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
            <p className="text-gray-300">Loading event details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !eventDetails) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen bg-gray-900">
          <div className="text-center max-w-md">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-xl font-bold text-white mb-2">Error Loading Event</p>
            <p className="text-gray-300 mb-6">{error || 'Event details not found'}</p>
            <button
              onClick={handleLeave}
              className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all"
            >
              Go Back
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isEventStarted = new Date(eventDetails.startTime) <= new Date();

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={handleLeave}
              className="text-gray-400 hover:text-white flex items-center gap-2 transition-all mb-6"
            >
              <span>←</span>
              <span>Back to Events</span>
            </button>
            <h1 className="text-4xl font-bold text-white">{eventDetails.title}</h1>
            <p className="text-gray-400 mt-2">{eventDetails.category}</p>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Video Preview */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video Preview Card */}
              <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 shadow-xl">
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
                    <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${
                      isMuted ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                    }`}>
                      <span>{isMuted ? '🔇' : '🔊'}</span>
                      {isMuted ? 'Muted' : 'Unmuted'}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${
                      videoEnabled ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                      <span>{videoEnabled ? '✓' : '✗'}</span>
                      {videoEnabled ? 'Camera On' : 'Camera Off'}
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="p-6 bg-gray-900 border-t border-gray-700 space-y-4">
                  <h3 className="text-white font-semibold">Audio & Video Settings</h3>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                        isMuted
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {isMuted ? '🔇 Enable Microphone' : '🔊 Disable Microphone'}
                    </button>
                    <button
                      onClick={() => setVideoEnabled(!videoEnabled)}
                      className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                        videoEnabled
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      {videoEnabled ? '📹 Disable Camera' : '📹 Enable Camera'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Event Description */}
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">Event Details</h3>
                <p className="text-gray-300 leading-relaxed">{eventDetails.description}</p>
              </div>
            </div>

            {/* Right Column - Session Info & Join */}
            <div className="space-y-6">
              {/* Session Info Card */}
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-6">Session Information</h3>

                <div className="space-y-4">
                  {/* Participants */}
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Participants</p>
                    <p className="text-2xl font-bold text-white">{eventDetails.participantCount || 0}</p>
                  </div>

                  {/* Start Time */}
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Start Time</p>
                    <p className="text-white font-medium">
                      {new Date(eventDetails.startTime).toLocaleString()}
                    </p>
                    {!isEventStarted && (
                      <p className="text-yellow-400 text-xs mt-1 flex items-center gap-1">
                        <span>⏱️</span>
                        Event starts in{' '}
                        {Math.ceil(
                          (new Date(eventDetails.startTime).getTime() - new Date().getTime()) / 60000,
                        )}{' '}
                        minutes
                      </p>
                    )}
                  </div>

                  {/* Speakers */}
                  {eventDetails.speakers.length > 0 && (
                    <div>
                      <p className="text-gray-400 text-sm mb-3">Speakers</p>
                      <div className="space-y-2">
                        {eventDetails.speakers.map((speaker) => (
                          <div key={speaker._id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-900">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                              style={{
                                backgroundColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
                              }}
                            >
                              {speaker.name.charAt(0)}
                            </div>
                            <p className="text-white text-sm">{speaker.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Permissions Card */}
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4">Permissions</h3>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissionsAccepted}
                    onChange={(e) => setPermissionsAccepted(e.target.checked)}
                    className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 mt-1 cursor-pointer"
                  />
                  <span className="text-gray-300 text-sm leading-relaxed">
                    I agree to allow access to my camera and microphone during this session
                  </span>
                </label>

                <p className="text-gray-500 text-xs mt-4 leading-relaxed">
                  Your audio and video will only be shared with other session participants. You can disable them at any time during the session.
                </p>
              </div>

              {/* Join Button */}
              <button
                onClick={handleJoinSession}
                disabled={!permissionsAccepted || isJoining || !isEventStarted}
                className={`w-full py-4 rounded-xl font-bold text-white transition-all text-lg ${
                  permissionsAccepted && isEventStarted
                    ? 'bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 cursor-pointer'
                    : 'bg-gray-700 cursor-not-allowed opacity-50'
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
                className="w-full py-3 rounded-xl font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EventLobby;

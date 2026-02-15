import React, { useRef, useEffect } from 'react';
import type { RemoteStream } from '../../hooks/useWebRTC';
import { UserCircleIcon, VideoCameraSlashIcon } from '@heroicons/react/24/outline';

interface VideoGridProps {
  localStream: MediaStream | null;
  remoteStreams: RemoteStream[];
  isSelf?: boolean;
}

/**
 * VideoGrid Component
 * Displays local and remote video streams in a smart responsive grid
 */
export const VideoGrid: React.FC<VideoGridProps> = ({
  localStream,
  remoteStreams,
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Setup local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Calculate dynamic grid layout based on participant count
  const totalParticipants = (localStream ? 1 : 0) + remoteStreams.length;

  let gridClass = 'grid-cols-1';
  if (totalParticipants === 2) gridClass = 'grid-cols-1 md:grid-cols-2';
  if (totalParticipants >= 3 && totalParticipants <= 4) gridClass = 'grid-cols-1 md:grid-cols-2';
  if (totalParticipants >= 5 && totalParticipants <= 6) gridClass = 'grid-cols-2 md:grid-cols-3';
  if (totalParticipants > 6) gridClass = 'grid-cols-2 md:grid-cols-4';

  // Handle aspect ratio based on count
  const cardHeight = totalParticipants <= 2 ? 'h-full' : 'h-auto aspect-video';

  return (
    <div className={`grid ${gridClass} gap-4 w-full h-full content-center p-4 max-h-screen overflow-y-auto custom-scrollbar`}>
      {/* Local Video */}
      {localStream && (
        <div className={`relative rounded-2xl overflow-hidden shadow-2xl bg-zinc-900 border border-white/10 group ${cardHeight} ring-1 ring-white/5`}>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> You
          </div>
        </div>
      )}

      {/* Remote Videos */}
      {remoteStreams.map((remote) => (
        <RemoteVideoPlayer key={remote.userId} stream={remote.stream} userId={remote.userId} cardHeight={cardHeight} />
      ))}

      {/* Empty State */}
      {!localStream && remoteStreams.length === 0 && (
        <div className="col-span-full h-full flex flex-col items-center justify-center p-8 text-center text-zinc-500">
          <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 ring-1 ring-white/10">
            <VideoCameraSlashIcon className="w-10 h-10 opacity-50" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">The stage is empty</h3>
          <p className="max-w-md mx-auto">Waiting for speakers to join the session. If you are the host, make sure your camera is on.</p>
        </div>
      )}
    </div>
  );
};

interface RemoteVideoPlayerProps {
  stream: MediaStream;
  userId: string;
  cardHeight: string;
}

const RemoteVideoPlayer: React.FC<RemoteVideoPlayerProps> = ({ stream, userId, cardHeight }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={`relative rounded-2xl overflow-hidden shadow-2xl bg-zinc-900 border border-white/10 group ${cardHeight} ring-1 ring-white/5`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      {/* Participant Label */}
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border border-white/10">
        <UserCircleIcon className="w-4 h-4 text-zinc-400" />
        <span>Participant {userId.slice(0, 4)}</span>
      </div>

      {/* Audio Indicator (Mock for visual consistency) */}
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md p-1.5 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-4 h-4 flex items-center justify-center gap-[2px]">
          <div className="w-[2px] h-2 bg-green-500 animate-pulse"></div>
          <div className="w-[2px] h-3 bg-green-500 animate-pulse delay-75"></div>
          <div className="w-[2px] h-1 bg-green-500 animate-pulse delay-150"></div>
        </div>
      </div>
    </div>
  );
};

export default VideoGrid;

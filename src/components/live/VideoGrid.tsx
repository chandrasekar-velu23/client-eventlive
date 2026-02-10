import React, { useRef, useEffect } from 'react';
import type { RemoteStream } from '../../hooks/useWebRTC';

interface VideoGridProps {
  localStream: MediaStream | null;
  remoteStreams: RemoteStream[];
  isSelf?: boolean;
}

/**
 * VideoGrid Component
 * Displays local and remote video streams in a responsive grid
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

  // Calculate grid layout
  const totalParticipants = (localStream ? 1 : 0) + remoteStreams.length;
  const gridCols = totalParticipants <= 2 ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`grid ${gridCols} gap-2 w-full h-full auto-rows-fr`}>
      {/* Local Video */}
      {localStream && (
        <div className="relative bg-gray-900 rounded-lg overflow-hidden shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-3 left-3 bg-black bg-opacity-60 text-white px-3 py-1 rounded text-sm font-medium">
            You
          </div>
        </div>
      )}

      {/* Remote Videos */}
      {remoteStreams.map((remote) => (
        <RemoteVideoPlayer key={remote.userId} stream={remote.stream} userId={remote.userId} />
      ))}

      {/* Empty State */}
      {!localStream && remoteStreams.length === 0 && (
        <div className="col-span-full flex items-center justify-center bg-gray-800 rounded-lg">
          <div className="text-center text-gray-400">
            <p className="text-lg">Waiting for video streams...</p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Remote Video Player Component
 */
interface RemoteVideoPlayerProps {
  stream: MediaStream;
  userId: string;
}

const RemoteVideoPlayer: React.FC<RemoteVideoPlayerProps> = ({ stream, userId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden shadow-lg">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-3 left-3 bg-black bg-opacity-60 text-white px-3 py-1 rounded text-sm font-medium">
        Participant {userId.substring(0, 6)}
      </div>
    </div>
  );
};

export default VideoGrid;

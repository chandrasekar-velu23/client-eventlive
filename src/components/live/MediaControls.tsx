import React, { useState } from 'react';
import { toast } from 'sonner';

interface MediaControlsProps {
  isMuted: boolean;
  videoEnabled: boolean;
  onToggleMicrophone: () => Promise<void>;
  onToggleCamera: () => Promise<void>;
  onScreenShare?: () => Promise<void>;
  onLeaveSession?: () => Promise<void>;
  isLoading?: boolean;
}

/**
 * MediaControls Component
 * Controls for microphone, camera, screen sharing, and session exit
 */
export const MediaControls: React.FC<MediaControlsProps> = ({
  isMuted,
  videoEnabled,
  onToggleMicrophone,
  onToggleCamera,
  onScreenShare,
  onLeaveSession,
  isLoading = false,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const handleToggleMicrophone = async () => {
    if (isProcessing) return;
    try {
      setIsProcessing(true);
      await onToggleMicrophone();
      toast.success(isMuted ? 'Microphone enabled' : 'Microphone disabled');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle microphone';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleCamera = async () => {
    if (isProcessing) return;
    try {
      setIsProcessing(true);
      await onToggleCamera();
      toast.success(videoEnabled ? 'Camera disabled' : 'Camera enabled');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle camera';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScreenShare = async () => {
    if (!onScreenShare || isProcessing) return;
    try {
      setIsProcessing(true);
      await onScreenShare();
      setIsScreenSharing(!isScreenSharing);
      toast.success(isScreenSharing ? 'Screen share stopped' : 'Screen share started');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to share screen';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLeaveSession = async () => {
    if (!onLeaveSession || isProcessing) return;
    if (!window.confirm('Are you sure you want to leave this session?')) return;

    try {
      setIsProcessing(true);
      await onLeaveSession();
      toast.success('Left session');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to leave session';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex gap-3 items-center justify-center p-4 bg-gray-900 rounded-lg border border-gray-700">
      {/* Microphone Button */}
      <button
        onClick={handleToggleMicrophone}
        disabled={isProcessing || isLoading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
          isMuted
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-green-600 hover:bg-green-700 text-white'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        <span className="text-lg">{isMuted ? '🔇' : '🔊'}</span>
        <span className="hidden sm:inline">{isMuted ? 'Unmute' : 'Mute'}</span>
      </button>

      {/* Camera Button */}
      <button
        onClick={handleToggleCamera}
        disabled={isProcessing || isLoading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
          videoEnabled
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-red-600 hover:bg-red-700 text-white'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={videoEnabled ? 'Disable Camera' : 'Enable Camera'}
      >
        <span className="text-lg">{videoEnabled ? '📹' : '📹'}</span>
        <span className="hidden sm:inline">{videoEnabled ? 'Camera On' : 'Camera Off'}</span>
      </button>

      {/* Screen Share Button */}
      {onScreenShare && (
        <button
          onClick={handleScreenShare}
          disabled={isProcessing || isLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            isScreenSharing
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
        >
          <span className="text-lg">🖥️</span>
          <span className="hidden sm:inline">{isScreenSharing ? 'Stop Share' : 'Share'}</span>
        </button>
      )}

      {/* Divider */}
      <div className="w-px h-8 bg-gray-600" />

      {/* Leave Button */}
      {onLeaveSession && (
        <button
          onClick={handleLeaveSession}
          disabled={isProcessing || isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-red-700 hover:bg-red-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          title="Leave Session"
        >
          <span className="text-lg">👋</span>
          <span className="hidden sm:inline">Leave</span>
        </button>
      )}
    </div>
  );
};

export default MediaControls;

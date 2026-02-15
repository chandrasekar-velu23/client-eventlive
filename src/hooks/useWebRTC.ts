import { useEffect, useRef, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ]
};

export interface RemoteStream {
  userId: string;
  stream: MediaStream;
}

interface PeerConnection {
  [userId: string]: RTCPeerConnection;
}

interface UseWebRTCProps {
  sessionId: string;
  isHost: boolean;
  enabled: boolean; // Lobby logic
}

export const useWebRTC = ({ sessionId, isHost: _isHost, enabled }: UseWebRTCProps) => {
  const { user } = useAuth();
  const token = user?.token || localStorage.getItem('token');
  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<PeerConnection>({});

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<{ [userId: string]: MediaStream }>({});
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Helper to create Peer Connection
  // Defined outside useEffect or via useRef to be accessible
  const createPeerConnection = (userId: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          sessionId,
          to: userId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('Received remote track from:', userId);
      setRemoteStreams(prev => ({
        ...prev,
        [userId]: event.streams[0]
      }));
    };

    return pc;
  };

  // Initialize Socket
  useEffect(() => {
    if (!enabled || !sessionId || !user || !token) return;

    // Prevent double connection
    if (socketRef.current?.connected) return;

    // Connect to session namespace
    const newSocket = io(`${import.meta.env.VITE_API_BASE_URL}/session`, {
      auth: { token },
      transports: ['websocket']
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    const socket = newSocket;

    socket.on('connect', () => {
      console.log('Connected to signaling server');
      setIsConnected(true);
      socket.emit('join-session', { sessionId });
    });

    socket.on('participant-joined', async ({ userId }) => {
      console.log('New participant joined:', userId);
      if (userId !== user.id) {
        const pc = createPeerConnection(userId);
        peersRef.current[userId] = pc;
        // Add local tracks
        localStream?.getTracks().forEach(track => pc.addTrack(track, localStream));

        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          socket.emit('webrtc-offer', {
            sessionId,
            to: userId,
            offer
          });
        } catch (err) {
          console.error("Error creating offer:", err);
        }
      }
    });

    socket.on('webrtc-offer', async ({ from, offer }) => {
      console.log('Received offer from:', from);
      const pc = createPeerConnection(from);
      peersRef.current[from] = pc;

      // Add local tracks if available (so they can see us too)
      if (localStream) {
        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('webrtc-answer', {
        sessionId,
        to: from,
        answer
      });
    });

    socket.on('webrtc-answer', async ({ from, answer }) => {
      console.log('Received answer from:', from);
      const pc = peersRef.current[from];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('ice-candidate', async ({ from, candidate }) => {
      const pc = peersRef.current[from];
      if (pc && candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on('participant-left', ({ userId }) => {
      console.log('Participant left:', userId);
      if (peersRef.current[userId]) {
        peersRef.current[userId].close();
        delete peersRef.current[userId];
        setRemoteStreams(prev => {
          const newStreams = { ...prev };
          delete newStreams[userId];
          return newStreams;
        });
      }
    });

    return () => {
      socket.disconnect();
      Object.values(peersRef.current).forEach(pc => pc.close());
      peersRef.current = {};
    };
  }, [enabled, sessionId, token, localStream]);

  // Handle Local Stream extraction
  const startLocalStream = useCallback(async (video = true, audio = true) => {
    try {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio });
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Failed to get local stream', err);
      return null;
    }
  }, [localStream]);

  // Cleanup local stream on unmount
  useEffect(() => {
    return () => {
      localStream?.getTracks().forEach(track => track.stop());
    };
  }, [localStream]);

  const toggleAudio = (enabled: boolean) => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = enabled);
      socketRef.current?.emit('update-media-state', { sessionId, isMuted: !enabled });
    }
  };

  const toggleVideo = (enabled: boolean) => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = enabled);
      socketRef.current?.emit('update-media-state', { sessionId, videoEnabled: enabled });
    }
  };

  const shareScreen = async () => {
    // TODO: Implement replaceTrack logic
  };

  return {
    localStream,
    remoteStreams,
    isConnected,
    startLocalStream,
    toggleAudio,
    toggleVideo,
    shareScreen,
    socket
  };
};

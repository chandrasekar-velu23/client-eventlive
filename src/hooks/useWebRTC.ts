import { useEffect, useRef, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from './useAuth';
import { SOCKET_URL } from '../services/api';

/* ---------- ICE Server Configuration ---------- */
function buildIceServers(): RTCConfiguration {
  return {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
    iceCandidatePoolSize: 10,
  };
}

const ICE_SERVERS = buildIceServers();

export interface RemoteStream {
  userId: string;
  stream: MediaStream;
}

interface PeerConnection {
  [socketId: string]: RTCPeerConnection;
}

export interface RemoteParticipant {
  socketId: string;
  userId: string;
  stream: MediaStream;
}

interface UseWebRTCProps {
  sessionId: string | undefined;
  isHost: boolean;
  enabled: boolean;
}

export const useWebRTC = ({ sessionId, isHost: _isHost, enabled }: UseWebRTCProps) => {
  const { user } = useAuth();
  const token = user?.token || localStorage.getItem('token');

  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<PeerConnection>({});
  const makingOfferRef = useRef<{ [socketId: string]: boolean }>({});

  // Use a ref for localStream so event handlers inside socket effects always see fresh value
  const localStreamRef = useRef<MediaStream | null>(null);
  // Tracks the raw screen-capture stream when screen sharing is active
  const screenStreamRef = useRef<MediaStream | null>(null);

  // No global isPolite. Politeness is determined per peer.

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<{ [socketId: string]: RemoteParticipant }>({});
  const [isConnected, setIsConnected] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // Stable createPeerConnection via ref — no stale closures
  const createPeerConnectionRef = useRef((remoteSocketId: string, remoteUserId: string, currentSocket: Socket) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Perfect Negotiation Implementation
    pc.onnegotiationneeded = async () => {
      try {
        makingOfferRef.current[remoteSocketId] = true;
        await pc.setLocalDescription();
        if (pc.localDescription && currentSocket.connected) {
          currentSocket.emit('webrtc-offer', {
            sessionId,
            roomId: sessionId, // Fallback to sessionId if sessionCode is unknown
            to: remoteSocketId,
            offer: pc.localDescription
          });
        }
      } catch (err) {
        console.error(`[WebRTC] Negotiation error with ${remoteSocketId}:`, err);
      } finally {
        makingOfferRef.current[remoteSocketId] = false;
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && currentSocket.connected) {
        currentSocket.emit('ice-candidate', {
          sessionId,
          to: remoteSocketId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track from:', remoteUserId, 'on socket:', remoteSocketId);
      const stream = event.streams[0];
      if (stream) {
        setRemoteStreams(prev => ({
          ...prev,
          [remoteSocketId]: { socketId: remoteSocketId, userId: remoteUserId, stream }
        }));
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE state for ${remoteSocketId}:`, pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        pc.restartIce();
      }
    };

    return pc;
  });

  const addLocalTracksToPeer = useCallback((pc: RTCPeerConnection) => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getTracks().forEach(track => {
      const senders = pc.getSenders();
      const alreadyAdded = senders.find(s => s.track?.kind === track.kind);
      if (!alreadyAdded) {
        pc.addTrack(track, stream);
      }
    });
  }, []);

  // Initialize Socket when enabled
  useEffect(() => {
    if (!enabled || !sessionId || !user || !token) return;

    // Prevent double connection
    if (socketRef.current?.connected) return;

    console.log('[WebRTC] Connecting to signaling server...');
    const newSocket = io(`${SOCKET_URL}/session`, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('[WebRTC] Connected to signaling server');
      setIsConnected(true);
      newSocket.emit('join-session', { sessionId });
    });

    newSocket.on('connect_error', (err) => {
      console.error('[WebRTC] Connection error:', err.message);
      setIsConnected(false);
    });

    newSocket.on('disconnect', (reason) => {
      console.warn('[WebRTC] Disconnected:', reason);
      setIsConnected(false);
    });

    // PERFECT NEGOTIATION HANDLERS
    newSocket.on('participant-joined', async ({ userId: remoteUserId, socketId: remoteSocketId }: { userId: string, socketId: string }) => {
      if (remoteSocketId === newSocket.id) return;

      console.log('[WebRTC] Participant joined:', remoteUserId, 'socket:', remoteSocketId);
      if (!peersRef.current[remoteSocketId]) {
        const pc = createPeerConnectionRef.current(remoteSocketId, remoteUserId, newSocket);
        peersRef.current[remoteSocketId] = pc;
        addLocalTracksToPeer(pc);
      }
    });

    newSocket.on('webrtc-offer', async ({ from: remoteSocketId, userId: remoteUserId, offer, roomId: incomingRoomId }: { from: string; userId: string; offer: RTCSessionDescriptionInit; roomId?: string }) => {
      console.log('[WebRTC] Signal: Remote Offer from', remoteSocketId);
      try {
        if (!peersRef.current[remoteSocketId]) {
          const pc = createPeerConnectionRef.current(remoteSocketId, remoteUserId, newSocket);
          peersRef.current[remoteSocketId] = pc;
          addLocalTracksToPeer(pc);
        }

        const pc = peersRef.current[remoteSocketId];
        const isPolite = newSocket.id ? (newSocket.id < remoteSocketId) : true;
        const offerCollision = (offer.type === "offer") &&
          (makingOfferRef.current[remoteSocketId] || pc.signalingState !== "stable");

        const ignoreOffer = !isPolite && offerCollision;
        if (ignoreOffer) {
          console.log('[WebRTC] Conflict: Ignoring offer because we are impolite');
          return;
        }

        if (offerCollision) {
          await Promise.all([
            pc.setLocalDescription({ type: "rollback" }),
            pc.setRemoteDescription(new RTCSessionDescription(offer))
          ]);
        } else {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
        }

        if (offer.type === "offer") {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          newSocket.emit('webrtc-answer', {
            sessionId,
            roomId: incomingRoomId || "",
            to: remoteSocketId,
            answer
          });
        }
      } catch (err) {
        console.error('[WebRTC] Error handling offer:', err);
      }
    });

    newSocket.on('webrtc-answer', async ({ from: remoteSocketId, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
      console.log('[WebRTC] Signal: Remote Answer from', remoteSocketId);
      const pc = peersRef.current[remoteSocketId];
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error('[WebRTC] Error setting remote description:', err);
        }
      }
    });

    newSocket.on('ice-candidate', async ({ from: remoteSocketId, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      const pc = peersRef.current[remoteSocketId];
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          // Normal during negotiation transitions
        }
      }
    });

    newSocket.on('participant-left', ({ socketId: remoteSocketId }: { socketId: string }) => {
      console.log('[WebRTC] Participant left socket:', remoteSocketId);
      const pc = peersRef.current[remoteSocketId];
      if (pc) {
        pc.close();
        delete peersRef.current[remoteSocketId];
        setRemoteStreams(prev => {
          const next = { ...prev };
          delete next[remoteSocketId];
          return next;
        });
      }
    });

    newSocket.on('session-ended', () => {
      console.log('[WebRTC] Session ended by host');
      // Let the parent page handle navigation
    });

    return () => {
      console.log('[WebRTC] Cleanup');
      newSocket.emit('leave-session', { sessionId });
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
      Object.values(peersRef.current).forEach(pc => pc.close());
      peersRef.current = {};
      setIsConnected(false);
      setRemoteStreams({});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, sessionId, token]);

  // When localStream changes, replace tracks in all existing peer connections
  useEffect(() => {
    if (!localStream) return;
    Object.values(peersRef.current).forEach(pc => {
      const senders = pc.getSenders();
      localStream.getTracks().forEach(track => {
        const sender = senders.find(s => s.track?.kind === track.kind);
        if (sender) {
          sender.replaceTrack(track).catch(console.error);
        } else {
          pc.addTrack(track, localStream);
        }
      });
    });
  }, [localStream]);

  // Get camera/mic stream
  const startLocalStream = useCallback(async (video = true, audio = true) => {
    try {
      // Stop any existing tracks first
      localStreamRef.current?.getTracks().forEach(t => t.stop());

      const stream = await navigator.mediaDevices.getUserMedia({ video, audio });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('[WebRTC] Failed to get local stream:', err);
      return null;
    }
  }, []);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const toggleAudio = useCallback((enabled: boolean) => {
    const stream = localStreamRef.current;
    if (stream) {
      stream.getAudioTracks().forEach(track => { track.enabled = enabled; });
      socketRef.current?.emit('update-media-state', { sessionId, isMuted: !enabled });
    }
  }, [sessionId]);

  const toggleVideo = useCallback((enabled: boolean) => {
    const stream = localStreamRef.current;
    if (stream) {
      stream.getVideoTracks().forEach(track => { track.enabled = enabled; });
      socketRef.current?.emit('update-media-state', { sessionId, videoEnabled: enabled });
    }
  }, [sessionId]);

  const shareScreen = useCallback(async () => {
    try {
      const rawScreenStream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { frameRate: { ideal: 30 } },
        audio: true
      });
      const screenTrack = rawScreenStream.getVideoTracks()[0];

      // Keep the raw screen stream for recording
      screenStreamRef.current = rawScreenStream;

      // Replace video track in all peer connections
      Object.values(peersRef.current).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack).catch(console.error);
        else pc.addTrack(screenTrack, rawScreenStream);
      });

      // Compose new local stream: screen video + mic audio
      const micTrack = localStreamRef.current?.getAudioTracks()[0];
      const composed = new MediaStream([screenTrack]);
      if (micTrack) composed.addTrack(micTrack);
      localStreamRef.current = composed;
      setLocalStream(composed);
      setIsScreenSharing(true);

      // Automatically revert when user stops via browser UI
      screenTrack.onended = () => {
        stopScreenShare();
      };

      socketRef.current?.emit('update-media-state', { sessionId, screenshareActive: true });
    } catch (err) {
      console.error('[WebRTC] Screen share failed:', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const stopScreenShare = useCallback(async () => {
    try {
      // Get a fresh camera stream without calling startLocalStream (avoids circular dep)
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const videoTrack = cameraStream.getVideoTracks()[0];
      const audioTrack = cameraStream.getAudioTracks()[0];

      // Replace in peers
      Object.values(peersRef.current).forEach(pc => {
        if (videoTrack) {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(videoTrack).catch(console.error);
        }
      });

      // Stop old screen share tracks and clear the ref
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
      localStreamRef.current?.getVideoTracks().forEach(t => t.stop());

      const newStream = new MediaStream();
      if (videoTrack) newStream.addTrack(videoTrack);
      if (audioTrack) newStream.addTrack(audioTrack);

      localStreamRef.current = newStream;
      setLocalStream(newStream);
      setIsScreenSharing(false);

      socketRef.current?.emit('update-media-state', { sessionId, screenshareActive: false });
    } catch (err) {
      console.error('[WebRTC] Stop screen share failed:', err);
      setIsScreenSharing(false);
    }
  }, [sessionId]);

  return {
    localStream,
    remoteStreams,
    screenStream: screenStreamRef.current, // raw screen capture stream for recording
    isConnected,
    isScreenSharing,
    startLocalStream,
    toggleAudio,
    toggleVideo,
    shareScreen,
    stopScreenShare,
    socket,
  };
};

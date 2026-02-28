import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { SOCKET_URL } from '../services/api';

/* ---------- ICE Server Configuration ---------- */
function buildIceServers(): RTCConfiguration {
    return {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
        ],
        iceCandidatePoolSize: 10,
    };
}

const ICE_SERVERS = buildIceServers();

export interface RemoteParticipant {
    socketId: string;
    userId: string;
    stream: MediaStream;
}

interface PeerConnection {
    [socketId: string]: RTCPeerConnection;
}

interface WebRTCContextType {
    socket: Socket | null;
    localStream: MediaStream | null;
    remoteStreams: { [socketId: string]: RemoteParticipant };
    screenStream: MediaStream | null;
    isConnected: boolean;
    isScreenSharing: boolean;
    startLocalStream: (video?: boolean, audio?: boolean) => Promise<MediaStream | null>;
    stopLocalStream: () => void;
    toggleAudio: (enabled: boolean) => void;
    toggleVideo: (enabled: boolean) => void;
    shareScreen: (ids: { sessionId?: string; roomId?: string }) => Promise<void>;
    stopScreenShare: (ids: { sessionId?: string; roomId?: string }) => Promise<void>;
    joinSession: (ids: { sessionId?: string; roomId?: string }, mediaOptions?: { audioEnabled?: boolean; videoEnabled?: boolean }) => void;
    leaveSession: (sessionId: string) => void;
}

const WebRTCContext = createContext<WebRTCContextType | undefined>(undefined);

export const WebRTCProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const token = user?.token || localStorage.getItem('token');

    const socketRef = useRef<Socket | null>(null);
    const peersRef = useRef<PeerConnection>({});
    const makingOfferRef = useRef<{ [socketId: string]: boolean }>({});
    const ignoreOfferRef = useRef<{ [socketId: string]: boolean }>({});
    const iceCandidateQueueRef = useRef<{ [socketId: string]: RTCIceCandidateInit[] }>({});
    const localStreamRef = useRef<MediaStream | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);

    const [socket, setSocket] = useState<Socket | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<{ [socketId: string]: RemoteParticipant }>({});
    const [isConnected, setIsConnected] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    // Keep refs in sync and update tracks across all peers
    useEffect(() => {
        localStreamRef.current = localStream;
        if (!localStream) return;

        Object.values(peersRef.current).forEach(pc => {
            localStream.getTracks().forEach(track => {
                const senders = pc.getSenders();
                const sender = senders.find(s => s.track?.kind === track.kind);
                if (sender) {
                    sender.replaceTrack(track).catch(err =>
                        console.error(`[WebRTCContext] Track replacement error:`, err)
                    );
                } else if (pc.signalingState !== 'closed') {
                    pc.addTrack(track, localStream);
                }
            });
        });
    }, [localStream]);

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


    const getOrCreatePeerConnection = useCallback((remoteSocketId: string, remoteUserId: string, sessionId: string, confirmedRoomId: string, newSocket: Socket) => {
        if (peersRef.current[remoteSocketId]) return peersRef.current[remoteSocketId];

        console.log(`[WebRTCContext] Creating PC for ${remoteSocketId} (${remoteUserId})`);
        const pc = new RTCPeerConnection(ICE_SERVERS);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                newSocket.emit('ice-candidate', { sessionId, to: remoteSocketId, candidate: event.candidate });
            }
        };

        pc.ontrack = (event) => {
            const stream = event.streams[0];
            if (stream) {
                console.log(`[WebRTCContext] Got remote stream from ${remoteSocketId}`);
                setRemoteStreams(prev => ({
                    ...prev,
                    [remoteSocketId]: { socketId: remoteSocketId, userId: remoteUserId, stream }
                }));
            }
        };

        pc.oniceconnectionstatechange = () => {
            if (pc.iceConnectionState === 'failed') {
                if ('restartIce' in pc && typeof pc.restartIce === 'function') {
                    (pc.restartIce as any)();
                }
            }
        };

        pc.onnegotiationneeded = async () => {
            try {
                makingOfferRef.current[remoteSocketId] = true;
                await pc.setLocalDescription();
                newSocket.emit('webrtc-offer', { sessionId, roomId: confirmedRoomId, to: remoteSocketId, offer: pc.localDescription });
            } catch (err) {
                console.error(`[WebRTCContext] Negotiation Error (${remoteSocketId}):`, err);
            } finally {
                makingOfferRef.current[remoteSocketId] = false;
            }
        };

        peersRef.current[remoteSocketId] = pc;
        addLocalTracksToPeer(pc);
        return pc;
    }, [addLocalTracksToPeer]);

    const joinSession = useCallback((ids: { sessionId?: string; roomId?: string }, mediaOptions?: { audioEnabled?: boolean; videoEnabled?: boolean }) => {
        const { sessionId, roomId } = ids;
        if (!user || !token || (!sessionId && !roomId)) return;
        if (socketRef.current?.connected) return;

        console.log('[WebRTCContext] Connecting to signaling server for room:', roomId || sessionId);
        const newSocket = io(`${SOCKET_URL}/session`, {
            path: '/socket.io',
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('[WebRTCContext] Connected to signaling server');
            setIsConnected(true);
            newSocket.emit('join-session', {
                sessionId,
                roomId,
                isMuted: mediaOptions?.audioEnabled === false,
                videoEnabled: mediaOptions?.videoEnabled === true
            });
        });

        newSocket.on('connect_error', (err) => {
            console.error('[WebRTCContext] Connection error:', err.message);
            setIsConnected(false);
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
        });

        // Lobby / Approval Events
        newSocket.on('waiting-for-approval', (data) => {
            console.log('[WebRTCContext] Waiting for approval...', data.message);
        });

        newSocket.on('approved', ({ roomId: confirmedRoomId }) => {
            console.log('[WebRTCContext] Approved! Joining room:', confirmedRoomId);
            // The backend already joined the socket to the room, but we might want to update local state
        });

        newSocket.on('rejected', (data) => {
            console.warn('[WebRTCContext] Rejected:', data.message);
            newSocket.disconnect();
        });

        newSocket.on('participant-joined', async ({ userId: remoteUserId, socketId: remoteSocketId }: { userId: string, socketId: string }) => {
            if (remoteSocketId === newSocket.id) return;
            console.log('[WebRTCContext] Participant joined:', remoteUserId, 'socket:', remoteSocketId);
            getOrCreatePeerConnection(remoteSocketId, remoteUserId, sessionId || "", roomId || "", newSocket);
        });

        newSocket.on('webrtc-offer', async ({ from: remoteSocketId, fromUserId: remoteUserId, offer }: { from: string; fromUserId: string; offer: RTCSessionDescriptionInit }) => {
            const pc = getOrCreatePeerConnection(remoteSocketId, remoteUserId, sessionId || "", roomId || "", newSocket);

            const isPolite = newSocket.id ? (newSocket.id < remoteSocketId) : true;
            const offerCollision = (offer.type === "offer") && (makingOfferRef.current[remoteSocketId] || pc.signalingState !== "stable");

            ignoreOfferRef.current[remoteSocketId] = !isPolite && offerCollision;
            if (ignoreOfferRef.current[remoteSocketId]) {
                console.log('[WebRTCContext] Ignoring offer from (impolite clash):', remoteSocketId);
                return;
            }

            try {
                if (offerCollision) {
                    await Promise.all([
                        pc.setLocalDescription({ type: "rollback" }),
                        pc.setRemoteDescription(new RTCSessionDescription(offer))
                    ]);
                } else {
                    await pc.setRemoteDescription(new RTCSessionDescription(offer));
                }

                if (offer.type === "offer") {
                    await pc.setLocalDescription();
                    newSocket.emit('webrtc-offer', {
                        sessionId,
                        roomId,
                        to: remoteSocketId,
                        offer: pc.localDescription
                    });
                }

                // Flush buffered candidates
                const queue = iceCandidateQueueRef.current[remoteSocketId] || [];
                while (queue.length > 0) {
                    const candidate = queue.shift();
                    if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => { });
                }
            } catch (err) {
                console.error(`[WebRTCContext] Offer handling error (${remoteSocketId}):`, err);
            }
        });

        newSocket.on('webrtc-answer', async ({ from: remoteSocketId, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
            const pc = peersRef.current[remoteSocketId];
            if (pc) {
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(answer));
                } catch (err) {
                    console.error(`[WebRTCContext] Answer handling error (${remoteSocketId}):`, err);
                }
            }
        });

        newSocket.on('ice-candidate', async ({ from: remoteSocketId, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
            const pc = peersRef.current[remoteSocketId];
            if (pc && pc.remoteDescription && pc.remoteDescription.type) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    if (!ignoreOfferRef.current[remoteSocketId]) {
                        console.error(`[WebRTCContext] ICE Candidate error (${remoteSocketId}):`, err);
                    }
                }
            } else {
                if (!iceCandidateQueueRef.current[remoteSocketId]) iceCandidateQueueRef.current[remoteSocketId] = [];
                iceCandidateQueueRef.current[remoteSocketId].push(candidate);
            }
        });

        newSocket.on('participant-left', ({ socketId: remoteSocketId }: { socketId: string }) => {
            console.log('[WebRTCContext] Participant left:', remoteSocketId);
            const pc = peersRef.current[remoteSocketId];
            if (pc) {
                pc.close();
                delete peersRef.current[remoteSocketId];
                delete makingOfferRef.current[remoteSocketId];
                delete ignoreOfferRef.current[remoteSocketId];
                delete iceCandidateQueueRef.current[remoteSocketId];
                setRemoteStreams(prev => {
                    const next = { ...prev };
                    delete next[remoteSocketId];
                    return next;
                });
            }
        });

    }, [user, token, addLocalTracksToPeer, getOrCreatePeerConnection]);


    const leaveSession = useCallback((sessionId: string) => {
        console.log('[WebRTCContext] Leaving session:', sessionId);
        socketRef.current?.emit('leave-session', { sessionId });
        socketRef.current?.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);

        // Comprehensive Mesh Cleanup
        Object.values(peersRef.current).forEach(pc => pc.close());
        peersRef.current = {};
        makingOfferRef.current = {};
        ignoreOfferRef.current = {};
        iceCandidateQueueRef.current = {};

        setRemoteStreams({});
    }, []);

    const startLocalStream = useCallback(async (video = true, audio = true) => {
        try {
            localStreamRef.current?.getTracks().forEach(t => t.stop());
            const stream = await navigator.mediaDevices.getUserMedia({ video, audio });
            localStreamRef.current = stream;
            setLocalStream(stream);
            return stream;
        } catch (err) {
            console.error('[WebRTCContext] Failed to get local stream:', err);
            return null;
        }
    }, []);

    const stopLocalStream = useCallback(() => {
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
        setLocalStream(null);
    }, []);

    const toggleAudio = useCallback((enabled: boolean) => {
        localStreamRef.current?.getAudioTracks().forEach(track => { track.enabled = enabled; });
    }, []);

    const toggleVideo = useCallback((enabled: boolean) => {
        localStreamRef.current?.getVideoTracks().forEach(track => { track.enabled = enabled; });
    }, []);

    const shareScreen = useCallback(async (ids: { sessionId?: string; roomId?: string }) => {
        const { sessionId, roomId } = ids;
        try {
            const rawScreenStream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: true });
            const screenTrack = rawScreenStream.getVideoTracks()[0];
            screenStreamRef.current = rawScreenStream;

            Object.values(peersRef.current).forEach(pc => {
                const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                if (sender) sender.replaceTrack(screenTrack).catch(console.error);
                else pc.addTrack(screenTrack, rawScreenStream);
            });

            const micTrack = localStreamRef.current?.getAudioTracks()[0];
            const composed = new MediaStream([screenTrack]);
            if (micTrack) composed.addTrack(micTrack);
            localStreamRef.current = composed;
            setLocalStream(composed);
            setIsScreenSharing(true);

            screenTrack.onended = () => stopScreenShare({ sessionId, roomId });
            socketRef.current?.emit('update-media-state', { sessionId, roomId, screenshareActive: true });
        } catch (err) { console.error(err); }
    }, []);

    const stopScreenShare = useCallback(async (ids: { sessionId?: string; roomId?: string }) => {
        const { sessionId, roomId } = ids;
        try {
            const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            const videoTrack = cameraStream.getVideoTracks()[0];

            Object.values(peersRef.current).forEach(pc => {
                const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                if (sender && videoTrack) sender.replaceTrack(videoTrack).catch(console.error);
            });

            screenStreamRef.current?.getTracks().forEach(t => t.stop());
            localStreamRef.current?.getTracks().forEach(t => t.stop());
            setLocalStream(cameraStream);
            setIsScreenSharing(false);
            socketRef.current?.emit('update-media-state', { sessionId, roomId, screenshareActive: false });
        } catch (err) { console.error(err); }
    }, []);

    return (
        <WebRTCContext.Provider value={{
            socket, localStream, remoteStreams, screenStream: screenStreamRef.current,
            isConnected, isScreenSharing, startLocalStream, stopLocalStream,
            toggleAudio, toggleVideo, shareScreen, stopScreenShare, joinSession, leaveSession
        }}>
            {children}
        </WebRTCContext.Provider>
    );
};

export const useWebRTCContext = () => {
    const context = useContext(WebRTCContext);
    if (!context) throw new Error('useWebRTCContext must be used within a WebRTCProvider');
    return context;
};

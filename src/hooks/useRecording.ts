import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { BASE_URL } from '../services/api';

/* ─────────────────────────────────────────────
 * Types
 * ───────────────────────────────────────────── */
export interface RecordingStreams {
    localStream: MediaStream | null;
    remoteStreams: { [userId: string]: MediaStream };
    screenStream?: MediaStream | null; // optional active screen-share stream
}

interface UseRecordingReturn {
    isRecording: boolean;
    uploadProgress: number; // 0-100
    startRecording: (streams: RecordingStreams) => Promise<void>;
    stopRecording: () => void;
    recordingUrl: string | null;
}

/* ─────────────────────────────────────────────
 * Constants
 * ───────────────────────────────────────────── */
const CHUNK_INTERVAL_MS = 5000;         // Send a chunk every 5 seconds
const GRID_COLS_MAX = 3;             // Max columns in the video grid
const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const WATERMARK = 'EventLive • Live Recording';

/* ─────────────────────────────────────────────
 * Helpers
 * ───────────────────────────────────────────── */
function getBestMimeType(): string {
    const candidates = [
        'video/webm; codecs=vp9,opus',
        'video/webm; codecs=vp8,opus',
        'video/webm',
        'video/mp4',
    ];
    return candidates.find(m => MediaRecorder.isTypeSupported(m)) || '';
}

function getToken(): string {
    return (
        localStorage.getItem('token') ||
        (() => {
            try {
                return JSON.parse(localStorage.getItem('user') || '{}')?.token || '';
            } catch {
                return '';
            }
        })()
    );
}

/* ─────────────────────────────────────────────
 * Hook
 * ───────────────────────────────────────────── */
export const useRecording = (sessionId?: string): UseRecordingReturn => {
    const [isRecording, setIsRecording] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [recordingUrl, setRecordingUrl] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animFrameRef = useRef<number | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const composedStreamRef = useRef<MediaStream | null>(null);
    const uploadIdRef = useRef<string | null>(null);
    const chunkIndexRef = useRef(0);
    const totalSentRef = useRef(0);
    const totalExpectedRef = useRef(0); // rough estimate
    // Keep live references to video elements so the draw loop can access them
    const videoElemsRef = useRef<{ video: HTMLVideoElement; label: string }[]>([]);

    /* Cleanup on unmount */
    useEffect(() => {
        return () => {
            cleanupResources();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const cleanupResources = () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        audioCtxRef.current?.close();
        composedStreamRef.current?.getTracks().forEach(t => t.stop());
        videoElemsRef.current.forEach(({ video }) => {
            video.pause();
            video.srcObject = null;
        });
        videoElemsRef.current = [];
    };

    /* ── Draw Loop ──────────────────────────────── */
    const createDrawLoop = useCallback(
        (canvas: HTMLCanvasElement) => {
            const ctx = canvas.getContext('2d')!;

            const draw = () => {
                ctx.fillStyle = '#0f0f0f';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                const elems = videoElemsRef.current;
                const count = elems.length;
                if (count === 0) {
                    // No streams yet — draw placeholder
                    ctx.fillStyle = '#1a1a2e';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                } else {
                    const cols = Math.min(count, GRID_COLS_MAX);
                    const rows = Math.ceil(count / cols);
                    const cellW = canvas.width / cols;
                    const cellH = canvas.height / rows;
                    const padding = 4;

                    elems.forEach(({ video, label }, i) => {
                        const col = i % cols;
                        const row = Math.floor(i / cols);
                        const x = col * cellW + padding;
                        const y = row * cellH + padding;
                        const w = cellW - padding * 2;
                        const h = cellH - padding * 2;

                        if (video.readyState >= 2 && video.videoWidth > 0) {
                            // Letter-box fit
                            const vRatio = video.videoWidth / video.videoHeight;
                            const cRatio = w / h;
                            let drawW = w, drawH = h, offX = x, offY = y;
                            if (vRatio > cRatio) {
                                drawH = w / vRatio;
                                offY = y + (h - drawH) / 2;
                            } else {
                                drawW = h * vRatio;
                                offX = x + (w - drawW) / 2;
                            }
                            ctx.drawImage(video, offX, offY, drawW, drawH);
                        } else {
                            // Placeholder tile
                            ctx.fillStyle = '#1e1e3f';
                            ctx.fillRect(x, y, w, h);
                            ctx.fillStyle = '#555';
                            ctx.font = '14px sans-serif';
                            ctx.textAlign = 'center';
                            ctx.fillText('No video', x + w / 2, y + h / 2);
                        }

                        // Participant label
                        ctx.fillStyle = 'rgba(0,0,0,0.55)';
                        ctx.fillRect(x + 4, y + h - 26, label.length * 7 + 8, 22);
                        ctx.fillStyle = '#fff';
                        ctx.font = 'bold 13px sans-serif';
                        ctx.textAlign = 'left';
                        ctx.fillText(label, x + 8, y + h - 10);
                    });
                }

                /* Watermark — bottom-right */
                ctx.font = 'bold 16px sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.35)';
                ctx.textAlign = 'right';
                ctx.fillText(WATERMARK, canvas.width - 16, canvas.height - 14);

                /* Timestamp — bottom-left */
                ctx.font = '13px monospace';
                ctx.fillStyle = 'rgba(255,255,255,0.25)';
                ctx.textAlign = 'left';
                ctx.fillText(new Date().toISOString().slice(0, 19).replace('T', ' ') + ' UTC', 12, canvas.height - 10);

                /* REC indicator */
                ctx.beginPath();
                ctx.arc(18, 18, 7, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(239,68,68,${0.6 + Math.sin(Date.now() / 500) * 0.4})`;
                ctx.fill();
                ctx.font = 'bold 13px sans-serif';
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'left';
                ctx.fillText('REC', 30, 23);

                animFrameRef.current = requestAnimationFrame(draw);
            };

            draw();
        },
        []
    );

    /* ── Chunk Upload ──────────────────────────── */
    const uploadChunk = useCallback(
        async (chunk: Blob) => {
            if (!sessionId || !uploadIdRef.current) return;

            const idx = chunkIndexRef.current++;
            const fd = new FormData();
            fd.append('chunk', chunk, `chunk-${idx}.webm`);
            fd.append('chunkIndex', String(idx));
            fd.append('uploadId', uploadIdRef.current);

            const token = getToken();

            try {
                await fetch(`${BASE_URL}/sessions/${sessionId}/recording/chunk`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: fd,
                });
                totalSentRef.current += chunk.size;
                if (totalExpectedRef.current > 0) {
                    const pct = Math.min(
                        95,
                        Math.round((totalSentRef.current / totalExpectedRef.current) * 100)
                    );
                    setUploadProgress(pct);
                }
            } catch (e) {
                console.warn('[Recording] chunk upload failed, will retry on finalize', e);
            }
        },
        [sessionId]
    );

    /* ── Finalize Upload ───────────────────────── */
    const finalizeUpload = useCallback(
        async (totalChunks: number) => {
            if (!sessionId || !uploadIdRef.current) return;
            const token = getToken();
            const toastId = 'rec-upload';

            toast.loading('Finalizing & storing recording to cloud…', { id: toastId });

            try {
                const res = await fetch(
                    `${BASE_URL}/sessions/${sessionId}/recording/finalize`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            uploadId: uploadIdRef.current,
                            totalChunks,
                        }),
                    }
                );

                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const { data } = await res.json();
                setRecordingUrl(data?.url || null);
                setUploadProgress(100);
                toast.success('Recording saved to cloud! ✅', { id: toastId });
            } catch (err) {
                console.error('[Recording] finalize failed:', err);
                toast.error('Cloud upload failed. Trying local download…', { id: toastId });
                // Will be handled by onstop blob fallback
            }
        },
        [sessionId]
    );

    /* ── Start Recording ───────────────────────── */
    const startRecording = useCallback(
        async ({ localStream, remoteStreams, screenStream }: RecordingStreams) => {
            if (isRecording) {
                toast.warning('Recording already in progress');
                return;
            }

            try {
                /* 1 ─ Initialise upload session first */
                if (!sessionId) {
                    toast.error('Cannot record: session ID not available');
                    return;
                }

                const token = getToken();
                const initRes = await fetch(
                    `${BASE_URL}/sessions/${sessionId}/recording/init`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                if (!initRes.ok) throw new Error('Failed to initialise recording upload');
                const { data: initData } = await initRes.json();
                uploadIdRef.current = initData.uploadId;
                chunkIndexRef.current = 0;
                totalSentRef.current = 0;
                setUploadProgress(0);

                /* 2 ─ Build video element list */
                const elems: { video: HTMLVideoElement; label: string }[] = [];

                // Possibly active screen-share goes first (as the "main" tile)
                const activeScreen = screenStream && screenStream.getVideoTracks().length > 0
                    ? screenStream
                    : null;

                if (activeScreen) {
                    const v = document.createElement('video');
                    v.srcObject = activeScreen;
                    v.muted = true;
                    v.autoplay = true;
                    await v.play().catch(() => { });
                    elems.push({ video: v, label: '🖥 Screen Share' });
                }

                // Local camera (may be the screen-share view if user is sharing — show both)
                if (localStream && localStream.getVideoTracks().length > 0) {
                    const v = document.createElement('video');
                    v.srcObject = localStream;
                    v.muted = true;
                    v.autoplay = true;
                    await v.play().catch(() => { });
                    elems.push({ video: v, label: '📷 You (Host)' });
                }

                // Remote participants
                Object.entries(remoteStreams).forEach(([uid, stream], i) => {
                    if (!stream || stream.getVideoTracks().length === 0) return;
                    const v = document.createElement('video');
                    v.srcObject = stream;
                    v.muted = true;
                    v.autoplay = true;
                    v.play().catch(() => { });
                    elems.push({ video: v, label: `👤 Participant ${i + 1}` });
                });

                videoElemsRef.current = elems;

                /* 3 ─ Canvas (composite video grid) */
                const canvas = document.createElement('canvas');
                canvas.width = CANVAS_WIDTH;
                canvas.height = CANVAS_HEIGHT;
                canvasRef.current = canvas;
                createDrawLoop(canvas);

                /* 4 ─ Audio mixing via AudioContext */
                const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                const audioCtx = new AudioCtx();
                audioCtxRef.current = audioCtx;
                const dest = audioCtx.createMediaStreamDestination();

                const connectAudio = (stream: MediaStream | null | undefined, gain = 1) => {
                    if (!stream || stream.getAudioTracks().length === 0) return;
                    const src = audioCtx.createMediaStreamSource(stream);
                    const gainNode = audioCtx.createGain();
                    gainNode.gain.value = gain;
                    src.connect(gainNode).connect(dest);
                };

                // Local mic (slightly boosted for clarity)
                connectAudio(localStream, 1.0);
                // Screen-share system audio (if captured)
                connectAudio(activeScreen, 0.85);
                // ALL remote participants
                Object.values(remoteStreams).forEach(s => connectAudio(s, 0.9));

                /* 5 ─ Compose final stream */
                const canvasStream = canvas.captureStream(30);
                const finalTracks = [
                    ...canvasStream.getVideoTracks(),
                    ...dest.stream.getAudioTracks(),
                ];
                const finalStream = new MediaStream(finalTracks);
                composedStreamRef.current = finalStream;

                // Rough size estimate: 1.5 Mbps video + 128 kbps audio per minute
                // For progress estimation only
                totalExpectedRef.current = 0;

                /* 6 ─ MediaRecorder */
                const mimeType = getBestMimeType();
                const recorder = new MediaRecorder(finalStream, {
                    mimeType,
                    videoBitsPerSecond: 2_500_000, // 2.5 Mbps
                    audioBitsPerSecond: 128_000,
                });
                mediaRecorderRef.current = recorder;

                // Accumulate chunks locally too (for fallback download)
                const allChunks: Blob[] = [];

                recorder.ondataavailable = (e) => {
                    if (!e.data || e.data.size === 0) return;
                    allChunks.push(e.data);
                    totalExpectedRef.current += e.data.size;
                    uploadChunk(e.data); // non-blocking streamed upload
                };

                recorder.onstop = async () => {
                    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
                    cleanupResources();

                    const blob = new Blob(allChunks, { type: 'video/webm' });
                    const totalChunks = chunkIndexRef.current;

                    // Try finalizing the streamed upload
                    await finalizeUpload(totalChunks);

                    // Local download fallback (always provide it as a safety net)
                    const blobUrl = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = blobUrl;
                    a.download = `eventlive-recording-${sessionId}-${Date.now()}.webm`;
                    a.style.display = 'none';
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => {
                        document.body.removeChild(a);
                        URL.revokeObjectURL(blobUrl);
                    }, 2000);

                    setIsRecording(false);
                };

                /* Handle user stopping screen-share from browser stop button */
                if (activeScreen) {
                    activeScreen.getVideoTracks()[0].onended = () => stopRecording();
                }

                recorder.start(CHUNK_INTERVAL_MS);
                setIsRecording(true);
                toast.success('🔴 Recording started — capturing all participants', {
                    description: 'Audio, video & screen share are all being captured.'
                });

            } catch (err: any) {
                console.error('[Recording] startRecording failed:', err);
                if (err?.name === 'NotAllowedError') {
                    toast.error('Screen capture permission denied', {
                        description: 'Grant screen capture access to enable recording.'
                    });
                } else {
                    toast.error(`Recording failed to start: ${err?.message || 'Unknown error'}`);
                }
                setIsRecording(false);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [isRecording, sessionId, uploadChunk, finalizeUpload, createDrawLoop]
    );

    /* ── Stop Recording ────────────────────────── */
    const stopRecording = useCallback(() => {
        const recorder = mediaRecorderRef.current;
        if (!recorder || recorder.state === 'inactive') return;

        toast.info('Stopping recording, please wait…', { duration: 3000 });
        recorder.stop();
    }, []);

    return { isRecording, uploadProgress, startRecording, stopRecording, recordingUrl };
};

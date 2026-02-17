import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { uploadRecording as apiUploadRecording } from '../services/api';

interface UseRecordingReturn {
    isRecording: boolean;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    recordingBlob: Blob | null;
}

export const useRecording = (sessionId?: string): UseRecordingReturn => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null); // To store the mixed stream

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        };
    }, []);

    const startRecording = useCallback(async () => {
        try {
            // 1. Get Screen Stream (Video + System Audio)
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: 30 }
                },
                audio: true // Important: System Audio
            });

            // 2. Get Mic Stream
            const micStream = await navigator.mediaDevices.getUserMedia({
                audio: true
            });

            // 3. Set up Audio Mixing
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioContextClass();
            audioContextRef.current = audioCtx;

            const dest = audioCtx.createMediaStreamDestination();

            // Add Screen Audio to Mix
            if (screenStream.getAudioTracks().length > 0) {
                const screenSource = audioCtx.createMediaStreamSource(screenStream);
                screenSource.connect(dest);
            } else {
                toast.warning("System audio not captured. Share tab/window audio if needed.");
            }

            // Add Mic Audio to Mix
            if (micStream.getAudioTracks().length > 0) {
                const micSource = audioCtx.createMediaStreamSource(micStream);
                micSource.connect(dest);
            }

            const mixedAudioStream = dest.stream;

            // 4. Set up Canvas for Watermarking
            const canvas = document.createElement('canvas');
            canvas.width = 1920;
            canvas.height = 1080;
            canvasRef.current = canvas;
            const ctx = canvas.getContext('2d');

            const videoElement = document.createElement('video');
            videoElement.srcObject = screenStream;
            videoElement.muted = true; // Avoid feedback
            videoElement.play();

            // Wait for video to load
            await new Promise<void>((resolve) => {
                videoElement.onloadedmetadata = () => {
                    canvas.width = videoElement.videoWidth;
                    canvas.height = videoElement.videoHeight;
                    resolve();
                };
            });

            // Drawing Loop
            const draw = () => {
                if (!ctx || !canvas) return;

                // Draw Video
                ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

                // Draw Watermark
                ctx.font = 'bold 30px sans-serif';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.textAlign = 'right';
                ctx.fillText('EventLive Recording', canvas.width - 40, canvas.height - 40);

                // Time Watermark
                const time = new Date().toLocaleTimeString();
                ctx.font = '20px sans-serif';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillText(time, canvas.width - 40, canvas.height - 15);

                animationFrameRef.current = requestAnimationFrame(draw);
            };

            draw();

            // 5. Combine Canvas Video + Mixed Audio
            const canvasStream = canvas.captureStream(30);
            const combinedTracks = [
                ...canvasStream.getVideoTracks(),
                ...mixedAudioStream.getAudioTracks()
            ];

            const finalStream = new MediaStream(combinedTracks);
            streamRef.current = finalStream;

            // 6. Start Recording
            const mediaRecorder = new MediaRecorder(finalStream, {
                mimeType: 'video/webm; codecs=vp9'
            });
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                setRecordingBlob(blob);

                // Stop all source streams
                screenStream.getTracks().forEach(t => t.stop());
                micStream.getTracks().forEach(t => t.stop());
                finalStream.getTracks().forEach(t => t.stop());
                if (audioContextRef.current) audioContextRef.current.close();

                setIsRecording(false);
                toast.success("Recording ready! Uploading...");

                // Auto-upload logic would go here
                if (sessionId) {
                    await uploadRecording(sessionId, blob);
                } else {
                    // Fallback local download for safety
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    document.body.appendChild(a);
                    a.style.display = 'none';
                    a.href = url;
                    a.download = `recording-${new Date().toISOString()}.webm`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                    toast.info("Recording downloaded locally as fallback.");
                }
            };

            // Handle Stop from Browser UI (Screen Share Stop)
            screenStream.getVideoTracks()[0].onended = () => {
                stopRecording();
            };

            mediaRecorder.start(1000); // Collect chunks every second
            setIsRecording(true);
            toast.info("Recording started with watermark");

        } catch (err) {
            console.error("Failed to start recording:", err);
            toast.error("Could not start recording. Check permissions.");
        }
    }, [sessionId]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    }, []);

    const uploadRecording = async (sid: string, blob: Blob) => {
        try {
            toast.loading("Uploading recording to cloud...", { id: "upload-toast" });
            await apiUploadRecording(sid, blob);
            toast.success("Recording uploaded successfully to cloud!", { id: "upload-toast" });
        } catch (e) {
            console.error("Upload failed", e);
            toast.error("Cloud upload failed. Downloading locally.", { id: "upload-toast" });

            // Fallback download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `backup-recording-${sid}.webm`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        }
    };

    return {
        isRecording,
        startRecording,
        stopRecording,
        recordingBlob
    };
};

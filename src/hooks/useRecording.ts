import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface UseRecordingReturn {
    isRecording: boolean;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    recordingBlob: Blob | null;
}

export const useRecording = (): UseRecordingReturn => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { mediaSource: 'screen' } as any,
                audio: true // Capture system audio
            });

            // Check if we got audio track (user might not share audio)
            if (stream.getAudioTracks().length === 0) {
                toast.warning("System audio not captured. You won't hear participants in the recording.");
            }

            // Try to get local mic audio to mix in? 
            // For MVP, we'll just record what getDisplayMedia gives us (System Audio + Screen).
            // Note: This won't capture the local user's mic unless we mix it. 
            // Adding local mic mixing adds complexity (AudioContext), skipping for now.

            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                setRecordingBlob(blob);

                // Auto-download
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                document.body.appendChild(a);
                a.style.display = 'none';
                a.href = url;
                a.download = `session-recording-${new Date().toISOString()}.webm`;
                a.click();
                window.URL.revokeObjectURL(url);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
                setIsRecording(false);
                toast.success("Recording saved!");
            };

            // Handle user stopping via browser UI
            stream.getVideoTracks()[0].onended = () => {
                if (mediaRecorder.state !== 'inactive') {
                    mediaRecorder.stop();
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
            toast.info("Recording started... Stop sharing to save.");

        } catch (err) {
            console.error("Error starting recording:", err);
            toast.error("Failed to start recording.");
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    }, []);

    return {
        isRecording,
        startRecording,
        stopRecording,
        recordingBlob
    };
};

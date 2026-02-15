import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface FileMeta {
    id: string;
    name: string;
    size: number;
    type: string;
    senderId: string;
}

interface IncomingFile {
    meta: FileMeta;
    chunks: string[]; // Base64 chunks
    receivedSize: number;
}

export const useFileTransfer = (sendData: (data: any) => void) => {
    const [incomingFiles, setIncomingFiles] = useState<{ [id: string]: IncomingFile }>({});
    const [downloadedFiles, setDownloadedFiles] = useState<FileMeta[]>([]);

    const CHUNK_SIZE = 16384; // 16KB

    const sendFile = useCallback(async (file: File) => {
        const fileId = crypto.randomUUID();
        const reader = new FileReader();

        toast.info(`Starting transfer: ${file.name}`);

        // Send Metadata
        sendData(JSON.stringify({
            type: 'file-start',
            payload: {
                id: fileId,
                name: file.name,
                size: file.size,
                type: file.type
            }
        }));

        reader.onload = async (e) => {
            const buffer = e.target?.result as ArrayBuffer;
            const uint8Array = new Uint8Array(buffer);
            const totalChunks = Math.ceil(uint8Array.length / CHUNK_SIZE);

            for (let i = 0; i < totalChunks; i++) {
                const start = i * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, uint8Array.length);
                const chunk = uint8Array.slice(start, end);

                // Convert chunk to base64 to send via JSON (simplifies signaling types)
                // In prod, binary streams are better
                const base64Chunk = btoa(String.fromCharCode(...chunk));

                sendData(JSON.stringify({
                    type: 'file-chunk',
                    payload: {
                        fileId,
                        chunk: base64Chunk,
                        index: i,
                        total: totalChunks
                    }
                }));

                // Small delay to prevent buffer overflow if many peers
                if (i % 10 === 0) await new Promise(r => setTimeout(r, 10));
            }

            sendData(JSON.stringify({
                type: 'file-end',
                payload: { fileId }
            }));

            toast.success(`Sent: ${file.name}`);
        };

        reader.readAsArrayBuffer(file);
    }, [sendData]);

    const handleDataMessage = useCallback((data: any, fromUserId: string) => {
        try {
            if (typeof data !== 'string') return;
            const message = JSON.parse(data);

            if (message.type === 'file-start') {
                const meta = { ...message.payload, senderId: fromUserId };
                setIncomingFiles(prev => ({
                    ...prev,
                    [meta.id]: { meta, chunks: [], receivedSize: 0 }
                }));
                toast.info(`Receiving ${meta.name}...`);
            }
            else if (message.type === 'file-chunk') {
                const { fileId, chunk } = message.payload;

                setIncomingFiles(prev => {
                    const current = prev[fileId];
                    if (!current) return prev;

                    const newChunks = [...current.chunks];
                    newChunks[message.payload.index] = chunk; // Ensure order

                    return {
                        ...prev,
                        [fileId]: {
                            ...current,
                            chunks: newChunks,
                            receivedSize: current.receivedSize + 1 // Simply counting chunks roughly
                        }
                    };
                });
            }
            else if (message.type === 'file-end') {
                const { fileId } = message.payload;
                setIncomingFiles(prev => {
                    const fileData = prev[fileId];
                    if (!fileData) return prev;

                    // Reassemble
                    // Reassemble
                    // Decode B64 chunks and concatenate 
                    // NO, we encoded sliced Uint8Array to b64. So each chunk is a valid b64 string.
                    // decoding each chunk back to Uint8Array and concatenating is correct.

                    const blobs = fileData.chunks.map(b64 => {
                        const byteCharacters = atob(b64);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) {
                            byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        return new Uint8Array(byteNumbers);
                    });

                    const blob = new Blob(blobs, { type: fileData.meta.type });
                    const url = URL.createObjectURL(blob);

                    // Auto download or prompt?
                    // Let's create a download link programmatically
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileData.meta.name;
                    a.click();
                    URL.revokeObjectURL(url);

                    toast.success(`Received & Downloaded: ${fileData.meta.name}`);

                    setDownloadedFiles(prev => [...prev, fileData.meta]);

                    const { [fileId]: removed, ...rest } = prev;
                    return rest;
                });
            }

        } catch (err) {
            console.error("Error parsing data message:", err);
        }
    }, []);

    return {
        sendFile,
        handleDataMessage,
        incomingFiles,
        downloadedFiles
    };
};

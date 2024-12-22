declare module 'react-native-webrtc' {
    import { ViewProps } from 'react-native';

    export interface MediaStream {
        toURL(): string;
        getTracks(): MediaStreamTrack[];
        release(): void;
    }

    export interface MediaStreamTrack {
        stop(): void;
    }

    export interface RTCPeerConnectionConfig {
        iceServers: Array<{
            urls: string | string[];
            username?: string;
            credential?: string;
        }>;
    }

    export class RTCPeerConnection {
        constructor(configuration: RTCPeerConnectionConfig);
        addTrack(track: MediaStreamTrack, stream: MediaStream): void;
        close(): void;
        createOffer(options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit>;
        createAnswer(options?: RTCAnswerOptions): Promise<RTCSessionDescriptionInit>;
        setLocalDescription(description: RTCSessionDescriptionInit): Promise<void>;
        setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void>;
        addIceCandidate(candidate: RTCIceCandidateInit): Promise<void>;
        onicecandidate: ((event: { candidate: RTCIceCandidate | null }) => void) | null;
        ontrack: ((event: { streams: MediaStream[] }) => void) | null;
    }

    export interface RTCViewProps extends ViewProps {
        streamURL: string;
        mirror?: boolean;
        zOrder?: number;
        objectFit?: 'contain' | 'cover';
    }

    export class RTCView extends React.Component<RTCViewProps> { }

    export const mediaDevices: {
        getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream>;
        getDisplayMedia(constraints?: DisplayMediaStreamConstraints): Promise<MediaStream>;
    };
}


import { Socket as SocketIOClient } from 'socket.io-client';

export interface ServerToClientEvents {
    'connection-request': (requestingCode: string) => void;
    'connection-accepted': () => void;
    'connection-rejected': () => void;
    'offer': (offer: RTCSessionDescriptionInit) => void;
    'answer': (answer: RTCSessionDescriptionInit) => void;
    'candidate': (candidate: RTCIceCandidateInit) => void;
    'disconnect-request': () => void;
}

export interface ClientToServerEvents {
    'register': (code: string) => void;
    'request-connection': (data: { targetCode: string; myCode: string }) => void;
    'accept-connection': (requesterCode: string) => void;
    'reject-connection': (requesterCode: string) => void;
    'offer': (data: { offer: RTCSessionDescriptionInit; targetCode: string }) => void;
    'answer': (data: { answer: RTCSessionDescriptionInit; targetCode: string }) => void;
    'candidate': (data: { candidate: RTCIceCandidateInit; targetCode: string }) => void;
    'disconnect-peer': (targetCode: string) => void;
}

export type Socket = SocketIOClient<ServerToClientEvents, ClientToServerEvents>;

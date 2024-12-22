import { RTCPeerConnection, mediaDevices } from 'react-native-webrtc';
import io from 'socket.io-client';
import { requestPermissions } from './permissions';
import { Alert } from 'react-native';

const SERVER_URL = 'http://192.168.100.6:3000';

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }, // Tambahan STUN server
  ]
};

let socket = null;
let peerConnection = null;
let localStream = null;
let remoteStream = null;
let isInitiator = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

// State management callbacks
let onConnectionStateChange = null;
let onStreamUpdate = null;

export const initializeWebRTC = async (
  myCode,
  onStateChange = () => {},
  onStream = () => {}
) => {
  try {
    onConnectionStateChange = onStateChange;
    onStreamUpdate = onStream;

    // Bersihkan koneksi yang ada sebelumnya
    await cleanupConnection();

    // Inisialisasi socket
    socket = io(SERVER_URL, {
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      transports: ['websocket'], // Gunakan WebSocket
    });

    // Inisialisasi peer connection di awal
    peerConnection = await createPeerConnection();
    
    setupSocketListeners();
    registerWithServer(myCode);

    // Mulai stream lokal
    await startScreenShare();

    return {
      socket,
      peerConnection
    };
  } catch (error) {
    console.error('Error initializing WebRTC:', error);
    handleError(error);
    throw error;
  }
};

const setupSocketListeners = () => {
  socket.on('offer', async (offer) => {
    if (peerConnection) {
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit('answer', answer);
    }
  });

  socket.on('answer', async (answer) => {
    if (peerConnection) {
      await peerConnection.setRemoteDescription(answer);
    }
  });

  socket.on('ice-candidate', async (candidate) => {
    if (peerConnection) {
      await peerConnection.addIceCandidate(candidate);
    }
  });

  socket.on('connect', () => {
    console.log('Connected to signaling server');
    reconnectAttempts = 0;
  });

  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    reconnectAttempts++;
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      Alert.alert(
        'Connection Error',
        'Unable to connect to server. Please check your internet connection.'
      );
    }
  });

  socket.on('connection-request', async (requestingCode) => {
    if (onConnectionStateChange) {
      onConnectionStateChange({
        type: 'REQUEST_RECEIVED',
        payload: { requestingCode }
      });
    }
  });

  socket.on('connection-accepted', async () => {
    try {
      isInitiator = true;
      await createPeerConnection();
      const offer = await createOffer();
      socket.emit('offer', { offer, targetCode: peerConnection.targetCode });
    } catch (error) {
      console.error('Error after connection accepted:', error);
      handleError(error);
    }
  });

  socket.on('connection-rejected', () => {
    cleanupConnection();
    if (onConnectionStateChange) {
      onConnectionStateChange({
        type: 'CONNECTION_REJECTED'
      });
    }
  });

  socket.on('offer', async (offer) => {
    try {
      if (!peerConnection) {
        await createPeerConnection();
      }
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await createAnswer();
      socket.emit('answer', { answer, targetCode: peerConnection.targetCode });
    } catch (error) {
      console.error('Error handling offer:', error);
      handleError(error);
    }
  });

  socket.on('answer', async (answer) => {
    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
      handleError(error);
    }
  });

  socket.on('candidate', async (candidate) => {
    try {
      if (peerConnection && candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  });

  socket.on('disconnect-request', () => {
    handleDisconnect();
  });

  socket.on('disconnect', () => {
    cleanupConnection();
  });
};

const createPeerConnection = async () => {
  try {
    const pc = new RTCPeerConnection(configuration);

    pc.oniceconnectionstatechange = () => {
      console.log('ICE Connection State:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'disconnected' || 
          pc.iceConnectionState === 'failed' || 
          pc.iceConnectionState === 'closed') {
        handleDisconnect();
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection State:', pc.connectionState);
      if (onConnectionStateChange) {
        onConnectionStateChange({
          type: 'CONNECTION_STATE_CHANGED',
          payload: { state: pc.connectionState }
        });
      }
    };

    pc.onicecandidate = ({ candidate }) => {
      if (candidate && socket && pc.targetCode) {
        socket.emit('candidate', {
          candidate,
          targetCode: pc.targetCode
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        remoteStream = event.streams[0];
        if (onStreamUpdate) {
          onStreamUpdate({
            type: 'REMOTE_STREAM_UPDATED',
            payload: { stream: remoteStream }
          });
        }
      }
    };

    return pc;
  } catch (error) {
    console.error('Error creating peer connection:', error);
    throw error;
  }
};

const createOffer = async () => {
  try {
    const offer = await peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });
    await peerConnection.setLocalDescription(offer);
    return offer;
  } catch (error) {
    console.error('Error creating offer:', error);
    throw error;
  }
};

const createAnswer = async () => {
  try {
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    return answer;
  } catch (error) {
    console.error('Error creating answer:', error);
    throw error;
  }
};

export const startScreenShare = async () => {
  try {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
      throw new Error('Permissions not granted');
    }

    localStream = await mediaDevices.getDisplayMedia({
      video: {
        mandatory: {
          minWidth: 1280,
          minHeight: 720,
          minFrameRate: 30,
        }
      }
    });

    if (peerConnection) {
      localStream.getTracks().forEach(track => 
        peerConnection.addTrack(track, localStream)
      );
    }

    if (onStreamUpdate) {
      onStreamUpdate({
        type: 'LOCAL_STREAM_UPDATED',
        payload: { stream: localStream }
      });
    }

    return localStream;
  } catch (error) {
    console.error('Error starting screen share:', error);
    handleError(error);
    throw error;
  }
};

export const toggleCamera = async (useFrontCamera = true) => {
  try {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    localStream = await mediaDevices.getUserMedia({
      audio: true,
      video: {
        facingMode: useFrontCamera ? 'user' : 'environment',
        mandatory: {
          minWidth: 1280,
          minHeight: 720,
          minFrameRate: 30
        }
      }
    });

    if (peerConnection) {
      const senders = peerConnection.getSenders();
      const videoTrack = localStream.getVideoTracks()[0];
      const videoSender = senders.find(sender => sender.track?.kind === 'video');
      
      if (videoSender) {
        videoSender.replaceTrack(videoTrack);
      } else {
        peerConnection.addTrack(videoTrack, localStream);
      }
    }

    if (onStreamUpdate) {
      onStreamUpdate({
        type: 'LOCAL_STREAM_UPDATED',
        payload: { stream: localStream }
      });
    }

    return localStream;
  } catch (error) {
    console.error('Error toggling camera:', error);
    handleError(error);
    throw error;
  }
};

export const connectToPeer = async (targetCode) => {
  try {
    if (!socket) {
      throw new Error('WebRTC not initialized');
    }

    // Pastikan peerConnection ada dan dalam keadaan stabil
    if (!peerConnection || peerConnection.connectionState === 'closed') {
      peerConnection = await createPeerConnection();
    }

    peerConnection.targetCode = targetCode;

    socket.emit('request-connection', {
      targetCode,
      myCode: socket.id
    });
  } catch (error) {
    console.error('Error connecting to peer:', error);
    handleError(error);
  }
};

export const acceptConnection = async (requestingCode) => {
  try {
    if (!peerConnection || peerConnection.connectionState === 'closed') {
      peerConnection = await createPeerConnection();
    }

    peerConnection.targetCode = requestingCode;
    
    // Pastikan ada localStream
    if (!localStream) {
      await startScreenShare();
    }

    socket.emit('accept-connection', requestingCode);
  } catch (error) {
    console.error('Error accepting connection:', error);
    handleError(error);
  }
};


export const rejectConnection = (requestingCode) => {
  socket.emit('reject-connection', requestingCode);
};

const handleDisconnect = async () => {
  try {
    await cleanupConnection();
    if (onConnectionStateChange) {
      onConnectionStateChange({
        type: 'DISCONNECTED'
      });
    }
  } catch (error) {
    console.error('Error handling disconnect:', error);
  }
};

const cleanupConnection = async () => {
  try {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      localStream = null;
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      remoteStream = null;
    }

    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }

    isInitiator = false;
  } catch (error) {
    console.error('Error cleaning up connection:', error);
  }
};

const handleError = (error) => {
  console.error('WebRTC Error:', error);
  Alert.alert(
    'Connection Error',
    'An error occurred during the connection. Please try again.'
  );
  cleanupConnection();
};

const registerWithServer = (code) => {
  if (socket) {
    socket.emit('register', code);
  }
};

export const getConnectionState = () => ({
  isInitiator,
  hasLocalStream: !!localStream,
  hasRemoteStream: !!remoteStream,
  connectionState: peerConnection?.connectionState,
  iceConnectionState: peerConnection?.iceConnectionState
});

export const getCurrentStreams = () => ({
  localStream,
  remoteStream
});
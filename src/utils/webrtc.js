import { RTCPeerConnection, mediaDevices } from 'react-native-webrtc';
import io from 'socket.io-client';
import { requestPermissions } from './permissions';
import { Alert } from 'react-native';

const SERVER_URL = 'http://192.168.100.6:3000';
let socket = null;
let peerConnection = null;
let localStream = null;
let remoteStream = null;

export const initializeWebRTC = async (myCode, callbacks) => {
  try {
    await cleanupConnection();

    socket = io(SERVER_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5
    });

    peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        {
          urls: 'turn:numb.viagenie.ca',
          username: 'webrtc@live.com',
          credential: 'muazkh'
        }
      ],
      iceCandidatePoolSize: 10
    });

    setupSocketListeners(callbacks);
    socket.emit('register', myCode);
    setupPeerConnectionListeners(callbacks);

    return { socket, peerConnection };
  } catch (error) {
    console.error('Error initializing WebRTC:', error);
    Alert.alert('Error', 'Failed to initialize connection');
  }
};

const setupSocketListeners = (callbacks) => {
  socket.on('connection-request', (requestingCode) => {
    console.log('Received connection request from:', requestingCode);
    callbacks.onConnectionRequest?.(requestingCode);
  });

  socket.on('connection-accepted', async () => {
    console.log('Connection accepted');
    callbacks.onConnectionAccepted?.();
  });

  socket.on('connection-rejected', () => {
    console.log('Connection rejected');
    callbacks.onConnectionRejected?.();
    cleanupConnection();
  });

  socket.on('offer', async (offer) => {
    try {
      console.log('Received offer');
      if (!peerConnection) return;
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await createAndSetLocalAnswer();
      socket.emit('answer', { 
        answer,
        targetCode: peerConnection.targetCode 
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  });

  socket.on('answer', async (answer) => {
    try {
      console.log('Received answer');
      if (!peerConnection) return;
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  });

  socket.on('candidate', async (candidate) => {
    try {
      console.log('Received ICE candidate');
      if (peerConnection && candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  });

  socket.on('disconnect-request', () => {
    console.log('Received disconnect request');
    handleDisconnect(callbacks);
  });
};

const setupPeerConnectionListeners = (callbacks) => {
  if (!peerConnection) return;

  peerConnection.onicecandidate = ({ candidate }) => {
    if (candidate && socket && peerConnection.targetCode) {
      console.log('Sending ICE candidate');
      socket.emit('candidate', {
        candidate,
        targetCode: peerConnection.targetCode
      });
    }
  };

  peerConnection.ontrack = (event) => {
    console.log('Received remote track');
    if (event.streams && event.streams[0]) {
      remoteStream = event.streams[0];
      callbacks.onRemoteStream?.(remoteStream);
    }
  };

  peerConnection.oniceconnectionstatechange = () => {
    console.log('ICE Connection state:', peerConnection.iceConnectionState);
    
    // Handle various ICE connection states
    switch (peerConnection.iceConnectionState) {
      case 'connected':
        callbacks.onConnectionStateChange?.('connected');
        break;
      case 'disconnected':
        callbacks.onConnectionStateChange?.('disconnected');
        break;
      case 'failed':
        callbacks.onError?.('Connection failed');
        break;
      case 'closed':
        callbacks.onConnectionStateChange?.('closed');
        break;
    }
  };

  peerConnection.onconnectionstatechange = () => {
    console.log('Connection state:', peerConnection.connectionState);
    
    // Handle various connection states
    switch (peerConnection.connectionState) {
      case 'connected':
        callbacks.onConnectionStateChange?.('connected');
        break;
      case 'disconnected':
      case 'failed':
      case 'closed':
        handleDisconnect(callbacks);
        break;
    }
  };
};

export const startScreenShare = async () => {
  try {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
      throw new Error('Screen sharing permissions not granted');
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

    if (!localStream) {
      throw new Error('Failed to get display media');
    }

    if (peerConnection && localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });

      const offer = await createAndSetLocalOffer();
      socket.emit('offer', { 
        offer,
        targetCode: peerConnection.targetCode 
      });

      return localStream;
    }
    throw new Error('Invalid peer connection state');
  } catch (error) {
    console.error('Error starting screen share:', error);
    Alert.alert('Error', 'Failed to start screen sharing');
    throw error;
  }
};

const createAndSetLocalOffer = async () => {
  if (!peerConnection) throw new Error('No peer connection');
  const offer = await peerConnection.createOffer({
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
  });
  await peerConnection.setLocalDescription(offer);
  return offer;
};

const createAndSetLocalAnswer = async () => {
  if (!peerConnection) throw new Error('No peer connection');
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  return answer;
};

export const connectToPeer = (targetCode) => {
  if (!socket || !peerConnection) {
    Alert.alert('Error', 'Connection not initialized');
    return;
  }

  console.log('Connecting to peer:', targetCode);
  peerConnection.targetCode = targetCode;
  socket.emit('request-connection', {
    targetCode,
    myCode: socket.id
  });
};

export const acceptConnection = async (requestingCode) => {
  try {
    console.log('Accepting connection from:', requestingCode);
    if (!peerConnection) {
      throw new Error('No peer connection');
    }
    
    peerConnection.targetCode = requestingCode;
    socket.emit('accept-connection', requestingCode);
    
    // Wait a moment before starting screen share
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const stream = await startScreenShare();
    if (stream) {
      console.log('Screen sharing started successfully');
      return true;
    }
    throw new Error('Failed to start screen share');
  } catch (error) {
    console.error('Error accepting connection:', error);
    Alert.alert('Error', 'Failed to accept connection');
    throw error;
  }
};

export const rejectConnection = (requestingCode) => {
  console.log('Rejecting connection from:', requestingCode);
  socket.emit('reject-connection', requestingCode);
};

export const disconnect = () => {
  if (socket && peerConnection?.targetCode) {
    console.log('Disconnecting from peer');
    socket.emit('disconnect-peer', peerConnection.targetCode);
    handleDisconnect();
  }
};

const handleDisconnect = (callbacks) => {
  console.log('Handling disconnect in WebRTC');
  cleanupConnection();
  callbacks?.onDisconnected?.();
};

const cleanupConnection = () => {
  console.log('Cleaning up WebRTC connection');
  
  if (localStream) {
    localStream.getTracks().forEach(track => {
      track.stop();
      console.log('Stopped local track:', track.kind);
    });
    localStream = null;
  }

  if (remoteStream) {
    remoteStream.getTracks().forEach(track => {
      track.stop();
      console.log('Stopped remote track:', track.kind);
    });
    remoteStream = null;
  }

  if (peerConnection) {
    try {
      peerConnection.close();
    } catch (err) {
      console.error('Error closing peer connection:', err);
    }
    peerConnection = null;
  }
};
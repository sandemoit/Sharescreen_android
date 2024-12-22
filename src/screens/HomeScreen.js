import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ConnectForm from '../components/ConnectForm';
import ConnectionModal from '../components/ConnectionModal';
import RemoteDisplay from '../components/RemoteDisplay';
import { initializeWebRTC, setupSocketListeners } from '../utils/webrtc';

const HomeScreen = () => {
  const [myCode, setMyCode] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isViewer, setIsViewer] = useState(false);
  const [showConnectionRequest, setShowConnectionRequest] = useState(false);
  const [pendingConnectionCode, setPendingConnectionCode] = useState(null);

  useEffect(() => {
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    setMyCode(generatedCode);
    
    const { socket, peerConnection } = initializeWebRTC(generatedCode);
    
    if (typeof setupSocketListeners === 'function') {
      setupSocketListeners({
        socket,
        peerConnection,
        setShowConnectionRequest,
        setPendingConnectionCode,
        setIsConnected,
        setIsViewer
      });
    } else {
      console.warn('setupSocketListeners is undefined');
    }

    return () => {
      socket?.disconnect();
      peerConnection?.close();
    };
  }, []);

  return (
    <View style={styles.container}>
        <View style={styles.card}>
            <Text style={styles.TitleText}>Your code</Text>
            <Text style={styles.codeText}>{myCode}</Text>
        </View>
      
      {!isConnected && !isViewer && (
        <ConnectForm myCode={myCode} />
      )}
      
      {isConnected && <RemoteDisplay />}
      
      <ConnectionModal
        visible={showConnectionRequest}
        requestCode={pendingConnectionCode}
        onResponse={(accepted) => {
          if (accepted) {
            acceptConnection(pendingConnectionCode);
            setIsConnected(true);
          } else {
            rejectConnection(pendingConnectionCode);
          }
          setShowConnectionRequest(false);
          setPendingConnectionCode(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    justifyContent: 'center',
  },
  TitleText: {
    color: '#fff',
    fontSize: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#363636',
    paddingVertical: 25,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginHorizontal: 15,
    marginBottom: 20,
  },
  codeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 4,
  },
});

export default HomeScreen;
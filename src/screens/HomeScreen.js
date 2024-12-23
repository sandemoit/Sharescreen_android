import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import ConnectForm from '../components/ConnectForm';
import ConnectionModal from '../components/ConnectionModal';
import RemoteDisplay from '../components/RemoteDisplay';
import { initializeWebRTC, acceptConnection, rejectConnection, disconnect } from '../utils/webrtc';

const HomeScreen = () => {
  const [myCode, setMyCode] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showConnectionRequest, setShowConnectionRequest] = useState(false);
  const [pendingConnectionCode, setPendingConnectionCode] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [connectedToCode, setConnectedToCode] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    setMyCode(generatedCode);

    const callbacks = {
      onConnectionRequest: (requestingCode) => {
        setShowConnectionRequest(true);
        setPendingConnectionCode(requestingCode);
      },
      onConnectionAccepted: () => {
        setIsConnected(true);
        setConnectedToCode(pendingConnectionCode);
      },
      onRemoteStream: (stream) => {
        console.log('Received remote stream in HomeScreen:', stream);
        if (stream && stream.toURL) {
          setRemoteStream(stream);
          setIsSharing(true);
        } else {
          console.error('Invalid stream received:', stream);
        }
      },
      // onScreenShareStarted: () => {
      //   console.log('Screen sharing started');
      //   setIsSharing(true);
      // },
      onDisconnected: () => {
        handleDisconnect();
      },
      onConnectionRejected: () => {
        setError('Connection was rejected');
        handleDisconnect();
      },
      onError: (errorMessage) => {
        setError(errorMessage);
        handleDisconnect();
      }
    };

    initializeWebRTC(generatedCode, callbacks);
  }, []);

  const handleConnectionResponse = async (accepted) => {
    setShowConnectionRequest(false);
    if (accepted) {
      try {
        console.log('Accepting connection from:', pendingConnectionCode);
        await acceptConnection(pendingConnectionCode);
        setIsSharing(true);
        setConnectedToCode(pendingConnectionCode);
      } catch (err) {
        setError('Failed to accept connection');
        handleDisconnect();
      }
    } else {
      rejectConnection(pendingConnectionCode);
    }
    setPendingConnectionCode(null);
  };

  const handleDisconnect = () => {
    console.log('Handling disconnect');
    disconnect();
    setIsConnected(false);
    setRemoteStream(null);
    setIsSharing(false);
    setConnectedToCode(null);
    setPendingConnectionCode(null);
    setShowConnectionRequest(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.titleText}>Your Connection Code</Text>
          <Text style={styles.codeText}>{myCode}</Text>
          {isConnected && (
            <Text style={styles.connectedText}>
              {isSharing 
                ? `Connected - Sharing Screen to ${connectedToCode}`
                : `Connected - Viewing Screen from ${connectedToCode}`
              }
            </Text>
          )}
        </View>

        {!isConnected && !isSharing && (
          <ConnectForm myCode={myCode} />
        )}

        {isConnected && remoteStream && !isSharing && (
          <View style={styles.displayContainer}>
            <RemoteDisplay 
              stream={remoteStream} 
              onDisconnect={handleDisconnect}
              isConnected={isConnected} 
            />
          </View>
        )}

        {(isConnected || isSharing) && (
          <View style={styles.disconnectContainer}>
            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={handleDisconnect}
            >
              <Text style={styles.disconnectText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        )}

        <ConnectionModal
          visible={showConnectionRequest}
          requestCode={pendingConnectionCode}
          onResponse={handleConnectionResponse}
        />

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
  },
  card: {
    backgroundColor: '#363636',
    paddingVertical: 25,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginHorizontal: 15,
    marginBottom: 20,
  },
  titleText: {
    color: '#fff',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 10,
  },
  codeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 4,
  },
  connectedText: {
    color: '#4CAF50',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  disconnectContainer: {
    padding: 20,
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
  },
  disconnectButton: {
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 15,
  },
  disconnectText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    padding: 15,
    backgroundColor: '#f44336',
    borderRadius: 10,
    marginHorizontal: 15,
    marginTop: 20,
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
  },
  displayContainer: {
    flex: 1,
    backgroundColor: '#000',
    margin: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
});

export default HomeScreen;
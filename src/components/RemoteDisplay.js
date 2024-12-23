import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { RTCView } from 'react-native-webrtc';

const RemoteDisplay = ({ stream, onDisconnect, isConnected }) => {
  console.log('RemoteDisplay Props:', {
    hasStream: !!stream,
    isConnected,
    streamURL: stream?.toURL?.(),
  });

  if (!stream || !isConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>
            Waiting for screen share...
          </Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <RTCView
        streamURL={stream.toURL()}
        style={styles.remoteStream}
        objectFit="contain"
        zOrder={1}
        mirror={false}
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.disconnectButton} 
          onPress={onDisconnect}
        >
          <Text style={styles.buttonText}>Disconnect</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteStream: {
    flex: 1,
    backgroundColor: '#363636',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#363636',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    padding: 20,
  },
  disconnectButton: {
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RemoteDisplay;
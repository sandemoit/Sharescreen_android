import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { RTCView } from 'react-native-webrtc';

const RemoteDisplay = ({ stream, onDisconnect }) => {
  return (
    <View style={styles.container}>
      {stream && (
        <RTCView
          streamURL={stream.toURL()}
          style={styles.remoteStream}
          objectFit="contain"
        />
      )}
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
    marginHorizontal: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RemoteDisplay;
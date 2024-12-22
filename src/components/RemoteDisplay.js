import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { disconnect } from '../utils/webrtc';

const RemoteDisplay = ({ stream }) => {
  return (
    <View style={styles.container}>
      {stream && (
        <RTCView
          streamURL={stream.toURL()}
          style={styles.remoteStream}
        />
      )}
      <TouchableOpacity style={styles.button} onPress={disconnect}>
        <Text style={styles.buttonText}>Disconnect</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  remoteStream: {
    flex: 1,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default RemoteDisplay;
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { connectToPeer } from '../utils/webrtc';

const ConnectForm = ({ myCode }) => {
  const [connectCode, setConnectCode] = useState('');
  // const [targetCode, setTargetCode] = useState('');

  const handleConnect = () => {
      if (connectCode === myCode) return;
      connectToPeer(connectCode);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.codeText}>Enter code to connect</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter connect code"
          value={connectCode}
          onChangeText={setConnectCode}
          keyboardType="numeric"
          maxLength={6}
        />
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleConnect}
          disabled={connectCode.length !== 6}
        >
          <Text style={styles.buttonText}>Connect</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  codeText: {
    color: '#fff',
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  container: {
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#363636',
    paddingVertical: 35,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginHorizontal: 15,
  },
  input: {
    marginBottom: 10,
    backgroundColor: '#292929',
    color: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 25,
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#6366f1',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default ConnectForm;

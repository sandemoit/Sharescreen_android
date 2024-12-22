import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const ConnectionModal = ({ visible, requestCode, onResponse }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.text}>
            Connection request from: {requestCode}
          </Text>
          <View style={styles.buttons}>
            <TouchableOpacity 
              style={[styles.button, styles.acceptButton]}
              onPress={() => onResponse(true)}
            >
              <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.rejectButton]}
              onPress={() => onResponse(false)}
            >
              <Text style={styles.buttonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  text: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    margin: 5,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default ConnectionModal;
import React, { forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MapView = forwardRef((props, ref) => {
  useImperativeHandle(ref, () => ({
    animateToRegion: () => console.log("animateToRegion called on web"),
  }));

  return (
    <View style={[props.style, styles.container]}>
      <Text style={styles.text}>Map is optimized for Mobile (Android/iOS).</Text>
      <Text style={styles.subText}>Please run on a phone to see the map.</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subText: {
    color: '#666',
  },
});

export const Marker = () => null;
export const Callout = () => null;
export default MapView;

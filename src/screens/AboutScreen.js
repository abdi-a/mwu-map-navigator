import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AboutScreen({ navigation }) {
  const openLink = (url) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="map-marker-radius" size={60} color="#2196F3" />
        <Text style={styles.title}>MWU Map Navigator</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why this App?</Text>
        <Text style={styles.text}>
          Google Maps is for the world. This app is for <Text style={styles.highlight}>Madda Walabu University</Text>.
        </Text>
        <View style={styles.bulletPoint}>
          <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
          <Text style={styles.bulletText}>Curated locations for students (Dorms, Cafes, Admin).</Text>
        </View>
        <View style={styles.bulletPoint}>
          <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
          <Text style={styles.bulletText}>Specific filters: Find "Libraries" or "Dorms" instantly.</Text>
        </View>
        <View style={styles.bulletPoint}>
          <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
          <Text style={styles.bulletText}>Campus-focused search: No distractions.</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Developer</Text>
        <View style={styles.developerCard}>
          <View style={styles.avatarContainer}>
            <MaterialCommunityIcons name="account" size={40} color="#fff" />
          </View>
          <View style={styles.devInfo}>
            <Text style={styles.devName}>Abdi A.</Text>
            <Text style={styles.devRole}>Computer Science Student</Text>
            <Text style={styles.devUni}>Madda Walabu University</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.githubButton} onPress={() => openLink('https://github.com/abdi-a')}>
          <MaterialCommunityIcons name="github" size={24} color="#fff" />
          <Text style={styles.githubText}>View on GitHub</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with ❤️ for MWU Students</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  version: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  text: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
    marginBottom: 15,
  },
  highlight: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bulletText: {
    fontSize: 15,
    color: '#555',
    marginLeft: 10,
    flex: 1,
  },
  developerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  devInfo: {
    flex: 1,
  },
  devName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  devRole: {
    fontSize: 14,
    color: '#666',
  },
  devUni: {
    fontSize: 12,
    color: '#999',
  },
  githubButton: {
    backgroundColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  githubText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,
  },
  footerText: {
    color: '#999',
    fontSize: 12,
  },
});

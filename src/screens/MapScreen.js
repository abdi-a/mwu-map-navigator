import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Dimensions, TextInput, Keyboard, TouchableOpacity, ScrollView, Linking, Platform, Alert } from 'react-native';
import MapView, { Marker, Callout } from '../components/Map';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { locations, REGION } from '../data/locations';

const CATEGORIES = [
  { id: 'all', name: 'All', icon: 'map-marker-multiple' },
  { id: 'library', name: 'Libraries', icon: 'library' },
  { id: 'cafe', name: 'Cafes', icon: 'coffee' },
  { id: 'dorm', name: 'Dorms', icon: 'bed' },
  { id: 'admin', name: 'Admin', icon: 'office-building' },
  { id: 'clinic', name: 'Health', icon: 'hospital-box' },
  { id: 'faculty', name: 'Colleges', icon: 'school' },
];

export default function MapScreen() {
  const mapRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [region, setRegion] = useState({
    latitude: 7.143,
    longitude: 39.999,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [searchQuery, setSearchQuery] = useState('');

  const openDirections = (lat, lng, label) => {
    const scheme = Platform.select({ ios: 'maps:', android: 'geo:' });
    const latLng = `${lat},${lng}`;
    const labelEncoded = encodeURIComponent(label);
    const url = Platform.select({
      ios: `${scheme}?q=${labelEncoded}&ll=${latLng}`,
      android: `${scheme}0,0?q=${latLng}(${labelEncoded})`
    });

    Linking.openURL(url);
  };

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission denied', 'We need your location to calculate distances.');
          return;
        }

        // 1. Get last known location immediately (fast)
        let lastKnown = await Location.getLastKnownPositionAsync({});
        if (lastKnown) setUserLocation(lastKnown.coords);

        // 2. Subscribe to location updates (accurate & real-time)
        await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (location) => {
            setUserLocation(location.coords);
          }
        );
      } catch (error) {
        console.log("Error getting location:", error);
      }
    })();
  }, []);

  const getDistance = (lat1, lon1) => {
    if (!userLocation) return null;
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371; // Radius of the earth in km
    const dLat = toRad(lat1 - userLocation.latitude);
    const dLon = toRad(lon1 - userLocation.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(userLocation.latitude)) *
        Math.cos(toRad(lat1)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d < 1 ? `${(d * 1000).toFixed(0)} m` : `${d.toFixed(1)} km`;
  };

  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || location.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getMarkerIcon = (type) => {
    switch (type) {
      case 'library': return 'library';
      case 'cafe': return 'coffee';
      case 'dorm': return 'bed';
      default: return 'map-marker';
    }
  };

  const getMarkerColor = (type) => {
    switch (type) {
      case 'library': return '#4A90E2'; // Blue
      case 'cafe': return '#FF6B6B'; // Red
      case 'dorm': return '#FFB347'; // Orange
      default: return '#E74C3C';
    }
  };

  const handleSearch = () => {
    if (filteredLocations.length > 0) {
      const location = filteredLocations[0];
      
      // Debugging: Let the user know what we found
      // Alert.alert("Found", `Zooming to ${location.title}`);

      const { width, height } = Dimensions.get('window');
      const ASPECT_RATIO = width / height;
      const LATITUDE_DELTA = 0.002;
      const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

      mapRef.current?.animateToRegion({
        latitude: location.coordinate.latitude,
        longitude: location.coordinate.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      }, 1000);
      
      Keyboard.dismiss();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topContainer}>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={24} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search MWU Campus..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                selectedCategory === cat.id && styles.categoryChipSelected
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <MaterialCommunityIcons 
                name={cat.icon} 
                size={20} 
                color={selectedCategory === cat.id ? '#fff' : '#666'} 
              />
              <Text style={[
                styles.categoryText,
                selectedCategory === cat.id && styles.categoryTextSelected
              ]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {filteredLocations.map((location) => (
          <Marker
            key={location.id}
            coordinate={location.coordinate}
          >
            <View style={[styles.markerBubble, { backgroundColor: getMarkerColor(location.type) }]}>
              <MaterialCommunityIcons name={getMarkerIcon(location.type)} size={20} color="#fff" />
            </View>
            <Callout onPress={() => openDirections(location.coordinate.latitude, location.coordinate.longitude, location.title)}>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{location.title}</Text>
                <Text style={styles.calloutDescription}>{location.description}</Text>
                {userLocation ? (
                  <Text style={styles.distanceText}>
                    <MaterialCommunityIcons name="walk" size={14} /> 
                    {getDistance(location.coordinate.latitude, location.coordinate.longitude)} away
                  </Text>
                ) : (
                  <Text style={[styles.distanceText, { color: '#999' }]}>
                    Locating you...
                  </Text>
                )}
                <View style={styles.directionsButton}>
                  <Text style={styles.directionsText}>Get Directions</Text>
                  <MaterialCommunityIcons name="navigation" size={14} color="#fff" />
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topContainer: {
    position: 'absolute',
    top: 50,
    width: '100%',
    zIndex: 1,
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  categoriesContainer: {
    flexGrow: 0,
  },
  categoriesContent: {
    paddingRight: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  categoryChipSelected: {
    backgroundColor: '#2196F3',
  },
  categoryText: {
    marginLeft: 6,
    fontWeight: '600',
    color: '#666',
  },
  categoryTextSelected: {
    color: '#fff',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  markerBubble: {
    padding: 5,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
    elevation: 4,
  },
  calloutContainer: {
    width: 200,
    padding: 5,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  calloutDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  distanceText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: 'bold',
    marginTop: 5,
  },
  directionsButton: {
    marginTop: 10,
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionsText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    marginRight: 5,
  },
});

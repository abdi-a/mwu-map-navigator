import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Dimensions, TextInput, Keyboard, TouchableOpacity, ScrollView, Linking, Platform, Alert, Switch } from 'react-native';
import MapView, { Marker, Callout, Polyline } from '../components/Map';
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

const MAP_STYLE = [
  {
    "featureType": "all",
    "elementType": "labels",
    "stylers": [
      { "visibility": "off" }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels",
    "stylers": [
      { "visibility": "off" }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [
      { "visibility": "off" }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "all",
    "stylers": [
      { "visibility": "off" }
    ]
  }
];

export default function MapScreen() {
  const mapRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [mapType, setMapType] = useState('standard');
  const [region, setRegion] = useState({
    latitude: 7.143,
    longitude: 39.999,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [destination, setDestination] = useState(null);
  const [destinationTitle, setDestinationTitle] = useState('');
  const [isNavigationActive, setIsNavigationActive] = useState(false);
  const [autoNavigate, setAutoNavigate] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  const toggleMapType = () => {
    // Use 'satellite' instead of 'hybrid' to hide Google's default labels
    setMapType(current => current === 'standard' ? 'satellite' : 'standard');
  };

  const fetchRoute = async (start, end) => {
    if (!start || !end) return;
    
    try {
      // Use OSRM (Open Source Routing Machine) public API
      // It's free and doesn't require an API key for basic usage
      const response = await fetch(
        `http://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`
      );
      const json = await response.json();

      if (json.code === 'Ok' && json.routes.length > 0) {
        const coordinates = json.routes[0].geometry.coordinates.map(coord => ({
          latitude: coord[1],
          longitude: coord[0],
        }));
        setRouteCoordinates(coordinates);
      } else {
        // Fallback to straight line if no road found
        setRouteCoordinates([start, end]);
      }
    } catch (error) {
      console.log("Error fetching route:", error);
      // Fallback to straight line on error
      setRouteCoordinates([start, end]);
    }
  };

  const startNavigation = (location) => {
    setDestination(location.coordinate);
    setDestinationTitle(location.title);
    setIsNavigationActive(true);
    setSearchQuery(''); // Clear search to show all markers (like Main Gate)
    Keyboard.dismiss();

    if (userLocation) {
      fetchRoute(userLocation, location.coordinate);
    } else {
      // If we don't have user location yet, just set straight line for now
      // It will update when user location is found if we add a watcher, 
      // but for now let's just set the destination
      setRouteCoordinates([]); 
    }
  };

  const stopNavigation = () => {
    setDestination(null);
    setDestinationTitle('');
    setIsNavigationActive(false);
    setRouteCoordinates([]);
  };

  const openExternalMaps = () => {
    if (!destination) return;
    
    const scheme = Platform.select({ ios: 'maps:', android: 'geo:' });
    const latLng = `${destination.latitude},${destination.longitude}`;
    const label = destinationTitle || "Destination";
    const url = Platform.select({
      ios: `${scheme}?q=${label}&ll=${latLng}`,
      android: `${scheme}0,0?q=${latLng}(${label})`
    });

    Linking.openURL(url);
  };

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
    // Lock the map to MWU campus area
    if (mapRef.current) {
      mapRef.current.setMapBoundaries(
        { latitude: 7.155, longitude: 40.010 }, // NorthEast
        { latitude: 7.130, longitude: 39.985 }  // SouthWest
      );
    }
  }, []);

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
            // If navigating, update the route from new position
            if (isNavigationActive && destination) {
               // Optional: Re-fetch route if moved significantly? 
               // For now, let's not spam the API. The line will just start from the new user location 
               // if we re-render, but we are using static routeCoordinates.
               // To make it dynamic, we would need to call fetchRoute again.
               // Let's keep it simple for the demo to avoid rate limits.
            }
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
      
      if (autoNavigate) {
        startNavigation(location);
        
        // Also zoom to show the route
        const { width, height } = Dimensions.get('window');
        const ASPECT_RATIO = width / height;
        const LATITUDE_DELTA = 0.01; // Zoom out a bit to see route
        const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

        mapRef.current?.animateToRegion({
          latitude: location.coordinate.latitude,
          longitude: location.coordinate.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }, 1000);
      } else {
        // Standard behavior: just zoom to location
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
      }
      
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
          <View style={styles.autoNavContainer}>
            <Text style={styles.autoNavLabel}>Nav</Text>
            <Switch
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={autoNavigate ? "#2196F3" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={setAutoNavigate}
              value={autoNavigate}
              style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
            />
          </View>
          <TouchableOpacity onPress={toggleMapType} style={styles.mapTypeButton}>
            <MaterialCommunityIcons 
              name={mapType === 'standard' ? 'satellite-variant' : 'map'} 
              size={24} 
              color="#666" 
            />
          </TouchableOpacity>
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
        mapType={mapType}
        customMapStyle={MAP_STYLE}
        minZoomLevel={15} // Restrict zooming out too far
        maxZoomLevel={20}
      >
        {userLocation && destination && isNavigationActive && (
          <Polyline
            coordinates={routeCoordinates.length > 0 ? routeCoordinates : [userLocation, destination]}
            strokeColor="#1967D2"
            strokeWidth={8}
          />
        )}

        {filteredLocations.map((location) => (
          <Marker
            key={location.id}
            coordinate={location.coordinate}
            onPress={() => {
              if (!isNavigationActive) {
                // Optional: Auto-select destination on tap?
                // For now, we keep the callout behavior
              }
            }}
          >
            <View style={[styles.markerBubble, { backgroundColor: getMarkerColor(location.type) }]}>
              <MaterialCommunityIcons name={getMarkerIcon(location.type)} size={20} color="#fff" />
            </View>
            <Callout onPress={() => startNavigation(location)}>
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
                  <Text style={styles.directionsText}>START</Text>
                  <MaterialCommunityIcons name="navigation" size={14} color="#fff" />
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {isNavigationActive && (
        <View style={styles.navigationPanel}>
          <View style={styles.navContent}>
            <View style={styles.navHeader}>
              <MaterialCommunityIcons name="navigation" size={24} color="#4285F4" />
              <View style={styles.navTextContainer}>
                <Text style={styles.navTitle} numberOfLines={1}>To: {destinationTitle}</Text>
                <Text style={styles.navSubText}>Follow the blue line</Text>
              </View>
            </View>
            <View style={styles.navButtons}>
              <TouchableOpacity style={styles.externalMapButton} onPress={openExternalMaps}>
                <MaterialCommunityIcons name="google-maps" size={20} color="white" />
                <Text style={styles.externalMapText}>Open Maps</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.stopButton} onPress={stopNavigation}>
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  navigationPanel: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    padding: 15,
  },
  navContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  navTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  navTitle: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
  navSubText: {
    color: '#666',
    fontSize: 12,
  },
  navButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  externalMapButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  externalMapText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 5,
  },
  stopButton: {
    padding: 5,
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
  },
  searchIcon: {
    marginRight: 10,
  },
  autoNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 5,
  },
  autoNavLabel: {
    fontSize: 10,
    color: '#666',
    marginRight: 2,
    fontWeight: 'bold',
  },
  mapTypeButton: {
    padding: 5,
    marginLeft: 5,
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

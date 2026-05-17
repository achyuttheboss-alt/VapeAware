import { IconSymbol } from '@/components/ui/IconSymbol';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface TreatmentCenter {
  id: string;
  name: string;
  address: string;
  distance: number;
  lat: number;
  lon: number;
}

export default function Hotline() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [treatmentCenters, setTreatmentCenters] = useState<TreatmentCenter[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {//asks user permission for location
    try {
      setLocationError(null);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied');
        return;
      }

      await getCurrentLocation();
    } catch (error) {
      console.error('Permission error:', error);
      setLocationError('Failed to get location permission');
    }
  };

  const getCurrentLocation = async () => {//fetches location using built in function and converts user's current location to the location in the app
    try {
      setLoading(true);
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      await fetchNearbyTreatmentCenters(currentLocation.coords.latitude, currentLocation.coords.longitude);
    } catch (error) {
      console.error('Location error:', error);
      setLocationError('Unable to get your location');
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {//calculates distance between two different points
    const R = 3959; // Radius of Earth in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const fetchNearbyTreatmentCenters = async (latitude: number, longitude: number) => {
    try {
      // Using Overpass API
      const radius = 10000; // 10km radius for centers
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="hospital"](around:${radius},${latitude},${longitude});
          node["amenity"="clinic"](around:${radius},${latitude},${longitude});
          node["healthcare"="centre"](around:${radius},${latitude},${longitude});
          node["healthcare"="rehabilitation"](around:${radius},${latitude},${longitude});
          node["healthcare:speciality"~"psychiatry|addiction"](around:${radius},${latitude},${longitude});
          way["amenity"="hospital"](around:${radius},${latitude},${longitude});
          way["amenity"="clinic"](around:${radius},${latitude},${longitude});
          way["healthcare"="centre"](around:${radius},${latitude},${longitude});
        );
        out body;
      `;

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
        headers: {
          'Content-Type': 'text/plain',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch nearby treatment centers');
      }

      const data = await response.json();

      
      const searchTerms = ['addiction treatment center', 'rehabilitation center', 'mental health clinic'];
      const nominatimResults = [];

      for (const term of searchTerms) {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(term)}&` +
          `format=json&` +
          `limit=10&` +
          `viewbox=${longitude-0.1},${latitude+0.1},${longitude+0.1},${latitude-0.1}&` +
          `bounded=1`
        );
        const data = await response.json();
        nominatimResults.push(...data);
      }

  
      const centers: TreatmentCenter[] = [];
      const seen = new Set();

      // Processes overpass's results
      data.elements?.forEach((element: any) => {
        const name = element.tags?.name ||
                     (element.tags?.amenity === 'hospital' ? 'Medical Center' :
                      element.tags?.amenity === 'clinic' ? 'Health Clinic' :
                      'Treatment Center');
        const key = `${element.lat}-${element.lon}`;

        if (!seen.has(key)) {
          seen.add(key);
          centers.push({
            id: element.id?.toString() || Math.random().toString(),
            name: name,
            address: element.tags?.['addr:street']
              ? `${element.tags['addr:housenumber'] || ''} ${element.tags['addr:street']}`.trim()
              : 'Address not available',
            distance: calculateDistance(latitude, longitude, element.lat, element.lon),
            lat: element.lat,
            lon: element.lon,
          });
        }
      });

      // Process nominatims results
      nominatimResults?.forEach((place: any) => {
        const key = `${place.lat}-${place.lon}`;
        const displayName = place.display_name.toLowerCase();
        if (!seen.has(key) &&
            (displayName.includes('rehab') ||
             displayName.includes('treatment') ||
             displayName.includes('clinic') ||
             displayName.includes('hospital') ||
             displayName.includes('health') ||
             displayName.includes('medical'))) {
          seen.add(key);
          centers.push({
            id: place.place_id?.toString() || Math.random().toString(),
            name: place.name || 'Treatment Center',
            address: place.display_name.split(',').slice(0, 3).join(', '),
            distance: calculateDistance(latitude, longitude, parseFloat(place.lat), parseFloat(place.lon)),
            lat: parseFloat(place.lat),
            lon: parseFloat(place.lon),
          });
        }
      });

      // sort by distance
      centers.sort((a, b) => a.distance - b.distance);

      setTreatmentCenters(centers.slice(0, 10)); // limit to 10 closest centers
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Error', 'Unable to find nearby treatment centers');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await getCurrentLocation();
    setRefreshing(false);
  };

  const openMaps = (center: TreatmentCenter) => {
    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q=',
    });
    const latLng = `${center.lat},${center.lon}`;
    const label = center.name;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    if (url) {
      Linking.openURL(url);
    }
  };

  const handleCall = () => {
    const phoneNumber = '18007849669';
    const url = Platform.OS === 'ios'
      ? `tel:${phoneNumber}`
      : `tel:${phoneNumber}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Phone calls are not supported on this device');
        }
      })
      .catch((err) => console.error('Error opening phone app:', err));
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#6B4226"
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Need Help?</Text>
        <Text style={styles.headerSubtitle}>
          Free, confidential support is just a call away
        </Text>
      </View>

      <View style={styles.mainCard}>
        <View style={styles.iconContainer}>
          <IconSymbol name="phone.fill" size={32} color="#6B4226" />
        </View>

        <Text style={styles.cardTitle}>National Quitline</Text>
        <Text style={styles.phoneNumber}>1-800-QUIT-NOW</Text>
        <Text style={styles.phoneNumberAlt}>(1-800-784-9669)</Text>

        <Text style={styles.description}>
          Free coaching and support to help you quit vaping or smoking.
          Available 24/7 in multiple languages.
        </Text>

        <TouchableOpacity
          style={styles.callButton}
          onPress={handleCall}
          activeOpacity={0.8}
        >
          <IconSymbol name="phone.fill" size={20} color="#F7F4EA" />
          <Text style={styles.callButtonText}>Call Now</Text>
        </TouchableOpacity>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <IconSymbol name="checkmark.circle.fill" size={20} color="#A57C5C" />
            <Text style={styles.featureText}>100% Free</Text>
          </View>
          <View style={styles.featureItem}>
            <IconSymbol name="checkmark.circle.fill" size={20} color="#A57C5C" />
            <Text style={styles.featureText}>Confidential</Text>
          </View>
          <View style={styles.featureItem}>
            <IconSymbol name="checkmark.circle.fill" size={20} color="#A57C5C" />
            <Text style={styles.featureText}>24/7 Support</Text>
          </View>
        </View>
      </View>

      {/* Nearby Treatment Centers Section */}
      <View style={styles.nearbySection}>
        <View style={styles.nearbySectionHeader}>
          <Text style={styles.nearbyTitle}>Nearby Treatment Centers</Text>
          <Text style={styles.nearbySubtitle}>
            Find professional help and support near you
          </Text>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6B4226" />
            <Text style={styles.loadingText}>Finding nearby treatment centers...</Text>
          </View>
        ) : locationError ? (
          <View style={styles.errorContainer}>
            <IconSymbol name="location.slash.fill" size={24} color="#8B5E3C" />
            <Text style={styles.errorText}>{locationError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={requestLocationPermission}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : treatmentCenters.length === 0 ? (
          <View style={styles.noShopsContainer}>
            <IconSymbol name="exclamationmark.triangle.fill" size={32} color="#A57C5C" />
            <Text style={styles.noShopsText}>
              No treatment centers found nearby
            </Text>
            <Text style={styles.noShopsSubtext}>
              Try calling the hotline above for remote support
            </Text>
          </View>
        ) : (
          <View>
            {treatmentCenters.map((center, index) => (
              <TouchableOpacity
                key={center.id}
                style={styles.shopCard}
                onPress={() => openMaps(center)}
                activeOpacity={0.8}
              >
                <View style={styles.shopIndexContainer}>
                  <Text style={styles.shopIndex}>{index + 1}</Text>
                </View>
                <View style={styles.shopInfo}>
                  <Text style={styles.shopName}>{center.name}</Text>
                  <Text style={styles.shopAddress}>{center.address}</Text>
                  <View style={styles.shopDistance}>
                    <IconSymbol name="location.fill" size={14} color="#A57C5C" />
                    <Text style={styles.shopDistanceText}>
                      {center.distance.toFixed(1)} miles away
                    </Text>
                  </View>
                </View>
                <IconSymbol name="chevron.right" size={20} color="#A57C5C" />
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.refreshButton}
              onPress={onRefresh}
            >
              <IconSymbol name="arrow.clockwise" size={18} color="#6B4226" />
              <Text style={styles.refreshButtonText}>Refresh Location</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>What to Expect</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <View style={styles.numberBadge}>
              <Text style={styles.numberText}>1</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoItemTitle}>Speak with a coach</Text>
              <Text style={styles.infoItemText}>
                Trained quit coaches provide personalized support
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.numberBadge}>
              <Text style={styles.numberText}>2</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoItemTitle}>Create a quit plan</Text>
              <Text style={styles.infoItemText}>
                Develop strategies that work for your lifestyle
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.numberBadge}>
              <Text style={styles.numberText}>3</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoItemTitle}>Get ongoing support</Text>
              <Text style={styles.infoItemText}>
                Receive follow-up calls and continuous guidance
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.emergencyNote}>
        <IconSymbol name="exclamationmark.circle.fill" size={18} color="#8B5E3C" />
        <Text style={styles.emergencyText}>
          For medical emergencies, call 911
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F0',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#6B4226',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8B5E3C',
    lineHeight: 24,
  },
  mainCard: {
    backgroundColor: '#F7F4EA',
    marginHorizontal: 24,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E4DCCF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6B4226',
    marginBottom: 8,
  },
  phoneNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#A57C5C',
    marginBottom: 4,
  },
  phoneNumberAlt: {
    fontSize: 16,
    color: '#8B5E3C',
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: '#6B4226',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B4226',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 24,
  },
  callButtonText: {
    color: '#F7F4EA',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 13,
    color: '#6B4226',
    marginLeft: 4,
    fontWeight: '500',
  },
  nearbySection: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  nearbySectionHeader: {
    marginBottom: 16,
  },
  nearbyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6B4226',
    marginBottom: 4,
  },
  nearbySubtitle: {
    fontSize: 14,
    color: '#8B5E3C',
  },
  loadingContainer: {
    backgroundColor: '#F7F4EA',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B4226',
  },
  errorContainer: {
    backgroundColor: '#F7F4EA',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#8B5E3C',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#6B4226',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#F7F4EA',
    fontSize: 14,
    fontWeight: '600',
  },
  noShopsContainer: {
    backgroundColor: '#F7F4EA',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  noShopsText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#6B4226',
  },
  noShopsSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#8B5E3C',
  },
  shopCard: {
    backgroundColor: '#F7F4EA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopIndexContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E4DCCF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shopIndex: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B4226',
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B4226',
    marginBottom: 4,
  },
  shopAddress: {
    fontSize: 13,
    color: '#8B5E3C',
    marginBottom: 6,
  },
  shopDistance: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopDistanceText: {
    fontSize: 12,
    color: '#A57C5C',
    marginLeft: 4,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F4EA',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    color: '#6B4226',
    fontWeight: '500',
    marginLeft: 6,
  },
  infoSection: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6B4226',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#F7F4EA',
    padding: 20,
    borderRadius: 16,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E4DCCF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  numberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B4226',
  },
  infoContent: {
    flex: 1,
  },
  infoItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B4226',
    marginBottom: 4,
  },
  infoItemText: {
    fontSize: 14,
    color: '#8B5E3C',
    lineHeight: 20,
  },
  emergencyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 100,
    paddingHorizontal: 24,
  },
  emergencyText: {
    fontSize: 14,
    color: '#8B5E3C',
    fontWeight: '500',
    marginLeft: 6,
  },
});
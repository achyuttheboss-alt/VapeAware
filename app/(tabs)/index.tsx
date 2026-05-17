import { IconSymbol } from '@/components/ui/IconSymbol';
import { router } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const userName = user?.email?.split('@')[0] || 'User';

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const quickActions = [
    {
      id: '1',
      title: 'Take Survey',
      icon: 'list.bullet.rectangle.fill',
      color: '#6B4226',
      route: '/(tabs)/survey',
      description: 'Track your progress'
    },
    {
      id: '2',
      title: 'Get Help',
      icon: 'phone.fill',
      color: '#6B4226',
      route: '/(tabs)/hotline',
      description: 'Call support line'
    },
    {
      id: '3',
      title: 'Chat Support',
      icon: 'message.circle.fill',
      color: '#6B4226',
      route: '/(tabs)/chatbot',
      description: 'AI assistance'
    },
    {
      id: '4',
      title: 'Previous Surveys',
      icon: 'doc.text.magnifyingglass',
      color: '#6B4226',
      route: '/(tabs)/PreviousSurveys',
      description: 'Look at how you did on your prior surveys'
    }
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{userName}!</Text>
          </View>
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
            <IconSymbol name="rectangle.portrait.and.arrow.right" size={24} color="#FAF7F0" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Motivational Quote */}
      <View style={styles.quoteCard}>
        <IconSymbol name="quote.opening" size={20} color="#8B5E3C" />
        <Text style={styles.quoteText}>
          "Every day without vaping is a victory. You're stronger than you think!"
        </Text>
        <Text style={styles.quoteAuthor}>- Your VapeGuardian</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconContainer}>
                <IconSymbol name={action.icon} size={28} color={action.color} />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionDescription}>{action.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Emergency Help Button */}
      <TouchableOpacity 
        style={styles.emergencyButton}
        onPress={() => router.push('/(tabs)/hotline')}
      >
        <View style={styles.emergencyBox}>
          <IconSymbol name="phone.fill" size={20} color="#FAF7F0" />
          <Text style={styles.emergencyText}>Need Immediate Help?</Text>
        </View>
      </TouchableOpacity>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F0', // cream background
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    backgroundColor: '#8B5E3C', // deep brown
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: '#F7F4EA',
    marginBottom: 4,
    fontFamily: 'SpaceMono-Regular',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FAF7F0',
    fontFamily: 'SpaceMono-Regular',
  },
  signOutButton: {
    padding: 8,
    backgroundColor: '#6B4226',
    borderRadius: 12,
  },
  quoteCard: {
    backgroundColor: '#F7F4EA',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  quoteText: {
    fontSize: 16,
    color: '#2B2B2B',
    fontStyle: 'italic',
    marginVertical: 10,
    lineHeight: 22,
    fontFamily: 'SpaceMono-Regular',
  },
  quoteAuthor: {
    fontSize: 14,
    color: '#6E6E6E',
    textAlign: 'right',
    fontFamily: 'SpaceMono-Regular',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2B2B2B',
    marginBottom: 16,
    fontFamily: 'SpaceMono-Regular',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: '#F7F4EA',
    borderRadius: 16,
    padding: 16,
    width: (width - 48) / 2,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#EADBC8', // soft highlight
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2B2B2B',
    marginBottom: 4,
    fontFamily: 'SpaceMono-Regular',
  },
  actionDescription: {
    fontSize: 12,
    color: '#6E6E6E',
    textAlign: 'center',
    fontFamily: 'SpaceMono-Regular',
  },
  emergencyButton: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  emergencyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B4226',
    paddingVertical: 16,
    borderRadius: 12,
  },
  emergencyText: {
    color: '#FAF7F0',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'SpaceMono-Regular',
  },
});

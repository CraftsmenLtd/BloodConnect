/* eslint-disable */
// This page is not implemented yet just demo.
import { Ionicons } from '@expo/vector-icons';
import { Cache } from 'aws-amplify/utils';
import React from 'react';
import {
  Button,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../authentication/context/useAuth';
import { SCREENS } from '../setup/constant/screens';
import { TOKEN } from '../setup/constant/token';
import { ProfileScreenNavigationProp } from '../setup/navigation/navigationTypes';
import { useTheme } from '../setup/theme/hooks/useTheme';
import StorageService from '../utility/storageService';

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

interface Badge {
  id: number;
  icon: string;
  label: string;
}

interface Achievement {
  id: number;
  icon: string;
  label: string;
  subLabel: string;
}

interface Post {
  id: number;
  title: string;
  donationPoint: string;
  dateTime: string;
  urgent: boolean;
}

const Profile: React.FC<ProfileScreenProps> = ({ navigation }) => {
const badges: Badge[] = [];

const achievements: Achievement[] = [
  { id: 2, icon: 'medkit', label: '5 times', subLabel: 'Platelet donor' },
  { id: 3, icon: 'globe', label: '3 cities', subLabel: 'Donated blood' },
  { id: 4, icon: 'star', label: '5 star rated', subLabel: 'Blood donor' },
];

const posts: Post[] = [
  {
    id: 1,
    title: 'Looking for 3 bag B+(ve) blood',
    donationPoint: 'Science Lab, Dhaka',
    dateTime: '05:00 PM, Tuesday',
    urgent: true,
  },
  {
    id: 2,
    title: 'Looking for 3 bag B+(ve) blood',
    donationPoint: 'Science Lab, Dhaka',
    dateTime: '05:00 PM, Tuesday',
    urgent: false,
  },
];
  const theme = useTheme()
  const auth = useAuth()

  const clearStorageExceptDeviceToken = async () => {
    if (Platform.OS !== 'web') {
      const keys = await StorageService.getAllKeys()
      const filteredKeys = keys.filter(TOKEN.DEVICE_TOKEN)
      await filteredKeys.remove()
    }
  };

  const handleSignOut = async (): Promise<void> => {
    try {
      await Promise.all([Cache.clear(), clearStorageExceptDeviceToken()])
      await auth.logoutUser()
      navigation.navigate(SCREENS.WELCOME)
    } catch (error) {
      console.error('Error during sign out:', error instanceof Error ? error.message : 'Unknown error');
      if (error instanceof Error && error.name === 'UserNotAuthenticatedException') {
        navigation.navigate(SCREENS.WELCOME);
      }
    }
  }

  return (
    <ScrollView style={styles.container}>
    <View style={styles.container}>
      <Button
        title="Sign Out"
        onPress={handleSignOut}
        color={theme.colors.primary}
      />
    </View>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.profileText}>Profile</Text>
        <View style={styles.headerIcons}>
          <Ionicons name="share-social" size={24} color={theme.colors.text} />
        </View>
      </View>

      <View style={styles.profileInfo}>
        <Image source={{ uri: 'https://via.placeholder.com/100' }} style={styles.profileImage} />
        <Text style={styles.bloodGroup}>A+ (ve)</Text>
        <Text style={styles.userName}>Sufi Ahmed</Text>
        <Text style={styles.userLocation}>Mohakhali DOHS, Dhaka</Text>
        <Text style={styles.userDetails}>Age: 29  •  Weight: 82  •  Height: 5'6"</Text>
        <TouchableOpacity style={styles.callButton}>
          <Text style={styles.callButtonText}>Call now</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Badges</Text>
        <FlatList
          horizontal
          data={badges}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.badge}>
              <Ionicons name={item.icon} size={32} color={theme.colors.primary} />
              <Text style={styles.badgeText}>{item.label}</Text>
            </View>
          )}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <FlatList
          horizontal
          data={achievements}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.achievement}>
              <Ionicons name={item.icon} size={24} color={theme.colors.primary} />
              <Text style={styles.achievementLabel}>{item.label}</Text>
              <Text style={styles.achievementSubLabel}>{item.subLabel}</Text>
            </View>
          )}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Posts</Text>
        {posts.map((post) => (
          <View key={post.id} style={styles.postCard}>
            <Text style={styles.postTitle}>{post.title}</Text>
            {post.urgent && <Text style={styles.urgentBadge}>URGENT</Text>}
            <View style={styles.postInfoRow}>
              <Ionicons name="location" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.postInfoText}>{post.donationPoint}</Text>
            </View>
            <View style={styles.postInfoRow}>
              <Ionicons name="calendar" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.postInfoText}>{post.dateTime}</Text>
            </View>
            <TouchableOpacity style={styles.viewDetailsButton}>
              <Text style={styles.viewDetailsText}>View details</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  profileText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  profileInfo: {
    alignItems: 'center',
    padding: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  bloodGroup: {
    backgroundColor: '#FFD700',
    padding: 4,
    borderRadius: 5,
    marginTop: 8,
    fontSize: 16,
    color: '#333',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 8,
  },
  userLocation: {
    fontSize: 14,
    color: '#666',
  },
  userDetails: {
    fontSize: 14,
    color: '#666',
    marginVertical: 8,
  },
  callButton: {
    backgroundColor: '#FF5A5F',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  callButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  badge: {
    alignItems: 'center',
    marginRight: 16,
  },
  badgeText: {
    fontSize: 12,
    color: '#333',
  },
  achievement: {
    alignItems: 'center',
    marginRight: 16,
    padding: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  achievementLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  achievementSubLabel: {
    fontSize: 12,
    color: '#666',
  },
  postCard: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  urgentBadge: {
    backgroundColor: '#FF5A5F',
    color: '#fff',
    padding: 4,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginVertical: 4,
  },
  postInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  postInfoText: {
    marginLeft: 4,
    color: '#666',
  },
  viewDetailsButton: {
    backgroundColor: '#e6e6e6',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  viewDetailsText: {
    color: '#333',
  },
})

export default Profile

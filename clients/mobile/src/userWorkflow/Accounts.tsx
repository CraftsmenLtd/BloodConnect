import React from 'react'
import { Text, View, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { signOut } from 'aws-amplify/auth'
import { ProfileScreenNavigationProp } from '../setup/navigation/navigationTypes'
import { SCREENS } from '../setup/constant/screens'
import { Cache } from 'aws-amplify/utils'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from '../authentication/context/useAuth'
import { MaterialIcons } from '@expo/vector-icons'
import { Theme } from '../setup/theme'
import { useTheme } from '../setup/theme/hooks/useTheme'

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

export default function Account({ navigation }: ProfileScreenProps) {
  const auth = useAuth()
  const styles = createStyles(useTheme())

  const clearAllStorage = async() => {
    if (Platform.OS !== 'web') {
      await AsyncStorage.clear()
    }
  }

  const handleSignOut = async(): Promise<void> => {
    try {
      await auth.logoutUser()
      await Promise.all([Cache.clear(), clearAllStorage()])
      await signOut()
      navigation.navigate(SCREENS.WELCOME)
    } catch (error) {
      console.error('Error during sign out:', error instanceof Error ? error.message : 'Unknown error')
      if (error instanceof Error && error.name === 'UserNotAuthenticatedException') {
        navigation.navigate(SCREENS.WELCOME)
      }
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Account</Text>

      <View style={styles.moreSection}>
        <TouchableOpacity style={styles.optionItem} onPress={() => { void handleSignOut() }}>
          <MaterialIcons name="logout" size={24} color="black" />
          <Text style={styles.optionText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>

  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderColor: theme.colors.extraLightGray
  },
  imageOuterBorder: {
    width: 60,
    height: 60,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  imageInnerBorder: {
    width: 58,
    height: 58,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: theme.colors.extraLightGray,
    alignItems: 'center',
    justifyContent: 'center'
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 30
  },
  profileInfo: {
    marginLeft: 15
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  profileLocationSection: {
    flexDirection: 'row'
  },
  profileLocation: {
    fontSize: 14,
    color: 'gray'
  },
  optionsSection: {
    borderTopWidth: 4,
    borderColor: '#eee'
  },
  moreSection: {
    borderTopWidth: 4,
    borderColor: '#eee',
    marginTop: 20
  },
  headingStyle: {
    alignItems: 'center',
    padding: 15
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15
  },
  optionText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333'
  }

})

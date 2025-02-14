import React from 'react'
import { View, Text, Image, StyleProp, ImageStyle, StyleSheet, Pressable } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { Theme } from '../../setup/theme'
import { COMMON_URLS } from '../../setup/constant/commonUrls'

interface UserData {
  name: string;
  location: string;
  isEditing?: boolean;
  onImageUpload?: () => void;
}

const ProfileSection: React.FC<UserData> = ({ name, location, isEditing = false, onImageUpload }) => {
  const styles = createStyles(useTheme())

  return (
    <View style={styles.profileSection}>
      <View style={styles.imageOuterBorder}>
        <View style={styles.imageInnerBorder}>
          <Image
            style={styles.profileImage as StyleProp<ImageStyle>}
            source={{ uri: COMMON_URLS.PROFILE_AVATAR }}
          />
          {isEditing && (
            <Pressable style={styles.cameraIconContainer} onPress={onImageUpload}>
              <View style={styles.cameraIconWrapper}>
                <MaterialIcons name="add-a-photo" size={16} style={styles.cameraIcon} />
              </View>
            </Pressable>
          )}
        </View>
      </View>
      <View style={styles.profileInfo}>
        <Text style={styles.profileName}>{name}</Text>
        <View style={styles.profileLocationSection}>
          <MaterialIcons name="location-on" size={16} style={styles.iconStyle} />
          <Text style={styles.profileLocation}>{location}</Text>
        </View>
      </View>
    </View>
  )
}

export default ProfileSection

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 4,
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
    justifyContent: 'center',
    position: 'relative'
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 30
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: -10,
    alignSelf: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    width: 46,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.colors.extraLightGray
  },
  cameraIconWrapper: {
    backgroundColor: theme.colors.greyBG,
    width: 46,
    height: 20,
    bottom: -1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cameraIcon: {
    color: theme.colors.black,
    fontSize: 18,
    width: 16,
    height: 16,
    transform: [{ scaleX: -1 }]
  },
  profileInfo: {
    marginLeft: 15
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  profileLocationSection: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  profileLocation: {
    fontSize: 14,
    color: 'gray'
  }
})

import React from 'react'
import type { StyleProp, ImageStyle } from 'react-native'
import { View, Image, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { Text } from '../../components/text/AppText'
import { MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import type { Theme } from '../../setup/theme'
import InitialsAvatar from '../../components/avatar/InitialsAvatar'
import { useProfileAvatarUri } from '../hooks/useProfileAvatarUri'
import { spacing, radius } from '../../setup/theme/tokens'

const AVATAR_SIZE = 56

type UserData = {
  name: string;
  location: string;
  age: number;
  isEditing?: boolean;
  uploading?: boolean;
  onImageUpload?: () => void;
}

const ProfileSection: React.FC<UserData> = (
  {
    name,
    location,
    age,
    isEditing = false,
    uploading = false,
    onImageUpload
  }) => {
  const theme = useTheme()
  const styles = createStyles(theme)
  const avatarUri = useProfileAvatarUri()

  return (
    <View style={styles.profileSection}>
      <View style={styles.imageOuterBorder}>
        <View style={styles.imageInnerBorder}>
          {avatarUri !== undefined
            ? (
              <Image
                style={styles.profileImage as StyleProp<ImageStyle>}
                source={{ uri: avatarUri }}
              />
            )
            : <InitialsAvatar name={name} size={AVATAR_SIZE} />}
          {uploading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="small" color={theme.colors.onPrimary} />
            </View>
          )}
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
        <Text variant="h3" style={styles.profileName}>{name} {age && `(${age})`}</Text>
        <View style={styles.profileLocationSection}>
          <MaterialIcons name="location-on" size={16} style={styles.iconStyle} />
          <Text variant="bodySmall" style={styles.profileLocation}>{location}</Text>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 4,
    borderColor: theme.colors.border
  },
  imageOuterBorder: {
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    borderWidth: 4,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  imageInnerBorder: {
    width: 58,
    height: 58,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  profileImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.pill
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.backdrop
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: -10,
    alignSelf: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: radius.xl,
    width: 46,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.elevation.sm,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  cameraIconWrapper: {
    backgroundColor: theme.colors.surfaceVariant,
    width: 46,
    height: 20,
    bottom: -1,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cameraIcon: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    width: 16,
    height: 16,
    transform: [{ scaleX: -1 }]
  },
  profileInfo: {
    marginLeft: spacing.lg
  },
  profileName: {
    fontWeight: 'bold'
  },
  profileLocationSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileLocation: {
    color: theme.colors.textSecondary
  },
  iconStyle: {
    color: theme.colors.textSecondary,
    marginRight: spacing.xs
  }
})

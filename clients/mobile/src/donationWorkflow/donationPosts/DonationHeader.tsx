import { MaterialIcons } from '@expo/vector-icons'
import React from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { Theme } from '../../setup/theme'
import { useTheme } from '../../setup/theme/hooks/useTheme'

type HeaderProps = {
  profileImageUri: string;
  title: string;
  buttonLabel: string;
  onButtonPress: () => void;
  onFilterButtonPress: () => void;
}

const Header: React.FC<HeaderProps> = ({ profileImageUri, title, buttonLabel, onButtonPress, onFilterButtonPress }) => {
  const theme = useTheme()
  const styles = createStyles(theme)

  return (
    <View style={styles.header}>
      <View style={styles.headerLeftContent}>
        <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={onButtonPress}>
        <Text style={styles.buttonText}>{buttonLabel}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={onFilterButtonPress}>
        <MaterialIcons
          name={'filter'}
          size={15}
          color={theme.colors.lightGrey}
        />
      </TouchableOpacity>
    </View>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: theme.colors.white,
    borderBottomColor: theme.colors.extraLightGray,
    borderBottomWidth: 1,
    borderTopColor: theme.colors.extraLightGray,
    borderTopWidth: 1
  },
  headerLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20
  },
  title: {
    fontSize: 17,
    color: theme.colors.lightGrey
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 25
  },
  buttonText: {
    color: theme.colors.white,
    fontWeight: 'bold'
  }
})

export default Header

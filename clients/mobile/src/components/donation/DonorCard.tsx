import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { Theme } from '../../setup/theme'

interface DonorCardProps {
  name: string;
  isSelected: boolean;
  onSelect: () => void;
}

const DonorCard: React.FC<DonorCardProps> = ({ name, isSelected, onSelect }) => {
  const theme = useTheme()
  const styles = createStyles(theme)

  return (
    <TouchableOpacity
      style={[styles.card, isSelected ? styles.cardSelected : null]}
      onPress={onSelect}
    >
      <View style={styles.row}>
        <MaterialIcons
          name={isSelected ? 'check-box' : 'check-box-outline-blank'}
          size={24}
          color={isSelected ? theme.colors.primary : theme.colors.lightGrey}
        />
        <View style={styles.textContainer}>
          <Text style={[styles.name, isSelected ? styles.nameSelected : null]}>
            {name}
          </Text>
          <Text style={[styles.info, isSelected ? styles.infoSelected : null]}>
            New blood donor
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default DonorCard

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: theme.colors.greyBG
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderWidth: 1,
      borderColor: theme.colors.extraLightGray,
      borderRadius: 8,
      marginBottom: 12,
      backgroundColor: theme.colors.white
    },
    cardSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.redFaded
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center'
    },
    textContainer: {
      marginLeft: 12
    },
    name: {
      fontSize: theme.typography.fontSize,
      fontWeight: '600',
      color: theme.colors.textPrimary
    },
    nameSelected: {
      color: theme.colors.primary
    },
    info: {
      fontSize: 14,
      color: theme.colors.textSecondary
    },
    infoSelected: {
      color: theme.colors.primary
    }
  })

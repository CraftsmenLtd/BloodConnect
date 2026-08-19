import React from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { Text } from '../text/AppText'
import { MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import type { Theme } from '../../setup/theme'
import { spacing, radius } from '../../setup/theme/tokens'

type DonorCardProps = {
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
          color={isSelected ? theme.colors.primary : theme.colors.borderStrong}
        />
        <View style={styles.textContainer}>
          <Text variant="body" style={[styles.name, isSelected ? styles.nameSelected : null]}>
            {name}
          </Text>
          <Text variant="bodySmall" style={[styles.info, isSelected ? styles.infoSelected : null]}>
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
      padding: spacing.lg,
      backgroundColor: theme.colors.surfaceVariant
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.md,
      marginBottom: spacing.md,
      backgroundColor: theme.colors.surface
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
      marginLeft: spacing.md
    },
    name: {
      fontWeight: '600',
      color: theme.colors.textPrimary
    },
    nameSelected: {
      color: theme.colors.primary
    },
    info: {
      color: theme.colors.textSecondary
    },
    infoSelected: {
      color: theme.colors.primary
    }
  })

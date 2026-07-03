import React from 'react'
import {
  useTranslation } from 'react-i18next'
import { View,
  Image,
  TouchableOpacity,
  StyleSheet
} from 'react-native'
import { Text } from '../../components/text/AppText'
import type { Theme } from '../../setup/theme'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { spacing, radius } from '../../setup/theme/tokens'

type HeaderProps = {
  profileImageUri: string;
  title: string;
  buttonLabel: string;
  onButtonPress: () => void;
  handleRefresh: () => void;
  onFilterButtonPress: () => void;
  bloodGroup: string;
  isFilteredByBloodGroup: boolean;
}

const Header: React.FC<HeaderProps> = ({
  profileImageUri,
  title,
  buttonLabel,
  onButtonPress,
  handleRefresh,
  onFilterButtonPress,
  bloodGroup,
  isFilteredByBloodGroup
}) => {
  const theme = useTheme()
  const { t } = useTranslation()
  const styles = createStyles(theme)

  return (
    <View>
      <View style={styles.header}>
        <View style={styles.headerLeftContent}>
          <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
          <Text style={styles.title}>{title}</Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={onButtonPress}>
          <Text style={styles.buttonText}>{buttonLabel}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.filter}>
        <TouchableOpacity
          style={[styles.filterButton, !isFilteredByBloodGroup
            ? styles.filterSelected
            : styles.filterNotSelected
          ]}
          onPress={handleRefresh}
        >
          <Text style={styles.buttonText}>{t('common.all')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, isFilteredByBloodGroup
            ? styles.filterSelected
            : styles.filterNotSelected
          ]}
          onPress={onFilterButtonPress}
        >
          <Text style={styles.buttonText}>{t('common.filterBy') + ' ' + bloodGroup}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1
  },
  filter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1
  },
  headerLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: radius.xl
  },
  title: {
    fontSize: 17,
    color: theme.colors.borderStrong
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.xl
  },
  filterButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.xl,
    marginRight: spacing.md
  },
  filterSelected: {
    backgroundColor: theme.colors.primary
  },
  filterNotSelected: {
    backgroundColor: theme.colors.borderStrong
  },
  buttonText: {
    color: theme.colors.onPrimary,
    fontWeight: 'bold'
  }
})

export default Header

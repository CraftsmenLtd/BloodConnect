import React, { useState } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { Text } from '../text/AppText'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import type { Theme } from '../../setup/theme'
import { spacing, radius } from '../../setup/theme/tokens'

type ToggleTabsProps = {
  tabs: [string, ...string[]];
  onTabPress: (tab: string) => void;
  initialActiveTab?: string;
}

const ToggleTabs: React.FC<ToggleTabsProps> = ({ tabs, onTabPress, initialActiveTab }) => {
  const styles = createStyles(useTheme())
  const [activeTab, setActiveTab] = useState(initialActiveTab ?? tabs[0])

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.activeTab]}
          onPress={() => {
            setActiveTab(tab)
            onTabPress(tab)
          }}
        >
          <Text style={[styles.text, activeTab === tab && styles.activeText]}>{tab}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceVariant
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center'
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
    borderRadius: radius.pill
  },
  text: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: '500'
  },
  activeText: {
    color: theme.colors.onPrimary
  }
})

export default ToggleTabs

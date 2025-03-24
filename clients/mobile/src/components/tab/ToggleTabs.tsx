import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import type { Theme } from '../../setup/theme'

interface ToggleTabsProps {
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
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: theme.colors.greyBG
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    justifyContent: 'center',
    alignItems: 'center'
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
    borderRadius: 100
  },
  text: {
    fontSize: 14,
    color: theme.colors.black,
    fontWeight: '500'
  },
  activeText: {
    color: theme.colors.white
  }
})

export default ToggleTabs

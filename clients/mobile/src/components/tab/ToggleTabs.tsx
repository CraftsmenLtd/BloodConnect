import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface ToggleTabsProps {
  tabs: string[];
  onTabPress: (tab: string) => void;
  initialActiveTab?: string;
}

const ToggleTabs: React.FC<ToggleTabsProps> = ({ tabs, onTabPress, initialActiveTab }) => {
  const [activeTab, setActiveTab] = useState(initialActiveTab ?? tabs[0])

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab ? styles.activeTab : styles.inactiveTab]}
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5'
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    justifyContent: 'center',
    alignItems: 'center'
  },
  activeTab: {
    backgroundColor: '#ff4d4d',
    borderRadius: 100
  },
  inactiveTab: {},
  text: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500'
  },
  activeText: {
    color: '#fff'
  }
})

export default ToggleTabs

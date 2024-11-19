import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

const ToggleTabs = ({ onMyPostsPress, onMyResponsesPress, tab1, tab2 }) => {
  const [activeTab, setActiveTab] = useState(tab1)

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, activeTab === tab1 ? styles.activeTab : styles.inactiveTab]}
        onPress={() => {
          setActiveTab(tab1)
          onMyPostsPress()
        }}
      >
        <Text style={[styles.text, activeTab === tab1 && styles.activeText]}>{tab1}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === tab2 ? styles.activeTab : styles.inactiveTab]}
        onPress={() => {
          setActiveTab(tab2)
          onMyResponsesPress()
        }}
      >
        <Text style={[styles.text, activeTab === tab2 && styles.activeText]}>{tab2}</Text>
      </TouchableOpacity>
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
  inactiveTab: {
    // backgroundColor: '#f5f5f5'
  },
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

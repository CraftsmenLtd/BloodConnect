import React from 'react'
import { Text, View, StyleSheet } from 'react-native'

interface WarningProps {
  text: string;
  showWarning: boolean;
}

const Warning: React.FC<WarningProps> = ({ text, showWarning }) => {
  return (
    <>
      {showWarning && text.trim() !== '' && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            Warning: {text}
          </Text>
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#FFCC00',
    borderRadius: 8,
    backgroundColor: '#FFF4D9',
    marginVertical: 10
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 10,
    color: '#FF8C00'
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#FF8C00',
    lineHeight: 18
  }
})

export default Warning

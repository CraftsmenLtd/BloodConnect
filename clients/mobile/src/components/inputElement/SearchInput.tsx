import React, { useState, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Keyboard, ScrollView } from 'react-native'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { Theme } from '../../setup/theme'
import { commonStyles } from './commonStyles'
import { LocationService } from '../../LocationService/LocationService'
import fetchClient from '../../setup/clients/apiClient'

interface SearchInputProps {
  label: string;
  name: string;
  error?: string | null;
  isRequired?: boolean;
  onChangeText: (name: string | undefined, text: string) => void;
  isVisible: string;
  setIsVisible: (name: string) => void;
}

const locationService = new LocationService(fetchClient)

export const SearchInput = ({ name, label, onChangeText, isVisible, setIsVisible, error, isRequired = false }: SearchInputProps) => {
  const styles = createStyles(useTheme())
  const [valueT, setValue] = useState('')
  const [options, setOptions] = useState<{ lat: number; lon: number; name: string }[]>([])
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleSelect = (item: { lat: number; lon: number; name: string }) => {
    setValue(item.name)
    onChangeText(name, item.name)
    setIsVisible('')
    Keyboard.dismiss()
  }

  const getOptions = async (value: string) => {
    try {
      const response = await locationService.getLocationAndNearbyPlaces(value)
      setOptions(response)
      console.log(response)
    } catch (error) {
      setOptions([])
      console.log(error)
    }
  }

  const searchOnChangeHandler = (value: string) => {
    setValue(value)
    onChangeText(name, value)
    setIsVisible(name)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      getOptions(value)
    }, 500)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {isRequired && <Text style={styles.asterisk}> *</Text>}
      </Text>
      <TouchableOpacity style={styles.dropdown} onPress={() => { setIsVisible(name) }}>
        <TextInput
          placeholder='Search Location'
          value={valueT}
          onChangeText={searchOnChangeHandler}
          onFocus={() => { setIsVisible(name) }}
          style={styles.input}
        />
      </TouchableOpacity>

      {(isVisible === name && options.length > 0) && (
        <View style={styles.dropdownOptionsContainer}>
          <ScrollView style={styles.scrollView} nestedScrollEnabled={true}>
            {options.map((item, index) => (
              <TouchableOpacity key={`${item.name}-${index}`} style={styles.option} onPress={() => { handleSelect(item) }}>
                <Text style={styles.optionText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      {error !== null && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  ...commonStyles(theme),
  label: {
    fontSize: 16,
    marginBottom: 5
  },
  container: {
    width: '100%',
    position: 'relative',
    marginVertical: 4
  },
  dropdown: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff'
  },
  input: {
    height: 40,
    fontSize: 16
  },
  dropdownOptionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    width: '100%',
    zIndex: 33,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    maxHeight: 200
  },
  scrollView: {
    maxHeight: 200
  },
  option: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  },
  optionText: {
    fontSize: 16
  }
})

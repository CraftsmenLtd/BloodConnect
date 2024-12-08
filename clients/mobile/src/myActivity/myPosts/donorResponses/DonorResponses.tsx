import React from 'react'
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native'

type DonorItem = {
  donorId: string;
  donorName: string;
}

type DonorResponsesProps = {
  acceptedDonors: DonorItem[];
  handlePressDonor: (item: string) => void;
}

const DonorResponses = ({ acceptedDonors, handlePressDonor }: DonorResponsesProps) => {
  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      {acceptedDonors.length === 0
        ? (
          <View style={styles.centeredContainer}>
            <Text style={styles.noDonorText}>No donors have responded yet.</Text>
          </View>
          )
        : (
          <View style={{ marginTop: 20, backgroundColor: 'white' }}>
            <View style={styles.container}>
              <Text style={styles.title}>Donors Who Responded</Text>
              <FlatList
                data={acceptedDonors}
                keyExtractor={(item) => item.donorId}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.donorItem}
                    onPress={() => { handlePressDonor(item.donorId) }}
                  >
                    <Image
                      source={{ uri: 'https://avatar.iran.liara.run/public/boy?username=Ash' }}
                      style={styles.avatar}
                    />
                    <View style={styles.textContainer}>
                      <Text style={styles.name}>{item.donorName}</Text>
                      <Text style={styles.status}>New blood donor</Text>
                    </View>
                    <Text style={styles.arrow}>&gt;</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
          )
      }
    </View>
  )
}

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  noDonorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  },
  container: {
    padding: 16
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  donorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12
  },
  textContainer: {
    flex: 1
  },
  name: {
    fontSize: 16,
    fontWeight: '500'
  },
  status: {
    fontSize: 12,
    color: '#888'
  },
  arrow: {
    fontSize: 20,
    color: '#007bff'
  }
})

export default DonorResponses

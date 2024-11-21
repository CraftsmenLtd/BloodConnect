import React, { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native'
import ToggleTabs from '../components/tab/ToggleTabs'
import { DetailPostRouteProp, DetailPostScreenNavigationProp } from '../setup/navigation/navigationTypes'
import PostCard from '../components/donation/PostCard'
import { SCREENS } from '../setup/constant/screens'
import { DonationData } from './useMyActivity'

interface DetailProps {
  navigation: DetailPostScreenNavigationProp;
  route: DetailPostRouteProp;
}

const Detail = ({ navigation, route }: DetailProps) => {
  const { data, tab } = route.params
  const [currentPage, setCurrentPage] = useState(tab ?? 'Detail')

  const handlePressDonor = (donor) => {
    navigation.navigate(SCREENS.DONAR_PROFILE, { donarId: donor.donorId })
  }

  const handleTabPress = (tab: string): void => {
    setCurrentPage(tab)
  }
  const updatePost = (donationData: DonationData): void => {
    navigation.navigate(SCREENS.DONATION, { data: { ...donationData }, isUpdating: true })
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 8, backgroundColor: 'white', paddingVertical: 16, marginBottom: -18.5 }}>
        <ToggleTabs
          tabs={['Detail', 'Responses']}
          onTabPress={handleTabPress}
          initialActiveTab={tab}
        />
      </View>
      {currentPage === 'Detail'
        ? (
          <View style={{ marginTop: 20, backgroundColor: 'white', flex: 1 }}>
            <PostCard post={data} showContactNumber showDescription showPatientName showTransportInfo showButton={false} updateHandler={updatePost} />
          </View>
        )
        : (
          <View style={{ marginTop: 20, backgroundColor: 'white' }}>
            <View style={styles.container}>
              <Text style={styles.title}>Donor who responded</Text>
              <FlatList
                data={data.acceptedDonors}
                keyExtractor={(item) => item.donorId}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.donorItem} onPress={() => { handlePressDonor(item) }}>
                    <Image source={{ uri: 'https://avatar.iran.liara.run/public/boy?username=Ash' }} style={styles.avatar} />
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
        )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 10
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
    marginRight: 10
  },
  textContainer: {
    flex: 1
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  status: {
    fontSize: 14,
    color: '#888'
  },
  arrow: {
    fontSize: 18,
    color: '#888'
  }
})

export default Detail

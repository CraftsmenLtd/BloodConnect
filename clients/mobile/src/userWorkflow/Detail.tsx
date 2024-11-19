import React, { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native'
import ToggleTabs from '../components/tab/ToggleTabs'
import { MyPosts } from './MyPosts'
import { DetailPostRouteProp, DetailPostScreenNavigationProp } from '../setup/navigation/navigationTypes'
import PostCard from '../components/donation/PostCard'
import { SCREENS } from '../setup/constant/screens'

interface DetailProps {
  navigation: DetailPostScreenNavigationProp;
  route: DetailPostRouteProp;
}

const donorsData = [
  { id: 1, name: 'Sufi Ahmed', status: '3 times blood donor', image: 'https://avatar.iran.liara.run/public/boy?username=Ash' },
  { id: 2, name: 'Diponkar', status: 'New blood donor', image: 'https://avatar.iran.liara.run/public/girl?username=Ash' },
  { id: 3, name: 'Sultan Khaja', status: 'New blood donor', image: 'https://avatar.iran.liara.run/public/boy?username=uno' }
]

const Detail = ({ navigation, route }: DetailProps) => {
  const { data } = route.params
  const [currentPage, setCurrentPage] = useState('Detail')

  const handlePressDonor = (donor) => {
    navigation.navigate(SCREENS.DONAR_PROFILE)
    console.log('Donor pressed:', donor)
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 8, backgroundColor: 'white', paddingVertical: 16, marginBottom: -18.5 }}>
        <ToggleTabs
          tab1='Detail'
          tab2='Responses'
          onMyPostsPress={() => { setCurrentPage('Detail') }}
          onMyResponsesPress={() => { setCurrentPage('Responses') }}
        />
      </View>
      {currentPage === 'Detail'
        ? (
          <View style={{ marginTop: 20, backgroundColor: 'white', flex: 1 }}>
            {/* <Text>HELOO</Text> */}
            <PostCard post={data} showContactNumber showDescription showPatientName showTransportInfo showButton={false} />
            {/* <MyPosts /> */}
          </View>
          )
        : (
          <View style={{ marginTop: 20, backgroundColor: 'white' }}>
            <View style={styles.container}>
              <Text style={styles.title}>Donor who responded</Text>
              <FlatList
                data={donorsData}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.donorItem} onPress={() => { handlePressDonor(item) }}>
                    <Image source={{ uri: item.image }} style={styles.avatar} />
                    <View style={styles.textContainer}>
                      <Text style={styles.name}>{item.name}</Text>
                      <Text style={styles.status}>{item.status}</Text>
                    </View>
                    <Text style={styles.arrow}>&gt;</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
            {/* <Text>Showing Responses content</Text> */}
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

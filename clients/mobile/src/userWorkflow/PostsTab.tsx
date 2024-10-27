import React from 'react'
import { FlatList, Text, TouchableOpacity, View, StyleSheet, Image } from 'react-native'
import { PostCard } from './PostCard'
import { SCREENS } from '../setup/constant/screens'

const posts = [
  {
    requestPostId: '01JAQJERPBPJ2932BZEKK32GV9',
    patientName: 'John Doe',
    neededBloodGroup: 'O-',
    bloodQuantity: '2 Bags',
    urgencyLevel: 'urgent',
    location: 'Baridhara, Dhaka',
    latitude: 23.7936,
    longitude: 90.4043,
    donationDateTime: '2024-10-28T15:30:00Z',
    contactNumber: '+880123456789',
    transportationInfo: 'Car available',
    shortDescription: 'Need blood urgently for surgery.'
  }
]

const PostsTab = ({ navigation }) => {
  const createPost = () => {
    navigation.navigate(SCREENS.DONATION, { data: null, isUpdating: false })
  }

  const updatePost = (donationData) => {
    navigation.navigate(SCREENS.DONATION, { data: { seekerId: 'lkjhasdfka-qrwerie-sfsdl6usdf', ...donationData }, isUpdating: true })
  }
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={{ uri: 'https://via.placeholder.com/40' }} style={styles.profileImage} />
        <TouchableOpacity style={styles.createPostButton} onPress={createPost}>
          <Text style={styles.createPostText}>Create Post</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={posts}
        renderItem={({ item }) => <PostCard post={item} updateHandler={() => { updatePost(item) }} />}
        keyExtractor={item => item.requestPostId}
        contentContainerStyle={styles.postList}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
    // backgroundColor: '#fff',
    // paddingHorizontal: 10
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20
  },
  createPostButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 25
  },
  createPostText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  postList: {
    paddingBottom: 10
  }
})

export default PostsTab

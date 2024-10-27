import React, { useEffect, useState } from 'react'
import { FlatList, Text, TouchableOpacity, View, StyleSheet, Image } from 'react-native'
import { PostCard } from './PostCard'
import { SCREENS } from '../../setup/constant/screens'
import { getDonationList } from '../donationService'
import { BloodDonationRecord } from '../types'
import { useFetchClient } from '../../setup/clients/useFetchClient'
import { DonationPostsScreenNavigationProp } from '../../setup/navigation/navigationTypes'

export type DonationData = Omit<BloodDonationRecord, 'reqPostId' | 'latitude' | 'longitude'> & {
  requestPostId: string;
}

interface DonationPostsProps {
  navigation: DonationPostsScreenNavigationProp;
}
const DonationPosts = ({ navigation }: DonationPostsProps) => {
  const fetchClient = useFetchClient()
  const [donaitonPosts, setDonationsPost] = useState<DonationData[]>([])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/space-before-function-paren
    const fetchData = async () => {
      try {
        const response = await getDonationList({}, fetchClient)
        if (response.data !== undefined && response.data.length > 0) {
          const formattedDonations = formatDonations(response.data)
          setDonationsPost(formattedDonations)
        } else {
          setDonationsPost([])
        }
      } catch (error) {
      }
    }
    void fetchData()
  }, [])

  function formatDonations(requests: BloodDonationRecord[]): DonationData[] {
    return requests.map(request => ({
      requestPostId: request.reqPostId ?? '',
      patientName: request.patientName ?? '',
      neededBloodGroup: request.neededBloodGroup ?? '',
      bloodQuantity: formatBloodQuantity(request.bloodQuantity),
      urgencyLevel: request.urgencyLevel ?? '',
      location: request.location ?? '',
      donationDateTime: request.donationDateTime ?? new Date().toISOString(),
      contactNumber: request.contactNumber ?? '',
      transportationInfo: request.transportationInfo ?? '',
      shortDescription: request.shortDescription ?? ''
    }))
  }

  function formatBloodQuantity(bloodQuantity: string | null | undefined): string {
    if (bloodQuantity !== '' && bloodQuantity !== null && bloodQuantity !== undefined) {
      const quantity = +bloodQuantity

      if (quantity === 1) {
        return `${quantity} Bag`
      } else if (quantity > 1) {
        return `${quantity} Bags`
      }
    }
    return ''
  }

  const createPost = () => {
    navigation.navigate(SCREENS.DONATION, { data: null, isUpdating: false })
  }

  const updatePost = (donationData: DonationData) => {
    navigation.navigate(SCREENS.DONATION, { data: { ...donationData }, isUpdating: true })
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
        data={donaitonPosts}
        renderItem={({ item }) => <PostCard post={item} updateHandler={updatePost} />}
        keyExtractor={item => item.requestPostId}
        contentContainerStyle={styles.postList}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
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

export default DonationPosts

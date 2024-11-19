import Posts from '../components/donation/Posts'
import { Text, View } from 'react-native'
import { useDonationPosts } from '../donationWorkflow/donationPosts/useDonationPosts'
import { useMyActivity } from './useMyActivity'
import PostCard from '../components/donation/PostCard'

export const MyPosts = () => {
  const {
    errorMessage,
    createPost,
    updatePost,
    donationPosts,
    loading,
    detailHandler
  } = useMyActivity()
  return (
    <View>
      <Posts donationPosts={donationPosts} loading={loading} errorMessage={errorMessage} updatePost={updatePost} detailHandler={detailHandler} />

    </View>
  )
}

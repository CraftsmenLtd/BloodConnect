import { useState } from 'react'
import { View, Text } from 'react-native'
import ToggleTabs from '../components/tab/ToggleTabs'
import { MyPosts } from './MyPosts'

const MyActivityTab = () => {
  const [currentPage, setCurrentPage] = useState('posts')
  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 8, backgroundColor: 'white', paddingVertical: 16, marginBottom: -18.5 }}>
        <ToggleTabs
          tab1='My Posts'
          tab2='My Responses'
          onMyPostsPress={() => { setCurrentPage('posts') }}
          onMyResponsesPress={() => { setCurrentPage('responses') }}
        />
      </View>
      {currentPage === 'posts'
        ? (
          <View style={{ marginTop: 20 }}>
            <MyPosts />
          </View>
        )
        : (
          <View style={{ marginTop: 20 }}>
            <Text>Showing My Responses content</Text>
          </View>
        )}
    </View>
  )
}

export default MyActivityTab

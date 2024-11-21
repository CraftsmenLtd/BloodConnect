import { View, Text } from 'react-native'
import ToggleTabs from '../components/tab/ToggleTabs'
import { MyPosts } from './MyPosts'
import { useMyActivity } from './useMyActivity'

const MyActivityTab = () => {
  const { currentPage, setCurrentPage, handleTabPress } = useMyActivity()
  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 8, backgroundColor: 'white', paddingVertical: 16, marginBottom: -18.5 }}>
        <ToggleTabs
          tabs={['My Posts', 'My Responses']}
          onTabPress={handleTabPress}
          initialActiveTab="My Posts"
        />
        {/* <ToggleTabs
          tab1='My Posts'
          tab2='My Responses'
          onMyPostsPress={() => { setCurrentPage('posts') }}
          onMyResponsesPress={() => { setCurrentPage('responses') }}
        /> */}
      </View>
      {currentPage === 'My Posts'
        ? <View style={{ marginTop: 20 }}>
          <MyPosts />
        </View>
        : <View style={{ marginTop: 20 }}>
          <Text>Showing My Responses content</Text>
        </View>
      }
    </View>
  )
}

export default MyActivityTab

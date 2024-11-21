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
      </View>
      {currentPage === 'My Posts'
        ? <View style={{ marginTop: 20 }}>
          <MyPosts />
        </View>
        : <View style={{ marginTop: 20, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'red', fontSize: 16, fontWeight: 'bold' }}>This feature is coming soon.</Text>
        </View>
      }
    </View>
  )
}

export default MyActivityTab

import React from 'react'
import type { ImageStyle, StyleProp } from 'react-native'
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native'
import { COMMON_URLS } from '../../../setup/constant/commonUrls'
import { useTheme } from '../../../setup/theme/hooks/useTheme'
import type { Theme } from '../../../setup/theme'

export type DonorItem = {
  donorId: string;
  donorName: string;
}

type DonorResponsesProps = {
  acceptedDonors: DonorItem[];
  handlePressDonor: (item: string) => void;
  // When provided (chat rollout on), each donor row gets a Chat button opening that donor's channel.
  onChatPress?: (donorId: string) => void;
}

const DonorResponses = ({ acceptedDonors, handlePressDonor, onChatPress }: DonorResponsesProps) => {
  const styles = createStyles(useTheme())

  return (
    <View style={styles.rootContainer}>
      {acceptedDonors.length === 0
        ? <View style={styles.centeredContainer}>
          <Text style={styles.noDonorText}>No donors have responded yet.</Text>
        </View>
        : <View style={styles.responseContainer}>
          <View style={styles.container}>
            <Text style={styles.title}>Donors Who Responded</Text>
            <FlatList
              data={acceptedDonors}
              keyExtractor={(item) => item.donorId}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.donorItem,
                    index === acceptedDonors.length - 1 && styles.donorItemLast
                  ]}
                  onPress={() => { handlePressDonor(item.donorId) }}>
                  <Image
                    source={{ uri: COMMON_URLS.PROFILE_AVATAR }}
                    style={styles.avatar as StyleProp<ImageStyle>} />
                  <View style={styles.textContainer}>
                    <Text style={styles.name}>{item.donorName}</Text>
                    <Text style={styles.status}>New blood donor</Text>
                  </View>
                  {onChatPress !== undefined && (
                    <TouchableOpacity
                      style={styles.chatButton}
                      onPress={() => { onChatPress(item.donorId) }}>
                      <Text style={styles.chatButtonText}>Chat</Text>
                    </TouchableOpacity>
                  )}
                  <Text style={styles.arrow}>&gt;</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      }
    </View>
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    rootContainer: {
      flex: 1,
      backgroundColor: theme.colors.white
    },
    centeredContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },
    noDonorText: {
      fontSize: 16,
      color: theme.colors.grey,
      textAlign: 'center'
    },
    responseContainer: {
      backgroundColor: theme.colors.white
    },
    container: {
      padding: 16
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
      color: theme.colors.textPrimary
    },
    donorItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.lightGrey
    },
    donorItemLast: {
      borderBottomWidth: 0,
      borderBottomColor: 'transparent'
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
      fontWeight: '500',
      color: theme.colors.textPrimary
    },
    status: {
      fontSize: 12,
      color: theme.colors.darkGrey
    },
    arrow: {
      fontSize: 20,
      color: theme.colors.primary
    },
    chatButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      marginRight: 12
    },
    chatButtonText: {
      fontSize: 13,
      color: theme.colors.primary,
      fontWeight: '600'
    }
  })

export default DonorResponses

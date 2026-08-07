import React from 'react'
import type { ImageStyle, StyleProp } from 'react-native'
import { View, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native'
import { Text } from '../../../components/text/AppText'
import InitialsAvatar from '../../../components/avatar/InitialsAvatar'
import { useTheme } from '../../../setup/theme/hooks/useTheme'
import type { Theme } from '../../../setup/theme'
import { spacing, radius } from '../../../setup/theme/tokens'
import useDonorResponses from './useDonorResponses'

const AVATAR_SIZE = 40

export type DonorItem = {
  donorId: string;
  donorName: string;
}

type DonorResponsesProps = {
  acceptedDonors: DonorItem[];
  handlePressDonor: (item: string) => void;
}

const DonorResponses = ({ acceptedDonors, handlePressDonor }: DonorResponsesProps) => {
  const styles = createStyles(useTheme())
  const donorDetails = useDonorResponses(acceptedDonors)

  return (
    <View style={styles.rootContainer}>
      {acceptedDonors.length === 0
        ? <View style={styles.centeredContainer}>
          <Text variant="body" style={styles.noDonorText}>No donors have responded yet.</Text>
        </View>
        : <View style={styles.responseContainer}>
          <View style={styles.container}>
            <Text variant="h3" style={styles.title}>Donors Who Responded</Text>
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
                  {donorDetails[item.donorId]?.profilePicture !== undefined
                    ? (
                      <Image
                        source={{ uri: donorDetails[item.donorId].profilePicture }}
                        style={styles.avatar as StyleProp<ImageStyle>} />
                    )
                    : (
                      <View style={styles.avatar as StyleProp<ImageStyle>}>
                        <InitialsAvatar name={item.donorName} size={AVATAR_SIZE} />
                      </View>
                    )}
                  <View style={styles.textContainer}>
                    <Text variant="body" style={styles.name}>{item.donorName}</Text>
                    {donorDetails[item.donorId]?.area !== undefined && (
                      <Text variant="caption" style={styles.status}>
                        {donorDetails[item.donorId].area}
                      </Text>
                    )}
                  </View>
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
      backgroundColor: theme.colors.surface
    },
    centeredContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },
    noDonorText: {
      color: theme.colors.textTertiary,
      textAlign: 'center'
    },
    responseContainer: {
      backgroundColor: theme.colors.surface
    },
    container: {
      padding: spacing.lg
    },
    title: {
      marginBottom: spacing.md,
      color: theme.colors.textPrimary
    },
    donorItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderStrong
    },
    donorItemLast: {
      borderBottomWidth: 0,
      borderBottomColor: 'transparent'
    },
    avatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: radius.xl,
      marginRight: spacing.md,
      overflow: 'hidden'
    },
    textContainer: {
      flex: 1
    },
    name: {
      fontWeight: '500',
      color: theme.colors.textPrimary
    },
    status: {
      color: theme.colors.textSecondary
    },
    arrow: {
      fontSize: 20,
      color: theme.colors.primary
    }
  })

export default DonorResponses

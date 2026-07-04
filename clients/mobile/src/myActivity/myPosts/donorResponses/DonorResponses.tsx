import React from 'react'
import type { ImageStyle, StyleProp } from 'react-native'
import { View, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native'
import { Text } from '../../../components/text/AppText'
import { COMMON_URLS } from '../../../setup/constant/commonUrls'
import { useTheme } from '../../../setup/theme/hooks/useTheme'
import type { Theme } from '../../../setup/theme'
import { spacing, radius } from '../../../setup/theme/tokens'

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
                  <Image
                    source={{ uri: COMMON_URLS.PROFILE_AVATAR }}
                    style={styles.avatar as StyleProp<ImageStyle>} />
                  <View style={styles.textContainer}>
                    <Text variant="body" style={styles.name}>{item.donorName}</Text>
                    <Text variant="caption" style={styles.status}>New blood donor</Text>
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
      width: 40,
      height: 40,
      borderRadius: radius.xl,
      marginRight: spacing.md
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

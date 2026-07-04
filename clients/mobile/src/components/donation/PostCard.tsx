import React, { useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  ViewStyle,
  StyleProp,
  ImageStyle
} from 'react-native'
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Dimensions
} from 'react-native'
import { Text } from '../text/AppText'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { formatBloodQuantity } from '../../donationWorkflow/donationHelpers'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import type { Theme } from '../../setup/theme'
import { Button } from '../button/Button'
import type { DonationData } from '../../donationWorkflow/donationPosts/useDonationPosts'
import type { StatusType } from '../../donationWorkflow/types'
import { STATUS, UrgencyLevel } from '../../donationWorkflow/types'
import StatusBadge from './StatusBadge'
import Badge from '../badge'
import GenericModal from '../modal'
import { openMapLocation } from '../../utility/mapUtils'
import { openSafetyReport } from '../../utility/safetyReport'
import { spacing, radius } from '../../setup/theme/tokens'

export type PostCardDisplayOptions = {
  showContactNumber?: boolean;
  showDescription?: boolean;
  showTransportInfo?: boolean;
  showPatientName?: boolean;
  showButton?: boolean;
  showHeader?: boolean;
  showOptions?: boolean;
  showPostUpdatedOption?: boolean;
  showStatus?: boolean;
  statusValue?: StatusType;
}

type PostCardProps = {
  post: DonationData;
  updateHandler?: (donationData: DonationData) => void;
  detailHandler?: (donationData: DonationData) => void;
  cancelHandler?: (donationData: DonationData) => void;
  isLoading?: boolean;
} & PostCardDisplayOptions

type DropdownPosition = {
  top: number;
  right: number;
}

export const PostCard: React.FC<PostCardProps> = React.memo(({
  post,
  updateHandler,
  detailHandler,
  cancelHandler,
  showContactNumber = false,
  showDescription = true,
  showTransportInfo = false,
  showPatientName = false,
  showButton = true,
  showHeader = true,
  showOptions = true,
  showPostUpdatedOption = true,
  showStatus = false,
  isLoading = false,
  statusValue = null
}) => {
  const theme = useTheme()
  const { t } = useTranslation()
  const styles = createStyles(theme)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isModalOpen, setModalOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({ top: 0, right: 0 })
  const iconRef = useRef<View>(null)
  const { height: windowHeight } = Dimensions.get('window')

  const handleToggleDropdown = useCallback(() => {
    if (!showDropdown && (iconRef.current !== null)) {
      iconRef.current.measureInWindow((_, pageY, __, height) => {
        const top = pageY + height
        const adjustedTop = Math.min(top, windowHeight - 100)
        setDropdownPosition({
          top: adjustedTop,
          right: 20
        })
      })
    }
    setShowDropdown((prev) => !prev)
  }, [showDropdown, windowHeight])

  const handleCloseDropdown = useCallback(() => {
    setShowDropdown(false)
  }, [])

  const handleUpdate = useCallback(() => {
    updateHandler?.(post)
    handleCloseDropdown()
  }, [post, updateHandler])

  const handleCancel = useCallback(() => {
    cancelHandler?.(post)
    if (!isLoading) {
      closeModal()
    }
  }, [post, cancelHandler])

  const handleReport = useCallback(() => {
    handleCloseDropdown()
    void openSafetyReport(post.requestPostId)
  }, [post.requestPostId, handleCloseDropdown])

  const openModal = () => {
    handleCloseDropdown()
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
  }

  const formatDateTime = (date: string) => {
    const dateObj = new Date(date)

    const timeStr = dateObj.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })

    const day = dateObj.getDate()
    const month = dateObj.toLocaleString('en-US', { month: 'short' })
    const year = dateObj.getFullYear()

    return `${timeStr}, ${day} ${month} ${year}`
  }

  const getDropdownStyle = useCallback((): ViewStyle => ({
    ...styles.dropdownContainer,
    top: dropdownPosition.top,
    right: dropdownPosition.right
  }), [dropdownPosition])

  const dropdownItems = [
    { text: 'Update', onPress: handleUpdate },
    { text: 'Cancel', onPress: openModal },
    { text: t('postCard.reportSafety'), onPress: handleReport }
  ]

  const DropdownItem: React.FC<{
    text: string;
    onPress: () => void;
    disabled: boolean;
    isLastItem?: boolean;
  }> = ({ text, onPress, disabled, isLastItem }) => (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.dropdownItem,
        isLastItem !== undefined && isLastItem && styles.dropdownItemLast,
        disabled && styles.buttonDisabled
      ]}
    >
      <Text variant="bodySmall" style={[styles.dropdownText, disabled && styles.textDisabled]}>{text}</Text>
    </TouchableOpacity>
  )

  return (
    <View style={styles.card}>
      {showHeader
        && <View style={styles.cardHeader}>
          <View>
            <Text variant="body" style={styles.userName}>{post.seekerName}</Text>
            <Text variant="caption" style={styles.postTime}>
              {t('donationPosts.postedOn')} {formatDateTime(post.createdAt)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {showStatus && <StatusBadge status={statusValue ?? post.status} />}
            {showOptions
              && <View style={styles.menuContainer}>
                <View ref={iconRef} collapsable={false}>
                  <TouchableOpacity
                    onPress={handleToggleDropdown}
                    style={styles.iconContainer}
                  >
                    <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.textTertiary} />
                  </TouchableOpacity>
                </View>

                <Modal
                  visible={showDropdown}
                  transparent
                  animationType="none"
                  onRequestClose={handleCloseDropdown}
                >
                  <TouchableWithoutFeedback onPress={handleCloseDropdown}>
                    <View style={styles.modalOverlay}>
                      <TouchableWithoutFeedback>
                        <View style={getDropdownStyle()}>
                          {dropdownItems.map((item, index) => (
                            <DropdownItem
                              key={item.text}
                              text={item.text}
                              onPress={item.onPress}
                              disabled={
                                post.status === STATUS.CANCELLED
                                || post.status === STATUS.COMPLETED
                              }
                              isLastItem={index === dropdownItems.length - 1}
                            />
                          ))}
                        </View>
                      </TouchableWithoutFeedback>
                    </View>
                  </TouchableWithoutFeedback>
                </Modal>
                <GenericModal
                  visible={isModalOpen}
                  title={t('modal.confirmation')}
                  message={t('modal.areYouSureYouWantToCancel')}
                  buttons={[
                    {
                      onPress: closeModal,
                      style: {
                        backgroundColor: theme.colors.surfaceVariant,
                        color: theme.colors.textPrimary
                      },
                      text: t('btn.close')
                    },
                    {
                      onPress: handleCancel,
                      style: {
                        backgroundColor: theme.colors.primary
                      },
                      text: t('btn.ok'),
                      loading: isLoading
                    }
                  ]}
                  onClose={closeModal}
                />
              </View>}
          </View>
        </View>
      }
      <View style={styles.bloodInfoWrapper}>
        <View style={styles.bloodInfo}>
          <View style={styles.bloodRow}>
            <MaterialIcons
              name='bloodtype'
              style={styles.bloodImage as StyleProp<ImageStyle>}
              size={32}
            />
            <View style={styles.bloodText}>
              <Text variant="bodySmall" style={styles.lookingForText}>
                {t('donationPosts.lookingFor')}
              </Text>
              <Text variant="body" style={styles.bloodAmount}>
                {
                  formatBloodQuantity(post.bloodQuantity)} {post.requestedBloodGroup} (ve) {t('common.blood')
                }
              </Text>
            </View>
          </View>
          {post.urgencyLevel === UrgencyLevel.URGENT && (
            <Badge
              text={post.urgencyLevel.toUpperCase()}
              containerStyle={styles.urgentBadge}
              textStyle={styles.urgentText}
              iconName='triangle-exclamation'
            />
          )}
        </View>

        <View style={styles.locationTimeContainer}>
          <View style={styles.locationTimeWrapper}>
            <View style={styles.infoSection}>
              <View style={styles.infoHeader}>
                <Ionicons name="location-outline" size={16} color={theme.colors.textTertiary} />
                <Text variant="bodySmall" style={styles.donationInfoPlaceholder}>
                  {t('donationPosts.donationPoint')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => { openMapLocation({ location: post.location }) }}>
                <Text variant="body" style={[styles.description, styles.link]}>{post.location}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.locationTimeWrapper, styles.noBorder]}>
            <View style={styles.infoSection}>
              <View style={styles.infoHeader}>
                <Ionicons name="time-outline" size={16} color={theme.colors.textTertiary} />
                <Text variant="bodySmall" style={styles.donationInfoPlaceholder}>
                  {t('donationPosts.timeDate')}
                </Text>
              </View>
              <Text variant="body" style={styles.description}>{formatDateTime(post.donationDateTime)}</Text>
            </View>
          </View>
        </View>
        {post.contactNumber !== '' && showContactNumber
          && <View style={styles.descriptionContainer}>
            <Text variant="bodySmall" style={styles.donationInfoPlaceholder}>
              {t('donationPosts.contactNumber')}
            </Text>
            <Text variant="body" style={styles.description}>{post.contactNumber}</Text>
          </View>
        }
        {post.patientName !== '' && showPatientName
          && <View style={styles.descriptionContainer}>
            <Text variant="bodySmall" style={styles.donationInfoPlaceholder}>
              {t('donationPosts.nameOfThePatient')}
            </Text>
            <Text variant="body" style={styles.description}>{post.patientName}</Text>
          </View>
        }

        {post.shortDescription !== '' && showDescription
          && <View style={styles.descriptionContainer}>
            <Text variant="bodySmall" style={styles.donationInfoPlaceholder}>
              {t('donationPosts.shortDescription')}
            </Text>
            <Text variant="body" style={styles.description}>{post.shortDescription}</Text>
          </View>
        }
        {post.transportationInfo !== '' && showTransportInfo
          && <View style={styles.descriptionContainer}>
            <Text variant="bodySmall" style={styles.donationInfoPlaceholder}>
              {t('donationPosts.transportationFacilityForTheDonor')}
            </Text>
            <Text variant="body" style={styles.description}>{post.transportationInfo}</Text>
          </View>
        }
      </View>
      {
        Array.isArray(post.acceptedDonors)
        && post.acceptedDonors.length > 0
        && showPostUpdatedOption
        && <>
          <Text variant="body" style={styles.bloodAmount}>Request Update</Text>
          <View style={[styles.bloodInfoWrapper, styles.postUpdate]}>
            <Ionicons name='time-outline' size={20} color={theme.colors.textTertiary} />
            <View>
              <Text variant="bodySmall" style={styles.donationInfoPlaceholder}>
                {t('donationPosts.numberOfDonors')}
              </Text>
              <Text variant="body" style={styles.bloodAmount}>
                {post.acceptedDonors.length} {t('donationPosts.donorsAcceptedYourRequest')}
              </Text>
            </View>
          </View>
        </>
      }
      {showButton && <View style={styles.buttonContainer}>
        <Button
          text={t('common.viewDetails')}
          buttonStyle={styles.buttonStyle}
          textStyle={styles.textStyle}
          onPress={() => { detailHandler?.(post) }}
        />
      </View>}
    </View>
  )
})

const createStyles = (theme: Theme) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    padding: spacing.xl,
    marginBottom: spacing.md,
    position: 'relative'
  },
  link: {
    textDecorationLine: 'underline'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  userName: {
    fontWeight: 'bold'
  },
  postTime: {
    color: theme.colors.textTertiary
  },
  menuContainer: {
    position: 'relative'
  },
  iconContainer: {
    padding: spacing.sm,
    marginRight: -8
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  bloodImage: {
    width: 28,
    height: 28,
    color: theme.colors.bloodRed
  },
  dropdownContainer: {
    position: 'absolute',
    backgroundColor: theme.colors.surface,
    borderRadius: radius.sm,
    ...theme.elevation.md,
    minWidth: 120
  },
  dropdownItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  dropdownItemLast: {
    borderBottomWidth: 0
  },
  dropdownText: {
    color: theme.colors.textPrimary
  },
  buttonDisabled: {
    opacity: 0.5
  },
  textDisabled: {
    color: theme.colors.borderStrong
  },
  bloodInfoWrapper: {
    borderRadius: radius.sm,
    borderColor: theme.colors.border,
    borderWidth: 1,
    marginBottom: spacing.sm
  },
  postUpdate: {
    flexDirection: 'row',
    padding: spacing.sm,
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  bloodInfo: {
    padding: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1
  },
  bloodRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  bloodText: {
    marginLeft: spacing.sm
  },
  lookingForText: {
    color: theme.colors.textSecondary
  },
  bloodAmount: {
    fontWeight: '500'
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.goldenYellow,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg
  },
  urgentText: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginLeft: spacing.xs
  },
  locationTimeContainer: {
    flexDirection: 'row',
    alignItems: 'stretch'
  },
  locationTimeWrapper: {
    width: '50%',
    borderRightColor: theme.colors.border,
    borderRightWidth: 1
  },
  noBorder: {
    borderRightWidth: 0
  },
  infoSection: {
    padding: spacing.sm
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  donationInfoPlaceholder: {
    color: theme.colors.textSecondary
  },
  descriptionContainer: {
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border
  },
  description: {
    marginTop: spacing.xs
  },
  buttonContainer: {
    marginTop: spacing.sm,
    width: '100%'
  },
  buttonStyle: {
    paddingVertical: spacing.md,
    backgroundColor: theme.colors.border
  },
  textStyle: {
    color: theme.colors.textPrimary
  }
})

export default PostCard

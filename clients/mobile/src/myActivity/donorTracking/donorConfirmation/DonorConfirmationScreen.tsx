import { View, StyleSheet, ScrollView } from 'react-native'
import { Text } from '../../../components/text/AppText'
import DonorCard from '../../../components/donation/DonorCard'
import useDonorConfirmation from './useDonorConfirmation'
import { useTheme } from '../../../setup/theme/hooks/useTheme'
import type { Theme } from '../../../setup/theme'
import { Button } from '../../../components/button/Button'
import type { DonorItem } from '../../myPosts/donorResponses/DonorResponses'
import StateAwareRenderer from '../../../components/StateAwareRenderer'
import useCompleteDonation from '../useCompleteDonation'
import { spacing } from '../../../setup/theme/tokens'

const DonorConfirmationScreen = () => {
  const styles = createStyles(useTheme())
  const { donors, selectDonorHandler, selectedDonor, requestPostId, createdAt } = useDonorConfirmation()
  const { executeFunction, loading, error } = useCompleteDonation()

  const ViewToRender = () =>
    <View style={styles.container}>
      <Text variant="h3" style={styles.responseText}>Select the donors who have donated blood</Text>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {donors.map((donor: DonorItem) => (
          <DonorCard
            key={donor.donorId}
            name={donor.donorName}
            isSelected={selectedDonor.includes(donor.donorId)}
            onSelect={() => selectDonorHandler(donor.donorId)}
          />
        ))}
      </ScrollView>

      <View style={styles.footerContainer}>
        {error !== null && <Text variant="bodySmall" style={styles.errorText}>{error}</Text>}
        <Button
          text="Confirm"
          onPress={() => { void executeFunction(selectedDonor, requestPostId, createdAt) }}
          loading={loading}
          disabled={loading}
        />
      </View>
    </View>

  return <StateAwareRenderer errorMessage={error} data={donors} ViewComponent={ViewToRender} />
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface
  },
  scrollContainer: {
    paddingBottom: spacing.lg
  },
  responseText: {
    marginBottom: spacing.lg
  },
  footerContainer: {
    marginTop: spacing.lg
  },
  errorText: {
    color: theme.colors.primary,
    marginBottom: spacing.sm,
    textAlign: 'center'
  }
})

export default DonorConfirmationScreen

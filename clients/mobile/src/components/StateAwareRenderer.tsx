import React from 'react'
import { StyleSheet } from 'react-native'
import { Text } from './text/AppText'
import { useTheme } from '../setup/theme/hooks/useTheme'
import Loader from './loaders/loader'
import type { Theme } from '../setup/theme'
import { spacing } from '../setup/theme/tokens'

type StateAwareRendererProps = {
  loading?: boolean;
  errorMessage: string | null;
  showEmptyMessageForEmptyArray?: boolean;
  data: unknown;
  LoadingComponent?: React.ReactElement;
  ErrorComponent?: React.ReactElement;
  EmptyComponent?: React.ReactElement;
  // Prefer the function form: it is invoked only after the loading, error and empty
  // guards below have passed, so the view may assume `data` is present. Passing an
  // already-built element means it is evaluated before those guards run.
  ViewComponent: React.ReactNode | (() => React.ReactNode);
}

const StateAwareRenderer: React.FC<StateAwareRendererProps> = ({
  loading,
  errorMessage,
  data,
  LoadingComponent,
  ErrorComponent,
  EmptyComponent,
  ViewComponent,
  showEmptyMessageForEmptyArray = false
}) => {
  const styles = createStyles(useTheme())

  if (loading !== undefined && loading) {
    return LoadingComponent ?? <Loader />
  }

  if (errorMessage !== null || ErrorComponent !== undefined) {
    return ErrorComponent ?? <Text variant="body" style={[styles.messageText, styles.errorMessage]}>{errorMessage}</Text>
  }

  const isEmpty = (data: unknown): boolean => {
    if (data === null || data === undefined) return true
    if (typeof data === 'string') return data.trim() === ''
    if (Array.isArray(data)) return data.length === 0
    if (typeof data === 'object') return Object.keys(data).length === 0

    return false
  }

  if (isEmpty(data) && (showEmptyMessageForEmptyArray || !Array.isArray(data))) {
    return EmptyComponent ?? <Text variant="body" style={styles.messageText}>No items found.</Text>
  }

  return <>{typeof ViewComponent === 'function' ? ViewComponent() : ViewComponent}</>
}

const createStyles = (theme: Theme) => StyleSheet.create({
  messageText: {
    textAlign: 'center',
    marginTop: spacing.xl,
    color: theme.colors.textSecondary
  },
  errorMessage: {
    color: theme.colors.primary
  }
})

export default StateAwareRenderer

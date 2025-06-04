import React from 'react'
import { useTheme } from '../../setup/theme/hooks/useTheme'

export const loaderHOC = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => (props: P) => {
    const theme = useTheme()

    return <Component {...props} theme={theme} />
  }

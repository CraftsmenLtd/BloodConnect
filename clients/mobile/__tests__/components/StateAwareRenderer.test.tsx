import React from 'react'
import { Text } from 'react-native'
import { render } from '@testing-library/react-native'
import StateAwareRenderer from '../../src/components/StateAwareRenderer'

jest.mock('../../src/setup/theme/hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      textSecondary: '#666666',
      textPrimary: '#000000',
      primary: '#FF4D4D',
      surface: '#FFFFFF'
    },
    typography: { fontFamily: 'Roboto_400Regular' }
  }),
  useIsDark: () => false
}))

describe('StateAwareRenderer', () => {
  const viewFor = (data: { weight: number } | null) => () =>
    <Text>{`BMI ${data!.weight}`}</Text>

  test('should not build the view while loading', () => {
    const buildView = jest.fn(viewFor(null))

    render(
      <StateAwareRenderer
        loading
        errorMessage={null}
        data={null}
        ViewComponent={buildView} />
    )

    expect(buildView).not.toHaveBeenCalled()
  })

  test('should not build the view when an error is present', () => {
    const buildView = jest.fn(viewFor(null))

    render(
      <StateAwareRenderer
        loading={false}
        errorMessage="Failed to fetch donor profile."
        data={null}
        ViewComponent={buildView} />
    )

    expect(buildView).not.toHaveBeenCalled()
  })

  test('should not build the view when data is null', () => {
    const buildView = jest.fn(viewFor(null))

    render(
      <StateAwareRenderer
        loading={false}
        errorMessage={null}
        data={null}
        ViewComponent={buildView} />
    )

    expect(buildView).not.toHaveBeenCalled()
  })

  test('should build the view once data has arrived', () => {
    const donor = { weight: 70 }
    const buildView = jest.fn(viewFor(donor))

    const { getByText } = render(
      <StateAwareRenderer
        loading={false}
        errorMessage={null}
        data={donor}
        ViewComponent={buildView} />
    )

    expect(buildView).toHaveBeenCalled()
    expect(getByText('BMI 70')).toBeTruthy()
  })

  test('should still render an already-built element for existing callers', () => {
    const { getByText } = render(
      <StateAwareRenderer
        loading={false}
        errorMessage={null}
        data={{ weight: 70 }}
        ViewComponent={<Text>prebuilt view</Text>} />
    )

    expect(getByText('prebuilt view')).toBeTruthy()
  })
})

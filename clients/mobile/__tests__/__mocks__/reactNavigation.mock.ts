const mockedNavigate = jest.fn()
const mockDispatch = jest.fn()
const mockReset = jest.fn()

jest.mock('@react-navigation/native', () => {
  const routeParamsContainer = { value: {} }
  const setRouteParams = (params: Record<string, unknown>): void => {
    routeParamsContainer.value = { ...params }
  }

  return {
    useNavigation: () => ({
      navigate: mockedNavigate,
      dispatch: mockDispatch
    }),
    CommonActions: {
      reset: mockReset
    },
    useRoute: () => ({
      get params() {
        return routeParamsContainer.value
      }
    }),
    setRouteParams
  }
})

export { mockedNavigate, mockDispatch, mockReset }
export const { setRouteParams } = jest.requireMock('@react-navigation/native')

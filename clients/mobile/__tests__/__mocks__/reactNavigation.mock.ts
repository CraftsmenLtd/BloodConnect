const mockedNavigate = jest.fn()
const mockDispatch = jest.fn()
const mockReset = jest.fn()

jest.mock('@react-navigation/native', () => {
  let routeParams = {}

  const setRouteParams = (params: Record<string, unknown>): void => {
    routeParams = { ...params }
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
        return routeParams
      }
    }),
    setRouteParams
  }
})

export { mockedNavigate, mockDispatch, mockReset }
export const { setRouteParams } = jest.requireMock('@react-navigation/native')

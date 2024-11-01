const mockedNavigate = jest.fn()
const mockDispatch = jest.fn()

jest.mock('@react-navigation/native', () => {
  return {
    useNavigation: () => ({
      navigate: mockedNavigate,
      dispatch: mockDispatch
    }),
    CommonActions: {
      reset: jest.fn()
    },
    useRoute: () => ({
      params: { email: 'test@example.com' }
    })
  }
})

export { mockedNavigate, mockDispatch }

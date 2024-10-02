const mockedNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  return {
    useNavigation: () => ({
      navigate: mockedNavigate,
    }),
    useRoute: () => ({
      params: { email: 'test@example.com' }, // Mocked route params
    }),
  };
});

export { mockedNavigate };

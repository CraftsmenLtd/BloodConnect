export const noopAsync = async(..._args: unknown[]): Promise<void> => {
  void _args
}
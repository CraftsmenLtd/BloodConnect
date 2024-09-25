import { signOut, signIn } from 'aws-amplify/auth';

export const userSignOut = async (): Promise<void> => {
  await signOut();
};

export const userSignIn = async (email: string, password: string) => {
  return await signIn({
    username: email,
    password,
  });
};
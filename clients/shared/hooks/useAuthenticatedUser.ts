import {
  fetchUserAttributes,
  FetchUserAttributesOutput,
} from 'aws-amplify/auth';
import { useEffect, useState } from 'react';

const useAuthenticatedUser = () => {
  const [user, setUser] = useState<FetchUserAttributesOutput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const currentUser = await fetchUserAttributes();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  return { user, loading };
};

export default useAuthenticatedUser;

import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useFetchData from '@client-commons/hooks/useFetchData';
import { getUser } from '@client-commons/platform/aws/auth/awsAuth';
import FullPageLoader from '../components/loader/FullPageLoader';
import * as RouteConsts from '../../constants/routeConsts';
import DefaultLayout from '../layout/DefaultLayout/DefaultLayout';

export function ProtectedRoute() {
  const [fetchUser, loading, user, ] = useFetchData(getUser);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (loading == true || user == undefined) {
    return <FullPageLoader />;
  }

  if (user == null) {
    return <Navigate to={RouteConsts.LoginPath} />;
  }

  return (
    <DefaultLayout>
      <Outlet />
    </DefaultLayout>
  );
}

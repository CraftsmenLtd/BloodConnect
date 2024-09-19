import { Navigate, Outlet } from 'react-router-dom';
import useAuthenticatedUser from '@shared/hooks/useAuthenticatedUser';
import FullPageLoader from '@presentation/components/loader/FullPageLoader';
import * as RouteConsts from '@constants/routeConsts';
import DefaultLayout from '@presentation/layout/DefaultLayout';

export function ProtectedRoute() {
  const { user, loading } = useAuthenticatedUser();

  if (loading === true) {
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

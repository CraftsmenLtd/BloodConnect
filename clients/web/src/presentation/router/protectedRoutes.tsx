import { Navigate, Outlet } from 'react-router-dom';
import useAuthenticatedUser from '../../hooks/useAuthenticatedUser';
import FullPageLoader from '../components/loader/FullPageLoader';
import * as RouteConsts from '../../constants/routeConsts';
import DefaultLayout from '../layout/DefaultLayout';

export function ProtectedRoute() {
  const { user, loading } = useAuthenticatedUser();

  if (loading) {
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

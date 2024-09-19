import { Navigate, Outlet } from 'react-router-dom';
import FullPageLoader from '@/presentation/components/loader/FullPageLoader';
import * as RouteConsts from '@/constants/routeConsts';
import useAuthenticatedUser from '@/application/hooks/useAuthenticatedUser.ts';
import DefaultLayout from '@/presentation/layout/DefaultLayout';

export function ProtectedRoute() {
  const { user, loading } = useAuthenticatedUser();

  if (loading) {
    return <FullPageLoader />;
  }

  if (!user) {
    return <Navigate to={RouteConsts.LoginPath} />;
  }

  return (
    <DefaultLayout>
      <Outlet />
    </DefaultLayout>
  );
}

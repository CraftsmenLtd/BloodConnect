import { Navigate, Outlet } from 'react-router-dom';
import useFetchData from '../../../../common/hooks/useFetchData';
import { getUser } from '../../../../common/platform/aws/auth/awsAuth';
import FullPageLoader from '../components/loader/FullPageLoader';
import * as RouteConsts from '../../constants/routeConsts';
import DefaultLayout from '../layout/DefaultLayout/DefaultLayout';

export function ProtectedRoute() {
  const [, loading, user, error] = useFetchData(getUser, true);

  
  if (loading == true || (user == undefined && error == null)) {
    return <FullPageLoader />;
  }

  if (user == undefined && error != null) {
    return <Navigate to={RouteConsts.LoginPath} />;
  }

  return (
    <DefaultLayout>
      <Outlet />
    </DefaultLayout>
  );
}

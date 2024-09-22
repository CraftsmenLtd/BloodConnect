import * as RouteConsts from '@web/constants/routeConsts';
import { RouteConfig } from '@web/types/routeConfig';

export const AppRoutes: RouteConfig[] = [
  {
    path: RouteConsts.LoginPath,
    page: RouteConsts.LoginPage,
    protected: false,
  },
  {
    path: RouteConsts.SignupPath,
    page: RouteConsts.SignupPage,
    protected: false,
  },
  {
    path: RouteConsts.DashboardPath,
    page: RouteConsts.DashboardPage,
    protected: true,
  },
];

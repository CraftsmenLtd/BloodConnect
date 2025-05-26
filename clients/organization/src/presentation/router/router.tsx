import React from 'clients/commons/platform/node_modules/@types/react';
import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom';
import FullPageLoader from '../components/loader/FullPageLoader';
import { LoginPath } from '../../constants/routeConsts';
import { Pages } from '../pages';
import { ProtectedRoute } from './protectedRoutes';
import { AppRoutes } from './routes';
import type { RouteConfig } from '../../types/routeConfig';

function RouterConfig() {
  return (
    <BrowserRouter>
      <React.Suspense fallback={<FullPageLoader />}>
        <Routes>
          {AppRoutes.map((route: RouteConfig) => {
            const Component = Pages[route.page];
            if (route.protected) {
              return (
                <Route key={`${route.page}`} element={<ProtectedRoute />}>
                  <Route path={route.path} element={<Component />} />
                </Route>
              );
            }
            return (
              <Route
                key={`${route.page}`}
                path={route.path}
                element={<Component />}
              />
            );
          })}
          {/* Default route that redirects to /login */}
          <Route path="/" element={<Navigate to={LoginPath} />} />
          {/* Catch-all route for undefined paths */}
          <Route path="*" element={<Navigate to={LoginPath} />} />
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  );
}

export default RouterConfig;

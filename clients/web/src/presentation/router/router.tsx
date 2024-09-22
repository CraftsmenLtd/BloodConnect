import React from 'react';
import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom';
import FullPageLoader from '@web/presentation/components/loader/FullPageLoader';
import { LoginPath } from '@web/constants/routeConsts';
import { Pages } from '@web/presentation/pages';
import { ProtectedRoute } from '@web/presentation/router/protectedRoutes';
import { AppRoutes } from '@web/presentation/router/routes';
import { RouteConfig } from '@web/types/routeConfig';

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

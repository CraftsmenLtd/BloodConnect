import React from 'react';

export const Pages: Record<
  string,
  React.LazyExoticComponent<React.FC<object>>
> = {
  Login: React.lazy(async () => import('@web/presentation/pages/auth/Login')),
  Signup: React.lazy(async () => import('@web/presentation/pages/auth/Signup')),
  Dashboard: React.lazy(
    async () => import('@web/presentation/pages/dashboard/Dashboard')
  ),
};

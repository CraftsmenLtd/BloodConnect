import React from 'react';

export const Pages: Record<
  string,
  React.LazyExoticComponent<React.FC<object>>
> = {
  Login: React.lazy(async () => import('@/presentation/pages/auth/Login')),
  Signup: React.lazy(async () => import('@/presentation/pages/auth/Signup')),
  Dashboard: React.lazy(
    async () => import('@/presentation/pages/dashboard/Dashboard')
  ),
};

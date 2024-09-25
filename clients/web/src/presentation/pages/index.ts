import React from 'react';

export const Pages: Record<
  string,
  React.LazyExoticComponent<React.FC<object>>
> = {
  Login: React.lazy(async () => import('./auth/Login')),
  Signup: React.lazy(async () => import('./auth/Signup')),
  Dashboard: React.lazy(
    async () => import('./dashboard/Dashboard')
  ),
};

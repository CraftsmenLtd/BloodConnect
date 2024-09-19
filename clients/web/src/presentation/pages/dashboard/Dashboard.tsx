/* eslint-disable no-console */
import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div
      className="flex justify-center items-center"
      style={{ minHeight: 'calc(100vh - 160px)' }}
    >
      <div className="w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">Dashboard</h1>
      </div>
    </div>
  );
};

export default Dashboard;

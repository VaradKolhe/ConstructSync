import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const MainLayout = () => {
  return (
    <div className="h-screen flex flex-col overflow-hidden industrial-grid bg-white">
      <Header />
      <main className="flex-grow overflow-y-auto relative">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;

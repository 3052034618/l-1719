
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAppStore } from '@/store/useAppStore';

interface LayoutProps {
  children?: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { sidebarCollapsed } = useAppStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main
        className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-60'}`}
      >
        {children || <Outlet />}
      </main>
    </div>
  );
}

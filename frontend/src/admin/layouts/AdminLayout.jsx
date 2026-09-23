import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '../components/AdminSidebar';

// Layout admin: sidebar bên trái + nội dung bên phải
export function AdminLayout() {
  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#e9edf2]">
      <AdminSidebar />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}

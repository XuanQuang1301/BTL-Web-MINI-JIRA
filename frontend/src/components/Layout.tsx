import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";

interface UserPayload {
  id: string;
  email: string;
  role?: string;
  sub?: string;
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserPayload | null>(null);

  const currentUserEmail = user?.email || user?.sub;
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    } else {
      try {
        const decoded = jwtDecode<UserPayload>(token);
        setUser(decoded);
      } catch (error) {
        console.error("Token bị lỗi hoặc hết hạn", error);
        localStorage.removeItem("token");
        navigate("/login");
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const getLinkClass = (path: string) => {
    if (location.pathname === path) {
      return "block py-3 px-4 rounded-lg bg-blue-50 text-blue-600 font-semibold border border-blue-200 shadow-sm transition";
    }
    return "block py-3 px-4 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition";
  };

  return (
    <div className="flex h-screen bg-blue-50 text-gray-800 overflow-hidden">
      {/* --- CỘT SIDEBAR BÊN TRÁI */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-xl z-20 shrink-0">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-3xl font-black text-blue-600 tracking-wider drop-shadow-sm">
            MINI JIRA
          </h2>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <Link to="/dashboard" className={getLinkClass("/")}>
            Bảng điều khiển
          </Link>
          <Link to="/projects" className={getLinkClass("/projects")}>
            Quản lý dự án
          </Link>
          <Link to="/tasks" className={getLinkClass("/tasks")}>
            Công việc của tôi
          </Link>
          <Link to="/timeline" className={getLinkClass("/timeline")}>
            TimeLine
          </Link>
          {/* Them email day de xem được danh sách user nha  */}
          {(currentUserEmail === "thuy@gmail.com" ||
            currentUserEmail === "thuy@gmail.com") && (
            <Link to="/users" className={getLinkClass("/users")}>
              Danh sách người dùng
            </Link>
          )}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full bg-red-50 hover:bg-red-500 text-red-600 hover:text-white py-2 rounded-lg transition font-semibold border border-red-200 hover:border-red-500"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* --- KHU VỰC BÊN PHẢI --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-blue-50">
        {/* 1. THANH NGANG (TOPBAR)*/}
        <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 h-16 flex items-center justify-between px-8 shrink-0 z-10 shadow-sm">
          <div>
            <span className="text-gray-500 text-sm font-medium">
              Hệ thống quản lý dự án
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-gray-800 leading-none">
                {currentUserEmail
                  ? currentUserEmail.split("@")[0]
                  : "Đang tải..."}
              </p>
              <p className="text-xs text-blue-600 mt-1 font-medium">
                {currentUserEmail === "thuy@gmail.com"
                  ? "Quản trị viên"
                  : "Thành viên"}
              </p>
            </div>

            <Link
              to="/profile"
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all border border-blue-200 cursor-pointer uppercase"
              title="Hồ sơ cá nhân"
            >
              {currentUserEmail ? currentUserEmail.charAt(0) : "U"}
            </Link>
          </div>
        </header>

        {/* 2. KHU VỰC NỘI DUNG CHÍNH */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

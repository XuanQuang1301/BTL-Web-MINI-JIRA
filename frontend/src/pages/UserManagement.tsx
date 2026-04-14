import { useState, useEffect } from 'react';
import axios from 'axios';

export default function UserManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:8081/api/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data);
            console.log(users)
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    // Hàm xóa người dùng
    const handleDeleteUser = async (userId: number, userName: string) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa thành viên "${userName}" khỏi hệ thống?`)) return;
        
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:8081/api/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(users.filter(u => u.id !== userId));
            alert("Đã xóa thành viên thành công!");
        } catch (error) {
            alert("Lỗi khi xóa người dùng!");
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    if (isLoading) return <div className="p-10 text-gray-400 animate-pulse font-medium text-sm uppercase tracking-widest">Đang tải danh sách...</div>;

    return (
    <div className="flex flex-col min-h-screen bg-[#f4f7f9] pb-10"> 
        
        <div className="px-8 pt-10 pb-6">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Quản lý thành viên</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Danh sách nhân sự và quản trị hệ thống.</p>
        </div>
        <div className="px-8">
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="p-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] w-2/5">Thành viên</th>
                            <th className="p-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Vai trò</th>
                            <th className="p-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Ngày tham gia</th>
                            <th className="p-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="p-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white text-[10px] font-black uppercase shadow-md group-hover:scale-110 transition-transform">
                                            {user.name.substring(0, 2)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{user.name}</p>
                                            <p className="text-[11px] text-slate-400 font-medium">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-5">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase border ${
                                        user.role === 'ADMIN' 
                                        ? 'bg-rose-50 text-rose-600 border-rose-100' 
                                        : 'bg-blue-50 text-blue-600 border-blue-100'
                                    }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-5 text-center text-[12px] font-bold text-slate-400">
                                    {user.createAt ? new Date(user.createAt).toLocaleDateString('vi-VN') : "15/04/2026"}
                                </td>
                                <td className="p-5 text-right">
                                    <button 
                                        onClick={() => handleDeleteUser(user.id, user.name)}
                                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer - Sát ngay dưới hộp trắng */}
            <div className="mt-6 flex justify-between items-center text-[12px] font-bold text-slate-400 uppercase tracking-tighter">
                <div>Tổng số: <span className="text-slate-900">{users.length}</span> thành viên hệ thống.</div>
            </div>
        </div>
    </div>
);
}
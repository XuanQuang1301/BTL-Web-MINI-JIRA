import { useState, useEffect } from 'react';
import axios from 'axios';

export default function UserManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingId, setLoadingId] = useState<number | null>(null);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:8081/api/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    // Hàm toggle khóa/mở khóa tài khoản
    const handleToggleLock = async (userId: number, userName: string, isLocked: boolean) => {
        const action = isLocked ? 'mở khóa' : 'khóa';
        if (!window.confirm(`Bạn có chắc chắn muốn ${action} tài khoản "${userName}"?`)) return;

        setLoadingId(userId);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`http://localhost:8081/api/users/${userId}/lock`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const newLockedState: boolean = res.data.locked;
            setUsers(users.map(u => u.id === userId ? { ...u, locked: newLockedState } : u));
            alert(res.data.message);
        } catch (error: any) {
            alert(error?.response?.data?.error || 'Lỗi khi thay đổi trạng thái tài khoản!');
        } finally {
            setLoadingId(null);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    if (isLoading) return <div className="p-10 text-gray-400 animate-pulse font-medium text-sm uppercase tracking-widest">Đang tải danh sách...</div>;

    const lockedCount = users.filter(u => u.locked).length;

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
                            <th className="p-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Trạng thái</th>
                            <th className="p-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Ngày tham gia</th>
                            <th className="p-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {users.map((user) => (
                            <tr key={user.id} className={`hover:bg-slate-50/50 transition-colors group ${user.locked ? 'opacity-60' : ''}`}>
                                <td className="p-5">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-[10px] font-black uppercase shadow-md group-hover:scale-110 transition-transform overflow-hidden shrink-0 ${user.locked ? 'bg-slate-400' : 'bg-slate-900'}`}>
                                            {user.avatarUrl ? (
                                                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                user.name.substring(0, 2)
                                            )}
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
                                <td className="p-5 text-center">
                                    {user.locked ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase bg-red-50 text-red-500 border border-red-100">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                                                <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                                            </svg>
                                            Đã khóa
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-100">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M18 1.5c2.9 0 5.25 2.35 5.25 5.25v3.75a.75.75 0 01-1.5 0V6.75a3.75 3.75 0 10-7.5 0v3a3 3 0 013 3v6.75a3 3 0 01-3 3H3.75a3 3 0 01-3-3v-6.75a3 3 0 013-3h9v-3c0-2.9 2.35-5.25 5.25-5.25z" />
                                            </svg>
                                            Hoạt động
                                        </span>
                                    )}
                                </td>
                                <td className="p-5 text-center text-[12px] font-bold text-slate-400">
                                    {user.createAt ? new Date(user.createAt).toLocaleDateString('vi-VN') : "15/04/2026"}
                                </td>
                                <td className="p-5 text-right">
                                    <button
                                        onClick={() => handleToggleLock(user.id, user.name, user.locked)}
                                        disabled={loadingId === user.id}
                                        title={user.locked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed ${
                                            user.locked
                                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                                            : 'bg-slate-100 text-slate-500 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 border border-slate-200'
                                        }`}
                                    >
                                        {loadingId === user.id ? (
                                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                            </svg>
                                        ) : user.locked ? (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M18 1.5c2.9 0 5.25 2.35 5.25 5.25v3.75a.75.75 0 01-1.5 0V6.75a3.75 3.75 0 10-7.5 0v3a3 3 0 013 3v6.75a3 3 0 01-3 3H3.75a3 3 0 01-3-3v-6.75a3 3 0 013-3h9v-3c0-2.9 2.35-5.25 5.25-5.25z" />
                                                </svg>
                                                Mở khóa
                                            </>
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                                    <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                                                </svg>
                                                Khóa
                                            </>
                                        )}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-between items-center text-[12px] font-bold text-slate-400 uppercase tracking-tighter">
                <div>Tổng số: <span className="text-slate-900">{users.length}</span> thành viên hệ thống.</div>
                {lockedCount > 0 && (
                    <div className="flex items-center gap-1.5 text-red-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                        </svg>
                        <span><span className="text-red-500">{lockedCount}</span> tài khoản đang bị khóa.</span>
                    </div>
                )}
            </div>
        </div>
    </div>
);
}
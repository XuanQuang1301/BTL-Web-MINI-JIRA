import { useState } from 'react';
import axios from 'axios';

export default function ChangePasswordModal({ onClose }: any) {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); // Xóa lỗi cũ nếu có

        // Validate cơ bản ở Frontend
        if (newPassword !== confirmPassword) {
            setError("Mật khẩu mới không khớp!");
            return;
        }
        if (newPassword.length < 6) {
            setError("Mật khẩu mới phải có ít nhất 6 ký tự!");
            return;
        }

        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:8081/api/users/profile/password', 
                { oldPassword, newPassword }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            alert("Đổi mật khẩu thành công! Vui lòng đăng nhập lại trong lần tới.");
            onClose();
        } catch (err: any) {
            console.error(err);
            // Hiển thị lỗi từ Backend trả về (Ví dụ: "Mật khẩu cũ sai")
            setError(err.response?.data?.error || "Lỗi khi đổi mật khẩu!");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity">
            <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Đổi mật khẩu</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <form onSubmit={handleSave} className="space-y-4">
                    {/* Hiển thị lỗi nếu có */}
                    {error && (
                        <div className="bg-rose-50 text-rose-600 text-sm font-bold p-3 rounded-lg flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Mật khẩu hiện tại</label>
                        <input 
                            type="password" required value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            placeholder="Nhập mật khẩu cũ..."
                        />
                    </div>
                    <div>
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Mật khẩu mới</label>
                        <input 
                            type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            placeholder="Nhập mật khẩu mới..."
                        />
                    </div>
                    <div>
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Xác nhận mật khẩu mới</label>
                        <input 
                            type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            placeholder="Nhập lại mật khẩu mới..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-4">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 font-medium text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                            Hủy bỏ
                        </button>
                        <button type="submit" disabled={isSaving} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95 min-w-[120px]">
                            {isSaving ? 'Đang xử lý...' : 'Lưu mật khẩu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
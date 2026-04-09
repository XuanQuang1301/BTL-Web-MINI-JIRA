import { useState } from 'react';
import axios from 'axios';

interface Props {
    onClose: () => void;
}

export default function ChangePasswordModal({ onClose }: Props) {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) { setError('Vui lòng điền đầy đủ các trường.'); return; }
        if (newPassword !== confirmPassword) { setError('Mật khẩu mới và xác nhận mật khẩu không khớp.'); return; }
        if (newPassword.length < 6) { setError('Mật khẩu mới phải có ít nhất 6 ký tự.'); return; }

        setIsSaving(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            await axios.patch('http://localhost:8081/api/users/profile/password', 
                { oldPassword, newPassword }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Đã cập nhật mật khẩu thành công! Vui lòng dùng mật khẩu mới cho lần đăng nhập sau.");
            onClose(); 
        } catch (err: any) {
            setError(err.response?.data?.message || 'Mật khẩu cũ không chính xác hoặc lỗi hệ thống.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-md p-8 relative overflow-hidden animate-fade-in-up">
                
                {/* Header Modal */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900">Đổi mật khẩu bảo mật</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-rose-500 p-1 rounded-full hover:bg-rose-50 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Input form */}
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 block">Mật khẩu cũ hiện tại</label>
                        <input 
                            type="password" 
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            placeholder="Nhập mật khẩu bạn đang dùng"
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-300 focus:ring-rose-100 focus:ring-2"
                        />
                    </div>
                    <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 block">Mật khẩu mới</label>
                        <input 
                            type="password" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-300 focus:ring-blue-100 focus:ring-2"
                        />
                    </div>
                    <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 block">Xác nhận mật khẩu mới</label>
                        <input 
                            type="password" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Nhập lại mật khẩu mới"
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-300 focus:ring-blue-100 focus:ring-2"
                        />
                    </div>
                    {error && <p className="text-xs text-rose-500 mt-2 font-medium bg-rose-50 px-3 py-1 rounded-lg border border-rose-100 inline-block">{error}</p>}
                </div>

                <div className="flex justify-end gap-3 mt-8">
                    <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 active:scale-95 transition-all">Hủy bỏ</button>
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all shadow-md active:scale-95 ${
                            isSaving ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800'
                        }`}
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002-2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        {isSaving ? 'Đang cập nhật...' : 'Cập nhật mật khẩu mới'}
                    </button>
                </div>
            </div>
        </div>
    );
}
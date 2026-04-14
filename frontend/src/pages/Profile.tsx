import { useState, useEffect } from 'react';
import axios from 'axios';
import ChangeAvatarModal from '../components/profile/ChangeAvatarModal';
import ChangePasswordModal from '../components/profile/ChangePasswordModal';
export default function Profile() {
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const fetchUserProfile = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:8081/api/users/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchUserProfile(); }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    // --- HÀM LƯU THÔNG TIN ---
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:8081/api/users/profile', user, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Cập nhật thông tin thành công!');
            setIsEditing(false); 
        } catch (error) {
            console.error(error);
            alert('Lỗi khi lưu thông tin!');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        fetchUserProfile(); // Lấy lại data gốc từ DB để xóa các text đã gõ nháp
    };

    if (isLoading) return <div className="p-10 font-bold text-blue-500 animate-pulse">Đang tải thông tin...</div>;
    if (!user) return <div className="p-10 text-red-500 font-bold">Lỗi kết nối hoặc không tìm thấy người dùng!</div>;

    const inputClass = `w-full rounded-md px-4 py-3 outline-none transition-all ${
        isEditing 
        ? 'border border-gray-300 focus:ring-1 focus:ring-blue-500 bg-white' 
        : 'border border-transparent bg-gray-50 text-gray-700 cursor-default pointer-events-none'
    }`;

    return (
        <div className="max-w-5xl mx-auto p-10 bg-white min-h-screen">
            <div className="flex justify-between items-start mb-10 border-b border-gray-100 pb-8">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                        {isEditing ? 'Chỉnh sửa hồ sơ' : 'Thông tin cá nhân'}
                    </h1>
                    <p className="text-gray-400 mt-2 font-medium">Quản lý thông tin và bảo mật tài khoản của bạn.</p>
                </div>
                <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-[3px] border-white shadow-lg bg-gray-100">
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-rose-500 flex items-center justify-center font-black text-3xl text-white">
                                {user.name?.substring(0, 1) || 'U'}
                            </div>
                        )}
                    </div>
                    {isEditing && (
                        <button 
                            onClick={() => setShowAvatarModal(true)}
                            className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md border border-gray-200 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
            <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Họ và tên</label>
                        <input 
                            name="name" 
                            value={user.name || ''} 
                            onChange={handleChange}
                            className={inputClass}
                            readOnly={!isEditing}
                            placeholder="Nhập họ và tên..."
                        />
                    </div>
                    {/* <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Biệt danh (Last Name)</label>
                        <input 
                            className="w-full border border-gray-200 rounded-md px-4 py-3 bg-gray-100 text-gray-500 cursor-not-allowed outline-none"
                            placeholder="Bozorgi" 
                            readOnly
                            title="Không thể thay đổi trường này"
                        />
                    </div> */}
                </div>

                <div className="space-y-2 relative">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Email</label>
                    <div className="relative">
                        <input 
                            value={user.email || ''} 
                            className="w-full border border-gray-200 rounded-md px-4 py-3 bg-gray-100 text-gray-500 pr-10 outline-none cursor-not-allowed"
                            readOnly
                            title="Email không thể thay đổi"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500" title="Email đã xác thực">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Địa chỉ (Address)</label>
                    <input 
                        name="address" 
                        value={user.address || ''} 
                        onChange={handleChange}
                        className={inputClass}
                        readOnly={!isEditing}
                        placeholder={isEditing ? "Nhập địa chỉ của bạn..." : "Chưa cập nhật địa chỉ"}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Số điện thoại</label>
                    <input 
                        name="phoneNumber" 
                        value={user.phoneNumber || ''} 
                        onChange={handleChange}
                        className={inputClass}
                        readOnly={!isEditing}
                        placeholder={isEditing ? "Nhập số điện thoại..." : "Chưa cập nhật số điện thoại"}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Thành phố (City)</label>
                        {isEditing ? (
                            <select 
                                name="city"
                                value={user.city || ''}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-4 py-3 outline-none bg-white cursor-pointer focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="">-- Chọn thành phố --</option>
                                <option value="Hà Nội">Hà Nội</option>
                                <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                                <option value="Đà Nẵng">Đà Nẵng</option>
                            </select>
                        ) : (
                            <input value={user.city || 'Chưa cập nhật'} className={inputClass} readOnly />
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Khu vực (State)</label>
                        {isEditing ? (
                            <select 
                                name="state"
                                value={user.state || ''}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-4 py-3 outline-none bg-white cursor-pointer focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="">-- Chọn vùng --</option>
                                <option value="Miền Bắc">Miền Bắc</option>
                                <option value="Miền Trung">Miền Trung</option>
                                <option value="Miền Nam">Miền Nam</option>
                            </select>
                        ) : (
                            <input value={user.state || 'Chưa cập nhật'} className={inputClass} readOnly />
                        )}
                    </div>
                </div>
                <div className="space-y-2 pt-4">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Mật khẩu (Password)</label>
                    <div className="relative flex gap-4 items-center">
                        <input 
                            type="password"
                            value="********"
                            className="w-full border border-gray-200 rounded-md px-4 py-3 bg-gray-100 text-gray-500 outline-none cursor-not-allowed"
                            readOnly
                        />
                        {isEditing && (
                            <button type="button" 
                            onClick={() => setShowPasswordModal(true)}
                            className="shrink-0 px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-md hover:bg-gray-200 transition-colors text-sm">
                                Đổi mật khẩu
                            </button>
                        )}
                    </div>
                </div>

                {/* --- KHU VỰC NÚT BẤM ĐỘNG --- */}
                <div className="flex gap-4 pt-10 border-t border-gray-100">
                    {!isEditing ? (
                        <button 
                            type="button" 
                            onClick={() => setIsEditing(true)}
                            className="bg-blue-600 text-white font-black py-3.5 px-8 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            Chỉnh sửa hồ sơ
                        </button>
                    ) : (
                        <>
                            <button 
                                type="button" 
                                onClick={handleCancel}
                                className="flex-1 md:flex-none border-2 border-gray-200 text-gray-600 font-bold py-3.5 px-8 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button 
                                type="submit" 
                                disabled={isSaving}
                                className="flex-1 md:flex-none bg-blue-600 text-white font-black py-3.5 px-12 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </>
                    )}
                </div>
            </form>

            {showAvatarModal && (
                <ChangeAvatarModal 
                    currentAvatar={user.avatarUrl} 
                    onClose={() => setShowAvatarModal(false)} 
                    onUpdate={(newUrl: string) => setUser({ ...user, avatarUrl: newUrl })} 
                />
            )}
            {showPasswordModal && (
                <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
            )}
        </div>
    );
}
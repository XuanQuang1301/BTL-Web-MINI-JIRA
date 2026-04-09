import { useState, useEffect } from 'react';
import axios from 'axios';
import ChangeAvatarModal from '../components/profile/ChangeAvatarModal';

export default function Profile() {
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showAvatarModal, setShowAvatarModal] = useState(false);

    const fetchUserProfile = async () => {
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

    if (isLoading) return <div className="p-10">Đang tải...</div>;
    if (!user) return <div className="p-10">Lỗi kết nối!</div>;

    return (
        <div className="max-w-5xl mx-auto p-10 bg-white min-h-screen">
            {/* Header: Title & Avatar */}
            <div className="flex justify-between items-start mb-10">
                <h1 className="text-4xl font-bold text-gray-900">Edit profile</h1>
                <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-100 shadow-sm">
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center font-bold text-xl">
                                {user.name?.substring(0, 1)}
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={() => setShowAvatarModal(true)}
                        className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-md border border-gray-200 hover:bg-gray-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Form */}
            <form className="space-y-6 max-w-3xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block font-bold text-gray-700">First Name</label>
                        <input 
                            name="name" 
                            value={user.name} 
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md px-4 py-3 focus:ring-1 focus:ring-orange-500 outline-none transition"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block font-bold text-gray-700">Last Name</label>
                        <input 
                            className="w-full border border-gray-300 rounded-md px-4 py-3 bg-gray-50 cursor-not-allowed"
                            placeholder="Bozorgi" readOnly
                        />
                    </div>
                </div>

                <div className="space-y-2 relative">
                    <label className="block font-bold text-gray-700">Email</label>
                    <div className="relative">
                        <input 
                            value={user.email} 
                            className="w-full border border-gray-300 rounded-md px-4 py-3 bg-white pr-10 outline-none"
                            readOnly
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block font-bold text-gray-700">Address</label>
                    <input 
                        name="address" 
                        value={user.address || ''} 
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-md px-4 py-3 outline-none focus:border-orange-500"
                        placeholder="33062 Zboncak isle"
                    />
                </div>

                <div className="space-y-2">
                    <label className="block font-bold text-gray-700">Contact Number</label>
                    <input 
                        name="phoneNumber" 
                        value={user.phoneNumber || ''} 
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-md px-4 py-3 outline-none"
                        placeholder="58077.79"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block font-bold text-gray-700">City</label>
                        <select className="w-full border border-gray-300 rounded-md px-4 py-3 outline-none appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1em_1em]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`}}>
                            <option>{user.city || 'Chọn thành phố'}</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="block font-bold text-gray-700">State</label>
                        <select className="w-full border border-gray-300 rounded-md px-4 py-3 outline-none appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1em_1em]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`}}>
                            <option>{user.state || 'Chọn vùng'}</option>
                        </select>
                    </div>
                </div>
                <div className="space-y-2 pt-4">
                    <label className="block font-bold text-gray-700">Password</label>
                    <div className="relative">
                        <input 
                            type="password"
                            value="********"
                            className="w-full border border-gray-300 rounded-md px-4 py-3 outline-none"
                            readOnly
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </span>
                    </div>
                </div>
                <div className="flex gap-4 pt-10">
                    <button type="button" className="flex-1 md:flex-none border border-orange-500 text-orange-500 font-bold py-3 px-12 rounded-md hover:bg-orange-50 transition">
                        Cancel
                    </button>
                    <button type="submit" className="flex-1 md:flex-none bg-orange-600 text-white font-bold py-3 px-16 rounded-md hover:bg-orange-700 transition shadow-lg">
                        Save
                    </button>
                </div>
            </form>

            {showAvatarModal && (
                <ChangeAvatarModal 
                    currentAvatar={user.avatarUrl} 
                    onClose={() => setShowAvatarModal(false)} 
                    onUpdate={(newUrl: string) => setUser({ ...user, avatarUrl: newUrl })} 
                />
            )}
        </div>
    );
}
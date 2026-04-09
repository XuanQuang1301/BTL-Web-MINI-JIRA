import { useState } from 'react';
import axios from 'axios';

export default function ChangeAvatarModal({ currentAvatar, onClose, onUpdate }: any) {
    const [preview, setPreview] = useState(currentAvatar || '');
    const [selectedFile, setSelectedFile] = useState<File | null>(null); 
    const [isSaving, setIsSaving] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file); 
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string); 
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!selectedFile) {
            alert("Vui lòng chọn ảnh!");
            return;
        }

        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            
            const formData = new FormData();
            formData.append('file', selectedFile); 

            const res = await axios.patch('http://localhost:8081/api/users/profile/avatar', 
                formData, 
                { 
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    } 
                }
            );
            onUpdate(res.data.url); 
            onClose();
        } catch (err) {
            console.error(err);
            alert("Lỗi khi tải ảnh lên Cloudinary!");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-slate-100 animate-fade-in-up">
                <h2 className="text-2xl font-black mb-6 text-slate-900 tracking-tight text-center">Cập nhật ảnh đại diện</h2>
                
                <div className="flex flex-col items-center gap-8">
                    <div className="w-48 h-48 rounded-[3rem] bg-slate-50 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center ring-1 ring-slate-100">
                        {preview ? (
                            <img src={preview} className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex flex-col items-center text-slate-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-xs font-bold uppercase tracking-widest">Chưa chọn ảnh</span>
                            </div>
                        )}
                    </div>

                    <label className="group cursor-pointer bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-blue-200/50 active:scale-95">
                        Chọn ảnh từ..
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                </div>

                <div className="flex justify-center gap-4 mt-12">
                    <button onClick={onClose} className="px-6 py-3 font-bold text-slate-400 hover:text-slate-600 transition-colors">Hủy bỏ</button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving || !selectedFile}
                        className="bg-blue-600 text-white px-10 py-3.5 rounded-2xl font-bold shadow-lg shadow-blue-200 disabled:opacity-30 disabled:shadow-none transition-all active:scale-95"
                    >
                        {isSaving ? 'Đang tải lên mây...' : 'Cập nhật ngay'}
                    </button>
                </div>
            </div>
        </div>
    );
}
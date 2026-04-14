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

            // Đổi thành POST để khớp với Backend nhận File
            const res = await axios.post('http://localhost:8081/api/users/profile/avatar', 
                formData, 
                { 
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    } 
                }
            );
            
            onUpdate(res.data.avatarUrl); 
            onClose();
        } catch (err) {
            console.error(err);
            alert("Lỗi khi tải ảnh lên!");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity">
            <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Cập nhật ảnh đại diện</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="flex flex-col items-center gap-6">
                    <div className="w-40 h-40 rounded-full bg-slate-50 border border-slate-200 shadow-inner overflow-hidden flex items-center justify-center relative group">
                        {preview ? (
                            <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                        ) : (
                            <div className="flex flex-col items-center text-slate-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-[10px] font-bold uppercase tracking-widest">Trống</span>
                            </div>
                        )}
                    </div>

                    <label className="cursor-pointer bg-white text-slate-700 border border-slate-300 px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm active:scale-95 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        </svg>
                        Chọn ảnh 
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                </div>

                {/* --- KHU VỰC NÚT ĐÃ ĐƯỢC CĂN GIỮA --- */}
                <div className="flex justify-center gap-4 mt-8 pt-6 border-t border-slate-100">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2.5 font-medium text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors w-32"
                    >
                        Hủy bỏ
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving || !selectedFile}
                        className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center w-32"
                    >
                        {isSaving ? 'Đang tải...' : 'Tải ảnh lên'}
                    </button>
                </div>
            </div>
        </div>
    );
}
import { useState, useEffect } from 'react'; 
import { useParams, Link } from 'react-router-dom'; 
import axios from 'axios';

interface Project {
    id: number; 
    name: string; 
    description: string; 
    key: string; 
    role: string; 
}

interface Task {
    id: number;
    title: string;
    description: string;
    status: string;
    priority: string;
    progress: number;
    position: number;
    dueDate: string | null;
    assigneeId: number | null;
    reporterId: number;
    projectId: number;
}

export default function ProjectDetail() {
    const { id } = useParams(); 
    const [project, setProject] = useState<Project | null>(null); 
    const [tasks, setTasks] = useState<Task[]>([]); 
    const [isLoading, setIsLoading] = useState(true);  
    const [allUsers, setAllUsers] = useState<any[]>([]);
    
    // --- STATE ĐIỀU HƯỚNG TAB ---
    const [activeTab, setActiveTab] = useState<'tasks' | 'members'>('tasks');

    // --- STATE DÀNH CHO FORM TẠO TASK ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDesc, setNewTaskDesc] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');
    const [newTaskDueDate, setNewTaskDueDate] = useState('');
    const [newTaskAssignee, setNewTaskAssignee] = useState('');
    const [newTaskPosition, setNewTaskPosition] = useState(0); 

    // --- STATE CHO MODAL XEM CHI TIẾT & COMMENT ---
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [commentText, setCommentText] = useState('');

    // --- STATE DUYỆT THÀNH VIÊN ---
    const [pendingMembers, setPendingMembers] = useState<any[]>([]);
    const [isPendingOpen, setIsPendingOpen] = useState(false); 
    const [projectMembersList, setProjectMembersList] = useState<any[]>([]);

    // --- STATE CHO CHỨC NĂNG THÊM THÀNH VIÊN ---
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [isAddingMember, setIsAddingMember] = useState(false);

    // STATE kiểm soát Dropdown chọn người 
    const [assigningTaskId, setAssigningTaskId] = useState<number | null>(null);

    // State lưu danh sách checklist của task đang chọn
    const [subTasks, setSubTasks] = useState<any[]>([]);
    const [newSubContent, setNewSubContent] = useState('');

    const fetchData = async () => {
        setIsLoading(true); 
        try {
            const token = localStorage.getItem('token'); 
            const config = { headers: { Authorization: `Bearer ${token}` } }; 
            const [projectRes, taskRes, membersRes, allUsersRes] = await Promise.all([
                axios.get(`http://localhost:8081/api/project/${id}`, config), 
                axios.get(`http://localhost:8081/api/project/${id}/tasks`, config),
                axios.get(`http://localhost:8081/api/project/${id}/members`, config),
                axios.get(`http://localhost:8081/api/users`, config) 
            ]); 

            setProject(projectRes.data); 
            setTasks(taskRes.data);
            setProjectMembersList(membersRes.data);
            setAllUsers(allUsersRes.data);
            if (projectRes.data.role === 'OWNER' || projectRes.data.role === 'MANAGER') {
                fetchPendingMembers();
            }
        } catch (error: any) { 
            console.error("Lỗi tải dữ liệu:", error);
            if (error.response?.status === 404) {
                alert("Không tìm thấy dự án hoặc API /members chưa được tạo!");
            }
        } finally {
            setIsLoading(false); 
        }
    };

    const fetchPendingMembers = async () => {
        if(!id) return; 
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:8081/api/project/${id}/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingMembers(res.data);
        } catch (error: any) {
            if (error.response?.status === 403) {
                setPendingMembers([]); 
            } else {
                console.error("Lỗi lấy danh sách chờ:", error);
            }
        }
    };

    useEffect(() => {
        fetchData(); 
        fetchPendingMembers();
    }, [id]); 

    // --- XỬ LÝ DUYỆT THÀNH VIÊN ---
    const handleApprove = async (recordId: number) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:8081/api/project/approve', 
                { memberRecordId: recordId }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Đã duyệt thành viên! Bây giờ dự án sẽ hiện bên member");
            setPendingMembers(prev => prev.filter(m => m.id !== recordId));
            if (pendingMembers.length === 1) setIsPendingOpen(false);
            fetchData(); 
        } catch (error) {
            alert("Lỗi khi duyệt");
        }
    };

    // --- HÀM XỬ LÝ THÊM THÀNH VIÊN ---
    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMemberEmail.trim()) return;
        setIsAddingMember(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:8081/api/project/${id}/members`, 
                { email: newMemberEmail, role: 'MEMBER' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            alert("Đã thêm thành viên thành công!");
            setShowAddMemberModal(false);
            setNewMemberEmail('');            
            fetchData(); // Load lại danh sách member
        } catch (error: any) {
            console.error(error);
            alert("Lỗi: " + (error.response?.data?.error || "Không thể thêm thành viên này."));
        } finally {
            setIsAddingMember(false);
        }
    };

    // --- XỬ LÝ COMMENT ---
    const fetchComments = async (taskId: number) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:8081/api/project/${id}/tasks/${taskId}/comments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setComments(res.data);
        } catch (error) { console.error(error); }
    };

    const handleOpenDetail = (task: Task) => {
        setSelectedTask(task);
        setIsDetailOpen(true);
        setCommentText('');
        fetchComments(task.id);
        fetchSubTasks(task.id);
    };

    const handleSendComment = async () => {
        if (!commentText.trim() || !selectedTask) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:8081/api/project/${id}/tasks/${selectedTask.id}/comments`, 
            {content: commentText }, 
            {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCommentText('');
            fetchComments(selectedTask.id);
        } catch (error) { alert("Lỗi gửi bình luận"); }
    };

    // --- XỬ LÝ TASK ---
    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault(); 
        setIsCreating(true); 
        try {
            const token = localStorage.getItem('token'); 
            const selectedMember = projectMembersList.find(m => m.userId === Number(newTaskAssignee));
            const emailToSend = selectedMember ? selectedMember.userEmail : "";
            const payload = {
                title: newTaskTitle,
                description: newTaskDesc || "Chưa có mô tả chi tiết",
                priority: newTaskPriority,
                status: 'TODO',
                position: Number(newTaskPosition) || 0,
                progress: 0,
                dueDate: newTaskDueDate ? `${newTaskDueDate}T23:59:59` : null,
                assigneeEmail: emailToSend 
            };

            await axios.post(`http://localhost:8081/api/project/${id}/tasks`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            }); 
            
            setIsModalOpen(false); 
            setNewTaskTitle(''); 
            setNewTaskDesc('');
            fetchData(); 
        } catch (error: any) {
            console.error("Chi tiết lỗi:", error.response?.data);
            alert("Lỗi tạo Task: " + (error.response?.data?.message || error.response?.data?.error || "Dữ liệu không hợp lệ")); 
        } finally {
            setIsCreating(false); 
        }
    };

    const handleDeleteTask = async (taskId: number) => {
        if (!window.confirm("Xóa thẻ công việc này?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:8081/api/project/${id}/tasks/${taskId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (error: any) { alert("Lỗi khi xóa"); }
    };

    const getStatusStyle = (status: string) => {
        switch(status) {
            case 'TODO': return 'bg-gray-50 text-gray-500 border-gray-200';
            case 'IN_PROGRESS': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'DONE': return 'bg-green-50 text-green-600 border-green-200';
            default: return 'bg-gray-50 text-gray-500';
        }
    };

    const getPriorityStyle = (priority: string) => {
        switch(priority) {
            case 'HIGH': return 'bg-orange-50 text-orange-600';
            case 'URGENT': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-gray-50 text-gray-500';
        }
    };
    
    const handleQuickAssign = async (taskId: number, userId: number) => {
        try {
            const token = localStorage.getItem('token'); 
            await axios.patch(`http://localhost:8081/api/project/${id}/tasks/${taskId}/assignee`, 
                { assigneeId: userId }, 
                { headers: { Authorization: `Bearer ${token}` } }
            ); 
            setTasks(prevTasks => prevTasks.map(task => 
                task.id === taskId ? { ...task, assigneeId: userId } : task
            ));
            setAssigningTaskId(null); 
        } catch(error: any){
            console.error("Chi tiết lỗi Backend:", error.response?.data || error.message);
            alert("Lỗi khi giao việc: " + (error.response?.data?.error || "Không kết nối được API"));
        }
    };

    // Hàm lấy danh sách subtasks khi mở Modal
    const fetchSubTasks = async (taskId: number) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:8081/api/subtasks/task/${taskId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSubTasks(res.data);
        } catch (error) { console.error("Lỗi lấy checklist:", error); }
    };

    // Hàm thêm mới một đầu việc
    const handleAddSubTask = async () => {
        if (!newSubContent.trim() || !selectedTask) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:8081/api/subtasks`, 
                { taskId: selectedTask.id, content: newSubContent },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNewSubContent('');
            fetchSubTasks(selectedTask.id); 
            fetchData(); 
        } catch (error) { alert("Lỗi thêm việc"); }
    };

    // Hàm tích chọn hoàn thành
    const handleToggleSub = async (subId: number, isDone: boolean) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`http://localhost:8081/api/subtasks/${subId}/toggle`, 
                { isDone: !isDone },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if(selectedTask) {
                fetchSubTasks(selectedTask.id);
                fetchData();
            }
        } catch (error) { alert("Lỗi cập nhật"); }
    };

    if (isLoading) return <div className="p-10 text-blue-600 font-black animate-pulse">ĐANG TẢI DỮ LIỆU... </div>;
    if (!project) return <div className="p-10 text-red-500 font-bold">Lỗi: Không tìm thấy dự án!</div>;

    return (
        <div className="flex flex-col h-full bg-white relative"> 
            
            {/* ================= HEADER DỰ ÁN ================= */}
            <div className="flex items-start justify-between mb-8 border-b border-gray-100 pb-8 px-2 mt-2">
                <div className="flex items-start gap-6">
                    <Link to="/projects" className="mt-1 flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 text-gray-400 w-10 h-10 rounded-xl transition shadow-sm">&larr;</Link>
                    <div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-black text-gray-900">{project.name}</h1>
                            <span className="text-[10px] bg-blue-600 text-white px-3 py-1 rounded-full font-black tracking-widest shadow-lg shadow-blue-100 uppercase">{project.role}</span>
                        </div>
                        <p className="text-gray-400 text-sm mt-2 font-medium">{project.description}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end mr-2">
                        <span className="text-[9px] font-black text-black-300 uppercase tracking-widest mb-1">Mã tham gia</span>
                        <code className="bg-gray-50 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-blue-600 font-bold text-xs select-all cursor-pointer" title="Click để copy">
                            {project.key}
                        </code>
                    </div>

                    <button 
                        onClick={() => setShowAddMemberModal(true)}
                        className="flex items-center gap-2 p-2.5 px-4 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl hover:bg-blue-100 hover:shadow-md transition-all active:scale-95 group font-bold text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                        </svg>
                        <span className="hidden lg:inline">Thêm người</span>
                    </button>
                    <div className="relative">
                        <button 
                            onClick={() => setIsPendingOpen(!isPendingOpen)}
                            className="relative p-2.5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95 group"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500 group-hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            {pendingMembers.length > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-4 ring-white animate-bounce">
                                    {pendingMembers.length}
                                </span>
                            )}
                        </button>

                        {isPendingOpen && (
                            <div className="absolute right-0 mt-4 w-80 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 z-[110] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 rounded-t-[2rem]">
                                    <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Yêu cầu gia nhập</h3>
                                    <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-lg">{pendingMembers.length} mới</span>
                                </div>

                                <div className="max-h-80 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                    {pendingMembers.length > 0 ? (
                                        pendingMembers.map((m: any) => (
                                            <div key={m.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs uppercase shrink-0">
                                                    {m.userName?.charAt(0) || "U"}
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-xs font-black text-slate-800 truncate">{m.userName}</p>
                                                    <p className="text-[10px] text-slate-400 truncate">{m.userEmail}</p>
                                                </div>
                                                <button onClick={() => handleApprove(m.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black transition-all active:scale-90 shadow-md shadow-emerald-100 uppercase">
                                                    Duyệt
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-10 text-center flex flex-col items-center gap-2 opacity-30">
                                            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                                            <p className="text-[10px] font-black uppercase tracking-widest">Không có yêu cầu tham gia</p>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 bg-slate-50/50 rounded-b-[2rem] border-t border-slate-50 text-center">
                                    <button onClick={() => setIsPendingOpen(false)} className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest">Đóng</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ================= THANH MENU NGANG (TABS) ================= */}
            <div className="flex justify-between items-center mb-6 px-4 border-b border-slate-200">
                <div className="flex gap-8">
                    <button 
                        onClick={() => setActiveTab('tasks')} 
                        className={`relative pb-4 text-[17px] font-black transition-colors ${activeTab === 'tasks' ? 'text-blue-600 font-bold' : 'text-slate-500 font-medium hover:text-slate-800'}`}
                    >
                        Danh sách công việc
                        {activeTab === 'tasks' && <div className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-blue-600 rounded-t-md animate-in slide-in-from-bottom-1"></div>}
                    </button>
                    <button 
                        onClick={() => setActiveTab('members')} 
                        className={`relative pb-4 text-[17px] font-black transition-colors ${activeTab === 'members' ? 'text-blue-600 font-bold' 
                            : 'text-slate-500 font-medium hover:text-slate-800'}`}
                    >
                        Thành viên dự án <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full ml-1">{projectMembersList.length}</span>
                        {activeTab === 'members' && <div className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-blue-600 rounded-t-md animate-in slide-in-from-bottom-1"></div>}
                    </button>
                </div>

                {activeTab === 'tasks' && (
                    <button onClick={()=> setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 mb-2 rounded-xl font-black shadow-lg shadow-blue-200 transition active:scale-95 flex items-center gap-2 text-sm">
                        <span className="text-lg leading-none">+</span> Thêm Task
                    </button>
                )}
            </div>

            {/* ================= NỘI DUNG TỪNG TAB ================= */}
            
            {/* TAB 1: DANH SÁCH CÔNG VIỆC */}
            {activeTab === 'tasks' && (
                <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden mx-2 relative">
                    {/* Bọc toàn bộ bảng vào 1 div scroll */}
                    <div className="overflow-y-auto max-h-[calc(100vh-350px)] custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm">
                                <tr className="border-b border-gray-100 text-gray-400 text-[10px] uppercase tracking-widest shadow-sm">
                                    <th className="p-5 font-black w-[30%]">Công việc</th>
                                    <th className="p-5 font-black text-center w-[12%]">Trạng thái</th>
                                    <th className="p-5 font-black text-center w-[12%]">Ưu tiên</th>
                                    <th className="p-5 font-black text-center w-[15%]">Thời hạn</th>
                                    <th className="p-5 font-black w-[15%]">Tiến độ</th>
                                    <th className="p-5 font-black text-right w-[10%]">Nhân sự</th>
                                    <th className="p-5 font-black text-center w-[6%]">Xóa</th>
                                </tr>
                            </thead>
                            
                            <tbody className="divide-y divide-gray-50 bg-white">
                                {tasks.map((task) => {
                                    const assignee = allUsers.find(u => u.id === task.assigneeId);
                                    return (
                                        <tr key={task.id} className="hover:bg-blue-50/20 transition-all group">
                                            {/* Bỏ w-1/3 ở đây đi vì đã set ở phần thead rồi */}
                                            <td className="p-5 cursor-pointer" onClick={() => handleOpenDetail(task)}>
                                                <p className="text-gray-900 font-bold text-sm group-hover:text-blue-600 transition-colors">{task.title}</p>
                                                <p className="text-gray-400 text-xs mt-0.5 line-clamp-1 font-normal">{task.description}</p>
                                            </td>
                                            <td className="p-5 text-center">
                                                <span className={`text-[10px] uppercase px-3 py-1 rounded-full font-black border ${getStatusStyle(task.status)}`}>{task.status}</span>
                                            </td>
                                            <td className="p-5 text-center">
                                                <span className={`text-[10px] px-2.5 py-1 rounded-md font-black ${getPriorityStyle(task.priority)}`}>{task.priority}</span>
                                            </td>
                                            <td className="p-5 text-center text-[11px] text-gray-500 font-bold">
                                                {task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : "-"}
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                                        <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${task.progress}%` }}></div>
                                                    </div>
                                                    <span className="text-[10px] font-black text-gray-300 w-6 text-right">{task.progress}%</span>
                                                </div>
                                            </td>
                                            <td className="p-5 relative">
                                                <div className="flex items-center justify-end gap-2.5">
                                                    <span className="text-xs font-bold text-gray-700 truncate max-w-[90px]">
                                                        {assignee?.name || "Chưa giao"}
                                                    </span>

                                                    {/* Nút chọn người */}
                                                    <div className="relative">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.preventDefault(); e.stopPropagation();
                                                                setAssigningTaskId(assigningTaskId === task.id ? null : task.id);
                                                            }}
                                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-black uppercase shadow-md border-2 border-white transition-all active:scale-90 shrink-0 ${assignee ? 'bg-blue-600' : 'bg-gray-300 hover:bg-blue-400'}`}
                                                        >
                                                            {assignee?.name?.charAt(0) || "?"}
                                                        </button>

                                                        {/* Dropdown Giao việc */}
                                                        {assigningTaskId === task.id && (
                                                            <>
                                                                <div className="fixed inset-0 z-[110]" onClick={(e) => { e.stopPropagation(); setAssigningTaskId(null); }}></div>
                                                                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.2)] border border-slate-100 z-[9999] py-2 animate-in fade-in zoom-in-95 duration-150">
                                                                    <p className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Giao việc cho:</p>
                                                                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                                                        {projectMembersList.length > 0 ? (
                                                                            projectMembersList.map(member => (
                                                                                <button
                                                                                    key={member.id}
                                                                                    onClick={(e) => { e.stopPropagation(); handleQuickAssign(task.id, member.userId); }}
                                                                                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-3"
                                                                                >
                                                                                    <div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center text-[9px] uppercase text-slate-500 font-black">
                                                                                        {member.userName?.charAt(0) || 'U'}
                                                                                    </div>
                                                                                    <div className="flex flex-col truncate">
                                                                                        <span className="truncate">{member.userName}</span>
                                                                                        <span className="text-[9px] font-medium text-slate-400 truncate">{member.userEmail}</span>
                                                                                    </div>
                                                                                </button>
                                                                            ))
                                                                        ) : (
                                                                            <p className="px-4 py-4 text-[10px] text-center text-slate-400 font-bold uppercase">Chưa có thành viên</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5 text-center">
                                                <button onClick={() => handleDeleteTask(task.id)} className="text-gray-200 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {tasks.length === 0 && (
                                    <tr><td colSpan={7} className="text-center py-10 text-gray-400 font-medium">Chưa có công việc nào. Hãy tạo mới!</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 2: THÀNH VIÊN DỰ ÁN */}
            {activeTab === 'members' && (
                <div className="mx-2">
                    <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/30 border-b border-gray-100 text-gray-400 text-[10px] uppercase tracking-widest">
                                    <th className="p-6 font-black">Thành viên</th>
                                    <th className="p-6 font-black text-center">Vai trò</th>
                                    <th className="p-6 font-black text-center">Ngày tham gia</th>
                                    <th className="p-6 font-black text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {projectMembersList.map((member) => (
                                    <tr key={member.id} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="p-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 rounded-[0.8rem] bg-[#0f172a] text-white flex items-center justify-center font-black text-[11px] uppercase shadow-md shrink-0 tracking-wider">
                                                    {member.userName?.substring(0, 2) || 'U'}
                                                </div>
                                                <div>
                                                    <p className="text-slate-900 font-bold text-[14px]">{member.userName}</p>
                                                    <p className="text-slate-400 text-xs mt-0.5">{member.userEmail}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5 text-center">
                                            <span className={`text-[9px] uppercase font-black tracking-widest px-3 py-1 rounded-md border inline-block ${
                                                member.role === 'OWNER' ? 'text-rose-600 bg-rose-50 border-rose-100' :
                                                member.role === 'MANAGER' ? 'text-orange-600 bg-orange-50 border-orange-100' :
                                                'text-blue-500 bg-blue-50 border-blue-100'
                                            }`}>
                                                {member.role}
                                            </span>
                                        </td>
                                        <td className="p-5 text-center text-xs text-slate-500 font-bold">
                                            {member.joinedAt || member.createdAt 
                                                ? new Date(member.joinedAt || member.createdAt).toLocaleDateString('vi-VN') 
                                                : ""}
                                        </td>
                                        <td className="p-5 text-center">
                                            <button 
                                                onClick={() => {
                                                    if(window.confirm('Bạn có chắc muốn xóa thành viên này khỏi dự án?')) {
                                                        alert('API Xóa thành viên đang được cập nhật!');
                                                    }
                                                    
                                                }}
                                                className="text-slate-300 hover:text-rose-500 p-2 hover:bg-rose-50 rounded-xl transition-all"
                                                title="Xóa thành viên"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {projectMembersList.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="text-center py-10 text-slate-400 font-medium">
                                            Dự án này chưa có thành viên nào.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Dòng text tổng số ở góc dưới */}
                    <div className="mt-5 px-1 text-[11px] text-slate-500 uppercase tracking-widest font-medium">
                        Tổng số: <span className="font-black text-slate-700">{projectMembersList.length}</span> thành viên hệ thống.
                    </div>
                </div>
            )}


            {/* Modal Thêm Thành Viên Bằng Email */}
            {showAddMemberModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">Mời thành viên mới</h3>
                            <button onClick={() => setShowAddMemberModal(false)} className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-rose-100 hover:text-rose-600 transition-colors">✕</button>
                        </div>
                        
                        <form onSubmit={handleAddMember} className="p-6 space-y-6">
                            <div>
                                <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest block mb-2">Địa chỉ Email</label>
                                <input 
                                    type="email" 
                                    value={newMemberEmail} 
                                    onChange={(e) => setNewMemberEmail(e.target.value)}
                                    placeholder="Ví dụ: nva@gmail.com"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    required
                                />
                                <p className="text-[11px] text-slate-400 mt-2 font-medium">Người dùng phải có tài khoản trên hệ thống để được mời.</p>
                            </div>
                            
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowAddMemberModal(false)} className="flex-1 px-4 py-3 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                                    Hủy
                                </button>
                                <button type="submit" disabled={isAddingMember} className="flex-1 px-4 py-3 rounded-xl font-bold text-sm text-white bg-blue-600 shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all">
                                    {isAddingMember ? 'Đang gửi...' : 'Gửi lời mời'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Tạo Task (Giữ nguyên cấu trúc của bạn) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 backdrop-blur-sm p-4">
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-2xl border border-gray-100">
                        <h2 className="text-2xl font-black text-gray-900 mb-8">Tạo công việc mới</h2>
                        <form onSubmit={handleCreateTask} className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-black-400 uppercase tracking-widest">Tiêu đề</label>
                                <input type="text" required placeholder="Tên công việc..." value={newTaskTitle} onChange={(e)=>setNewTaskTitle(e.target.value)} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-black-400 uppercase tracking-widest">Mô tả chi tiết</label>
                                <textarea rows={3} placeholder="Mô tả..." value={newTaskDesc} onChange={(e) => setNewTaskDesc(e.target.value)} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm outline-none resize-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <select value={newTaskPriority} onChange={(e)=>setNewTaskPriority(e.target.value)} className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 text-sm font-bold">
                                    <option value="LOW">Thấp</option><option value="MEDIUM">Trung bình</option><option value="HIGH">Cao</option><option value="URGENT">Khẩn cấp</option>
                                </select>
                                <input type="date" value={newTaskDueDate} onChange={(e)=>setNewTaskDueDate(e.target.value)} className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 text-sm outline-none" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Người thực hiện</label>
                                <select value={newTaskAssignee} onChange={(e) => setNewTaskAssignee(e.target.value)} className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 text-sm font-bold">
                                    <option value="">-- Để trống (Chưa giao cho ai) --</option>
                                    {projectMembersList.map(member => (
                                        <option key={member.id} value={member.userId}>{member.userName} ({member.userEmail})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-4 pt-6">
                                <button type="button" onClick={()=>setIsModalOpen(false)} className="flex-1 py-4 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl transition">Hủy</button>
                                <button type="submit" disabled={isCreating} className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition active:scale-95">{isCreating ? 'Đang xử lý...' : 'Tạo ngay'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {isDetailOpen && selectedTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col border border-gray-100">
                        <div className="p-7 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                            <h2 className="text-xl font-black text-gray-900">{selectedTask.title}</h2>
                            <button onClick={()=>setIsDetailOpen(false)} className="bg-white border w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-rose-50 shadow-sm transition">✕</button>
                        </div>
                        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                            <div className="flex-1 p-8 overflow-y-auto space-y-8 border-r border-gray-50">
                                <div>
                                    <label className="text-[10px] font-black text-black-400 uppercase tracking-widest">Mô tả chi tiết</label>
                                    <p className="bg-gray-50 p-6 rounded-2xl text-sm text-gray-600 mt-3 leading-relaxed border border-gray-100">{selectedTask.description}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="mt-6">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="text-[10px] font-black text-black-400 uppercase tracking-widest">Việc cần làm</label>
                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                                            {subTasks.filter(s => s.isDone).length}/{subTasks.length}
                                        </span>
                                    </div>
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                        {subTasks.map((sub) => (
                                            <div key={sub.id} className="flex items-center gap-3 p-3 bg-gray-50/50 border border-gray-100 rounded-2xl">
                                                <input type="checkbox" checked={sub.isDone} disabled={true} className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-not-allowed opacity-60" />
                                                <span className={`text-xs font-medium ${sub.isDone ? 'text-gray-300 line-through' : 'text-gray-600'}`}>{sub.content}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                    <div className="bg-gray-50 p-5 rounded-2xl h-fit mt-6">
                                        <span className="text-[9px] block font-black text-black-400 uppercase mb-1">Tiến độ tổng thể</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex-1 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-blue-600 h-full transition-all duration-500" style={{ width: `${selectedTask.progress}%` }}></div>
                                            </div>
                                            <span className="text-xs font-black text-gray-900">{selectedTask.progress}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full md:w-[360px] flex flex-col bg-gray-50/50">
                                <div className="p-5 border-b border-gray-100 bg-white font-black text-[11px] text-black-400 uppercase tracking-widest">💬 Thảo luận ({comments.length})</div>
                                <div className="flex-1 p-5 overflow-y-auto space-y-5 custom-scrollbar">
                                    {comments.map((c) => (
                                    <div key={c.id} className="flex gap-3">
                                        <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-[10px] text-white font-black uppercase shrink-0 shadow-md">
                                            {c.user?.name?.charAt(0) || "U"}
                                        </div>
                                        <div className="flex-1 bg-white border border-gray-100 p-3 rounded-2xl shadow-sm">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-[10px] font-black text-gray-900">{c.user?.name || "Người dùng ẩn danh"}</p>
                                                <span className="text-[9px] text-gray-400 font-medium">
                                                    {c.createdAt ? new Date(c.createdAt).toLocaleString('vi-VN') : ""}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600">{c.content}</p>
                                        </div>
                                    </div>
                                    ))}
                                </div>
                                <div className="p-5 bg-white border-t border-gray-100 flex gap-2">
                                    <input type="text" value={commentText} onChange={(e)=>setCommentText(e.target.value)} onKeyDown={(e)=>e.key==='Enter' && handleSendComment()} placeholder="Phản hồi..." className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-blue-500 outline-none" />
                                    <button onClick={handleSendComment} className="bg-blue-600 text-white px-4 rounded-xl font-black text-[10px] uppercase shadow-md shadow-blue-100 transition active:scale-90">Gửi</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
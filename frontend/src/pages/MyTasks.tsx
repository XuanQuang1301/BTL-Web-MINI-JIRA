import { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import AIBreakdownModal from '../components/AIBreakdownModal';

interface Task {
    id: number;
    title: string;
    description: string;
    status: string;
    priority: string;
    progress: number;
    dueDate: string | null;
    projectId: number;
    assigneeId: number | null;
}

interface ProjectInfo {
    name: string;
    role: string;
}

interface ColumnData {
    name: string;
    items: Task[];
}

interface BoardData {
    [key: string]: ColumnData;
}

const initialBoard: BoardData = {
    TODO: { name: 'Cần làm', items: [] },
    IN_PROGRESS: { name: 'Đang làm', items: [] },
    REVIEW: { name: 'Chờ duyệt', items: [] },
    DONE: { name: 'Đã xong', items: [] }
};

export default function MyTasks() {
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
    const [activeTab, setActiveTab] = useState('all');

    const [columns, setColumns] = useState<BoardData>(initialBoard);
    const [isLoading, setIsLoading] = useState(true);
    const [projectsMap, setProjectsMap] = useState<Record<number, ProjectInfo>>({});
    const [allUsers, setAllUsers] = useState<any[]>([]);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [isEditingTask, setIsEditingTask] = useState(false); 
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editProgress, setEditProgress] = useState(0);
    const [editPriority, setEditPriority] = useState('');
    const [editDueDate, setEditDueDate] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [commentText, setCommentText] = useState('');

    const [subTasks, setSubTasks] = useState<any[]>([]);
    const [newSubContent, setNewSubContent] = useState('');

    // State cho AI Modal
    const [showAIModal, setShowAIModal] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const [selectedTaskTitle, setSelectedTaskTitle] = useState<string>('');

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [tasksRes, projectsRes, usersRes] = await Promise.all([
                axios.get('http://localhost:8081/api/project/tasks/my-tasks', config),
                axios.get('http://localhost:8081/api/project/my', config),
                axios.get('http://localhost:8081/api/users', config)
            ]);

            setAllUsers(usersRes.data);
            const projMap: Record<number, ProjectInfo> = {};
            projectsRes.data.forEach((p: any) => { projMap[p.id] = { name: p.name, role: p.role }; });
            setProjectsMap(projMap);

            const fetchedTasks: Task[] = tasksRes.data;
            const newBoard: BoardData = {
                TODO: { name: 'Cần làm', items: [] },
                IN_PROGRESS: { name: 'Đang làm', items: [] },
                REVIEW: { name: 'Chờ duyệt', items: [] },
                DONE: { name: 'Đã xong', items: [] }
            };
            fetchedTasks.forEach(task => {
                if (newBoard[task.status]) newBoard[task.status].items.push(task);
            });
            setColumns(newBoard);
        } catch (error) {
            console.error("Lỗi tải dữ liệu:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const fetchSubTasks = async (taskId: number) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:8081/api/subtasks/task/${taskId}`, { headers: { Authorization: `Bearer ${token}` } });
            const freshSubs = res.data;
            setSubTasks(freshSubs);
            const doneCount = freshSubs.filter((s: any) => s.isDone || s.done).length;
            const newProgress = freshSubs.length > 0 ? Math.round((doneCount / freshSubs.length) * 100) : 0;
            setEditingTask(prev => prev && prev.id === taskId ? { ...prev, progress: newProgress } : prev);
        } catch (error) { console.error(error); }
    };

    const handleAddSubTask = async () => {
        const content = newSubContent.trim();
        if (!content || !editingTask) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:8081/api/subtasks',
                { taskId: editingTask.id, content },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNewSubContent('');
            await fetchSubTasks(editingTask.id); 
            fetchData();
        } catch (error) { alert("Lỗi thêm subtask"); }
    };

    const handleToggleSub = async (subId: number, currentIsDone: boolean) => {
        const newIsDone = !currentIsDone;
        // 1. Optimistic UI: cập nhật subtask ngay lập tức
        const updatedSubs = subTasks.map(s => s.id === subId ? { ...s, isDone: newIsDone, done: newIsDone } : s);
        setSubTasks(updatedSubs);
        // 2. Tính và cập nhật % tiến độ ngay lập tức 
        const doneCount = updatedSubs.filter(s => s.isDone || s.done).length;
        const newProgress = updatedSubs.length > 0 ? Math.round((doneCount / updatedSubs.length) * 100) : 0;
        setEditingTask(prev => prev ? { ...prev, progress: newProgress } : prev);
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`http://localhost:8081/api/subtasks/${subId}/toggle`,
                { isDone: newIsDone },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Sau khi server xác nhận, re-sync lại data thật (fetchSubTasks cũng update progress)
            await fetchSubTasks(editingTask!.id);
            fetchData(); 
        } catch (error) {
            setSubTasks(prev => prev.map(s => s.id === subId ? { ...s, isDone: currentIsDone, done: currentIsDone } : s));
            setEditingTask(prev => prev ? { ...prev, progress: editingTask!.progress } : prev);
            alert("Lỗi cập nhật subtask");
        }
    };

    const fetchComments = async (projectId: number, taskId: number) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:8081/api/project/${projectId}/tasks/${taskId}/comments`, { headers: { Authorization: `Bearer ${token}` } });
            setComments(res.data);
        } catch (error) { console.error(error); }
    };

    const handleSendComment = async () => {
        if (!commentText.trim() || !editingTask) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:8081/api/project/${editingTask.projectId}/tasks/${editingTask.id}/comments`, {
                content: commentText  
            }, { headers: { Authorization: `Bearer ${token}` } });
            setCommentText('');
            fetchComments(editingTask.projectId, editingTask.id);
        } catch (error) { alert("Lỗi gửi bình luận"); }
    };

    const onDragEnd = async (result: DropResult) => {
        if (!result.destination) return;
        const { source, destination, draggableId } = result;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const sourceColumn = columns[source.droppableId];
        const destColumn = columns[destination.droppableId];
        const draggableTask = sourceColumn.items[source.index];

        if (!draggableTask.projectId) {
            alert("Công việc này thuộc về một dự án đã bị xóa, không thể cập nhật trạng thái!");
            return;
        }

        if (destination.droppableId === 'DONE') {
            const userRole = projectsMap[draggableTask.projectId]?.role;
            if (userRole !== 'OWNER' && userRole !== 'MANAGER') {
                alert("Chỉ Quản lý có quyền duyệt sang Đã xong!");
                return;
            }
        }

        const sourceItems = [...sourceColumn.items];
        const destItems = [...destColumn.items];
        const [removed] = sourceItems.splice(source.index, 1);

        if (source.droppableId !== destination.droppableId) {
            removed.status = destination.droppableId;
            if (destination.droppableId === 'DONE') removed.progress = 100;
            destItems.splice(destination.index, 0, removed);
            setColumns({
                ...columns,
                [source.droppableId]: { ...sourceColumn, items: sourceItems },
                [destination.droppableId]: { ...destColumn, items: destItems },
            });
            try {
                const token = localStorage.getItem('token');
                await axios.patch(`http://localhost:8081/api/project/${draggableTask.projectId}/tasks/${draggableId}/status`,
                    { status: destination.droppableId },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                fetchData();
            } catch (error) { fetchData(); }
        } else {
            sourceItems.splice(destination.index, 0, removed);
            setColumns({ ...columns, [source.droppableId]: { ...sourceColumn, items: sourceItems } });
        }
    };

    const handleToggleTaskCompleteList = async (e: React.MouseEvent, task: Task) => {
        e.stopPropagation();
        if (!task.projectId) {
            alert("Công việc này thuộc về một dự án đã bị xóa, không thể cập nhật trạng thái!");
            return;
        }
        if (task.status !== 'DONE') {
            const userRole = projectsMap[task.projectId]?.role;
            if (userRole !== 'OWNER' && userRole !== 'MANAGER') {
                alert("Chỉ Quản lý dự án mới có quyền duyệt Task sang Đã xong!");
                return;
            }
        }
        const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`http://localhost:8081/api/project/${task.projectId}/tasks/${task.id}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchData();
        } catch (error) {
            alert("Lỗi cập nhật trạng thái!");
        }
    };

    // Mở modal ở chế độ XEM
    const handleOpenModal = (task: Task) => {
        setEditingTask(task);
        setIsEditingTask(false);
        setIsEditModalOpen(true);
        fetchComments(task.projectId, task.id);
        fetchSubTasks(task.id);
    };

    // Bật chế độ CHỈNH SỬA
    const handleStartEdit = () => {
        if (!editingTask) return;
        setEditTitle(editingTask.title);
        setEditDesc(editingTask.description || '');
        setEditProgress(editingTask.status === 'DONE' ? 100 : (editingTask.progress || 0));
        setEditPriority(editingTask.priority);
        setEditDueDate(editingTask.dueDate ? editingTask.dueDate.split('T')[0] : '');
        setIsEditingTask(true);
    };

    const handleUpdateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTask) return;
        setIsUpdating(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`http://localhost:8081/api/project/${editingTask.projectId}/tasks/${editingTask.id}`, {
                title: editTitle,
                description: editDesc,
                priority: editPriority,
                dueDate: editDueDate ? new Date(editDueDate).toISOString() : null,
                assigneeEmail: null  // MyTasks không sửa assignee, gửi null để tránh lỗi @Email validation
            }, { headers: { Authorization: `Bearer ${token}` } });
            setEditingTask(res.data);
            setIsEditingTask(false);
            fetchData();
        } catch (error: any) { alert("Lỗi cập nhật: " + (error.response?.data?.error || error.response?.data?.message || "Kiểm tra lại dữ liệu")); }
        finally { setIsUpdating(false); }
    };

    const getPriorityStyle = (priority: string) => {
        switch (priority) {
            case 'HIGH': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'URGENT': return 'bg-red-100 text-red-800 border-red-300';
            case 'MEDIUM': return 'bg-orange-100 text-orange-700 border-orange-200';
            default: return 'bg-blue-100 text-blue-700 border-blue-200';
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'TODO': return 'bg-gray-100 text-gray-600 border-gray-200';
            case 'IN_PROGRESS': return 'bg-blue-100 text-blue-600 border-blue-200';
            case 'REVIEW': return 'bg-orange-100 text-orange-600 border-orange-200';
            case 'DONE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            default: return 'bg-gray-100 text-gray-500';
        }
    };

    const allTasksList = [...columns.TODO.items, ...columns.IN_PROGRESS.items, ...columns.REVIEW.items, ...columns.DONE.items];
    const filteredTasksList = activeTab === 'all' ? allTasksList : allTasksList.filter(t => t.status === activeTab);

    if (isLoading) return <div className="h-screen flex items-center justify-center text-blue-600 font-bold animate-pulse">SẴN SÀNG...</div>;

    return (
        <div className="h-full flex flex-col p-6 bg-[#f4f7f9] min-h-screen">
            {/* HEADER & VIEW TOGGLES */}
            <div className="flex justify-between items-start mb-8 px-2">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Công việc của tôi</h1>
                    <p className="text-slate-500 font-medium mt-1">Quản lý và theo dõi nhiệm vụ của bạn</p>
                </div>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                    <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-slate-100 text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        Danh sách
                    </button>
                    <button onClick={() => setViewMode('kanban')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'kanban' ? 'bg-slate-100 text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
                        Kanban
                    </button>
                </div>
            </div>

            {/* LIST VIEW */}
            {viewMode === 'list' && (
                <div className="flex flex-col">
                    <div className="flex gap-6 border-b border-slate-200 mb-6">
                        {[
                            { id: 'all', label: `Tất cả (${allTasksList.length})` },
                            { id: 'TODO', label: `Cần làm (${columns.TODO.items.length})` },
                            { id: 'IN_PROGRESS', label: `Đang làm (${columns.IN_PROGRESS.items.length})` },
                            { id: 'REVIEW', label: `Chờ duyệt (${columns.REVIEW.items.length})` },
                            { id: 'DONE', label: `Đã xong (${columns.DONE.items.length})` }
                        ].map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="space-y-4">
                        {filteredTasksList.map(task => (
                            <div key={task.id} onClick={() => handleOpenModal(task)} className={`flex items-center justify-between p-5 rounded-xl border transition-all cursor-pointer ${task.status === 'DONE' ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 hover:shadow-md hover:border-blue-300'}`}>
                                <div className="flex items-start gap-4">
                                    <button
                                        onClick={(e) => handleToggleTaskCompleteList(e, task)}
                                        className={`mt-1 flex items-center justify-center w-6 h-6 rounded-md border-2 transition-all ${task.status === 'DONE' ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-slate-400'}`}
                                    >
                                        {task.status === 'DONE' && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                    </button>
                                    <div>
                                        <h3 className={`font-bold text-slate-900 text-[15px] ${task.status === 'DONE' ? 'line-through text-slate-500' : ''}`}>{task.title}</h3>
                                        <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md inline-block mt-2 border border-blue-100">{projectsMap[task.projectId]?.name || 'Dự án'}</div>
                                        <div className="flex items-center gap-5 mt-3 text-xs font-medium text-slate-400">
                                            {task.dueDate && <span>📅 {new Date(task.dueDate).toLocaleDateString('vi-VN')}</span>}
                                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${getPriorityStyle(task.priority)}`}>{task.priority}</span>
                                        </div>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-black px-3 py-1.5 rounded-full border uppercase ${getStatusStyle(task.status)}`}>{task.status.replace('_', ' ')}</span>
                            </div>
                        ))}
                        {filteredTasksList.length === 0 && (
                            <div className="text-center py-20 text-slate-400">
                                <p className="text-5xl mb-4"></p>
                                <p className="font-bold">Không có công việc nào ở đây!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* KANBAN VIEW */}
            {viewMode === 'kanban' && (
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex gap-5 overflow-x-auto pb-4 flex-1">
                        {Object.entries(columns).map(([columnId, column]) => (
                            <div key={columnId} className="flex-shrink-0 w-72 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                                <div className="p-4 flex items-center justify-between border-b border-slate-100">
                                    <div className="flex items-center gap-2 font-bold text-slate-700 text-sm">
                                        <div className={`w-2 h-2 rounded-full ${columnId === 'TODO' ? 'bg-slate-400' : columnId === 'IN_PROGRESS' ? 'bg-blue-500' : columnId === 'REVIEW' ? 'bg-orange-500' : 'bg-emerald-500'}`}></div>
                                        {column.name}
                                    </div>
                                    <span className="bg-slate-200 px-2.5 py-0.5 rounded-full text-slate-600 font-bold">{column.items.length}</span>
                                </div>
                                <Droppable droppableId={columnId}>
                                    {(provided, snapshot) => (
                                        <div {...provided.droppableProps} ref={provided.innerRef} className={`p-4 min-h-[450px] overflow-y-auto custom-scrollbar transition-all ${snapshot.isDraggingOver ? 'bg-blue-50/30' : 'bg-transparent'}`}>
                                            {column.items.map((item, index) => (
                                                <Draggable key={item.id.toString()} draggableId={item.id.toString()} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                                            onClick={() => handleOpenModal(item)}
                                                            className={`p-5 mb-5 rounded-3xl bg-white border border-slate-200 transition-all duration-300 cursor-pointer group ${snapshot.isDragging ? 'rotate-2 scale-105 shadow-2xl border-blue-400 z-50' : 'shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-blue-300'}`}
                                                        >
                                                            <div className="flex justify-between items-start mb-4">
                                                                <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg uppercase tracking-wider border border-blue-100">{projectsMap[item.projectId]?.name || 'Project'}</span>
                                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${getPriorityStyle(item.priority)}`}>{item.priority}</span>
                                                            </div>
                                                            <h3 className="text-slate-800 font-bold text-sm mb-4 leading-relaxed group-hover:text-blue-600 transition-colors">{item.title}</h3>
                                                            <div className="flex justify-between items-center text-slate-400 border-t border-slate-50 pt-3">
                                                                <span className="text-[10px] font-bold">{item.dueDate ? new Date(item.dueDate).toLocaleDateString('vi-VN') : 'N/A'}</span>
                                                                <div className="w-7 h-7 rounded-xl bg-slate-900 flex items-center justify-center text-white text-[10px] font-black uppercase shadow-md">
                                                                    {allUsers.find(u => u.id === item.assigneeId)?.name?.charAt(0) || "?"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        ))}
                    </div>
                </DragDropContext>
            )}

            {/* MODAL XEM CHI TIẾT / CHỈNH SỬA */}
            {isEditModalOpen && editingTask && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
                        {/* HEADER MODAL */}
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center gap-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                {isEditingTask ? (
                                    <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                                        className="text-xl font-black text-slate-900 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400 flex-1 shadow-sm" />
                                ) : (
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight truncate">{editingTask.title}</h2>
                                )}
                                <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase flex-shrink-0 ${getStatusStyle(editingTask.status)}`}>
                                    {editingTask.status.replace('_', ' ')}
                                </span>
                            </div>
                            {/* NÚT CHỈNH SỬA Ở GÓC TRÊN */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {!isEditingTask ? (
                                    <button onClick={handleStartEdit}
                                        className="bg-white hover:bg-blue-50 text-blue-600 border border-slate-200 hover:border-blue-300 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center gap-1.5 shadow-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        Chỉnh sửa
                                    </button>
                                ) : (
                                    <button onClick={() => setIsEditingTask(false)}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-black transition-all">
                                        Hủy
                                    </button>
                                )}
                                <button onClick={() => { setIsEditModalOpen(false); setIsEditingTask(false); }}
                                    className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm">✕</button>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                            {/* CỘT TRÁI */}
                            <div className="flex-1 p-8 overflow-y-auto space-y-6 border-r border-slate-100 custom-scrollbar">
                                {isEditingTask ? (
                                    /* FORM CHỈNH SỬA */
                                    <form id="editTaskForm" onSubmit={handleUpdateTask} className="space-y-5">
                                        <div>
                                            <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest block mb-2">Mô tả chi tiết</label>
                                            <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={4}
                                                className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-[1.2rem] px-6 py-4 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest block mb-2">Mức độ ưu tiên</label>
                                                <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 font-bold text-xs text-slate-700 outline-none shadow-sm">
                                                    <option value="LOW">THẤP (LOW)</option>
                                                    <option value="MEDIUM">TRUNG BÌNH (MEDIUM)</option>
                                                    <option value="HIGH">CAO (HIGH)</option>
                                                    <option value="URGENT">KHẨN CẤP (URGENT)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest block mb-2">Hạn chót</label>
                                                <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)}
                                                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 font-bold text-xs text-slate-700 outline-none shadow-sm" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest block mb-2">Tiến độ (Tự động tính từ Subtask)</label>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                                                    <div className="bg-blue-600 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(37,99,235,0.4)]" style={{ width: `${editProgress}%` }}></div>
                                                </div>
                                                <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 min-w-[45px] text-center">{editProgress}%</span>
                                            </div>
                                        </div>

                                        {/* Subtasks trong form edit */}
                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Việc cần làm</label>
                                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                                                    {subTasks.filter(s => s.isDone || s.done).length}/{subTasks.length}
                                                </span>
                                            </div>
                                            <div className="flex gap-2 mb-3">
                                                <input type="text" value={newSubContent} onChange={(e) => setNewSubContent(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddSubTask()}
                                                    placeholder="Thêm đầu việc mới..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-100" />
                                                <button type="button" onClick={handleAddSubTask} className="bg-blue-600 text-white px-4 rounded-xl font-black text-[10px] uppercase shadow-md active:scale-95 transition">Thêm</button>
                                                <button type="button" onClick={() => { setSelectedTaskId(editingTask!.id); setSelectedTaskTitle(editingTask!.title); setShowAIModal(true); }}
                                                    className="flex items-center gap-1.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white px-4 rounded-xl font-black text-[10px] uppercase shadow-md active:scale-95 transition hover:from-violet-600 hover:to-purple-700">
                                                    ✨ AI
                                                </button>
                                            </div>
                                            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                                {subTasks.map(sub => (
                                                    <div key={sub.id} onClick={() => handleToggleSub(sub.id, sub.isDone || sub.done || false)}
                                                        className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:border-blue-200 transition-all">
                                                        <input type="checkbox" checked={sub.isDone || sub.done || false} readOnly
                                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 pointer-events-none" />
                                                        <span className={`text-xs font-bold flex-1 ${(sub.isDone || sub.done) ? 'text-slate-300 line-through' : 'text-slate-600'}`}>{sub.content}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex gap-3 pt-4 border-t border-slate-100">
                                            <button type="button" onClick={() => setIsEditingTask(false)} className="px-6 py-3 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Hủy</button>
                                            <button type="submit" disabled={isUpdating} className="flex-1 bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-sm shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50">
                                                {isUpdating ? 'ĐANG LƯU...' : 'CẬP NHẬT THAY ĐỔI'}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    /* CHẾ ĐỘ XEM CHI TIẾT */
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">Mô tả</label>
                                            <p className="bg-blue-50 p-5 rounded-2xl text-sm text-slate-700 leading-relaxed border border-blue-100 whitespace-pre-wrap min-h-[60px]">
                                                {editingTask.description || 'Chưa có mô tả.'}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Dự án</p>
                                                <p className="text-sm font-bold text-blue-600">{projectsMap[editingTask.projectId]?.name || '—'}</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Hạn chót</p>
                                                <p className="text-sm font-bold text-slate-700">{editingTask.dueDate ? new Date(editingTask.dueDate).toLocaleDateString('vi-VN') : '—'}</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Độ ưu tiên</p>
                                                <span className={`text-xs font-black px-2 py-0.5 rounded border ${getPriorityStyle(editingTask.priority)}`}>{editingTask.priority}</span>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Tiến độ</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                                                        <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${editingTask.progress}%` }}></div>
                                                    </div>
                                                    <span className="text-xs font-black text-slate-700">{editingTask.progress}%</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Subtasks trong view mode */}
                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Việc cần làm</label>
                                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                                                    {subTasks.filter(s => s.isDone || s.done).length}/{subTasks.length}
                                                </span>
                                            </div>
                                            <div className="flex gap-2 mb-3">
                                                <input type="text" value={newSubContent} onChange={(e) => setNewSubContent(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddSubTask()}
                                                    placeholder="Thêm đầu việc mới..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-100" />
                                                <button onClick={handleAddSubTask} className="bg-blue-600 text-white px-4 rounded-xl font-black text-[10px] uppercase shadow-md active:scale-95 transition">Thêm</button>
                                                <button type="button" onClick={() => { setSelectedTaskId(editingTask!.id); setSelectedTaskTitle(editingTask!.title); setShowAIModal(true); }}
                                                    className="flex items-center gap-1.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white px-4 rounded-xl font-black text-[10px] uppercase shadow-md active:scale-95 transition hover:from-violet-600 hover:to-purple-700">
                                                    AI Gợi ý
                                                </button>
                                            </div>
                                            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                                                {subTasks.map(sub => (
                                                    <div key={sub.id} onClick={() => handleToggleSub(sub.id, sub.isDone || sub.done || false)}
                                                        className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:border-blue-200 transition-all group">
                                                        <input type="checkbox" checked={sub.isDone || sub.done || false} readOnly
                                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 pointer-events-none" />
                                                        <span className={`text-xs font-bold flex-1 ${(sub.isDone || sub.done) ? 'text-slate-300 line-through' : 'text-slate-600'}`}>{sub.content}</span>
                                                    </div>
                                                ))}
                                                {subTasks.length === 0 && <p className="text-xs text-slate-400 font-medium text-center py-3">Chưa có checklist nào.</p>}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* CỘT PHẢI: BÌNH LUẬN */}
                            <div className="w-full md:w-[380px] flex flex-col bg-slate-50/40">
                                <div className="p-6 border-b border-slate-200 font-black text-[11px] text-slate-600 uppercase tracking-widest">💬 Bình luận ({comments.length})</div>
                                <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar">
                                    {comments.map((c) => (
                                        <div key={c.id} className="flex gap-4">
                                            <div className="w-9 h-9 bg-blue-600 rounded-[1rem] flex items-center justify-center text-[10px] text-white font-black shrink-0 shadow-lg">{c.user?.name?.charAt(0)}</div>
                                            <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                                                <p className="text-[10px] font-black text-slate-900 mb-1">{c.user?.name}</p>
                                                <p className="text-[12px] text-slate-700 leading-relaxed font-medium">{c.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {comments.length === 0 && <p className="text-xs text-slate-400 text-center py-8">Chưa có bình luận.</p>}
                                </div>
                                <div className="p-6 bg-white border-t border-slate-200 flex gap-3">
                                    <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendComment()} placeholder="Phản hồi..." className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-xs outline-none focus:ring-2 focus:ring-blue-100 transition-all" />
                                    <button onClick={handleSendComment} className="bg-blue-600 text-white px-6 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-200 hover:scale-105 active:scale-95 transition-all">Gửi</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Modal - Gợi ý Subtask */}
            {showAIModal && editingTask && (
                <AIBreakdownModal
                    isOpen={showAIModal}
                    onClose={() => setShowAIModal(false)}
                    parentId={selectedTaskId || 0}
                    parentName={selectedTaskTitle}
                    parentDesc={editingTask.description || ''}
                    type="TASK"
                    onSuccess={() => { fetchSubTasks(editingTask.id); fetchData(); setShowAIModal(false); }}
                />
            )}
        </div>
    );
}

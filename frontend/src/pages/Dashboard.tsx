import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend 
} from 'recharts';

interface Project {
    id: number;
    createdAt?: string; 
}

interface Task {
    id: number;
    status: string;
    dueDate: string | null;
}

export default function Dashboard() {
    const [totalProjects, setTotalProjects] = useState(0);
    const [completedTasks, setCompletedTasks] = useState(0);
    const [inProgressTasks, setInProgressTasks] = useState(0);
    const [overdueTasks, setOverdueTasks] = useState(0);
    
    const [barData, setBarData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };

                const [projectsRes, tasksRes] = await Promise.all([
                    axios.get('http://localhost:8081/api/project/my', config),
                    axios.get('http://localhost:8081/api/project/tasks/my-tasks', config) 
                ]);

                const projects: Project[] = projectsRes.data;
                const myTasks: Task[] = tasksRes.data;
                setTotalProjects(projects.length);

                const currentYear = new Date().getFullYear();
                const monthlyStats = Array.from({ length: 12 }, (_, i) => ({
                    name: `T${i + 1}`,
                    project: 0
                }));

                projects.forEach(p => {
                    if (p.createdAt) {
                        const date = new Date(p.createdAt);
                        if (date.getFullYear() === currentYear) {
                            const monthIndex = date.getMonth(); 
                            monthlyStats[monthIndex].project += 1;
                        }
                    }
                });
                setBarData(monthlyStats);

                const completed = myTasks.filter(task => task.status === 'DONE').length;
                setCompletedTasks(completed);

                const inProgress = myTasks.filter(task => task.status === 'IN_PROGRESS' || task.status === 'REVIEW').length;
                setInProgressTasks(inProgress);

                const now = new Date();
                const overdue = myTasks.filter(task => {
                    if (task.status === 'DONE' || !task.dueDate) return false;
                    const deadline = new Date(task.dueDate);
                    return deadline < now;
                }).length;
                setOverdueTasks(overdue);

            } catch (error) {
                console.error("Lỗi khi tải dữ liệu Dashboard:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (isLoading) {
        return <div className="text-blue-600 p-8 text-xl font-bold animate-pulse">Đang tổng hợp dữ liệu... ⏳</div>;
    }

    // --- DATA CHO BIỂU ĐỒ DONUT TÙY CHỈNH ---
    // Gắn màu trực tiếp vào đây để khi lọc bỏ giá trị 0 không bị sai màu
    const pieData = [
        { name: 'Hoàn thành', value: completedTasks, color: '#10B981' }, 
        { name: 'Đang xử lý', value: inProgressTasks, color: '#F59E0B' }, 
        { name: 'Quá hạn', value: overdueTasks, color: '#EF4444' },      
    ];
    
    // Lọc bỏ những trạng thái có giá trị = 0 để biểu đồ không bị đè label
    const activePieData = pieData.filter(item => item.value > 0);
    const totalTasksForPie = completedTasks + inProgressTasks + overdueTasks;

    return (
        <div className="h-full flex flex-col pb-10">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Tổng quan về các dự án và nhiệm vụ</h1>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Card Tổng dự án */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex justify-between items-center">
                    <div>
                        <h3 className="text-gray-500 font-medium mb-1 text-sm">Tổng dự án đang tham gia</h3>
                        <p className="text-4xl font-bold text-gray-800">{totalProjects}</p>
                    </div>
                    <div className="w-14 h-14 rounded-[1rem] bg-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                    </div>
                </div>

                {/* Card Hoàn thành */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex justify-between items-center">
                    <div>
                        <h3 className="text-gray-500 font-medium mb-1 text-sm">Hoàn thành</h3>
                        <p className="text-4xl font-bold text-gray-800">{completedTasks}</p>
                    </div>
                    <div className="w-14 h-14 rounded-[1rem] bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>

                {/* Card Đang thực hiện */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex justify-between items-center">
                    <div>
                        <h3 className="text-gray-500 font-medium mb-1 text-sm">Đang thực hiện</h3>
                        <p className="text-4xl font-bold text-gray-800">{inProgressTasks}</p>
                    </div>
                    <div className="w-14 h-14 rounded-[1rem] bg-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>

                {/* Card Quá hạn */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex justify-between items-center">
                    <div>
                        <h3 className="text-gray-500 font-medium mb-1 text-sm">Quá hạn</h3>
                        <p className="text-4xl font-bold text-gray-800">{overdueTasks}</p>
                    </div>
                    <div className="w-14 h-14 rounded-[1rem] bg-rose-500 flex items-center justify-center text-white shadow-md shadow-rose-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* ================= KHU VỰC BIỂU ĐỒ ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Biểu đồ cột */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Thống kê dự án theo tháng</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} allowDecimals={false} />
                                <Tooltip 
                                    cursor={{fill: '#F3F4F6'}}
                                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                                    formatter={(value) => [`${value} dự án`, 'Số lượng']}
                                />
                                <Bar dataKey="project" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Biểu đồ DONUT MỚI */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-1 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Trạng thái công việc</h3>
                    
                    {totalTasksForPie === 0 ? (
                        <div className="h-[320px] flex flex-col items-center justify-center text-gray-400">
                            <p>Chưa có dữ liệu công việc</p>
                        </div>
                    ) : (
                        <div className="h-[320px] w-full relative">
                            
                            {/* Số TỔNG ở chính giữa */}
                            <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none z-10" style={{ marginTop: '-15px' }}>
                                <span className="text-4xl font-black text-slate-800 leading-none">{totalTasksForPie}</span>
                                <span className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">Tổng số</span>
                            </div>

                            <ResponsiveContainer width="100%" height="100%">
                                {/* SỬA LỖI MẤT CHỮ: Thêm margin 45px ở hai bên trái/phải */}
                                <PieChart margin={{ top: 0, right: 45, bottom: 0, left: 45 }}>
                                    <Pie
                                        data={activePieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50} // Ép bánh nhỏ lại thêm xíu nữa
                                        outerRadius={70} 
                                        paddingAngle={3}
                                        dataKey="value"
                                        stroke="none"
                                        label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        labelLine={{ stroke: '#9CA3AF', strokeWidth: 1 }}
                                        style={{ fontSize: '11px', fontWeight: '500' }} // Thu nhỏ font chữ các label xung quanh
                                    >
                                        {activePieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}   
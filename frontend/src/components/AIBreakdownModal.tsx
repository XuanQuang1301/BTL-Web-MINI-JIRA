import React, { useState, useEffect } from 'react';
import axios from 'axios';

// DTO cho task (project level)
interface GeneratedTask {
  title: string;
  description: string;
  dueDate: string;
  assigneeId?: number;
  priority?: string;
}

// DTO cho subtask (task level)
interface GeneratedSubtask {
  content: string;
}

interface User {
  id: number;
  name: string;
  avatar?: string;
  email?: string;
}

interface AIBreakdownModalProps {
  isOpen: boolean;
  type: 'PROJECT' | 'TASK';
  parentId: number;
  parentName: string;
  parentDesc?: string;
  onClose: () => void;
  onSuccess: () => void;
  // projectName: string; 
  // onSaved: () => void; 
}

const AIBreakdownModal: React.FC<AIBreakdownModalProps> = ({ 
  isOpen, 
  type, 
  parentId, 
  parentName, 
  parentDesc = '',
  onClose, 
  onSuccess 
}) => {
  const [promptText, setPromptText] = useState<string>('');
  const [generatedList, setGeneratedList] = useState<(GeneratedTask | GeneratedSubtask)[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    if (isOpen) {
      const fetchMembers = async () => {
        try {
          if (type === 'PROJECT') {
            const res = await axios.get(`http://localhost:8081/api/project/${parentId}/members`, getAuthConfig());
            const members = res.data.map((m: any) => ({
              id: m.userId,
              name: m.userName,
              email: m.userEmail
            }));
            setAllUsers(members);
          } else {
            const res = await axios.get('http://localhost:8081/api/users', getAuthConfig()); 
            setAllUsers(res.data);
          }
        } catch (e) {
             console.error("Không lấy được danh sách user", e);
        }
      };
      fetchMembers();
    }
  }, [isOpen, parentId, type]);

  if (!isOpen) return null;

  const handleAskAI = async () => {
    setIsLoading(true);
    const fullContext = `Đối tượng: ${parentName}\nMô tả: ${parentDesc}\nYêu cầu bổ sung: ${promptText}`.trim();
    
    try {
      const response = await axios.post(
        'http://localhost:8081/api/chatbot/ai/breakdown', 
        { message: fullContext, level: type },
        getAuthConfig()
      );
      
      if (type === 'PROJECT') {
        const today = new Date().toISOString().split('T')[0];
        const normalizedData = response.data.map((t: any) => {
          let prio = 'MEDIUM';
          if (t.priority) {
            const p = String(t.priority).toUpperCase();
            if (p.includes('LOW') || p.includes('THẤP')) prio = 'LOW';
            else if (p.includes('HIGH') || p.includes('CAO') || p.includes('QUAN TRỌNG')) prio = 'HIGH';
            else if (p.includes('URGENT') || p.includes('KHẨN')) prio = 'URGENT';
          }
          return {
            title: t.title,
            description: t.description,
            dueDate: t.dueDate || today,
            assigneeId: undefined,
            priority: prio
          };
        });
        setGeneratedList(normalizedData);
      } else {
        // TASK level: AI trả về danh sách subtask (có thể có title/description hoặc content)
        const subtasks = response.data.map((item: any) => ({
          content: item.title || item.description || item.content || "Đầu việc mới"
        }));
        setGeneratedList(subtasks);
      }
    } catch (error: any) {
      alert("Lỗi AI: " + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditItem = (index: number, field: keyof (GeneratedTask & GeneratedSubtask), value: any) => {
    const newList = [...generatedList];
    if (type === 'PROJECT') {
      (newList[index] as any)[field] = value;
    } else {
      (newList[index] as any)[field] = value;
    }
    setGeneratedList(newList);
  };

  const handleSaveToDB = async () => {
    setIsSaving(true);
    try {
      if (type === 'PROJECT') {
        const tasks = generatedList as GeneratedTask[];
        for (const task of tasks) {
          const selectedUser = allUsers.find(u => u.id === task.assigneeId);
          const payload = {
            title: task.title,
            description: task.description,
            dueDate: task.dueDate ? `${task.dueDate}T23:59:59` : null,
            assigneeEmail: selectedUser ? selectedUser.email : null,
            priority: task.priority || 'MEDIUM',
            status: 'TODO',
            progress: 0
          };
          await axios.post(`http://localhost:8081/api/project/${parentId}/tasks`, payload, getAuthConfig());
        }
      } else {
        const subtasks = generatedList as GeneratedSubtask[];
        for (const sub of subtasks) {
          await axios.post(`http://localhost:8081/api/subtasks`, {
            taskId: parentId,
            content: sub.content
          }, getAuthConfig());
        }
      }
      alert("Lưu thành công!");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Chi tiết lỗi:", error.response?.data);
      alert("Lưu thất bại: " + (error.response?.data?.message || error.message));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex justify-center items-center p-4 z-[999] animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-2"> TinyJira AI Assistant</h2>
            <p className="text-sm font-medium opacity-80">
              Phân rã {type === 'PROJECT' ? 'công việc cho dự án' : 'đầu việc cho task'}: <span className="underline">{parentName}</span>
            </p>
          </div>
          <button onClick={onClose} className="bg-white/20 hover:bg-white/40 w-10 h-10 rounded-full flex items-center justify-center transition-all">&times;</button>
        </div>

        {/* Body */}
        <div className="p-8 overflow-y-auto flex-1 bg-slate-50/50">
          <div className="mb-8 space-y-3">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Yêu cầu cụ thể cho AI</label>
            <div className="flex gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
              <textarea 
                rows={2}
                className="flex-1 p-3 text-sm focus:outline-none resize-none"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder={type === 'PROJECT' ? "VD: Chia thành các task kỹ thuật, ưu tiên phần backend..." : "VD: Chia thành các bước nhỏ để hoàn thành task này..."}
              />
              <button 
                onClick={handleAskAI}
                disabled={isLoading}
                className="px-6 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all disabled:bg-slate-300"
              >
                {isLoading ? " Đang xử lý..." : " Phân rã"}
              </button>
            </div>
          </div>

          {generatedList.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <h3 className="font-black text-slate-800 tracking-tight">
                  {type === 'PROJECT' ? 'Danh sách công việc & Hạn chót' : 'Danh sách đầu việc cần làm'}
                </h3>
              </div>
              
              <div className="grid gap-3">
                {generatedList.map((item, index) => (
                  <div key={index} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center">
                    
                    {type === 'PROJECT' ? (
                      // ------------------- PROJECT: hiển thị title, desc, dueDate, assignee -------------------
                      <>
                        <div className="flex-1 w-full">
                          <input 
                            className="font-bold text-slate-800 w-full mb-1 focus:text-purple-600 outline-none"
                            value={(item as GeneratedTask).title}
                            onChange={(e) => handleEditItem(index, 'title', e.target.value)}
                          />
                          <input 
                            className="text-xs text-slate-500 w-full outline-none"
                            value={(item as GeneratedTask).description}
                            onChange={(e) => handleEditItem(index, 'description', e.target.value)}
                          />
                        </div>
                        
                        <div className="flex items-center gap-4 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0">
                          {/* Assignee dropdown */}
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Thực hiện</p>
                            <select 
                              className="text-xs font-semibold bg-slate-50 border-none rounded-lg p-2 w-full min-w-[150px]"
                              value={(item as GeneratedTask).assigneeId || ''}
                              onChange={(e) => handleEditItem(index, 'assigneeId', Number(e.target.value) || undefined)}
                            >
                              <option value="">Chưa phân công</option>
                              {allUsers.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Priority dropdown */}
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Độ ưu tiên</p>
                            <select 
                              className="text-xs font-semibold bg-slate-50 border-none rounded-lg p-2 w-full min-w-[100px]"
                              value={(item as GeneratedTask).priority || 'MEDIUM'}
                              onChange={(e) => handleEditItem(index, 'priority', e.target.value)}
                            >
                              <option value="LOW">Thấp (LOW)</option>
                              <option value="MEDIUM">Trung bình (MEDIUM)</option>
                              <option value="HIGH">Cao (HIGH)</option>
                              <option value="URGENT">Khẩn cấp (URGENT)</option>
                            </select>
                          </div>

                          {/* Due date */}
                          <div className="min-w-[140px]">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Hạn chót</p>
                            <input 
                              type="date" 
                              className="text-xs font-bold bg-blue-50 text-blue-700 rounded-lg p-2 w-full outline-none"
                              value={(item as GeneratedTask).dueDate}
                              onChange={(e) => handleEditItem(index, 'dueDate', e.target.value)}
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      // ------------------- TASK: chỉ hiển thị content (subtask) -------------------
                      <div className="flex-1 w-full">
                        <input 
                          className="w-full text-sm font-medium text-slate-700 outline-none"
                          value={(item as GeneratedSubtask).content}
                          onChange={(e) => handleEditItem(index, 'content', e.target.value)}
                          placeholder="Nội dung đầu việc..."
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50">Hủy</button>
          <button 
            onClick={handleSaveToDB} 
            disabled={generatedList.length === 0 || isSaving}
            className="px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-200 hover:scale-105 transition-all disabled:opacity-50"
          >
            {isSaving ? " Đang lưu..." : "Xác nhận và Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIBreakdownModal;
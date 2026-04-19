import { useEffect, useMemo, useState } from "react";
import axios from "axios";

type ViewMode = "day" | "month" | "year";
type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  progress: number;
  createdAt?: string | null;
  dueDate: string | null;
  projectId: number;
  assigneeId: number | null;
}

interface ProjectInfo {
  name: string;
  role: string;
}

interface UserInfo {
  id: number;
  name?: string;
  email?: string;
}

interface TimelineTask extends Task {
  projectName: string;
  assigneeName: string;
  startDate: string;
  endDate: string;
}

const API_BASE_URL = "http://localhost:8081/api";
const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const currentYear = new Date().getFullYear();
const yearOptions = Array.from(
  { length: 11 },
  (_, index) => currentYear + index,
);

const statusTheme: Record<
  TaskStatus,
  { color: string; soft: string; track: string; label: string }
> = {
  TODO: {
    color: "#94A3B8",
    soft: "bg-slate-100 text-slate-700",
    track: "from-slate-400 to-slate-500",
    label: "Cần làm",
  },
  IN_PROGRESS: {
    color: "#6366F1",
    soft: "bg-indigo-100 text-indigo-700",
    track: "from-indigo-400 to-indigo-600",
    label: "Đang làm",
  },
  REVIEW: {
    color: "#C026D3",
    soft: "bg-fuchsia-100 text-fuchsia-700",
    track: "from-fuchsia-400 to-purple-500",
    label: "Chờ duyệt",
  },
  DONE: {
    color: "#10B981",
    soft: "bg-emerald-100 text-emerald-700",
    track: "from-emerald-400 to-emerald-500",
    label: "Đã xong",
  },
};

//lấy số ngày trong tháng đang chọn
function getDaysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

//format ngày để hiển thị thống nhất trên giao diện
function formatDate(dateValue: string | null) {
  if (!dateValue) return "Chưa có hạn";
  return new Date(dateValue).toLocaleDateString("vi-VN");
}

//giới hạn giá trị trong một khoảng cố định
function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

//đưa mốc thời gian về đầu ngày
function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

//đưa mốc thời gian về cuối ngày
function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

//tính khoảng cách số ngày giữa 2 mốc thời gian
function dayDiff(from: Date, to: Date) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((to.getTime() - from.getTime()) / msPerDay);
}

// Xác định cột hiện tại để highlight trên timeline
function isCurrentColumn(
  viewMode: ViewMode,
  selectedYear: number,
  selectedMonth: number,
  label: string,
) {
  const now = new Date();

  if (viewMode === "day") {
    return (
      now.getFullYear() === selectedYear &&
      now.getMonth() === selectedMonth &&
      String(now.getDate()) === label
    );
  }

  if (viewMode === "month") {
    return (
      now.getFullYear() === selectedYear &&
      monthLabels[now.getMonth()] === label
    );
  }

  return String(now.getFullYear()) === label;
}

function statusLabel(status: string) {
  if (status === "TODO") return "Cần làm";
  if (status === "IN_PROGRESS") return "Đang làm";
  if (status === "REVIEW") return "Chờ duyệt";
  if (status === "DONE") return "Đã xong";
  return status;
}

// Chọn màu cho thanh timeline theo trạng thái task
function getBarTone(task: TimelineTask) {
  const isOverdue = Boolean(
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "DONE",
  );

  if (isOverdue) {
    return {
      strong: "bg-rose-500",
      soft: "bg-rose-100",
      text: "text-rose-700",
    };
  }

  if (task.status === "TODO") {
    return {
      strong: "bg-slate-500",
      soft: "bg-slate-200",
      text: "text-slate-700",
    };
  }

  if (task.status === "IN_PROGRESS") {
    return {
      strong: "bg-indigo-500",
      soft: "bg-indigo-100",
      text: "text-indigo-700",
    };
  }

  if (task.status === "REVIEW") {
    return {
      strong: "bg-fuchsia-500",
      soft: "bg-fuchsia-100",
      text: "text-fuchsia-700",
    };
  }

  return {
    strong: "bg-emerald-500",
    soft: "bg-emerald-100",
    text: "text-emerald-700",
  };
}

// Lấy tên hiển thị của user hiện tại để làm fallback cho assignee
function getCurrentUserDisplayName(users: UserInfo[], userId: number | null) {
  const currentUser = users.find((user) => user.id === userId);
  return (
    currentUser?.name || currentUser?.email?.split("@")[0] || "ThÃ nh viÃªn"
  );
}

// Đổi danh sách project sang dạng map để lookup nhanh hơn
function buildProjectsMap(projects: any[]) {
  const projectsMap: Record<number, ProjectInfo> = {};

  projects.forEach((project) => {
    projectsMap[project.id] = {
      name: project.name,
      role: project.role,
    };
  });

  return projectsMap;
}

export default function Timeline() {
  // State điều khiển bộ lọc và dữ liệu timeline
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [tasks, setTasks] = useState<TimelineTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Lấy dữ liệu task, project và user khi mở trang timeline
  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const token = localStorage.getItem("token");
        const storedId = localStorage.getItem("userId");
        const myId = storedId ? Number(storedId) : null;
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [tasksRes, projectsRes, usersRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/project/tasks/my-tasks`, config),
          axios.get(`${API_BASE_URL}/project/my`, config),
          axios.get(`${API_BASE_URL}/users`, config),
        ]);

        const users: UserInfo[] = usersRes.data || [];
        const me: UserInfo = {
          id: -1,
          name: getCurrentUserDisplayName(users, myId),
        };
        const displayName =
          me?.name || me?.email?.split("@")[0] || "Thành viên";

        const projectsMap = buildProjectsMap(projectsRes.data || []);

        const mappedTasks: TimelineTask[] = (tasksRes.data || []).map(
          (task: Task) => {
            const createdAt = task.createdAt ? new Date(task.createdAt) : null;
            const dueDate = task.dueDate ? new Date(task.dueDate) : null;
            const fallbackStart = createdAt || dueDate || new Date();
            const fallbackEnd = dueDate || createdAt || new Date();

            const assignee = users.find(
              (user: any) => user.id === task.assigneeId,
            );
            return {
              ...task,
              status: task.status || "TODO",
              projectName: projectsMap[task.projectId]?.name || "Dự án",
              assigneeName: assignee?.name || displayName,
              startDate: fallbackStart.toISOString(),
              endDate: fallbackEnd.toISOString(),
            };
          },
        );

        setTasks(mappedTasks);
      } catch (error) {
        console.error("Lỗi tại timeline:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimeline();
  }, []);

  // Tạo danh sách cột timeline theo chế độ xem hiện tại
  const timelineColumns = useMemo(() => {
    if (viewMode === "day") {
      return Array.from(
        { length: getDaysInMonth(selectedYear, selectedMonth) },
        (_, index) => ({
          key: `day-${index + 1}`,
          label: `${index + 1}`,
        }),
      );
    }

    if (viewMode === "year") {
      return yearOptions.map((year) => ({
        key: `year-${year}`,
        label: `${year}`,
      }));
    }

    return monthLabels.map((month, index) => ({
      key: `month-${index}`,
      label: month,
    }));
  }, [selectedMonth, selectedYear, viewMode]);

  // Tính các số liệu tổng quan cho phần dashboard phía trên
  const summary = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === "DONE").length;
    const overdue = tasks.filter(
      (task) =>
        task.dueDate &&
        new Date(task.dueDate) < new Date() &&
        task.status !== "DONE",
    ).length;
    const active = tasks.filter(
      (task) => task.status === "IN_PROGRESS" || task.status === "REVIEW",
    ).length;
    const avgProgress = total
      ? Math.round(
          tasks.reduce((sum, task) => sum + (task.progress || 0), 0) / total,
        )
      : 0;

    const statusSummary = (Object.keys(statusTheme) as TaskStatus[]).map(
      (status) => {
        const count = tasks.filter((task) => task.status === status).length;
        return {
          status,
          count,
          percent: total ? (count / total) * 100 : 0,
        };
      },
    );

    return { total, completed, overdue, active, avgProgress, statusSummary };
  }, [tasks]);

  // Tạo màu cho biểu đồ tròn theo tỷ lệ trạng thái
  const donutBackground = useMemo(() => {
    let cursor = 0;
    const segments = summary.statusSummary.map((item) => {
      const start = cursor;
      const end = cursor + item.percent;
      cursor = end;
      return `${statusTheme[item.status].color} ${start}% ${end}%`;
    });
    return `conic-gradient(${segments.join(", ")})`;
  }, [summary.statusSummary]);

  // Tính vị trí và độ dài của từng task trên timeline
  const positionedTasks = useMemo(() => {
    const totalColumns = timelineColumns.length;
    const periodStart =
      viewMode === "day"
        ? startOfDay(new Date(selectedYear, selectedMonth, 1))
        : viewMode === "month"
          ? startOfDay(new Date(selectedYear, 0, 1))
          : startOfDay(new Date(yearOptions[0], 0, 1));
    const periodEnd =
      viewMode === "day"
        ? endOfDay(
            new Date(
              selectedYear,
              selectedMonth,
              getDaysInMonth(selectedYear, selectedMonth),
            ),
          )
        : viewMode === "month"
          ? endOfDay(new Date(selectedYear, 11, 31))
          : endOfDay(new Date(yearOptions[yearOptions.length - 1], 11, 31));

    return tasks
      .map((task) => {
        const rawStart = new Date(task.startDate);
        const rawEnd = new Date(task.endDate);
        const taskStart = startOfDay(rawStart <= rawEnd ? rawStart : rawEnd);
        const taskEnd = endOfDay(rawStart <= rawEnd ? rawEnd : rawStart);
        const isVisible = taskStart <= periodEnd && taskEnd >= periodStart;

        if (!isVisible) {
          return {
            ...task,
            isVisible,
            left: 0,
            width: 0,
          };
        }

        const clippedStart = taskStart > periodStart ? taskStart : periodStart;
        const clippedEnd = taskEnd < periodEnd ? taskEnd : periodEnd;

        let startIndex = 0;
        let endIndex = totalColumns - 1;

        if (viewMode === "day") {
          startIndex = dayDiff(periodStart, clippedStart);
          endIndex = dayDiff(periodStart, clippedEnd);
        } else if (viewMode === "month") {
          startIndex = clippedStart.getMonth();
          endIndex = clippedEnd.getMonth();
        } else {
          startIndex = clippedStart.getFullYear() - yearOptions[0];
          endIndex = clippedEnd.getFullYear() - yearOptions[0];
        }

        const safeStart = clamp(startIndex, 0, totalColumns - 1);
        const safeEnd = clamp(endIndex, safeStart, totalColumns - 1);
        const left = (safeStart / totalColumns) * 100;
        const width = ((safeEnd - safeStart + 1) / totalColumns) * 100;

        return {
          ...task,
          isVisible,
          left,
          width,
        };
      })
      .filter((task) => task.isVisible)
      .sort(
        (a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime(),
      );
  }, [selectedMonth, selectedYear, tasks, timelineColumns.length, viewMode]);

  // Gom task theo project để render từng nhóm dễ đọc hơn
  const groupedTasks = useMemo(() => {
    const groups = new Map<string, typeof positionedTasks>();

    positionedTasks.forEach((task) => {
      const current = groups.get(task.projectName) || [];
      current.push(task);
      groups.set(task.projectName, current);
    });

    return Array.from(groups.entries()).map(([projectName, items]) => ({
      projectName,
      items,
    }));
  }, [positionedTasks]);

  // Lấy các task gần deadline nhất để hiển thị cảnh báo nhanh
  const urgentTasks = useMemo(() => {
    return tasks
      .filter((task) => task.status !== "DONE")
      .sort(
        (a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime(),
      )
      .slice(0, 3);
  }, [tasks]);

  // Trạng thái loading khi dữ liệu chưa tải xong
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center rounded-[32px] bg-white text-blue-600">
        <span className="text-lg font-black animate-pulse">
          Đang tải timeline...
        </span>
      </div>
    );
  }

  return (
    <section className="min-h-full rounded-[32px] bg-[#f4f7f9] p-4 font-[Tahoma,sans-serif] text-slate-900 sm:p-6 xl:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
          Timeline
        </h1>

        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            {/* Cột trái: biểu đồ phân bố trạng thái */}
            <div className="rounded-[28px] bg-white p-6 shadow-[0_18px_60px_rgba(148,163,184,0.18)] ring-1 ring-slate-200">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
                  Trạng thái
                </p>
                <h2 className="text-2xl font-black text-slate-900">
                  Phân bố công việc
                </h2>
              </div>

              <div className="mt-6 flex justify-center">
                <div
                  className="relative h-52 w-52 rounded-full"
                  style={{ background: donutBackground }}
                >
                  <div className="absolute inset-[26%] rounded-full bg-white shadow-inner" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-slate-900">
                      {summary.completed}
                    </span>
                    <span className="text-sm font-semibold text-slate-400">
                      đã xong
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="grid grid-cols-[1.2fr_0.8fr_0.6fr] border-b border-slate-200 pb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                  <span>Status</span>
                  <span>Count</span>
                  <span>%</span>
                </div>
                {summary.statusSummary.map((item) => (
                  <div
                    key={item.status}
                    className="grid grid-cols-[1.2fr_0.8fr_0.6fr] items-center text-sm font-semibold text-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-4 w-4 rounded-full"
                        style={{
                          backgroundColor: statusTheme[item.status].color,
                        }}
                      />
                      <span>{statusLabel(item.status)}</span>
                    </div>
                    <span style={{ color: statusTheme[item.status].color }}>
                      {item.count} task
                    </span>
                    <span>{item.percent.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cột phải: các thẻ thống kê nhanh */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[28px] bg-white p-6 shadow-[0_18px_60px_rgba(148,163,184,0.18)] ring-1 ring-slate-200">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
                  Tổng quan
                </p>
                <h3 className="mt-1 text-2xl font-black text-slate-900">
                  Tiến độ cá nhân
                </h3>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                      Tổng task
                    </p>
                    <p className="mt-3 text-3xl font-black text-slate-900">
                      {summary.total}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                      Đang xử lý
                    </p>
                    <p className="mt-3 text-3xl font-black text-slate-900">
                      {summary.active}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                      Trễ hạn
                    </p>
                    <p className="mt-3 text-3xl font-black text-rose-500">
                      {summary.overdue}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                      Tiến độ TB
                    </p>
                    <p className="mt-3 text-3xl font-black text-cyan-600">
                      {summary.avgProgress}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] bg-white p-6 shadow-[0_18px_60px_rgba(148,163,184,0.18)] ring-1 ring-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
                      Cần ưu tiên
                    </p>
                    <h3 className="text-xl font-black text-slate-900">
                      Gần đến deadline
                    </h3>
                  </div>
                  <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600">
                    {urgentTasks.length} task
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {urgentTasks.length > 0 ? (
                    urgentTasks.map((task) => (
                      <div
                        key={task.id}
                        className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {task.title}
                            </p>
                            <p className="mt-1 text-xs font-medium text-slate-500">
                              {task.projectName}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusTheme[task.status as TaskStatus]?.soft || "bg-slate-100 text-slate-600"}`}
                          >
                            {statusLabel(task.status)}
                          </span>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500">
                          <span>Hạn: {formatDate(task.dueDate)}</span>
                          <span>{task.progress}%</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-400">
                      Chưa có task cảnh báo trong giai đoạn này.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Khối timeline chính */}
          <div className="overflow-hidden rounded-[28px] bg-white text-slate-900 shadow-[0_18px_60px_rgba(148,163,184,0.18)] ring-1 ring-slate-200">
            <div className="border-b border-slate-200 px-5 py-4">
              {/* Thanh điều khiển: đổi chế độ xem và mốc thời gian */}
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-lg font-black text-slate-900">
                    Timeline task
                  </p>
                </div>

                <div className="flex justify-end">
                  <div className="flex flex-wrap gap-2 rounded-[24px] border border-slate-200 bg-blue-50 p-2 text-slate-900">
                    <div className="rounded-2xl border border-blue-100 bg-white p-1">
                      {(["day", "month", "year"] as ViewMode[]).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setViewMode(mode)}
                          className={`rounded-2xl px-5 py-2.5 text-sm font-semibold transition ${
                            viewMode === mode
                              ? "bg-blue-600 text-white shadow-sm"
                              : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                          }`}
                        >
                          {mode === "day"
                            ? "Ngày"
                            : mode === "month"
                              ? "Tháng"
                              : "Năm"}
                        </button>
                      ))}
                    </div>

                    <select
                      value={selectedMonth}
                      onChange={(event) =>
                        setSelectedMonth(Number(event.target.value))
                      }
                      className="rounded-2xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                    >
                      {monthLabels.map((month, index) => (
                        <option
                          key={month}
                          value={index}
                          className="text-slate-900"
                        >
                          {month}
                        </option>
                      ))}
                    </select>

                    <select
                      value={selectedYear}
                      onChange={(event) =>
                        setSelectedYear(Number(event.target.value))
                      }
                      className="rounded-2xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                    >
                      {yearOptions.map((year) => (
                        <option
                          key={year}
                          value={year}
                          className="text-slate-900"
                        >
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Bảng timeline và các thanh tiến độ của task */}
            <div className="overflow-x-auto">
              <div className="min-w-[1120px]">
                <div className="grid grid-cols-[88px_260px_minmax(740px,1fr)] border-b-2 border-slate-300 bg-slate-50">
                  <div className="relative z-10 flex items-center justify-center border-r border-slate-200 bg-slate-50 px-4 py-2 text-center text-sm font-bold uppercase tracking-[0.2em] text-slate-500">
                    Project
                  </div>
                  <div className="flex items-center justify-center border-r border-slate-200 px-6 py-2 text-center text-lg font-bold text-slate-800">
                    Task
                  </div>
                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: `repeat(${timelineColumns.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {timelineColumns.map((column) => (
                      <div
                        key={column.key}
                        className={`border-l border-slate-200 px-2 py-2 text-center text-sm font-semibold ${
                          isCurrentColumn(
                            viewMode,
                            selectedYear,
                            selectedMonth,
                            column.label,
                          )
                            ? "bg-cyan-50 text-cyan-700"
                            : "text-slate-500"
                        }`}
                      >
                        {column.label}
                      </div>
                    ))}
                  </div>
                </div>

                {groupedTasks.length > 0 ? (
                  <div className="relative">
                    <div
                      className="absolute left-[348px] right-0 top-0 bottom-0 grid pointer-events-none"
                      style={{
                        gridTemplateColumns: `repeat(${timelineColumns.length}, minmax(0, 1fr))`,
                      }}
                    >
                      {timelineColumns.map((column) => (
                        <div
                          key={`body-grid-${column.key}`}
                          className={`border-l border-slate-200 ${
                            isCurrentColumn(
                              viewMode,
                              selectedYear,
                              selectedMonth,
                              column.label,
                            )
                              ? "bg-cyan-50/70"
                              : "bg-transparent"
                          }`}
                        />
                      ))}
                    </div>

                    {groupedTasks.map((group) => (
                      <div
                        key={group.projectName}
                        className="relative border-b-2 border-slate-300 last:border-b-0"
                      >
                        <div className="grid grid-cols-[88px_260px_minmax(740px,1fr)]">
                          <div
                            className="relative flex items-center justify-center border-r border-slate-300 bg-slate-50/80 px-3"
                            style={{
                              gridRow: `span ${group.items.length} / span ${group.items.length}`,
                            }}
                          >
                            <span
                              className="text-center text-sm font-black uppercase tracking-[0.18em] text-slate-700"
                              style={{
                                writingMode: "vertical-rl",
                                transform: "rotate(180deg)",
                              }}
                            >
                              {group.projectName}
                            </span>
                          </div>

                          {group.items.map((task, index) => {
                            const tone = getBarTone(task);
                            const progressWidth = `${task.status === "DONE" ? 100 : clamp(task.progress || 0, 0, 100)}%`;
                            const rowBorderClass =
                              index < group.items.length - 1
                                ? "border-b border-slate-200"
                                : "";

                            return (
                              <div key={task.id} className="contents">
                                <div
                                  className={`flex min-h-[68px] flex-col justify-center border-r border-slate-200 px-4 py-3 ${rowBorderClass}`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="flex-1 text-sm font-bold text-slate-900 line-clamp-2 leading-tight">
                                      {task.title}
                                    </p>
                                    <span
                                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap ${statusTheme[task.status as TaskStatus]?.soft || "bg-slate-100 text-slate-600"}`}
                                    >
                                      {statusLabel(task.status)}
                                    </span>
                                  </div>

                                  <div className="mt-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-400 gap-1">
                                    <span className="truncate">
                                      {formatDate(task.endDate)}
                                    </span>
                                    <span className="shrink-0">{task.progress}%</span>
                                  </div>
                                </div>

                                <div
                                  className={`relative min-h-[68px] border-l border-slate-200 ${rowBorderClass}`}
                                >
                                  <div
                                    className="absolute top-1/2 -translate-y-1/2"
                                    style={{
                                      left: `${task.left}%`,
                                      width: `${task.width}%`,
                                    }}
                                  >
                                    <div
                                      className={`relative h-6 overflow-hidden rounded-full ${tone.soft}`}
                                    >
                                      <div
                                        className={`h-full rounded-full ${tone.strong}`}
                                        style={{ width: progressWidth }}
                                      />
                                      <span
                                        className={`absolute inset-0 flex items-center justify-center text-xs font-black ${tone.text}`}
                                      >
                                        {task.progress}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-16 text-center text-sm font-semibold text-slate-400">
                    Không có task nào trong mốc thời gian đang chọn.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

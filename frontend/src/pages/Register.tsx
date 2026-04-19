import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      const response = await axios.post('http://localhost:8081/api/auth/signup', formData);
      setIsError(false);
      setMessage('Đăng ký thành công! Đang chuyển đến trang đăng nhập...');
      console.log('Dữ liệu trả về:', response.data);
      setTimeout(() => navigate('/login'), 2000);
    }
    catch (error: any) {
      setIsError(true);
      setMessage(error.response?.data?.error || 'Có lỗi xảy ra khi đăng ký');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Tạo Tài Khoản</h2>

        {message && (
          <div className={`p-3 rounded mb-4 text-sm text-center border ${isError ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-600 mb-1 text-sm">Họ và Tên</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-white text-gray-800 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập tên của bạn"
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1 text-sm">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-white text-gray-800 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@gmail.com"
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1 text-sm">Mật khẩu</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-white text-gray-800 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition duration-200 mt-4"
          >
            Đăng Ký
          </button>
        </form>
        
        <p className="mt-6 text-center text-gray-600 text-sm border-t border-gray-200 pt-6">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  )
}
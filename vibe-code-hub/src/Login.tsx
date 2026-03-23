import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Lock, Eye, EyeOff } from 'lucide-react';

const SAVED_EMAIL_KEY = 'vcb_saved_email';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, isVIP, loading: authLoading } = useAuth();

  useEffect(() => {
    const saved = localStorage.getItem(SAVED_EMAIL_KEY);
    if (saved) setEmail(saved);
  }, []);

  // เมื่อ auth context ยืนยัน VIP แล้ว ให้ redirect ไป dashboard
  useEffect(() => {
    if (!authLoading && user && isVIP) {
      navigate('/');
    }
  }, [authLoading, user, isVIP, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem(SAVED_EMAIL_KEY, email);
      // ไม่ navigate ที่นี่ — ให้ useEffect ด้านบนจัดการเมื่อ auth context พร้อม
    } catch (err: any) {
      const code = err?.code ?? '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองอีกครั้ง');
      } else if (code === 'auth/user-disabled') {
        setError('บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
      } else if (code === 'auth/too-many-requests') {
        setError('ลองผิดหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่');
      } else if (code === 'auth/operation-not-allowed' || code === 'auth/configuration-not-found') {
        setError('ระบบยังไม่เปิดใช้งานการล็อกอินด้วย Email/Password กรุณาติดต่อผู้ดูแลระบบ');
      } else if (code === 'auth/network-request-failed') {
        setError('ไม่สามารถเชื่อมต่อได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่');
      } else {
        setError(`เกิดข้อผิดพลาด: ${code || 'ไม่ทราบสาเหตุ'} กรุณาติดต่อผู้ดูแลระบบ`);
      }
      setLoading(false);
    }
  };

  const isSubmitting = loading || (!!user && authLoading);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="max-w-md w-full bg-zinc-900 rounded-2xl shadow-2xl p-8 border border-zinc-800">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Vibe Code Hub</h1>
          <p className="text-zinc-400 mt-2 text-sm">พอร์ทัลสำหรับสมาชิก VIP</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">อีเมล</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="กรอกอีเมลของคุณ"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">รหัสผ่าน</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="กรอกรหัสผ่านของคุณ"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-zinc-500 space-y-1">
          <p>การเข้าถึงจำกัดเฉพาะสมาชิกที่ได้รับอนุญาตเท่านั้น</p>
          <p>ไม่อนุญาตให้สมัครด้วยตนเอง</p>
        </div>
      </div>
    </div>
  );
};

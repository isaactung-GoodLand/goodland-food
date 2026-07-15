'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPage() {
  const [token, setToken] = useState('');
  const [step, setStep] = useState<'enter' | 'done'>('enter');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('請輸入重設Token');
      return;
    }
    setLoading(true);
    setError('');

    // Redirect to reset page with the token
    window.location.href = `/admin/reset?token=${encodeURIComponent(token.trim())}`;
  };

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">密碼已重設</h1>
          <p className="text-gray-500 text-sm mb-6">請用新密碼登入</p>
          <Link href="/admin/login"
            className="inline-block w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            前往登入
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🔑</div>
          <h1 className="text-xl font-bold text-gray-800">忘記密碼</h1>
          <p className="text-sm text-gray-500 mt-1">請向系統管理員取得重設Token</p>
        </div>

        <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <strong>如何取得 Token？</strong><br/>
          請聯繫系統管理員，由管理員登入 Neon Console 在 <code>admin_users</code> 資料表設定 recovery token。
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">重設Token</label>
            <input
              type="text"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="請貼上管理員提供的Token"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? '轉跳中...' : '前往設定新密碼'}
          </button>

          <div className="text-center">
            <Link href="/admin/login" className="text-sm text-blue-600 hover:underline">
              想起密碼了？返回登入
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

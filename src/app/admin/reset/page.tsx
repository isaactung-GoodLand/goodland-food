'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirm) {
      setMsg({ type: 'err', text: '請填寫所有欄位' });
      return;
    }
    if (password !== confirm) {
      setMsg({ type: 'err', text: '兩次密碼不符' });
      return;
    }
    if (password.length < 8) {
      setMsg({ type: 'err', text: '密碼至少 8 個字元' });
      return;
    }

    setLoading(true);
    setMsg(null);

    const res = await fetch('/admin/api/auth/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password: password }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setMsg({ type: 'ok', text: '密碼已重設，請用新密碼登入 🎉' });
      setTimeout(() => router.push('/admin/login'), 2000);
    } else {
      setMsg({ type: 'err', text: data.error || '重設失敗' });
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🔑</div>
            <h1 className="text-xl font-bold text-gray-800">重設密碼</h1>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-4 py-3 rounded-lg">
            請從管理員取得重設連結。連結格式：<code>/admin/reset?token=...</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🔑</div>
          <h1 className="text-xl font-bold text-gray-800">設定新密碼</h1>
          <p className="text-sm text-gray-500 mt-1">輸入新密碼完成重設</p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">新密碼</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="至少 8 個字元"
              required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">確認新密碼</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="再輸入一次"
              required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {msg && (
            <div className={`px-4 py-2.5 rounded-lg text-sm ${
              msg.type === 'ok'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {msg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '設定中...' : '設定新密碼'}
          </button>

          <div className="text-center">
            <a href="/admin/login" className="text-sm text-blue-600 hover:underline">
              想起密碼了？返回登入
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100" />}>
      <ResetForm />
    </Suspense>
  );
}

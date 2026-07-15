'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SettingsPage() {
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPw || !newPw || !confirmPw) {
      setMsg({ type: 'err', text: '請填寫所有欄位' });
      return;
    }
    if (newPw !== confirmPw) {
      setMsg({ type: 'err', text: '新密碼與確認密碼不符' });
      return;
    }
    if (newPw.length < 8) {
      setMsg({ type: 'err', text: '新密碼至少 8 個字元' });
      return;
    }
    setLoading(true);
    setMsg(null);
    const res = await fetch('/admin/api/auth/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ old_password: oldPw, new_password: newPw }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMsg({ type: 'ok', text: '密碼更新成功 🎉' });
      setOldPw(''); setNewPw(''); setConfirmPw('');
    } else {
      setMsg({ type: 'err', text: data.error || '更新失敗' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-md w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-bold text-gray-800">⚙️ 帳號設定</h1>
          <Link href="/admin"
            className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200">
            ← 返回
          </Link>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">舊密碼</label>
            <input type="password" value={oldPw} onChange={e => setOldPw(e.target.value)}
              placeholder="輸入舊密碼"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">新密碼</label>
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
              placeholder="輸入新密碼（至少 8 字元）"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">確認新密碼</label>
            <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
              placeholder="再輸入一次新密碼"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {msg && (
            <div className={`px-4 py-2.5 rounded-lg text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {msg.text}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? '更新中...' : '更新密碼'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <h2 className="text-sm font-medium text-gray-700 mb-2">忘記密碼？</h2>
          <p className="text-xs text-gray-500 mb-2">聯繫管理員產生重設連結，或直接操作資料庫。</p>
          <a href="/admin/reset"
            className="text-xs text-blue-600 hover:underline">
            已有重設連結 →
          </a>
        </div>
      </div>
    </div>
  );
}

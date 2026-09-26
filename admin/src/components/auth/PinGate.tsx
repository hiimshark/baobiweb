import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const PinGate: React.FC = () => {
  const { login, addToast } = useAppStore();
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) {
      setErrorMessage('Vui lòng nhập mã PIN quản trị.');
      return;
    }

    const tokenInput = document.querySelector('input[name="cf-turnstile-response"]') as HTMLInputElement;
    const turnstileToken = tokenInput?.value;

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await login(pin, turnstileToken);
      if (res.ok) {
        addToast({
          title: 'Đăng nhập thành công',
          description: 'Chào mừng bạn quay lại hệ thống quản trị Kho Sỉ Bao Bì.',
          type: 'success',
        });
      } else {
        setErrorMessage(res.error || 'Mã PIN quản trị không chính xác.');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).turnstile) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).turnstile.reset();
          } catch {}
        }
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.error || 'Mã PIN không chính xác hoặc bạn đã thử quá nhiều lần.'
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).turnstile) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).turnstile.reset();
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand / Shield Icon */}
        <div className="text-center space-y-3 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-500/25 ring-4 ring-emerald-500/10">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Kho Sỉ Bao Bì
            </h1>
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mt-0.5">
              Admin Portal
            </p>
          </div>
          <p className="text-sm text-slate-400 max-w-xs mx-auto">
            Khu vực giới hạn cho Quản trị viên. Vui lòng nhập mã PIN bảo mật để tiếp tục.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
              Mã PIN Quản Trị
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                autoFocus
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="Nhập mã PIN bí mật..."
                className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono tracking-widest text-center text-lg pr-12 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Cloudflare Turnstile CAPTCHA */}
          <div className="flex justify-center my-2 min-h-[65px]">
            <div
              className="cf-turnstile"
              data-sitekey="0x4AAAAAAFEbDSKygc5KymKl"
              data-theme="dark"
            />
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-xs text-rose-300 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Mở khóa Quản Trị</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security badge and link back */}
        <div className="mt-8 pt-6 border-t border-slate-700/60 text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Được bảo vệ bằng mã hóa SHA / Rate Limiting</span>
          </div>

          <div>
            <a
              href="/"
              className="text-xs text-slate-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
            >
              ← Quay lại trang bán hàng cho khách
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

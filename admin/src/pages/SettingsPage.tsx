import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Send, 
  ShieldCheck, 
  Palette, 
  Save, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  Database,
  Moon,
  Sun,
  Lock,
  RefreshCw
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { adminApi } from '../lib/api';

export const SettingsPage: React.FC = () => {
  const { darkMode, toggleDarkMode, addToast } = useAppStore();
  const [activeTab, setActiveTab] = useState<'store' | 'telegram' | 'security' | 'system'>('store');

  // Store profile settings
  const [storeName, setStoreName] = useState('Kho Sỉ Bao Bì');
  const [hotline, setHotline] = useState('0908 123 456');
  const [zalo, setZalo] = useState('0908 123 456');
  const [address, setAddress] = useState('TP. Hồ Chí Minh');
  const [workHours, setWorkHours] = useState('08:00 - 18:00 (Thứ 2 - Thứ 7)');
  const [freeShipThreshold, setFreeShipThreshold] = useState('3.000.000');

  // Telegram settings
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);

  // Security settings
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPins, setShowPins] = useState(false);

  useEffect(() => {
    adminApi.getStatus().then((res) => {
      if (res && res.ok) {
        if (res.brand) {
          if (res.brand.name) setStoreName(res.brand.name);
          if (res.brand.phone) {
            setHotline(res.brand.phone);
            setZalo(res.brand.phone);
          }
          if (res.brand.address) setAddress(res.brand.address);
          if (res.brand.hours) setWorkHours(res.brand.hours);
        }
        if (res.chatId) setChatId(res.chatId);
        if (res.maskedToken) setBotToken(res.maskedToken);
      }
    }).catch((err) => console.warn('Could not load server config:', err));
  }, []);

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.saveSettings({
        brand: {
          name: storeName,
          phone: hotline,
          address,
          hours: workHours,
        },
      });
      addToast({
        title: 'Đã lưu cấu hình cửa hàng',
        description: 'Thông tin liên hệ và địa chỉ kho đã được đồng bộ lên web chính.',
        type: 'success',
      });
    } catch {
      addToast({
        title: 'Lỗi đồng bộ',
        description: 'Không thể lưu cài đặt lên máy chủ.',
        type: 'error',
      });
    }
  };

  const handleTestTelegram = async () => {
    setIsTestingTelegram(true);
    try {
      const res = await adminApi.testTelegram();
      if (res && res.ok) {
        addToast({
          title: 'Gửi tin nhắn Telegram thành công',
          description: 'Tin nhắn thử nghiệm đã được đẩy đến nhóm Telegram Quản Trị.',
          type: 'success',
        });
      } else {
        addToast({
          title: 'Lỗi gửi tin nhắn',
          description: res.error || 'Kiểm tra token hoặc Chat ID.',
          type: 'error',
        });
      }
    } catch (err: any) {
      addToast({
        title: 'Lỗi Telegram',
        description: err.response?.data?.error || 'Không gửi được tin nhắn test.',
        type: 'error',
      });
    } finally {
      setIsTestingTelegram(false);
    }
  };

  const handleSaveTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { chatId };
      if (!botToken.includes('…')) {
        payload.token = botToken;
      }
      await adminApi.saveSettings(payload);
      addToast({
        title: 'Đã cập nhật Telegram Bot',
        description: 'Hệ thống sẽ chuyển tiếp mọi đơn hàng mới vào Chat ID này.',
        type: 'success',
      });
    } catch (err: any) {
      addToast({
        title: 'Lỗi cấu hình Bot',
        description: err.response?.data?.error || 'Không thể lưu cấu hình Bot Telegram.',
        type: 'error',
      });
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 6) {
      addToast({
        title: 'Mã PIN quá ngắn',
        description: 'Mã PIN bảo mật mới phải có ít nhất 6 ký tự.',
        type: 'error',
      });
      return;
    }
    if (newPin !== confirmPin) {
      addToast({
        title: 'Mã PIN không khớp',
        description: 'Mã PIN mới và xác nhận mã PIN không trùng nhau.',
        type: 'error',
      });
      return;
    }

    try {
      await adminApi.saveSettings({ newPin });
      localStorage.setItem('admin_pin', newPin);
      addToast({
        title: 'Đổi mã PIN thành công',
        description: 'Mã PIN quản trị viên mới đã được kích hoạt trên hệ thống.',
        type: 'success',
      });
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (err: any) {
      addToast({
        title: 'Lỗi đổi PIN',
        description: err.response?.data?.error || 'Không thể đổi mã PIN.',
        type: 'error',
      });
    }
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localStorage));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `baobi_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    addToast({
      title: 'Xuất dữ liệu thành công',
      description: 'Tệp JSON sao lưu hệ thống đã được tải xuống.',
      type: 'success',
    });
  };

  const handleResetData = () => {
    if (window.confirm('Bạn có chắc chắn muốn đặt lại tất cả dữ liệu về mặc định ban đầu không?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cài Đặt Hệ Thống</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Quản lý thông tin kho sỉ, tích hợp Telegram bot báo đơn và cấu hình bảo mật
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Tabs */}
        <div className="md:col-span-1 space-y-1">
          <button
            onClick={() => setActiveTab('store')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              activeTab === 'store'
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 font-semibold'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Thông tin kho sỉ</span>
          </button>

          <button
            onClick={() => setActiveTab('telegram')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              activeTab === 'telegram'
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 font-semibold'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card'
            }`}
          >
            <Send className="w-4 h-4 text-sky-500" />
            <span>Bot Telegram</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              activeTab === 'security'
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 font-semibold'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Bảo mật & Mã PIN</span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              activeTab === 'system'
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 font-semibold'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card'
            }`}
          >
            <Palette className="w-4 h-4 text-purple-500" />
            <span>Giao diện & Dữ liệu</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="md:col-span-3">
          {/* Tab 1: Store Info */}
          {activeTab === 'store' && (
            <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-6 shadow-sm">
              <div className="flex items-center justify-between pb-5 border-b border-gray-100 dark:border-dark-border mb-6">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Thông tin Kho Sỉ Bao Bì
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Thông tin này hiển thị trên website, hoá đơn báo giá và tin nhắn Zalo gửi khách
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveStore} className="space-y-4">
                <Input
                  label="Tên kho / Doanh nghiệp"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Hotline tư vấn nhanh"
                    value={hotline}
                    onChange={(e) => setHotline(e.target.value)}
                    required
                  />
                  <Input
                    label="Số Zalo nhận file in / đặt hàng"
                    value={zalo}
                    onChange={(e) => setZalo(e.target.value)}
                    required
                  />
                </div>

                <Input
                  label="Địa chỉ kho lấy hàng trực tiếp"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Khung giờ phục vụ"
                    value={workHours}
                    onChange={(e) => setWorkHours(e.target.value)}
                  />
                  <Input
                    label="Hạn mức freeship nội thành (VNĐ)"
                    value={freeShipThreshold}
                    onChange={(e) => setFreeShipThreshold(e.target.value)}
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <Button type="submit" variant="primary" className="gap-2">
                    <Save className="w-4 h-4" /> Lưu thông tin
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 2: Telegram Bot */}
          {activeTab === 'telegram' && (
            <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-6 shadow-sm">
              <div className="flex items-center justify-between pb-5 border-b border-gray-100 dark:border-dark-border mb-6">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    Tích hợp Telegram Bot Báo Đơn
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Đang hoạt động
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Tự động đẩy thông báo ngay tức thì khi có khách đặt hàng hoặc để lại SĐT tư vấn
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveTelegram} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Telegram Bot Token
                  </label>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Input
                  label="Chat ID / Group ID Nhận Thông Báo"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  placeholder="Ví dụ: -100xxxxxxxxxx hoặc user id"
                />

                <div className="p-4 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/40 rounded-xl text-xs text-sky-800 dark:text-sky-300 space-y-1.5">
                  <div className="font-semibold flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" /> Hướng dẫn lấy Chat ID:
                  </div>
                  <p>1. Thêm bot vào nhóm Telegram của nhân viên bán hàng / kho.</p>
                  <p>2. Gửi một tin nhắn bất kỳ vào nhóm rồi truy cập <code>https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code> để lấy ID nhóm.</p>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestTelegram}
                    isLoading={isTestingTelegram}
                    className="gap-2 text-sky-600 border-sky-300 hover:bg-sky-50 dark:border-sky-800 dark:hover:bg-sky-950/50"
                  >
                    <Send className="w-4 h-4" /> Gửi tin nhắn test
                  </Button>

                  <Button type="submit" variant="primary" className="gap-2">
                    <Save className="w-4 h-4" /> Lưu cấu hình Bot
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 3: Security & PIN */}
          {activeTab === 'security' && (
            <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-6 shadow-sm">
              <div className="flex items-center justify-between pb-5 border-b border-gray-100 dark:border-dark-border mb-6">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Bảo Mật & Mã PIN Quản Trị
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Quản lý mã PIN truy cập hệ thống và kích hoạt các lớp bảo vệ chống xâm nhập
                  </p>
                </div>
              </div>

              <form onSubmit={handleChangePin} className="space-y-4">
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                  <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Mã PIN mặc định:</span> Nếu chưa đổi, mã PIN mặc định truy cập quyền quản trị backend là <strong>1997</strong>.
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Mã PIN hiện tại
                  </label>
                  <div className="relative">
                    <input
                      type={showPins ? 'text' : 'password'}
                      value={currentPin}
                      onChange={(e) => setCurrentPin(e.target.value)}
                      placeholder="Nhập mã PIN cũ..."
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                      Mã PIN mới
                    </label>
                    <input
                      type={showPins ? 'text' : 'password'}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="Tối thiểu 4 số..."
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                      Xác nhận mã PIN mới
                    </label>
                    <input
                      type={showPins ? 'text' : 'password'}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      placeholder="Nhập lại mã PIN..."
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showPinToggle"
                    checked={showPins}
                    onChange={(e) => setShowPins(e.target.checked)}
                    className="rounded text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="showPinToggle" className="text-xs text-gray-600 dark:text-gray-400">
                    Hiển thị các mã PIN
                  </label>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-dark-border">
                  <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                    Các lớp phòng thủ Anti-Hack đã tích hợp:
                  </h4>
                  <ul className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      Rate Limiting: Giới hạn 20 request/phút trên API gửi đơn chống Spam/DDoS
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      XSS Prevention: Lọc sạch HTML Tags trong tên khách và ghi chú
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      Security Headers: CSP, X-Frame-Options (chống Clickjacking), X-Content-Type-Options
                    </li>
                  </ul>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button type="submit" variant="primary" className="gap-2">
                    <Save className="w-4 h-4" /> Cập nhật mã PIN
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 4: System & Appearance */}
          {activeTab === 'system' && (
            <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  Giao Diện & Dữ Liệu Hệ Thống
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Tùy chỉnh chế độ hiển thị và quản lý bộ nhớ đệm
                </p>
              </div>

              {/* Theme switch */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-bg rounded-xl border border-gray-100 dark:border-dark-border">
                <div className="flex items-center gap-3">
                  {darkMode ? (
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                      <Moon className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                      <Sun className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      Chế độ Giao diện ({darkMode ? 'Tối / Dark mode' : 'Sáng / Light mode'})
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Chuyển đổi giữa nền sáng văn phòng và nền tối bảo vệ mắt
                    </p>
                  </div>
                </div>

                <Button variant="outline" size="sm" onClick={toggleDarkMode}>
                  {darkMode ? 'Chuyển sang Sáng' : 'Chuyển sang Tối'}
                </Button>
              </div>

              {/* Backup & Reset */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Sao lưu & Dữ liệu
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 border border-gray-200 dark:border-dark-border rounded-xl space-y-2">
                    <div className="flex items-center gap-2 font-medium text-sm text-gray-900 dark:text-white">
                      <Database className="w-4 h-4 text-primary-500" />
                      Sao lưu dữ liệu
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Xuất toàn bộ danh sách sản phẩm, danh mục, đơn hàng thành file JSON.
                    </p>
                    <Button variant="outline" size="sm" onClick={handleExportData} className="w-full">
                      Tải file sao lưu
                    </Button>
                  </div>

                  <div className="p-4 border border-rose-200 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/20 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 font-medium text-sm text-rose-600 dark:text-rose-400">
                      <RefreshCw className="w-4 h-4" />
                      Đặt lại dữ liệu mẫu
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Khôi phục dữ liệu mẫu ban đầu của Kho Sỉ Bao Bì (xoá mọi thay đổi thử nghiệm).
                    </p>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleResetData}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white"
                    >
                      Đặt lại mặc định
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

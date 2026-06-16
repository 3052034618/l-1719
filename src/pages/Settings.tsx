
import { useState } from 'react';
import {
  Settings,
  User,
  Bell,
  Shield,
  Database,
  Palette,
  Globe,
  ChevronRight,
  Save,
} from 'lucide-react';
import Header from '@/components/Header';
import { useAuthStore } from '@/store/useAuthStore';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [activeSection, setActiveSection] = useState<string>('account');

  const sections = [
    { id: 'account', label: '账户设置', icon: User },
    { id: 'notifications', label: '通知设置', icon: Bell },
    { id: 'security', label: '安全设置', icon: Shield },
    { id: 'appearance', label: '外观设置', icon: Palette },
    { id: 'system', label: '系统设置', icon: Settings },
  ];

  return (
    <div className="min-h-screen">
      <Header
        title="系统设置"
        subtitle="个性化配置和系统参数"
      />

      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex">
              <div className="w-56 border-r border-gray-100 p-4 space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <section.icon size={18} />
                    <span>{section.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex-1 p-6">
                {activeSection === 'account' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-800">账户设置</h3>

                    <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
                        {user?.name?.charAt(0) || 'A'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{user?.name || '管理员'}</p>
                        <p className="text-sm text-gray-500">
                          {user?.role === 'manager'
                            ? '调度经理'
                            : user?.role === 'store_admin'
                            ? '门店管理员'
                            : user?.role === 'finance'
                            ? '财务人员'
                            : user?.role === 'engineer'
                            ? '维保工程师'
                            : '系统管理员'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          用户名
                        </label>
                        <input
                          type="text"
                          defaultValue={user?.username || 'admin'}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          姓名
                        </label>
                        <input
                          type="text"
                          defaultValue={user?.name || '系统管理员'}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          邮箱
                        </label>
                        <input
                          type="email"
                          defaultValue="admin@example.com"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          手机号
                        </label>
                        <input
                          type="tel"
                          defaultValue="13800138000"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                      <Save size={18} />
                      保存修改
                    </button>
                  </div>
                )}

                {activeSection === 'notifications' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-800">通知设置</h3>

                    <div className="space-y-3">
                      {[
                        { label: '新订单通知', desc: '有新预订时收到通知', defaultChecked: true },
                        { label: '事故预警', desc: '车辆发生事故时立即通知', defaultChecked: true },
                        { label: '维保提醒', desc: '车辆需保养时提前通知', defaultChecked: true },
                        { label: '库存预警', desc: '配件库存不足时通知', defaultChecked: false },
                        { label: '日报推送', desc: '每日推送运营日报', defaultChecked: true },
                        { label: '系统公告', desc: '接收系统公告和更新通知', defaultChecked: true },
                      ].map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-800">{item.label}</p>
                            <p className="text-sm text-gray-500">{item.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              defaultChecked={item.defaultChecked}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSection === 'security' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-800">安全设置</h3>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">修改密码</p>
                          <p className="text-sm text-gray-500">定期修改密码提高账户安全性</p>
                        </div>
                        <ChevronRight size={20} className="text-gray-400" />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">两步验证</p>
                          <p className="text-sm text-gray-500">启用手机验证码登录</p>
                        </div>
                        <span className="text-xs text-gray-500">未开启</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">登录记录</p>
                          <p className="text-sm text-gray-500">查看最近登录设备和地点</p>
                        </div>
                        <ChevronRight size={20} className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'appearance' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-800">外观设置</h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        主题模式
                      </label>
                      <div className="flex gap-3">
                        <button className="flex-1 p-4 border-2 border-blue-500 bg-blue-50 rounded-lg text-center">
                          <div className="w-8 h-8 bg-white border border-gray-200 rounded mx-auto mb-2"></div>
                          <p className="text-sm font-medium text-gray-800">浅色</p>
                        </button>
                        <button className="flex-1 p-4 border border-gray-200 rounded-lg text-center hover:bg-gray-50">
                          <div className="w-8 h-8 bg-gray-800 rounded mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600">深色</p>
                        </button>
                        <button className="flex-1 p-4 border border-gray-200 rounded-lg text-center hover:bg-gray-50">
                          <div className="w-8 h-8 bg-gradient-to-b from-gray-200 to-gray-800 rounded mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600">跟随系统</p>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        主题色
                      </label>
                      <div className="flex gap-3">
                        {['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'].map(
                          (color) => (
                            <button
                              key={color}
                              className={`w-10 h-10 rounded-full border-2 ${
                                color === '#3b82f6'
                                  ? 'border-gray-800 scale-110'
                                  : 'border-transparent hover:scale-105'
                              } transition-transform`}
                              style={{ backgroundColor: color }}
                            />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'system' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-800">系统设置</h3>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Globe size={20} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">语言设置</p>
                            <p className="text-sm text-gray-500">简体中文</p>
                          </div>
                        </div>
                        <ChevronRight size={20} className="text-gray-400" />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                            <Database size={20} className="text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">数据备份</p>
                            <p className="text-sm text-gray-500">上次备份: 今天 02:00</p>
                          </div>
                        </div>
                        <button className="text-sm text-blue-600 hover:text-blue-700">
                          立即备份
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                            <Settings size={20} className="text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">系统信息</p>
                            <p className="text-sm text-gray-500">版本 v1.0.0</p>
                          </div>
                        </div>
                        <button className="text-sm text-blue-600 hover:text-blue-700">
                          检查更新
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

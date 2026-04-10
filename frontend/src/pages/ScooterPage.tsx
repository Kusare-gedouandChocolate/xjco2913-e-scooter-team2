// src/pages/ScooterPage.tsx
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { scootersApi, bookingsApi, mapsApi } from '../api';
import type { Scooter, PricingRule, ScooterLocation } from '../types';
import { StateWrapper } from '../components/StateWrapper';
import { formatPrice, getUTCTimeString } from '../utils/format';

// --- 自定义地图图标 (解决 Vite 默认图标路径 Bug，并融入石绿主题色) ---
const createCustomIcon = (color: string) => L.divIcon({
  className: 'custom-scooter-marker',
  html: `<svg width="32" height="32" viewBox="0 0 24 24" fill="${color}" stroke="#ffffff" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><circle cx="12" cy="12" r="3" fill="#ffffff"></circle></svg>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const availableIcon = createCustomIcon('#57c2c0'); // 石绿
const unavailableIcon = createCustomIcon('#94a3b8'); // 灰色

// --- 地图视角控制子组件 (用于列表点击联动地图) ---
const MapController = ({ center }: { center: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
};

export const ScooterPage: React.FC = () => {
  // --- 数据状态 ---
  const [scooters, setScooters] = useState<Scooter[]>([]);
  const [locations, setLocations] = useState<ScooterLocation[]>([]);
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // --- 交互状态 ---
  const [onlyAvailable, setOnlyAvailable] = useState(true); // 状态筛选
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [mapError, setMapError] = useState(false); // 地图兜底文案标识

  // --- 预订交互状态 ---
  const [selectedScooter, setSelectedScooter] = useState<Scooter | null>(null);
  const [selectedHireType, setSelectedHireType] = useState<string>('');
  const [bookingStep, setBookingStep] = useState<'idle' | 'booking' | 'paying' | 'success'>('idle');
  const [actionError, setActionError] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 并发请求：车辆列表、价格规则、地图点位
      const [scootersRes, rulesRes, locsRes] = await Promise.all([
        scootersApi.getScooters(),
        scootersApi.getPricingRules(),
        mapsApi.getLocations(onlyAvailable)
      ]);
      setScooters(scootersRes.data || []);
      setRules(rulesRes.data || []);
      setLocations(locsRes.data || []);
      
      // 默认将地图中心设为第一辆车的位置
      if (locsRes.data && locsRes.data.length > 0) {
        setMapCenter([locsRes.data[0].latitude, locsRes.data[0].longitude]);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || '获取车辆数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyAvailable]); // 筛选条件变化时重新获取

  // 列表点击：联动地图居中
  const handleLocateOnMap = (scooterId: string) => {
    const loc = locations.find(l => l.scooterId === scooterId);
    if (loc) {
      setMapCenter([loc.latitude, loc.longitude]);
      // 移动端体验优化：点击定位后稍微滚动页面让地图漏出来
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenBooking = (scooter: Scooter) => {
    setSelectedScooter(scooter);
    setSelectedHireType(rules[0]?.hireType || '');
    setBookingStep('idle');
    setActionError('');
  };

  const handleConfirmBooking = async () => {
    if (!selectedScooter || !selectedHireType) return;
    setBookingStep('booking');
    setActionError('');
    try {
      const bookingRes = await bookingsApi.createBooking({
        scooterId: selectedScooter.scooterId,
        hireType: selectedHireType,
        startTime: getUTCTimeString(),
      });
      const bId = bookingRes.data.bookingId;
      setBookingStep('paying');
      await bookingsApi.payBooking({ bookingId: bId });
      setBookingStep('success');
      fetchData(); // 支付成功后刷新地图和列表
    } catch (err: unknown) {
      const e = err as { message?: string };
      setActionError(e.message || '操作失败，请重试');
      setBookingStep('idle');
    }
  };

  // 过滤要在列表显示的车辆
  const displayScooters = onlyAvailable ? scooters.filter(s => s.status === 'available') : scooters;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={{ color: 'var(--color-text-main)', fontSize: '1.8rem', marginBottom: '8px' }}>
          寻找附近的滑板车
        </h1>
        {/* 状态筛选切换器 */}
        <div style={styles.filterBar}>
          <button 
            style={styles.filterBtn(onlyAvailable)} 
            onClick={() => setOnlyAvailable(true)}
          >
            仅看可用
          </button>
          <button 
            style={styles.filterBtn(!onlyAvailable)} 
            onClick={() => setOnlyAvailable(false)}
          >
            查看全部
          </button>
        </div>
      </header>

      <StateWrapper loading={loading} error={error} onRetry={fetchData}>
        <div style={styles.contentLayout}>
          
          {/* 左侧/上方：地图展示区 */}
          <div style={styles.mapSection}>
            {mapError ? (
              // 地图加载失败兜底文案
              <div style={styles.mapFallback}>
                <span style={{ fontSize: '2rem', marginBottom: '10px' }}>🗺️</span>
                <p>地图组件加载失败，但您仍可通过下方列表预订车辆。</p>
              </div>
            ) : (
              <MapContainer 
                center={mapCenter || [53.8, -1.55]} // 默认利兹/市中心附近坐标
                zoom={14} 
                style={{ height: '100%', width: '100%', borderRadius: '16px', zIndex: 0 }}
                whenReady={() => setMapError(false)}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" // 使用现代感浅色地图底图
                />
                <MapController center={mapCenter} />
                
                {locations.map(loc => (
                  <Marker 
                    key={loc.scooterId} 
                    position={[loc.latitude, loc.longitude]}
                    icon={loc.status === 'available' ? availableIcon : unavailableIcon}
                    eventHandlers={{
                      click: () => setMapCenter([loc.latitude, loc.longitude])
                    }}
                  >
                    <Popup>
                      <div style={{ textAlign: 'center' as const, minWidth: '120px' }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>#{loc.code}</h4>
                        <span style={styles.badge(loc.status === 'available')}>
                          {loc.status === 'available' ? '当前可用' : '不可用'}
                        </span>
                        {loc.status === 'available' && (
                          <button 
                            style={styles.miniBookBtn}
                            onClick={() => {
                              const target = scooters.find(s => s.scooterId === loc.scooterId);
                              if (target) handleOpenBooking(target);
                            }}
                          >
                            在此下单
                          </button>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>

          {/* 右侧/下方：车辆列表区 */}
          <div style={styles.listSection}>
            {displayScooters.length === 0 ? (
              <div style={{ textAlign: 'center' as const, padding: '40px', color: 'var(--color-text-muted)' }}>
                当前筛选条件下无可用车辆
              </div>
            ) : (
              displayScooters.map((scooter) => (
                <div key={scooter.scooterId} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <span style={styles.scooterCode}>🛴 #{scooter.code}</span>
                    <span style={styles.badge(scooter.status === 'available')}>
                      {scooter.status === 'available' ? '可租用' : '不可用'}
                    </span>
                  </div>
                  
                  <div style={styles.cardBody}>
                    <p style={styles.locationInfo}>
                      <span>📍 {scooter.location}</span>
                      {/* 点击联动地图 */}
                      <button style={styles.locateBtn} onClick={() => handleLocateOnMap(scooter.scooterId)}>
                        在地图中定位
                      </button>
                    </p>
                    <div style={styles.priceRow}>
                      <span style={styles.priceLabel}>基础费率</span>
                      <span style={styles.priceValue}>{formatPrice(scooter.basePrice)}/次</span>
                    </div>
                  </div>

                  <button 
                    style={styles.bookBtn(scooter.status === 'available')}
                    disabled={scooter.status !== 'available'}
                    onClick={() => handleOpenBooking(scooter)}
                  >
                    立即预订
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </StateWrapper>

      {/* 预订与支付弹窗 (保留原有逻辑，仅调整 TS 严格限制) */}
      {selectedScooter && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            {bookingStep === 'success' ? (
              <div style={{ textAlign: 'center' as const, padding: '20px 0' }}>
                <div style={styles.successIcon}>✓</div>
                <h2 style={{ color: 'var(--color-primary)', marginBottom: '10px' }}>支付成功！</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>车辆解锁码已发送，请安全骑行。</p>
                <button style={styles.primaryBtn} onClick={() => setSelectedScooter(null)}>
                  完成并关闭
                </button>
              </div>
            ) : (
              <>
                <h2 style={{ marginBottom: '16px' }}>确认预订</h2>
                <p style={{ marginBottom: '20px', color: 'var(--color-text-muted)' }}>
                  您正在预订车辆 <strong>#{selectedScooter.code}</strong>
                </p>

                {actionError && <div style={styles.errorBox}>{actionError}</div>}

                <div style={{ marginBottom: '24px' }}>
                  <label style={styles.label}>请选择租赁时长套餐：</label>
                  <div style={styles.radioGroup}>
                    {rules.map((rule) => (
                      <label key={rule.ruleId} style={styles.radioOption(selectedHireType === rule.hireType)}>
                        <input 
                          type="radio" 
                          name="hireType" 
                          value={rule.hireType}
                          checked={selectedHireType === rule.hireType}
                          onChange={(e) => setSelectedHireType(e.target.value)}
                          style={{ display: 'none' }} 
                        />
                        <span style={{ fontWeight: 600 }}>{rule.hireType} 套餐</span>
                        <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{formatPrice(rule.price)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={styles.modalActions}>
                  <button style={styles.cancelBtn} onClick={() => setSelectedScooter(null)} disabled={bookingStep !== 'idle'}>
                    取消
                  </button>
                  <button style={styles.confirmBtn} onClick={handleConfirmBooking} disabled={bookingStep !== 'idle'}>
                    {bookingStep === 'booking' ? '正在锁单...' : bookingStep === 'paying' ? '正在扣款...' : '确认并支付'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- 内联样式字典 ---
const styles = {
  container: {
    padding: '24px',
    maxWidth: '1400px', // 放宽最大宽度容纳地图
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap' as const,
    gap: '16px',
  },
  filterBar: {
    display: 'flex',
    backgroundColor: '#f1f5f9',
    borderRadius: '8px',
    padding: '4px',
  },
  filterBtn: (isActive: boolean) => ({
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    fontWeight: 600,
    fontSize: '0.9rem',
    backgroundColor: isActive ? '#ffffff' : 'transparent',
    color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
    boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
    transition: 'all 0.2s',
  }),
  contentLayout: {
    display: 'flex',
    gap: '24px',
    flexDirection: window.innerWidth < 768 ? 'column' as const : 'row' as const, // 响应式布局：手机上下，电脑左右
  },
  mapSection: {
    flex: '1.5',
    height: window.innerWidth < 768 ? '350px' : '600px', // 移动端地图高度自适应
    backgroundColor: 'var(--color-surface)',
    borderRadius: '16px',
    boxShadow: 'var(--shadow-md)',
    overflow: 'hidden',
    position: 'relative' as const,
  },
  mapFallback: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '20px',
    textAlign: 'center' as const,
    color: 'var(--color-text-muted)',
    backgroundColor: '#f8fafc',
  },
  listSection: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    maxHeight: '600px',
    overflowY: 'auto' as const, // 列表过长时支持内部滚动
    paddingRight: '4px',
  },
  card: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--color-border)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  scooterCode: { fontSize: '1.1rem', fontWeight: 700 },
  badge: (isAvailable: boolean) => ({
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 700,
    backgroundColor: isAvailable ? '#e6f7f6' : '#f1f5f9',
    color: isAvailable ? 'var(--color-primary)' : 'var(--color-text-muted)',
  }),
  cardBody: { marginBottom: '16px' },
  locationInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: 'var(--color-text-muted)',
    fontSize: '0.9rem',
    marginBottom: '12px',
  },
  locateBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-primary)',
    fontSize: '0.85rem',
    textDecoration: 'underline',
    cursor: 'pointer',
  },
  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: 'var(--color-bg)',
    padding: '8px 12px',
    borderRadius: '6px',
  },
  priceLabel: { fontSize: '0.85rem', color: 'var(--color-text-muted)' },
  priceValue: { fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-main)' },
  bookBtn: (isAvailable: boolean) => ({
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    fontWeight: 600,
    backgroundColor: isAvailable ? 'var(--color-primary)' : '#e2e8f0',
    color: isAvailable ? '#fff' : '#94a3b8',
    cursor: isAvailable ? 'pointer' : 'not-allowed',
  }),
  miniBookBtn: {
    marginTop: '12px',
    padding: '6px 12px',
    width: '100%',
    backgroundColor: 'var(--color-primary)',
    color: '#fff',
    borderRadius: '4px',
    fontSize: '0.85rem',
    fontWeight: 'bold',
  },
  // Modal 样式保持不变 (合并保留之前的样式)
  modalOverlay: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modalContent: { backgroundColor: 'var(--color-surface)', borderRadius: '20px', padding: '32px', width: '90%', maxWidth: '440px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
  label: { display: 'block', fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px' },
  radioGroup: { display: 'flex', flexDirection: 'column' as const, gap: '12px' },
  radioOption: (isSelected: boolean) => ({ display: 'flex', justifyContent: 'space-between', padding: '16px', borderRadius: '12px', border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`, backgroundColor: isSelected ? '#f0fafa' : '#fff', cursor: 'pointer' }),
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' },
  cancelBtn: { padding: '10px 20px', borderRadius: '8px', backgroundColor: '#f1f5f9', color: 'var(--color-text-main)', fontWeight: 600 },
  confirmBtn: { padding: '10px 20px', borderRadius: '8px', backgroundColor: 'var(--color-primary)', color: '#fff', fontWeight: 600 },
  primaryBtn: { width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--color-primary)', color: '#fff', fontWeight: 600 },
  successIcon: { width: '64px', height: '64px', lineHeight: '64px', backgroundColor: '#e6f7f6', color: 'var(--color-primary)', borderRadius: '50%', fontSize: '32px', margin: '0 auto 16px', fontWeight: 'bold' },
  errorBox: { padding: '12px', backgroundColor: '#fff1f2', color: 'var(--color-accent)', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem', fontWeight: 500 },
};
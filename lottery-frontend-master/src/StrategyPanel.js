import { useContext, useState } from 'react';
import DateInput from './DateInput';
import { MemberContext } from './StrategyAccess';
import './strategy-vip.css';

function formatVietnamDate(value) {
  return value ? value.split('-').reverse().join('/') : '—';
}

function DayRates({ report, item }) {
  return item?.byDay?.map((day, index) => <span key={day.day}>Ngày {day.day}: {day.wins}/{report.signals} · <b className="strategy-percent">{day.rate}%</b>{index < item.byDay.length - 1 ? ' | ' : ''}</span>);
}

function StrategyResult({ title, description, report }) {
  const groups = [...new Set(report.items.map((item) => item.group))];
  return <section className="strategy-result-box">
    <div className="strategy-result-heading"><div><p className="eyebrow">{title}</p><h3>{title === 'CHIẾN LƯỢC 2 SỐ' ? 'Đề xuất lô 2 số' : 'Đề xuất lô 3 số'}</h3><p>{description}</p>{report.auto && <span className="vip-range-note">{report.vipMode === 'vip2' ? `VIP 2 · Tối ưu Mẫu: ${formatVietnamDate(report.from)} → ${formatVietnamDate(report.date)} · tối thiểu ${report.minimumSignals} tín hiệu` : `VIP 1 · Tối ưu Win Rate: ${formatVietnamDate(report.from)} → ${formatVietnamDate(report.date)} · tối thiểu 30 tín hiệu`}</span>}</div></div>
    {report.recommendationOne && <div className="priority-proposal"><div><span>ƯU TIÊN 1 SỐ</span><b>{report.recommendationOne.targets.join(' · ')}</b><small>{report.recommendationOne.formula}</small><small><DayRates report={report.recommendationOne} item={report.recommendationOne} /></small></div><strong>{report.recommendationOne.wins}/{report.recommendationOne.signals} về · <span className="strategy-percent">{report.recommendationOne.rate}%</span></strong></div>}
    <div className="priority-proposal"><div><span>ĐỀ XUẤT ƯU TIÊN</span><b>{report.recommendation?.targets?.join(' · ') || '—'}</b><small>{report.recommendation?.group} — {report.recommendation?.formula}</small><small><DayRates report={report.recommendation} item={report.recommendation} /></small></div><strong>{report.recommendation?.wins}/{report.recommendation?.signals} về · <span className="strategy-percent">{report.recommendation?.rate}%</span></strong></div>
    <div className="strategy-groups">{groups.map((group) => <section key={group}><h3>{group}</h3>{report.items.filter((item) => item.group === group).map((item) => <div className="strategy-row" key={`${group}-${item.formula}`}><div><span>Nguồn tạo số: {item.formula}</span><strong>{item.targets.join(' · ')}</strong><span className="strategy-days"><DayRates report={item} item={item} /></span></div><small>{item.wins}/{item.signals} về · <span className="strategy-percent">{item.rate}%</span></small></div>)}</section>)}</div>
  </section>;
}

function StrategyPlaceholder({ title, description }) {
  return <section className="strategy-result-box strategy-result-placeholder"><p className="eyebrow">{title}</p><h3>{title === 'CHIẾN LƯỢC 2 SỐ' ? 'Đề xuất lô 2 số' : 'Đề xuất lô 3 số'}</h3><p>{description}</p><span>Chọn khoảng ngày và bấm “Tính chiến lược” để xem đề xuất cùng winrate lịch sử.</span></section>;
}

export default function StrategyPanel({ date, onDateChange, request, onError }) {
  const member = useContext(MemberContext);
  const [from, setFrom] = useState('2005-01-01');
  const [standaloneWindowSize, setStandaloneWindowSize] = useState('2');
  const [standaloneNumberSize, setStandaloneNumberSize] = useState('2');
  const numberSize = member?.numberSize || standaloneNumberSize;
  const chooseNumberSize = (value) => member?.setNumberSize ? member.setNumberSize(value) : setStandaloneNumberSize(value);
  const windowSize = member?.vipWindow || standaloneWindowSize;
  const chooseWindowSize = (value) => member?.setVipWindow ? member.setVipWindow(value) : setStandaloneWindowSize(value);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [vipLoadingMode, setVipLoadingMode] = useState(null);

  async function load() {
    if (!date) return onError('Chọn ngày kết thúc trước khi tính chiến lược.');
    setLoading(true);
    try {
      const params = new URLSearchParams({ date, from, window: windowSize });
      setReport(await request(`/lottery/statistics/strategies?${params}`));
    } catch (error) { onError(error.message); } finally { setLoading(false); }
  }

  async function loadVip(mode) {
    if (!member?.canUseVip) {
      if (member?.openPlans) return member.openPlans();
      return onError('Tính năng VIP cần gói thành viên.');
    }
    if (!date) return onError('Chọn ngày kết thúc trước khi tối ưu chiến lược.');
    setVipLoadingMode(mode);
    try {
      const params = new URLSearchParams({ date, window: windowSize, mode });
      for (let attempt = 0; attempt < 30; attempt += 1) {
        const result = await request(`/lottery/statistics/vip-strategies?${params}`, { headers: { Authorization: `Bearer ${member.token}` } });
        if (!result.pending) {
          setReport(result);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      throw new Error('Snapshot VIP đang được tạo. Vui lòng thử lại sau ít phút.');
    } catch (error) { onError(error.message); } finally { setVipLoadingMode(null); }
  }

  return <article className="panel strategy-panel">
    <div className="strategy-heading"><div><p className="eyebrow">CÔNG THỨC CHIẾN LƯỢC</p><h2>Tra cứu theo khoảng ngày</h2><p>Chọn khoảng dữ liệu và khung kiểm tra để tính lại từ lịch sử.</p></div><div className="strategy-controls" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}><label>Từ ngày<DateInput min="2005-01-01" max={date || undefined} value={from} onChange={setFrom} /></label><label>Đến ngày<DateInput min={from} value={date || ''} onChange={onDateChange} /></label><label>Khung kiểm tra<select value={windowSize} onChange={(event) => chooseWindowSize(event.target.value)}><option value="1">Khung 1 ngày</option><option value="2">Khung 2 ngày</option><option value="3">Khung 3 ngày</option></select></label><label className="strategy-run-label">Thao tác<button onClick={load}>{loading ? 'Đang tính…' : 'Tính chiến lược'}</button></label><div className="vip-auto-grid"><button className="vip-auto-button vip-winrate-button" onClick={() => loadVip('vip1')} disabled={loading || Boolean(vipLoadingMode)}><span className="vip-auto-icon">1</span><span><b>{vipLoadingMode === 'vip1' ? 'Đang lấy dữ liệu…' : 'VIP 1 · Tối ưu Win Rate'}</b><small>Khung {windowSize} ngày đã chọn</small></span></button><button className="vip-auto-button vip-sample-button" onClick={() => loadVip('vip2')} disabled={loading || Boolean(vipLoadingMode)}><span className="vip-auto-icon">2</span><span><b>{vipLoadingMode === 'vip2' ? 'Đang lấy dữ liệu…' : 'VIP 2 · Tối ưu Mẫu'}</b><small>Khung {windowSize} ngày đã chọn</small></span></button></div></div></div>
    <div className="strategy-mode-tabs" role="tablist" aria-label="Kiểu thống kê chiến lược"><button role="tab" aria-selected={numberSize === '2'} className={numberSize === '2' ? 'active' : ''} onClick={() => chooseNumberSize('2')}>Thống kê 2 số</button><button role="tab" aria-selected={numberSize === '3'} className={numberSize === '3' ? 'active' : ''} onClick={() => chooseNumberSize('3')}>Thống kê 3 số</button></div>
    <div className="strategy-tab-page">{!report ? <StrategyPlaceholder title={numberSize === '2' ? 'CHIẾN LƯỢC 2 SỐ' : 'CHIẾN LƯỢC 3 SỐ'} description={numberSize === '2' ? 'Sử dụng 2 số cuối của mọi giải.' : 'Sử dụng 3 số cuối của các giải có từ 3 chữ số.'} /> : numberSize === '2' ? <StrategyResult title="CHIẾN LƯỢC 2 SỐ" description="Giữ nguyên các công thức hiện tại; kiểm tra bằng 2 số cuối của mọi giải." report={report} /> : <StrategyResult title="CHIẾN LƯỢC 3 SỐ" description="Cùng công thức, nhưng chọn và kiểm tra bằng 3 số cuối của các giải có từ 3 chữ số." report={report.threeNumber} />}</div>
  </article>;
}

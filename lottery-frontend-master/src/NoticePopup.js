import './notice-popup.css';

const icons = { error: '!', success: '✓', info: 'i' };

export default function NoticePopup({ message, type = 'info', onClose }) {
  if (!message) return null;
  return <div className={`notice-popup ${type}`} role="alert" aria-live="assertive">
    <span className="notice-popup-icon" aria-hidden="true">{icons[type] || icons.info}</span>
    <p>{message}</p>
    <button type="button" onClick={onClose} aria-label="Đóng thông báo">×</button>
  </div>;
}

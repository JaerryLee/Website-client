import React, { useState, useEffect } from 'react';
import './ModalActivitySetting.css';
import { MemberData } from '@/app/admin/management/page';

interface ModalActivitySettingProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  member: MemberData;
  onSave: (updated: string[]) => void;
}

const availableAuthorities = [
  'PointManager',
  'CalendarManager',
  'AttendanceManager',
  'RoleManager',
  'AuthorityManager',
];

export default function ModalActivitySetting({
  isOpen,
  onClose,
  member,
  onSave,
}: ModalActivitySettingProps) {
  // 로컬 상태: 선택된 권한 목록
  const [selectedAuthorities, setSelectedAuthorities] = useState<string[]>([]);

  // 모달이 열릴 때 기존 권한 정보를 초기값으로 설정 (member 객체에 권한 정보가 있다면 사용)
  // 현재 MemberData에는 activities가 없으므로 기본값은 빈 배열로 시작합니다.
  useEffect(() => {
    if (!isOpen) return;
    // 만약 member에 기존 권한 정보가 있다면 이를 사용하도록 수정할 수 있습니다.
    setSelectedAuthorities([]);
  }, [isOpen, member]);

  if (!isOpen) return null;

  const handleCheckboxChange = (authority: string, checked: boolean) => {
    if (checked) {
      setSelectedAuthorities([...selectedAuthorities, authority]);
    } else {
      setSelectedAuthorities(selectedAuthorities.filter((a) => a !== authority));
    }
  };

  const handleSave = () => {
    onSave(selectedAuthorities);
  };

  return (
    <div className="modal-activity-setting-backdrop">
      <div className="modal-activity-setting-content">
        <button className="close-btn" onClick={onClose}>✕</button>
        
        <h2>권한 관리 설정</h2>

        <div className="setting-body">
          <ul className="authority-list">
            {availableAuthorities.map((auth, idx) => (
              <li key={idx}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedAuthorities.includes(auth)}
                    onChange={(e) => handleCheckboxChange(auth, e.target.checked)}
                  />
                  {auth}
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="modal-buttons">
          <button className="save-btn-setting" onClick={handleSave}>저장</button>
          <button className="cancel-btn" onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
}

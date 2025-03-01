'use client';

import React, { useState, useMemo, useEffect } from 'react';
import './management.css';
import Image from 'next/image';

import ModalEditMember from '@/components/ModalEditMember';
import ModalEditPoint from '@/components/ModalEditPoint';
import ModalActivitySetting from '@/components/ModalActivitySetting';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface MemberData {
  id: number;
  nickname: string;
  roles: { role: string; point: number }[];
}

interface UserResponse {
  data: MemberData[];
  max_size: number;
}

const activityTabs = ['fetch', 'worktree', 'branch', 'solution challenge'];

export default function AdminPage() {
  const [members, setMembers] = useState<MemberData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'ALL' | 'DevRel' | 'Core' | 'Member' | 'Junior'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 11;
  const [maxSize, setMaxSize] = useState(0);

  const [selectedMember, setSelectedMember] = useState<MemberData | null>(null);
  const [activeTab, setActiveTab] = useState<string>('fetch');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPointModalOpen, setIsPointModalOpen] = useState(false);
  const [isSettingModalOpen, setIsSettingModalOpen] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const params = new URLSearchParams();
        params.set('page', currentPage.toString());
        if (filterRole !== 'ALL') {
          params.set('role', filterRole);
        }
        const res = await fetchWithAuth(
          `${API_BASE_URL}/user?${params.toString()}`,
          { method: 'GET' }
        );
        if (!res.ok) throw new Error('Failed to fetch users');
        const json = await res.json();
        const responseData: UserResponse = json[0];
        setMembers(responseData.data);
        setMaxSize(responseData.max_size);
      } catch (error) {
        console.error('유저 조회 실패:', error);
      }
    };

    fetchMembers();
  }, [currentPage, filterRole]);

  const filteredData = useMemo(() => {
    let data = members;
    if (searchTerm.trim() !== '') {
      data = data.filter((m) =>
        m.nickname.toLowerCase().includes(searchTerm.trim().toLowerCase())
      );
    }
    return data;
  }, [members, searchTerm]);

  const totalPages = Math.ceil(maxSize / itemsPerPage);
  const currentPageData = filteredData;

  const handleMemberClick = (member: MemberData) => {
    setSelectedMember(member);
  };

  const handleSaveMemberChanges = async (updated: MemberData) => {
    try {
      const body = {
        user_id: updated.id,
        roles: updated.roles.map((r) => r.role)
      };
      const res = await fetchWithAuth(
        `${API_BASE_URL}/user/role`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }
      );
      if (!res.ok) {
        throw new Error('유저 역할 변경 실패');
      }
      const updatedUser: MemberData = await res.json();
      const updatedList = members.map((m) =>
        m.id === updatedUser.id ? updatedUser : m
      );
      setMembers(updatedList);
      setSelectedMember(updatedUser);
      setIsModalOpen(false);
    } catch (error) {
      console.error('회원정보 수정 실패:', error);
    }
  };

  const handleSavePointChanges = async (updated: MemberData) => {
    try {
      const body = {
        user_id: updated.id,
        roles: updated.roles.map((r) => r.role)
      };
      const res = await fetchWithAuth(
        `${API_BASE_URL}/user/role`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }
      );
      if (!res.ok) {
        throw new Error('포인트 수정 실패');
      }
      const updatedUser: MemberData = await res.json();
      const updatedList = members.map((m) =>
        m.id === updatedUser.id ? updatedUser : m
      );
      setMembers(updatedList);
      setSelectedMember(updatedUser);
      setIsPointModalOpen(false);
    } catch (error) {
      console.error('포인트 수정 실패:', error);
    }
  };

  const handleSaveActivityChanges = async (updatedAuthorities: string[]) => {
    if (!selectedMember) return;
    try {
      const body = {
        user_id: selectedMember.id,
        authorities: updatedAuthorities
      };
      const res = await fetchWithAuth(
        `${API_BASE_URL}/user/authority`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }
      );
      if (!res.ok) {
        throw new Error('유저 권한 변경 실패');
      }
      const updatedUser: MemberData = await res.json();
      const updatedList = members.map((m) =>
        m.id === updatedUser.id ? updatedUser : m
      );
      setMembers(updatedList);
      setSelectedMember(updatedUser);
      setIsSettingModalOpen(false);
    } catch (error) {
      console.error('유저 권한 변경 실패:', error);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-content-wrapper">
        <div className="left-side">
          <div className="search-section">
            <input
              className="search-input"
              placeholder="검색하기"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-section">
            {['ALL', 'DevRel', 'Core', 'Member', 'Junior'].map((roleValue) => (
              <button
                key={roleValue}
                className={`filter-btn ${filterRole === roleValue ? 'active' : ''}`}
                onClick={() => {
                  setFilterRole(roleValue as typeof filterRole);
                  setCurrentPage(1);
                }}
              >
                {roleValue}
              </button>
            ))}
          </div>
          <table className="member-table">
            <thead>
              <tr>
                <th>닉네임</th>
                <th>역할</th>
                <th>포인트</th>
              </tr>
            </thead>
            <tbody>
              {currentPageData.map((m) => {
                const rolesString = m.roles.map((r) => r.role).join(', ');
                const totalPoints = m.roles.reduce((sum, r) => sum + r.point, 0);
                return (
                  <tr
                    key={m.id}
                    className={selectedMember?.id === m.id ? 'selected-row' : ''}
                    onClick={() => handleMemberClick(m)}
                  >
                    <td>{m.nickname}</td>
                    <td>{rolesString}</td>
                    <td>{totalPoints}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="pagination-row">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`page-btn ${p === currentPage ? 'active' : ''}`}
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        {selectedMember && (
          <div className="member-detail-section">
            <div className="detail-header">
              <Image
                src="/profile.svg"
                alt="프로필 이미지"
                className="manage-profile-image"
                width={120}
                height={120}
              />
              <h2>
                {selectedMember.nickname}
                <span className="edit-icon" onClick={() => setIsModalOpen(true)}>
                  ✏️
                </span>
              </h2>
              <div className="detail-role">
                {selectedMember.roles.map((r) => r.role).join(' / ')}
              </div>
              <div className="detail-point">
                <strong>{selectedMember.roles.reduce((sum, r) => sum + r.point, 0)}</strong> P
                <button className="point-edit-btn" onClick={() => setIsPointModalOpen(true)}>
                  포인트 수정
                </button>
              </div>
            </div>
            <div className="activity-manage">
              <h3>권한 관리</h3>
              <div className="tabs">
                {activityTabs.map((tab) => (
                  <button
                    key={tab}
                    className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
                <button className="tab-setting-btn" onClick={() => setIsSettingModalOpen(true)}>
                  <Image src="/settingicon.svg" alt="설정" width={24} height={24} />
                </button>
              </div>
              <div className="tab-content">
                <p>권한 수정 모달을 통해 권한을 변경하세요.</p>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="admin-bottom-buttons">
        <button className="admin-point-btn">멤버 포인트/활동 관리</button>
        <button className="admin-calendar-btn">캘린더 관리</button>
      </div>
      {/* 모달들 */}
      {selectedMember && (
        <ModalEditMember
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          member={selectedMember}
          onSave={handleSaveMemberChanges}
        />
      )}
      {selectedMember && (
        <ModalEditPoint
          isOpen={isPointModalOpen}
          onClose={() => setIsPointModalOpen(false)}
          member={selectedMember}
          onSave={handleSavePointChanges}
        />
      )}
      {selectedMember && (
        <ModalActivitySetting
          isOpen={isSettingModalOpen}
          onClose={() => setIsSettingModalOpen(false)}
          activeTab={activeTab}
          member={selectedMember}
          onSave={handleSaveActivityChanges}
        />
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, ChangeEvent, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { fetchWithAuth } from '@/utils/fetchWithAuth';
import './mypage.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface PointResponseItem {
  role: string;
  point: number;
}
interface HistoryResponseItem {
  id: number;
  point_change: number;
  role: string;
  reason: string;
  accumulated_point: number;
  date: string;
}

interface ProfileResponse {
  id: number;
  nickname: string;
  role: string;
  email: string;
  department: string;
  student_number: string;
  position_names: string[];
  profile_image: string;
  join_date: string;
}

interface PointHistoryItem {
  date: string;
  change: number;
  total: number;
  event: string;
}

export default function MyPage() {
  const [profileImageUrl, setProfileImageUrl] = useState<string>('/profile.svg');
  const [name, setName] = useState<string>('');
  const [major, setMajor] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [joinDate, setJoinDate] = useState<string>('');
  const [isCore, setIsCore] = useState<boolean>(false);
  const [userId, setUserId] = useState<number | null>(null);

  const [totalPoint, setTotalPoint] = useState<number>(0);

  const [pointHistory, setPointHistory] = useState<PointHistoryItem[]>([]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${year}. ${month}. ${day}`;
  };

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/mypage/profile`, {
        method: 'GET',
      });
      if (!res.ok) throw new Error('Failed to fetch profile');
      const data: ProfileResponse = await res.json();

      setProfileImageUrl(data.profile_image || '/profile.svg');
      setName(data.nickname);
      setMajor(`${data.department} ${data.student_number}학번`);

      const positionsJoined = data.position_names.join(' / ');
      const combinedRole = positionsJoined
        ? `${data.role} / ${positionsJoined}`
        : data.role;
      setRole(combinedRole);

      setJoinDate(formatDate(data.join_date));
      setIsCore(
        combinedRole.includes('Organizer') ||
        combinedRole.includes('CORE') ||
        combinedRole.includes('Core') ||
        combinedRole.includes('Admin')
      );
      setUserId(data.id);
    } catch (error) {
      console.error('프로필 조회 실패:', error);
    }
  }, []);

  const fetchPoints = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/point`, {
        method: 'GET',
      });
      if (!res.ok) throw new Error('Failed to fetch points');
      const data: PointResponseItem[] = await res.json();
      const sum = data.reduce((acc, cur) => acc + cur.point, 0);
      setTotalPoint(sum);
    } catch (error) {
      console.error('포인트 조회 실패:', error);
    }
  }, []);

  const fetchPointHistory = useCallback(
    async (uid: number) => {
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/point/history/${uid}`, {
          method: 'GET',
        });
        if (!res.ok) throw new Error('Failed to fetch point history');
        const data: HistoryResponseItem[] = await res.json();

        const mapped = data.map((item) => ({
          date: formatDate(item.date),
          change: item.point_change,
          total: item.accumulated_point,
          event: item.reason,
        }));

        setPointHistory(mapped);
      } catch (error) {
        console.error('포인트 히스토리 조회 실패:', error);
      }
    },
    []
  );

  useEffect(() => {
    fetchProfile();
    fetchPoints();
  }, [fetchProfile, fetchPoints]);
  useEffect(() => {
    if (userId !== null) {
      fetchPointHistory(userId);
    }
  }, [userId, fetchPointHistory]);

  const handleProfileImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const localUrl = URL.createObjectURL(file);
    setProfileImageUrl(localUrl);

    const formData = new FormData();
    formData.append('profile_image', file);

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/mypage/profile-image`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        console.error('프로필 이미지 업로드 실패');
        return;
      }
      const data = await res.json();
      if (data?.imageUrl) {
        setProfileImageUrl(data.imageUrl);
      }
    } catch (err) {
      console.error('프로필 이미지 업로드 에러:', err);
    }
  };

  const handleUpdateProfile = async () => {
    const body = {
      nickname: name,
      department: major.split(' ')[0],
      student_number: major.split(' ')[1]?.replace('학번', ''),
      position_names: role.split('/').map((v) => v.trim()),
    };

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/mypage/profile`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        console.error('프로필 정보 수정 실패');
        return;
      }
      console.log('프로필 수정 성공');
    } catch (err) {
      console.error('프로필 정보 수정 에러:', err);
    }
  };

  return (
    <div className="mypage-container">
      <section className="profile-section">
        <div className="profile-image-wrapper">
          <Image
            src={profileImageUrl}
            alt="프로필 사진"
            width={120}
            height={120}
            className="profile-image"
          />
          <label htmlFor="profileUpload" className="upload-label">
            프로필 사진 변경
          </label>
          <input
            id="profileUpload"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleProfileImageChange}
          />
        </div>

        <h2 className="profile-name">{name}</h2>
        <div className="profile-major">{major}</div>
        <div className="profile-role">{role}</div>
        <div className="profile-join-date">가입일: {joinDate}</div>

        <div className="profile-buttons">
          <button onClick={handleUpdateProfile} className="edit-button">
            정보 수정
          </button>
          {isCore && (
            <>
              <Link href="/admin">
                <button className="admin-button">관리자 모드</button>
              </Link>
              <Link href="/admin/management">
                <button className="admin-button">멤버 관리</button>
              </Link>
            </>
          )}
        </div>
      </section>
      <section className="point-section">
        <h2 className="point-title">My Status</h2>
        <div className="point-total">
          {totalPoint}
          <span className="point-unit">P</span>
        </div>

        <div className="point-history-table">
          <table>
            <thead>
              <tr>
                <th>날짜</th>
                <th>변동</th>
                <th>누적</th>
                <th>이벤트</th>
              </tr>
            </thead>
            <tbody>
              {pointHistory.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.date}</td>
                  <td>{item.change}</td>
                  <td>{item.total}</td>
                  <td>{item.event}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

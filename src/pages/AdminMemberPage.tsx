import React, { useState, useEffect, useCallback, useContext } from 'react';
import { 
  Users, Trash2, Search, UserMinus, ShieldAlert, 
  Calendar, Mail, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ArrowLeft
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { LanguageContext } from '../contexts/LanguageContext';

/**
 * [인터페이스] 회원 정보 데이터 구조
 */
interface Member {
  userId: string;      
  userName: string;    
  userEmail: string;   
  userRole: string;    
  userStatus: string;  
  lastLoginAt: string; 
  createAt: string;    
}

export default function AdminMemberPage() {
  const { user } = useUser(); 
  const navigate = useNavigate();
  const languageContext = useContext(LanguageContext);
  const getText = languageContext ? languageContext.getText : (key: string) => key;

  const [members, setMembers] = useState<Member[]>([]); 
  const [loading, setLoading] = useState(true); 
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]); 
  const [searchTerm, setSearchTerm] = useState(''); 

  /**
   *  회원 권한 변경 (USER -> ADMIN)
   */
  const handleGrantAdmin = async (memberId: string) => {
    if(!window.confirm("해당 사용자를 관리자로 변경하시겠습니까?")) return;
    
    try{
      const response = await fetch(`/api/admin/changeRoleAdmin/${memberId}`,{
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization' : `Bearer ${user?.accessToken}` 
        }
      });
      const result = await response.json();

      if(response.ok && result.status === 200) {
        alert(result.message);
        fetchMembers();
      } else {
        alert(result.message || "권한 변경에 실패했습니다.")
      }
    } catch(error){
      console.error("권한 변경 중 오류 발생:", error);
      alert("서버와 통신 중 오류가 발생했습니다.");
    }
  };

  /**
   * [API 호출] 전체 회원 목록 조회
   */
  const fetchMembers = useCallback(async () => {
    if (!user || user.userRole !== 'ADMIN') return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/getMemberList`, {
        headers: { 'Authorization': `Bearer ${user.accessToken}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setMembers(data.result?.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    if (user.userRole !== 'ADMIN') {
      alert("권한이 없습니다.");
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user?.userRole === 'ADMIN') {
      fetchMembers();
    }
  }, [fetchMembers, user?.userRole]);

  /**
   * 회원 개별 강퇴
   */
  const handleKick = async (userId: string) => {
    if (!window.confirm(`${userId} 회원을 강제 탈퇴시키겠습니까?`)) return;

    try {
      const response = await fetch(`/api/member/deleteMember/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user?.accessToken}` }
      });

      if (response.ok) {
        alert("처리가 완료되었습니다.");
        fetchMembers();
        setSelectedUsers(prev => prev.filter(id => id !== userId));
      } else {
        alert("처리 중 오류가 발생했습니다.");
      }
    } catch (error) {
      alert("서버 통신 오류");
    }
  };

  /**
   * 회원 일괄 강퇴
   */
  const handleBulkKick = async () => {
    if (selectedUsers.length === 0) {
      alert("삭제할 회원을 선택해 주세요.")
      return;
    }

    if (!window.confirm(`선택한 ${selectedUsers.length}명의 회원을 모두 강제 탈퇴시키겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/deleteMembersByAdmin`, {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.accessToken}`
        },
        body: JSON.stringify({ userIds: selectedUsers })
      });
      
      const result = await response.json();
        
      if(result.code === 200 || response.ok){
        alert(result.msg || "일괄 처리가 완료되었습니다.");
        setSelectedUsers([]);
        fetchMembers();
      } else {
        alert(result.msg || "처리 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("Bulk delete error", error)
      alert("서버 통신 중 오류가 발생했습니다.")
    }
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredMembers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredMembers.map(m => m.userId));
    }
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const filteredMembers = members.filter(m => 
    m.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d141b] transition-colors duration-300">
      <main className="max-w-[1440px] mx-auto px-4 md:px-10 py-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-primary mb-4 transition-colors font-bold">
              <ArrowLeft size={16} /> 메인으로 돌아가기
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-8 bg-red-500 rounded-full" />
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">회원 관리 시스템</h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">커뮤니티 회원 목록을 관리하고 부적절한 사용자를 제재합니다.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white dark:bg-[#1a222c] px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">전체 회원</p>
                <p className="text-xl font-black text-primary">{members.length}</p>
              </div>
              <div className="w-px h-8 bg-slate-100 dark:bg-slate-800" />
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">선택됨</p>
                <p className="text-xl font-black text-red-500">{selectedUsers.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a222c] p-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
            <input 
              type="text"
              placeholder="아이디, 이름, 이메일로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-14 pr-6 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <button 
            onClick={handleBulkKick}
            disabled={selectedUsers.length === 0}
            className="h-12 px-8 bg-red-500 text-white font-black rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-30 disabled:shadow-none flex items-center justify-center gap-2"
          >
            <UserMinus size={18} /> 일괄 강퇴
          </button>
        </div>

        <div className="bg-white dark:bg-[#1a222c] rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-5 w-16 text-center">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary/20" 
                      checked={selectedUsers.length > 0 && selectedUsers.length === filteredMembers.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">사용자 정보</th>
                  <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">권한</th>
                  <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">상태</th>
                  <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">최근 접속</th>
                  <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                        <p className="text-slate-400 font-bold">회원 목록을 불러오는 중...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredMembers.length > 0 ? filteredMembers.map((m) => (
                  <tr key={m.userId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                    <td className="px-6 py-5 text-center">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary/20" 
                        checked={selectedUsers.includes(m.userId)}
                        onChange={() => toggleSelectUser(m.userId)}
                      />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 dark:text-white">{m.userName}</span>
                        <span className="text-xs text-slate-400 font-bold">{m.userId} • {m.userEmail}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
                        m.userRole === 'ADMIN' ? 'bg-red-500 text-white' : 'bg-primary text-white'
                      }`}>
                        {m.userRole}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${
                        m.userStatus === 'Y' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {m.userStatus === 'Y' ? '승인' : '미승인'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center text-xs font-bold text-slate-500">
                      {m.lastLoginAt || '-'}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {m.userRole === 'USER' && (
                          <button
                            onClick={() => handleGrantAdmin(m.userId)}
                            className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all"
                            title="관리자 권한 부여"
                          >
                            <ShieldAlert size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleKick(m.userId)}
                          disabled={m.userRole === 'ADMIN'}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all disabled:opacity-0"
                          title="강제 탈퇴"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-slate-400 font-bold">검색 결과가 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

import React, { useEffect, useState, useCallback, useContext } from "react";
import { 
  Users, Shield, Trash2, Search, Filter, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  MoreVertical, CheckCircle2, AlertCircle, UserMinus, UserCheck, Mail, Calendar, LogIn,
  ShieldAlert, ArrowLeft
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { useAlert } from "../contexts/AlertContext";
import { LanguageContext } from "../contexts/LanguageContext";
import api from "../utils/api";
import ConfirmModal from "../components/ConfirmModal";

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
  lastLogAt?: string;
  createAt: string;    
  memberId: string;    
}

export default function AdminMemberPage() {
  const { user, isLoading } = useUser();
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const languageContext = useContext(LanguageContext);
  const getText = languageContext ? languageContext.getText : (key: string) => key;

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]); // memberIds

  // 모달 상태 관리
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
    isLoading: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info',
    isLoading: false
  });

  const closeConfirmModal = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

  /**
   * [API 호출] 전체 회원 목록 조회
   */
  const fetchMembers = useCallback(async () => {
    if (!user || user.userRole !== 'ADMIN') return;
    
    setLoading(true);
    try {
      const response = await api.get(`/api/admin/getMemberList`, {
        headers: { 'Authorization': `Bearer ${user.accessToken}` }
      });
      const data = response.data;
      
      if (data.success) {
        setMembers(data.result?.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
      showAlert({ type: 'error', message: "회원 목록을 가져오는 중에 문제가 생겼어요. 🌐" });
    } finally {
      setLoading(false);
    }
  }, [user, showAlert]);

  useEffect(() => {
    if (isLoading) return; // 로그인 정보 복구 중에는 체크를 대기함

    if (!user) {
      navigate('/');
      return;
    }
    if (user.userRole !== 'ADMIN') {
      showAlert({ type: 'warning', message: "접근 권한이 없습니다. 관리자만 이용 가능합니다. ⚠️" });
      navigate('/');
    } else {
      fetchMembers();
    }
  }, [user, isLoading, navigate, fetchMembers, showAlert]);

  /**
   * 회원 권한 변경 (USER -> ADMIN)
   */
  const handleGrantAdmin = (targetMemberId: string) => {
    setConfirmModal({
      isOpen: true,
      title: '관리자 권한 부여',
      message: '해당 사용자를 관리자로 변경하시겠습니까?\n변경 후에는 관리자 센터의 모든 기능을 이용할 수 있게 됩니다.',
      type: 'info',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          const response = await api.patch(`/api/admin/changeRoleAdmin/${targetMemberId}`, null, {
            headers: { 'Authorization' : `Bearer ${user?.accessToken}` }
          });
          if(response.data.status === 200 || response.data.success) {
            showAlert({ type: 'success', message: "관리자 권한 부여가 완료되었습니다. ✅" });
            fetchMembers();
            closeConfirmModal();
          } else {
            showAlert({ type: 'error', message: response.data.message || "권한 변경을 처리하지 못했어요. ⏳" });
          }
        } catch(error) {
          showAlert({ type: 'error', message: "통신이 원활하지 않아요. 🌐 네트워크 상태를 확인해 주세요." });
        } finally {
          setConfirmModal(prev => ({ ...prev, isLoading: false }));
        }
      }
    });
  };

  /**
   * 회원 개별 강퇴
   */
  const handleKick = (targetMemberId: string, targetUserId: string) => {
    setConfirmModal({
      isOpen: true,
      title: '회원 강제 탈퇴',
      message: `${targetUserId} 회원을 강제 탈퇴시키겠습니까?\n이 작업은 되돌릴 수 없으며, 모든 계정 정보가 즉시 삭제됩니다.`,
      type: 'danger',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          const response = await api.delete(`/api/member/deleteMember/${targetMemberId}`, {
            headers: { 'Authorization': `Bearer ${user?.accessToken}` }
          });
          if (response.status === 200 || response.data.success) {
            showAlert({ type: 'success', message: "강제 탈퇴 처리가 완료되었습니다. ✅" });
            fetchMembers();
            setSelectedUsers(prev => prev.filter(id => id !== targetMemberId));
            closeConfirmModal();
          } else {
            showAlert({ type: 'error', message: "처리가 원활하지 않아요. ⏳ 잠시 후 다시 시도해 주세요." });
          }
        } catch (error) {
          showAlert({ type: 'error', message: "통신 문제로 처리에 실패했습니다. 🌐" });
        } finally {
          setConfirmModal(prev => ({ ...prev, isLoading: false }));
        }
      }
    });
  };

  /**
   * 회원 일괄 강퇴
   */
  const handleBulkKick = () => {
    if (selectedUsers.length === 0) {
      showAlert({ type: 'warning', message: "삭제할 회원을 선택해 주세요. ⚠️" });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: '일괄 강제 탈퇴',
      message: `선택한 ${selectedUsers.length}명의 회원을 모두 강제 탈퇴시키겠습니까?\n이 작업은 대량으로 처리되며 복구가 불가능합니다.`,
      type: 'danger',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          const response = await api.post(`/api/admin/deleteMembersByAdmin`, { 
            memberIds: selectedUsers 
          }, {
            headers: { 'Authorization': `Bearer ${user?.accessToken}` }
          });
          if(response.data.code === 200 || response.status === 200 || response.data.success){
            showAlert({ type: 'success', message: "일괄 처리가 완료되었습니다. ✅" });
            setSelectedUsers([]);
            fetchMembers();
            closeConfirmModal();
          } else {
            showAlert({ type: 'error', message: "일괄 처리 중에 문제가 발생했어요. ⏳" });
          }
        } catch (error) {
          showAlert({ type: 'error', message: "통신 문제로 처리에 실패했습니다. 🌐" });
        } finally {
          setConfirmModal(prev => ({ ...prev, isLoading: false }));
        }
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredMembers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredMembers.map(m => m.memberId));
    }
  };

  const toggleSelectUser = (memberId: string) => {
    setSelectedUsers(prev => 
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  /**
   * 클라이언트 측 검색 필터링 (원본 로직 보존)
   */
  const filteredMembers = members.filter(m => 
    m.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d141b] transition-colors duration-300">
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8  py-10 font-sans"> {/* Header Width */}
        
        {/* Header Section */}
        <header className="mb-12">
          {/* 네비게이션 (홈 > 관리자 설정*/}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 ">
            <div>
              <nav className="flex items-center gap-2 text-sm text-slate-400 mb-4">
               <Link to="/" className="hover:text-primary transition-colors font-medium">홈</Link>
              <ChevronRight size={14} />
           <span className="text-slate-900 dark:text-white font-bold">관리자 설정</span>
           </nav>
           
           {/* 메인 타이틀 (회원 권한 관리) */}
                   <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            회원 권한 관리
          </h1>
        </div>
     
        {/* 3. 우측 상태 정보 (선택한 인원 표시 등) */}
        <div className="flex items-center gap-3">
          <div className="px-5 py-2.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 dark:border-slate-700 pr-3">Total</span>
            <span className="text-sm font-black text-primary">{members.length}명</span>
          </div>
          {selectedUsers.length > 0 && (
            <div className="px-5 py-2.5 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/30 flex items-center gap-3 animate-in fade-in zoom-in">
              <span className="text-[10px] font-black text-red-400 uppercase tracking-widest border-r border-red-100 dark:border-red-900/30 pr-3">Selected</span>
              <span className="text-sm font-black text-red-500">{selectedUsers.length}명</span>
            </div>
             )}
            
            
        </div>
      </div>
    </header>

        {/* Search & Actions Bar */}
        <section className="bg-white dark:bg-[#1a222c] p-5 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 mb-10">
          <div className="flex-1 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={22} />
            <input 
              type="text" 
              placeholder="이름, 아이디, 이메일로 검색..." 
              className="w-full h-14 pl-14 pr-6 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-base font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleBulkKick}
            disabled={selectedUsers.length === 0}
            className="h-14 px-10 bg-red-500 text-white text-base font-black rounded-2xl hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 disabled:opacity-30 disabled:shadow-none flex items-center justify-center gap-2 active:scale-95"
          >
            <UserMinus size={20} /> 일괄 강퇴
          </button>
        </section>

        {/* Members Table */}
        <div className="bg-white dark:bg-[#1a222c] rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden mb-10">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1100px]">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-8 py-6 w-20 text-center">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded-md border-2 border-slate-200 text-primary focus:ring-primary/20 cursor-pointer" 
                      checked={selectedUsers.length > 0 && selectedUsers.length === filteredMembers.length} 
                      onChange={toggleSelectAll} 
                    />
                  </th>
                  <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">사용자 정보</th>
                  <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">권한</th>
                  <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">상태</th>
                  <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">최근 접속</th>
                  <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-8 py-8"><div className="h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl w-full" /></td>
                    </tr>
                  ))
                ) : filteredMembers.length > 0 ? filteredMembers.map((member) => (
                  <tr key={member.memberId} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group ${selectedUsers.includes(member.memberId) ? 'bg-primary/5 dark:bg-primary/5' : ''}`}>
                    <td className="px-8 py-6 text-center">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded-md border-2 border-slate-200 text-primary focus:ring-primary/20 cursor-pointer" 
                        checked={selectedUsers.includes(member.memberId)} 
                        onChange={() => toggleSelectUser(member.memberId)} 
                      />
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary border border-primary/5 shadow-inner uppercase">{member.userName?.[0] || 'U'}</div>
                        <div>
                          <p className="text-base font-black text-slate-900 dark:text-white leading-none mb-1.5">{member.userName}</p>
                          <p className="text-xs text-slate-400 font-bold tracking-tight">{member.userId} • {member.userEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
                        member.userRole === 'ADMIN' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-primary text-white'
                      }`}>
                        {member.userRole}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${
                        member.userStatus === 'Y' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {member.userStatus === 'Y' ? '승인' : '미승인'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex flex-col items-center gap-1 text-slate-500 dark:text-slate-400 font-bold">
                        <span className="text-xs">{member.lastLoginAt || member.lastLogAt || '-'}</span>
                        <span className="text-[10px] opacity-50 font-medium italic">Joined: {member.createAt ? new Date(member.createAt).toLocaleDateString() : '-'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex items-center justify-center gap-3">
                        {member.userRole === 'USER' && (
                          <button
                            onClick={() => handleGrantAdmin(member.memberId)}
                            className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-black text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-xl transition-all border border-emerald-100/50 shadow-sm group"
                            title="해당 사용자를 관리자로 승격시킵니다."
                          >
                            <ShieldAlert size={16} className="group-hover:scale-110 transition-transform" />
                            <span>권한 부여</span>
                          </button>
                        )}
                        <button 
                          onClick={() => handleKick(member.memberId, member.userId)}
                          disabled={member.userRole === 'ADMIN'}
                          className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-black text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 rounded-xl transition-all border border-red-100/50 shadow-sm disabled:opacity-0 group"
                          title="해당 사용자를 강제로 탈퇴시킵니다."
                        >
                          <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                          <span>강퇴</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="py-32 text-center">
                      <div className="flex flex-col items-center gap-4 text-slate-300 dark:text-slate-700">
                        <Users size={64} strokeWidth={1} />
                        <p className="text-xl font-black">검색 결과가 없습니다.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        isLoading={confirmModal.isLoading}
      />
    </div>
  );
}

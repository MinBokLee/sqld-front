import React, { useEffect, useState, useCallback, useContext } from "react";
import { 
  Users, Shield, Trash2, Search, Filter, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  MoreVertical, CheckCircle2, AlertCircle, UserMinus, UserCheck, Mail, Calendar, LogIn,
  ShieldAlert, ArrowLeft, Crown, Layout, Code, Plus, Settings2, Hash, MessageSquare
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { useAlert } from "../contexts/AlertContext";
import { LanguageContext } from "../contexts/LanguageContext";
import { useBoard } from "../contexts/BoardContext";
import api from "../utils/api";
import ConfirmModal from "../components/ConfirmModal";

/**
 * [인터페이스] 데이터 구조 정의
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
  profileImage?: string;
  userProfileImage?: string;
  userImage?: string;
}

interface BoardMaster {
  boardCode: string;
  boardName: string;
  groupCode: string;
  fileYn: string;
  replyYn: string;
  tagYn: string;
  useYn: string;
  sortOrder?: number;
}

interface CommonCodeGroup {
  groupCode: string;
  groupName: string;
  sortOrder: number;
  useYn: string;
}

interface CommonCodeDetail {
  groupCode: string;
  codeId: string;
  codeName: string;
  sortOrder: number;
  useYn: string;
}

export default function AdminMemberPage() {
  const { user, isLoading } = useUser();
  const { showAlert, showToast } = useAlert();
  const { refreshConfigs } = useBoard();
  const navigate = useNavigate();

  const getFullImageUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `/uploads/${path.replace(/^\/*uploads\/*/, '')}`;
  };

  const languageContext = useContext(LanguageContext);
  const getText = languageContext ? languageContext.getText : (key: string) => key;

  const [activeTab, setActiveTab] = useState<'members' | 'boards' | 'codes'>('members');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]); // memberIds

  // 게시판 관리 상태
  const [boards, setBoards] = useState<BoardMaster[]>([]);
  const [isBoardLoading, setIsBoardLoading] = useState(false);

  // 공통 코드 관리 상태
  const [groups, setGroups] = useState<CommonCodeGroup[]>([]);
  const [details, setDetails] = useState<CommonCodeDetail[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [isCodeLoading, setIsCodeLoading] = useState(false);

  /**
   * [API 호출] 게시판 마스터 목록 조회
   */
  const fetchBoards = useCallback(async () => {
    setIsBoardLoading(true);
    try {
      const data: any = await api.get('/api/boardMaster/getBoardConfigList');
      const list = Array.isArray(data) ? data : (data?.data || []);
      const sortedList = [...list].sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
      setBoards(sortedList);
    } catch (error) {
      console.error("Failed to fetch boards:", error);
    } finally {
      setIsBoardLoading(false);
    }
  }, []);

  /**
   * [API 호출] 공통 코드 그룹 목록 조회
   */
  const fetchGroups = useCallback(async () => {
    setIsCodeLoading(true);
    try {
      const data: any = await api.get('/api/common-code-group/getGroupCodeList');
      const list = Array.isArray(data) ? data : (data?.data || []);
      setGroups(list);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    } finally {
      setIsCodeLoading(false);
    }
  }, []);

  /**
   * [API 호출] 공통 코드 상세 목록 조회
   */
  const fetchDetails = useCallback(async (groupCode: string) => {
    setIsCodeLoading(true);
    try {
      const data: any = await api.get(`/api/common-code-group-detail/readDetailCommonDetailCode/`, {
        params: { groupCode }
      });
      const list = Array.isArray(data) ? data : (data?.data || []);
      const sortedList = [...list].sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
      setDetails(sortedList);
      setSelectedGroup(groupCode);
    } catch (error) {
      console.error("Failed to fetch details:", error);
    } finally {
      setIsCodeLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'boards') fetchBoards();
    else if (activeTab === 'codes') fetchGroups();
  }, [activeTab, fetchBoards, fetchGroups]);

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

  const [boardModal, setBoardModal] = useState<{ isOpen: boolean; mode: 'add' | 'edit'; data: any }>({ isOpen: false, mode: 'add', data: null });
  const [groupModal, setGroupModal] = useState<{ isOpen: boolean; mode: 'add' | 'edit'; data: any }>({ isOpen: false, mode: 'add', data: null });
  const [detailModal, setDetailModal] = useState<{ isOpen: boolean; mode: 'add' | 'edit'; data: any }>({ isOpen: false, mode: 'add', data: null });

  /**
   * [핸들러] 게시판 마스터 등록/수정
   */
  const handleBoardSubmit = async (formData: any) => {
    try {
      const isEdit = boardModal.mode === 'edit';
      const maxOrder = isEdit ? boards.length : boards.length + 1;

      if (!formData.sortOrder || formData.sortOrder < 1 || formData.sortOrder > maxOrder) {
        showToast(`정렬 순서는 1부터 ${maxOrder} 사이여야 합니다. ⚠️`, 'warning', 4000);
        return;
      }

      const url = isEdit ? `/api/boardMaster/updateBoardMaster/${boardModal.data.boardCode}` : '/api/boardMaster/addBoardMaster';
      const method = isEdit ? 'patch' : 'post';
      
      await api[method](url, formData);
      showToast(`게시판이 성공적으로 ${isEdit ? '수정' : '등록'}되었습니다. ✅`, 'success');
      await refreshConfigs();
      fetchBoards();
      setBoardModal({ ...boardModal, isOpen: false });
    } catch (error) {
      console.error("Board error:", error);
    }
  };

  /**
   * [핸들러] 게시판 상세 정보 조회 후 수정 모달 오픈
   */
  const handleBoardEditClick = async (boardCode: string) => {
    try {
      const data: any = await api.get(`/api/boardMaster/readBoardMasterDetail/${boardCode}`);
      if (data) {
        setBoardModal({ isOpen: true, mode: 'edit', data });
      }
    } catch (error) {
      console.error("Failed to fetch board detail:", error);
      showToast("게시판 상세 정보를 불러오지 못했습니다. 🌐", "error");
    }
  };

  /**
   * [핸들러] 그룹 코드 등록/수정
   */
  const handleGroupSubmit = async (formData: any) => {
    try {
      const isEdit = groupModal.mode === 'edit';
      const maxOrder = isEdit ? groups.length : groups.length + 1;

      if (!formData.sortOrder || formData.sortOrder < 1 || formData.sortOrder > maxOrder) {
        showToast(`정렬 순서는 1부터 ${maxOrder} 사이여야 합니다. ⚠️`, 'warning', 4000);
        return;
      }

      const url = isEdit ? `/api/common-code-group/updateGroupCode/${groupModal.data.groupCode}` : '/api/common-code-group/addGroupCode';
      const method = isEdit ? 'patch' : 'post';
      
      await api[method](url, formData);
      showToast(`그룹 코드가 ${isEdit ? '수정' : '등록'}되었습니다. ✅`, 'success');
      await refreshConfigs();
      fetchGroups();
      setGroupModal({ ...groupModal, isOpen: false });
    } catch (error) {
      console.error("Group error:", error);
    }
  };

  /**
   * [핸들러] 상세 코드 등록/수정
   */
  const handleDetailSubmit = async (formData: any) => {
    try {
      const isEdit = detailModal.mode === 'edit';
      const currentGroupDetails = details.filter(d => d.groupCode === formData.groupCode);
      const maxOrder = isEdit ? currentGroupDetails.length : currentGroupDetails.length + 1;

      if (!formData.sortOrder || formData.sortOrder < 1 || formData.sortOrder > maxOrder) {
        showToast(`정렬 순서는 1부터 ${maxOrder} 사이여야 합니다. ⚠️`, 'warning', 4000);
        return;
      }

      const isDuplicate = details.some(d => 
        d.groupCode === formData.groupCode && 
        d.codeId !== (detailModal.data?.codeId || '') && 
        Number(d.sortOrder) === Number(formData.sortOrder)
      );

      if (isDuplicate) {
        showToast(`정렬 순서 ${formData.sortOrder}번은 이미 사용 중입니다. ⚠️`, 'warning', 4000);
        return;
      }

      const url = isEdit 
        ? `/api/common-code-group-detail/updateCommonCodeDetail/${detailModal.data.groupCode}/${detailModal.data.codeId}` 
        : '/api/common-code-group-detail/addCommonDetailCode';
      const method = isEdit ? 'patch' : 'post';
      
      await api[method](url, formData);
      showToast(`상세 코드가 ${isEdit ? '수정' : '등록'}되었습니다. ✅`, 'success');
      await refreshConfigs();
      fetchDetails(formData.groupCode);
      setDetailModal({ ...detailModal, isOpen: false });
    } catch (error) {
      console.error("Detail error:", error);
    }
  };

  const closeConfirmModal = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

  /**
   * [API 호출] 전체 회원 목록 조회
   */
  const fetchMembers = useCallback(async () => {
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.userRole)) return;
    
    setLoading(true);
    try {
      const data: any = await api.get(`/api/admin/getMemberList`);
      const list = Array.isArray(data) ? data : (data?.data || []);
      
      const mappedList = list.map((m: any) => ({
        ...m,
        profileImage: m.userProfileImage || m.profileImage || m.userImage
      }));
      setMembers(mappedList);
    } catch (error: any) {
      if (error.isAuthError) return;
      console.error("Failed to fetch members:", error);
      showToast("회원 목록을 가져오는 중에 문제가 생겼어요. 🌐", "error");
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    window.scrollTo(0, 0);

    if (isLoading) return;

    if (!user) {
      navigate('/');
      return;
    }
    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.userRole)) {
      showAlert({ type: 'warning', message: "접근 권한이 없습니다. 관리자만 이용 가능합니다. ⚠️" });
      navigate('/');
    } else {
      fetchMembers();
    }
  }, [user, isLoading, navigate, fetchMembers, showAlert]);

  /**
   * [권한 토글 로직] USER <-> ADMIN
   */
  const handleRoleToggle = (targetMember: Member) => {
    const isPromoting = targetMember.userRole === 'USER';
    const actionText = isPromoting ? '관리자로 승격' : '일반 유저로 강등';
    
    setConfirmModal({
      isOpen: true,
      title: '회원 권한 변경',
      message: `[${targetMember.userName}] 님을 ${actionText}시키겠습니까?\n이 작업은 즉시 반영됩니다.`,
      type: 'info',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          const result: any = await api.patch(`/api/admin/changeRoleAdmin/${targetMember.memberId}`, null, {
            headers: { 'Authorization' : `Bearer ${user?.accessToken}` }
          });
          
          showToast("권한 변경이 완료되었습니다. ✅", 'success');
          
          if (result) {
            setMembers(prev => prev.map(m => 
              m.memberId === targetMember.memberId ? { ...m, ...result.data || result } : m
            ));
          } else {
            fetchMembers();
          }
          closeConfirmModal();
        } catch(error: any) {
          console.error("Role toggle error:", error);
        } finally {
          setConfirmModal(prev => ({ ...prev, isLoading: false }));
        }
      }
    });
  };

  /**
   * 회원 개별 강퇴
   */
  const handleKick = (targetMember: Member) => {
    setConfirmModal({
      isOpen: true,
      title: '회원 강제 탈퇴',
      message: `${targetMember.userId} 회원을 강제 탈퇴시키겠습니까?\n이 작업은 되돌릴 수 없으며, 모든 계정 정보가 즉시 삭제됩니다.`,
      type: 'danger',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          await api.post(`/api/admin/deleteMembersBySuperAdmin`, 
            { memberIds: [targetMember.memberId] }, 
            { headers: { 'Authorization': `Bearer ${user?.accessToken}` } }
          );

          showToast("강제 탈퇴 처리가 완료되었습니다. ✅", 'success');
          setMembers(prev => prev.filter(m => m.memberId !== targetMember.memberId));
          setSelectedUsers(prev => prev.filter(id => id !== targetMember.memberId));
          closeConfirmModal();
        } catch (error) {
          console.error("Individual kick error:", error);
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
          await api.post(`/api/admin/deleteMembersBySuperAdmin`, { 
            memberIds: selectedUsers 
          }, {
            headers: { 'Authorization': `Bearer ${user?.accessToken}` }
          });
          
          showToast("일괄 처리가 완료되었습니다. ✅", 'success');
          setSelectedUsers([]);
          fetchMembers();
          closeConfirmModal();
        } catch (error) {
          console.error("Bulk kick error:", error);
        } finally {
          setConfirmModal(prev => ({ ...prev, isLoading: false }));
        }
      }
    });
  };

  const toggleSelectAll = () => {
    const selectableMembers = filteredMembers.filter(m => 
      !(m.memberId === user?.memberId && ['ADMIN', 'SUPER_ADMIN'].includes(m.userRole))
    );

    if (selectableMembers.length === 0) {
      showToast("선택 가능한 다른 회원이 없습니다. (본인 제외) 👤", 'info');
      return;
    }

    if (selectedUsers.length > 0 && selectedUsers.length === selectableMembers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(selectableMembers.map(m => m.memberId));
    }
  };

  const toggleSelectUser = (memberId: string) => {
    setSelectedUsers(prev => 
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  const filteredMembers = members.filter(m => 
    m.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canModifyRole = (target: Member) => {
    if (!user) return false;
    if (user.memberId === target.memberId) return false;
    if (target.userRole === 'SUPER_ADMIN') return false;
    
    if (user.userRole === 'SUPER_ADMIN') return true;
    if (user.userRole === 'ADMIN') {
      return target.userRole === 'USER';
    }
    return false;
  };

  const canKick = (target: Member) => {
    if (!user || user.userRole !== 'SUPER_ADMIN') return false;
    if (user.memberId === target.memberId) return false;
    if (target.userRole === 'SUPER_ADMIN') return false;
    
    return true;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d141b] transition-colors duration-300">
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8  py-10 font-sans">
        
        {/* Header Section */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <nav className="flex items-center gap-2 text-sm text-slate-400 font-bold">
              <Link to="/" className="hover:text-primary transition-colors font-medium">홈</Link>
              <ChevronRight size={14} />
              <span>시스템 관리</span>
            </nav>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <Shield className="text-primary" size={36} />
              운영 설정
            </h1>
          </div>

          <div className="flex bg-white dark:bg-[#1a222c] p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 w-fit">
            <button onClick={() => setActiveTab('members')} className={`px-6 sm:px-8 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'members' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
              <Users size={16} /> 회원 관리
            </button>
            <button onClick={() => setActiveTab('boards')} className={`px-6 sm:px-8 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'boards' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
              <Layout size={16} /> 게시판 설정
            </button>
            <button onClick={() => setActiveTab('codes')} className={`px-6 sm:px-8 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'codes' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
              <Code size={16} /> 공통 코드
            </button>
          </div>
        </header>

        {activeTab === 'members' && (
          <>
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
              
              {user?.userRole === 'SUPER_ADMIN' && (
                <button 
                  onClick={handleBulkKick}
                  disabled={selectedUsers.length === 0}
                  className="h-14 px-10 bg-red-500 text-white text-base font-black rounded-2xl hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 disabled:opacity-30 disabled:shadow-none flex items-center justify-center gap-2 active:scale-95"
                >
                  <UserMinus size={20} /> 일괄 강퇴
                </button>
              )}
            </section>

            {/* Member List Table */}
            <div className="bg-white dark:bg-[#1a222c] rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden mb-10">
              <div className="hidden lg:flex items-center px-8 py-6 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                <div className="w-12 flex justify-center">선택</div>
                <div className="w-40 px-4">사용자 이름</div>
                <div className="w-32 px-4">아이디</div>
                <div className="flex-1 px-4">이메일 주소</div>
                <div className="w-24 text-center">권한</div>
                <div className="w-20 text-center">상태</div>
                <div className="w-32 text-center">최근 접속</div>
                <div className="w-24 text-center">작업</div>
              </div>

              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <div key={`member-skeleton-${i}`} className="px-8 py-8">
                      <div className="h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl w-full" />
                    </div>
                  ))
                ) : filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => {
                    const isSelf = member.memberId === user?.memberId;
                    const isSelfAdmin = isSelf && ['ADMIN', 'SUPER_ADMIN'].includes(member.userRole);
                    
                    // 날짜 포맷팅 (YYYY.MM.DD)
                    const formatDate = (dateStr: string) => {
                      if (!dateStr) return '-';
                      try {
                        const d = new Date(dateStr);
                        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
                      } catch (e) { return dateStr; }
                    };

                    return (
                      <div key={member.memberId} className={`flex flex-col lg:flex-row lg:items-center px-8 py-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group ${selectedUsers.includes(member.memberId) ? 'bg-primary/5' : ''}`}>
                        {/* 선택 체크박스 */}
                        <div className="flex items-center justify-between lg:justify-center lg:w-12 mb-4 lg:mb-0">
                          <span className="lg:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">선택</span>
                          <div className="relative group/tooltip">
                            <input 
                              type="checkbox" 
                              disabled={isSelfAdmin}
                              className={`w-5 h-5 rounded-md border-2 transition-all ${isSelfAdmin ? 'border-slate-100 bg-slate-50 cursor-not-allowed opacity-50' : 'border-slate-200 text-primary focus:ring-primary/20 cursor-pointer'}`} 
                              checked={selectedUsers.includes(member.memberId)} 
                              onChange={() => toggleSelectUser(member.memberId)} 
                            />
                            {isSelfAdmin && (
                              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black rounded-xl opacity-0 group-hover/tooltip:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-2xl z-20 scale-95 group-hover/tooltip:scale-100 origin-left">
                                본인의 아이디는 강퇴할 수 없습니다.
                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-slate-900 dark:border-r-white" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 사용자 이름 & 아바타 */}
                        <div className="w-full lg:w-40 lg:px-4 mb-4 lg:mb-0 flex items-center gap-3">
                          <div className="size-9 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center font-black text-primary border border-primary/5 shadow-inner uppercase flex-shrink-0">
                            {(() => {
                              const fullUrl = getFullImageUrl(member.profileImage);
                              if (fullUrl) {
                                return (
                                  <img 
                                    src={fullUrl} 
                                    alt="P" 
                                    className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                  />
                                );
                              }
                              return <span className="text-xs">{member.userName?.[0] || 'U'}</span>;
                            })()}
                          </div>
                          <p className="text-sm font-black text-slate-900 dark:text-white truncate">{member.userName}</p>
                        </div>

                        {/* 아이디 */}
                        <div className="w-full lg:w-32 lg:px-4 mb-4 lg:mb-0">
                          <span className="lg:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">아이디</span>
                          <p className="text-xs text-slate-400 font-bold font-mono">{member.userId}</p>
                        </div>

                        {/* 이메일 */}
                        <div className="flex-1 lg:px-4 mb-4 lg:mb-0 min-w-0 lg:text-center">
                          <span className="lg:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">이메일</span>
                          <p className="text-xs text-slate-400 font-medium truncate">{member.userEmail}</p>
                        </div>

                        {/* 권한 */}
                        <div className="flex items-center justify-between lg:justify-center lg:w-24 mb-4 lg:mb-0">
                          <span className="lg:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">권한</span>
                          {member.userRole === 'SUPER_ADMIN' ? (
                            <span className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-indigo-600 text-white flex items-center gap-1 shadow-sm">
                              <Crown size={8} /> SUPER
                            </span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                              member.userRole === 'ADMIN' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}>
                              {member.userRole}
                            </span>
                          )}
                        </div>

                        {/* 상태 */}
                        <div className="flex items-center justify-between lg:justify-center lg:w-20 mb-4 lg:mb-0">
                          <span className="lg:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">상태</span>
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${
                            member.userStatus === 'Y' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {member.userStatus === 'Y' ? '승인' : '미승인'}
                          </span>
                        </div>

                        {/* 최근 접속 */}
                        <div className="flex items-center justify-between lg:justify-center lg:w-32 mb-4 lg:mb-0">
                          <span className="lg:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">최근 접속</span>
                          <span className="text-[11px] text-slate-500 font-bold font-mono">{formatDate(member.lastLoginAt || member.lastLogAt)}</span>
                        </div>

                        {/* 작업 버튼 */}
                        <div className="flex items-center justify-between lg:justify-center lg:w-24">
                          <span className="lg:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">작업</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRoleToggle(member)}
                              disabled={!canModifyRole(member)}
                              className={`p-1.5 rounded-lg transition-all border shadow-sm disabled:opacity-0 ${
                                member.userRole === 'USER' 
                                  ? 'text-emerald-600 bg-emerald-50 border-emerald-100/50 hover:bg-emerald-100' 
                                  : 'text-amber-600 bg-amber-50 border-amber-100/50 hover:bg-amber-100'
                              }`}
                            >
                              {member.userRole === 'USER' ? <ShieldAlert size={16} /> : <UserCheck size={16} />}
                            </button>

                            {user?.userRole === 'SUPER_ADMIN' && (
                              <button 
                                onClick={() => handleKick(member)}
                                disabled={!canKick(member)}
                                className="p-1.5 text-red-600 bg-red-50 border border-red-100/50 rounded-lg transition-all shadow-sm disabled:opacity-0 hover:bg-red-100"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-300 dark:text-slate-700">
                      <Users size={64} strokeWidth={1} />
                      <p className="text-xl font-black">검색 결과가 없습니다.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'boards' && (
          <section className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Layout className="text-primary" size={24} /> 게시판 마스터 관리
              </h2>
              <button 
                onClick={() => setBoardModal({ isOpen: true, mode: 'add', data: { fileYn: 'Y', replyYn: 'Y', useYn: 'Y' } })}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-black rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-primary/20 active:scale-95 text-sm"
              >
                <Plus size={18} /> 새 게시판 생성
              </button>
            </div>

            <div className="bg-white dark:bg-[#1a222c] rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
              <div className="hidden lg:flex items-center px-8 py-6 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                <div className="flex-1">게시판 정보</div>
                <div className="w-24 text-center">댓글</div>
                <div className="w-24 text-center">파일</div>
                <div className="w-24 text-center">태그</div>
                <div className="w-24 text-center">상태</div>
                <div className="w-20 text-center">작업</div>
              </div>

              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {isBoardLoading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={`board-skeleton-${i}`} className="px-8 py-8 animate-pulse">
                      <div className="h-12 bg-slate-50 dark:bg-slate-800 rounded-xl w-full" />
                    </div>
                  ))
                ) : boards.length > 0 ? (
                  boards.map((board) => (
                    <div key={board.boardCode} className="flex flex-col lg:flex-row lg:items-center px-8 py-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                      <div className="flex-1 flex items-center gap-4 mb-4 lg:mb-0">
                        <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                          <MessageSquare size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <p className="text-sm font-black text-slate-900 dark:text-white leading-none">{board.boardName}</p>
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[9px] font-black text-slate-400 border border-slate-200 dark:border-slate-700">
                              #{board.sortOrder}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">{board.boardCode}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 lg:flex items-center lg:gap-0 gap-2 mb-4 lg:mb-0">
                        <div className="flex flex-col lg:items-center gap-2 lg:w-24">
                          <span className="lg:hidden text-[9px] font-black text-slate-400 uppercase tracking-tighter">댓글</span>
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-black text-center ${board.replyYn === 'Y' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                            {board.replyYn === 'Y' ? '사용' : '미사용'}
                          </span>
                        </div>
                        <div className="flex flex-col lg:items-center gap-2 lg:w-24">
                          <span className="lg:hidden text-[9px] font-black text-slate-400 uppercase tracking-tighter">파일</span>
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-black text-center ${board.fileYn === 'Y' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                            {board.fileYn === 'Y' ? '사용' : '미사용'}
                          </span>
                        </div>
                        <div className="flex flex-col lg:items-center gap-2 lg:w-24">
                          <span className="lg:hidden text-[9px] font-black text-slate-400 uppercase tracking-tighter">태그</span>
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-black text-center ${board.tagYn === 'Y' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                            {board.tagYn === 'Y' ? '사용' : '미사용'}
                          </span>
                        </div>
                        <div className="flex flex-col lg:items-center gap-2 lg:w-24">
                          <span className="lg:hidden text-[9px] font-black text-slate-400 uppercase tracking-tighter">상태</span>
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black text-center ${board.useYn === 'Y' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                            {board.useYn === 'Y' ? '활성' : '비활성'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end lg:justify-center lg:w-20">
                        <button 
                          onClick={() => handleBoardEditClick(board.boardCode)}
                          className="p-2 text-slate-400 hover:text-primary transition-colors"
                        >
                          <Settings2 size={18} />
                        </button>
                      </div>
                    </div>
                  )
                )) : (
                  <div className="py-20 text-center text-slate-400 font-bold">등록된 게시판이 없습니다.</div>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'codes' && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-2">
            {/* Group Codes List */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Hash className="text-primary" size={20} /> 그룹 코드
                </h2>
                <button 
                  onClick={() => setGroupModal({ isOpen: true, mode: 'add', data: { useYn: 'Y' } })}
                  className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all"
                >
                  <Plus size={18} />
                </button>
              </div>
              <div className="bg-white dark:bg-[#1a222c] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                  {groups.map((group) => (
                    <div 
                      key={group.groupCode} 
                      onClick={() => fetchDetails(group.groupCode)}
                      className={`p-5 cursor-pointer transition-all flex items-center justify-between group ${selectedGroup === group.groupCode ? 'bg-primary/5 border-l-4 border-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-200 dark:border-slate-700">
                          {group.sortOrder}
                        </span>
                        <div>
                          <p className={`text-sm font-black ${selectedGroup === group.groupCode ? 'text-primary' : 'text-slate-700 dark:text-slate-200'}`}>{group.groupName}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{group.groupCode}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); setGroupModal({ isOpen: true, mode: 'edit', data: group }); }} className="p-1.5 text-slate-300 hover:text-primary transition-colors"><Settings2 size={16} /></button>
                        <ChevronRight size={16} className={`transition-transform ${selectedGroup === group.groupCode ? 'text-primary translate-x-1' : 'text-slate-300 group-hover:translate-x-1'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Detail Codes List */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Code className="text-primary" size={20} /> 상세 코드 {selectedGroup && <span className="text-sm text-slate-400 font-medium">({selectedGroup})</span>}
                </h2>
                {selectedGroup && (
                  <button 
                    onClick={() => setDetailModal({ 
                      isOpen: true, 
                      mode: 'add', 
                      data: { 
                        groupCode: selectedGroup, 
                        useYn: 'Y', 
                        sortOrder: details.filter(d => d.groupCode === selectedGroup).length + 1 
                      } 
                    })}
                    className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all"
                  >
                    <Plus size={18} />
                  </button>
                )}
              </div>
              <div className="bg-white dark:bg-[#1a222c] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden min-h-[400px]">
                {selectedGroup ? (
                  <div className="flex flex-col h-full">
                    <div className="hidden lg:flex items-center px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <div className="flex-1">코드/명칭</div>
                      <div className="w-16 text-center">순서</div>
                      <div className="w-20 text-center">상태</div>
                      <div className="w-16 text-center">작업</div>
                    </div>
                    <div className="divide-y divide-slate-50 dark:divide-slate-800">
                      {details.filter(detail => detail.groupCode === selectedGroup).map((detail) => (
                        <div key={`${detail.groupCode}_${detail.codeId}`} className="flex flex-col lg:flex-row lg:items-center px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                          <div className="flex-1 mb-2 lg:mb-0">
                            <p className="text-sm font-black text-slate-900 dark:text-white">{detail.codeName}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{detail.codeId}</p>
                          </div>
                          <div className="flex items-center justify-between lg:justify-center lg:w-16 mb-2 lg:mb-0">
                            <span className="lg:hidden text-[9px] font-black text-slate-400 uppercase tracking-tighter">순서</span>
                            <span className="text-xs font-bold text-slate-500">{detail.sortOrder}</span>
                          </div>
                          <div className="flex items-center justify-between lg:justify-center lg:w-20 mb-2 lg:mb-0">
                            <span className="lg:hidden text-[9px] font-black text-slate-400 uppercase tracking-tighter">상태</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${detail.useYn === 'Y' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                              {detail.useYn === 'Y' ? '사용' : '미사용'}
                            </span>
                          </div>
                          <div className="flex items-center justify-end lg:justify-center lg:w-16">
                            <button 
                              onClick={() => setDetailModal({ isOpen: true, mode: 'edit', data: detail })}
                              className="p-1.5 text-slate-300 hover:text-primary transition-colors"
                            >
                              <Settings2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {details.length === 0 && !isCodeLoading && (
                        <div className="py-24 text-center px-6">
                          <div className="size-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                            <Code size={32} />
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 font-bold mb-2">등록된 상세코드가 없습니다.</p>
                          <p className="text-slate-400 text-xs mb-8">해당 그룹의 첫 번째 상세 코드를 등록해 보세요!</p>
                          <button 
                            onClick={() => setDetailModal({ 
                              isOpen: true, 
                              mode: 'add', 
                              data: { 
                                groupCode: selectedGroup, 
                                useYn: 'Y', 
                                sortOrder: 1 
                              } 
                            })}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm font-black rounded-xl hover:bg-blue-600 shadow-lg shadow-primary/20 transition-all active:scale-95"
                          >
                            <Plus size={18} /> 첫 번째 코드 등록하기
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] text-slate-300 gap-4">
                    <Hash size={48} strokeWidth={1} />
                    <p className="text-sm font-bold">좌측 그룹 코드를 선택해 주세요.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
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

      {boardModal.isOpen && <BoardFormModal modal={boardModal} onClose={() => setBoardModal({ ...boardModal, isOpen: false })} onSubmit={handleBoardSubmit} boards={boards} />}
      {groupModal.isOpen && <GroupFormModal modal={groupModal} onClose={() => setGroupModal({ ...groupModal, isOpen: false })} onSubmit={handleGroupSubmit} currentCount={groups.length} />}
      {detailModal.isOpen && <DetailFormModal modal={detailModal} onClose={() => setDetailModal({ ...detailModal, isOpen: false })} onSubmit={handleDetailSubmit} details={details} />}
    </div>
  );
}

/**
 * [컴포넌트] 게시판 마스터 폼 모달
 */
function BoardFormModal({ modal, onClose, onSubmit, boards }: any) {
  const isEdit = modal.mode === 'edit';
  
  const initialData = {
    boardName: '',
    groupCode: '',
    fileYn: 'Y',
    replyYn: 'Y',
    tagYn: 'Y',
    useYn: 'Y',
    sortOrder: boards.length + 1
  };

  // [수정] 초기 상태 생성 시 누락된 필드가 없도록 initialData와 병합 (uncontrolled 경고 해결)
  const [formData, setFormData] = useState({ ...initialData, ...(modal.data || {}) });
  const maxOrder = isEdit ? boards.length : boards.length + 1;

  useEffect(() => {
    if (modal.isOpen) {
      setFormData({ ...initialData, ...(modal.data || {}) });
    }
  }, [modal.isOpen, modal.data]);

  useEffect(() => {
    if (modal.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [modal.isOpen]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1a222c] w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layout className="text-primary" size={24} /> {isEdit ? '게시판 수정' : '새 게시판 등록'}
          </h3>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">게시판 명칭</label>
            <input required className="w-full h-14 px-6 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 dark:text-white" value={formData.boardName} onChange={(e) => setFormData({...formData, boardName: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">그룹코드 (카테고리 연결)</label>
            <input 
              required 
              disabled={isEdit}
              className="w-full h-14 px-6 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 dark:text-white disabled:opacity-50" 
              placeholder="예: G_BRD_QA (공통 코드 그룹 ID)"
              value={formData.groupCode} 
              onChange={(e) => setFormData({...formData, groupCode: e.target.value})} 
            />
            <p className="text-[9px] text-primary/60 font-medium ml-1">공통 코드 관리에서 등록한 그룹 ID를 입력하면 해당 카테고리가 연결됩니다.</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-end px-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">정렬 순서</label>
              <span className="text-[9px] text-primary font-black uppercase">Max: {maxOrder}</span>
            </div>
            <input required type="number" min="1" max={maxOrder} className="w-full h-14 px-6 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 dark:text-white" value={formData.sortOrder} onChange={(e) => setFormData({...formData, sortOrder: e.target.value === '' ? '' : parseInt(e.target.value)})} />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {['fileYn', 'replyYn', 'tagYn', 'useYn'].map(field => (
              <div key={field} className="space-y-2 text-center">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">
                  {field === 'fileYn' ? 'FILE' : field === 'replyYn' ? 'REPLY' : field === 'tagYn' ? 'TAG' : 'USE'}
                </label>
                <button type="button" onClick={() => setFormData({...formData, [field]: formData[field] === 'Y' ? 'N' : 'Y'})} className={`w-full h-10 rounded-xl text-[10px] font-black transition-all ${formData[field] === 'Y' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-slate-100 text-slate-400'}`}>
                  {formData[field] === 'Y' ? '사용' : '미사용'}
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 h-14 rounded-2xl bg-slate-100 text-slate-500 text-sm font-black hover:bg-slate-200 transition-all">취소</button>
            <button type="submit" className="flex-1 h-14 rounded-2xl bg-primary text-white text-sm font-black hover:bg-blue-600 shadow-xl shadow-primary/20 transition-all">{isEdit ? '저장하기' : '등록하기'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * [컴포넌트] 공통 코드 그룹 폼 모달
 */
function GroupFormModal({ modal, onClose, onSubmit, currentCount }: any) {
  const isEdit = modal.mode === 'edit';
  const initialData = { groupCode: '', groupName: '', sortOrder: currentCount + 1, useYn: 'Y' };
  
  // [수정] 초기 상태 생성 시 누락된 필드가 없도록 initialData와 병합
  const [formData, setFormData] = useState({ ...initialData, ...(modal.data || {}) });
  const maxOrder = isEdit ? currentCount : currentCount + 1;

  useEffect(() => {
    if (modal.isOpen) {
      setFormData({ ...initialData, ...(modal.data || {}) });
    }
  }, [modal.isOpen, modal.data]);

  useEffect(() => {
    if (modal.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [modal.isOpen]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1a222c] w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Hash className="text-primary" size={24} /> {isEdit ? '그룹 수정' : '새 그룹 등록'}
          </h3>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">그룹 코드 (ID)</label>
            <input required disabled={isEdit} className="w-full h-14 px-6 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 dark:text-white disabled:opacity-50" placeholder="예: G_BRD_GREETING" value={formData.groupCode} onChange={(e) => setFormData({...formData, groupCode: e.target.value.toUpperCase()})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">그룹 명칭</label>
            <input required className="w-full h-14 px-6 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 dark:text-white" placeholder="예: 게시판 카테고리" value={formData.groupName} onChange={(e) => setFormData({...formData, groupName: e.target.value})} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-end px-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">정렬 순서</label>
              <span className="text-[9px] text-primary font-black uppercase">Max: {maxOrder}</span>
            </div>
            <input required type="number" min="1" max={maxOrder} className="w-full h-14 px-6 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 dark:text-white" value={formData.sortOrder} onChange={(e) => setFormData({...formData, sortOrder: e.target.value === '' ? '' : parseInt(e.target.value)})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">활성 상태</label>
            <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              {['Y', 'N'].map(v => (
                <button key={v} type="button" onClick={() => setFormData({...formData, useYn: v})} className={`flex-1 h-12 rounded-xl text-xs font-black transition-all ${formData.useYn === v ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400'}`}>
                  {v === 'Y' ? '활성 (Y)' : '비활성 (N)'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 h-14 rounded-2xl bg-slate-100 text-slate-500 text-sm font-black hover:bg-slate-200 transition-all">취소</button>
            <button type="submit" className="flex-1 h-14 rounded-2xl bg-primary text-white text-sm font-black hover:bg-blue-600 shadow-xl shadow-primary/20 transition-all">{isEdit ? '수정완료' : '등록하기'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * [컴포넌트] 상세 코드 폼 모달
 */
function DetailFormModal({ modal, onClose, onSubmit, details }: any) {
  const isEdit = modal.mode === 'edit';
  const currentGroupDetails = details.filter((d: any) => d.groupCode === (modal.data?.groupCode || ''));
  const initialData = { groupCode: '', codeId: '', codeName: '', sortOrder: currentGroupDetails.length + 1, useYn: 'Y' };
  
  // [수정] 초기 상태 생성 시 누락된 필드가 없도록 initialData와 병합
  const [formData, setFormData] = useState({ ...initialData, ...(modal.data || {}) });
  const maxOrder = isEdit ? currentGroupDetails.length : currentGroupDetails.length + 1;

  useEffect(() => {
    if (modal.isOpen) {
      setFormData({ ...initialData, ...(modal.data || {}) });
    }
  }, [modal.isOpen, modal.data, currentGroupDetails.length]);

  useEffect(() => {
    if (modal.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [modal.isOpen]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1a222c] w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Code className="text-primary" size={24} /> {isEdit ? '상세 코드 수정' : '새 상세 코드 등록'}
          </h3>
          <p className="text-[10px] text-slate-400 font-bold mt-1 tracking-widest uppercase">Group: {formData.groupCode}</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="p-8 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 tracking-wider ml-1">상세 코드 (ID)</label>
            <input required disabled={isEdit} className="w-full h-12 px-5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 dark:text-white disabled:opacity-50" value={formData.codeId} onChange={(e) => setFormData({...formData, codeId: e.target.value.toUpperCase()})} />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 tracking-wider ml-1">상세 명칭</label>
            <input required className="w-full h-12 px-5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 dark:text-white" value={formData.codeName} onChange={(e) => setFormData({...formData, codeName: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-end px-1">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">정렬 순서</label>
                <span className="text-[10px] text-primary font-black uppercase opacity-70">Max: {maxOrder}</span>
              </div>
              <input required type="number" min="1" max={maxOrder} className="w-full h-12 px-5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 dark:text-white" value={formData.sortOrder} onChange={(e) => setFormData({...formData, sortOrder: e.target.value === '' ? '' : parseInt(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider ml-1">사용 여부</label>
              <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl h-12">
                {['Y', 'N'].map(v => (
                  <button key={v} type="button" onClick={() => setFormData({...formData, useYn: v})} className={`flex-1 rounded-lg text-[10px] font-black transition-all ${formData.useYn === v ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}>
                    {v === 'Y' ? '사용' : '미사용'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <button type="button" onClick={onClose} className="flex-1 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm font-black hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">취소</button>
            <button type="submit" className="flex-1 h-12 rounded-xl bg-primary text-white text-sm font-black hover:bg-blue-600 shadow-lg shadow-primary/20 transition-all">{isEdit ? '수정 완료' : '등록 완료'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

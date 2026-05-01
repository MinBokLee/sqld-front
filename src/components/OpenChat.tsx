import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, User, WifiOff, Users, ChevronLeft } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import { useUser } from '../contexts/UserContext';

export default function OpenChat() {
  const { user } = useUser();
  const { messages, sendMessage, isLoadingHistory, isConnected, connectedUsers, userCount } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 새 메시지 수신 시 자동 스크롤 하단 이동
  useEffect(() => {
    if (scrollRef.current && isOpen && !showUserList) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, showUserList]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && isConnected) {
      sendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  if (!user) return null; // 로그인하지 않은 경우 채팅방 숨김

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40 font-sans">
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="size-12 md:size-14 bg-primary text-white rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 group"
        >
          <MessageSquare className="w-5 h-5 md:w-6 md:h-6 group-hover:rotate-12 transition-transform" />
          <span className={`absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-white ${isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}>
            {isConnected ? (userCount > 0 ? userCount : '!') : 'X'}
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[calc(100vw-32px)] sm:w-[360px] h-[480px] md:h-[520px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-300">
          {/* Header */}
          <div className="p-4 bg-primary flex items-center justify-between text-white shadow-lg">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="size-8 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  {showUserList ? (
                    <button onClick={() => setShowUserList(false)} className="hover:scale-110 transition-transform">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-primary ${isConnected ? 'bg-green-400' : 'bg-red-400 animate-pulse'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black leading-tight">
                    {showUserList ? '접속자 명단' : '오픈 채팅방'} 
                    <span className="ml-1 opacity-70">({userCount})</span>
                  </h3>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${isConnected ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'}`}>
                    {isConnected ? 'Online' : 'Offline'}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-white/70">
                  {showUserList ? '현재 채팅 참여 중인 유저' : '실시간 자유 게시판'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!showUserList && (
                <button 
                  onClick={() => setShowUserList(true)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors group relative"
                  title="접속자 명단"
                >
                  <Users className="w-4 h-4" />
                </button>
              )}
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col relative">
            {/* User List Overlay */}
            {showUserList ? (
              <div className="flex-1 p-4 overflow-y-auto bg-slate-50 dark:bg-slate-950 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex flex-col gap-2">
                  {connectedUsers.length > 0 ? (
                    connectedUsers.map((nickname, idx) => (
                      <div 
                        key={`${nickname}-${idx}`}
                        className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className="size-8 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                          <User size={16} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200">{nickname}</p>
                          <p className="text-[9px] text-green-500 font-bold">Online</p>
                        </div>
                        {nickname === user.userName && (
                          <span className="text-[9px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-black">나</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 opacity-40">
                      <Users className="w-10 h-10 mx-auto mb-3" />
                      <p className="text-xs font-bold">접속자 정보를 불러오고 있습니다...</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Messages List */
              <div 
                ref={scrollRef}
                className="flex-1 p-4 overflow-y-auto bg-slate-50 dark:bg-slate-950 flex flex-col gap-3 scroll-smooth"
              >
                {isLoadingHistory && (
                  <div className="text-center py-4">
                    <div className="inline-block size-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  </div>
                )}
                
                {!isConnected && (
                  <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 p-3 rounded-2xl flex items-center gap-3 mb-2 animate-in fade-in zoom-in duration-300">
                    <div className="size-8 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center text-red-500">
                      <WifiOff size={16} />
                    </div>
                    <p className="text-[11px] font-bold text-red-600 dark:text-red-400 leading-tight">
                      서버와 연결이 끊어졌습니다.<br/>잠시 후 자동으로 재연결됩니다.
                    </p>
                  </div>
                )}

                {messages.map((msg, idx) => {
                  const isMine = msg.senderId === user.memberId;
                  const isSystem = msg.type === 'ENTER' || msg.type === 'LEAVE' || msg.type === 'QUIT';
                  
                  if (isSystem) {
                    return (
                      <div key={msg.messageId || idx} className="flex justify-center my-3 animate-in fade-in slide-in-from-top-1 duration-500">
                        <div className="bg-slate-200/60 dark:bg-slate-800/60 backdrop-blur-sm px-4 py-1.5 rounded-full text-[10px] font-black text-slate-500 dark:text-slate-400 border border-white/20 flex items-center gap-1.5 shadow-sm">
                          <Users size={10} className="text-primary/60" />
                          {msg.content}
                        </div>
                      </div>
                    );
                  }

                  const showName = idx === 0 || messages[idx-1].senderId !== msg.senderId || messages[idx-1].type !== 'TALK';

                  return (
                    <div 
                      key={msg.messageId || idx} 
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                    >
                      {showName && !isMine && (
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1 ml-1 flex items-center gap-1">
                          <div className="size-4 bg-primary/10 rounded-full flex items-center justify-center text-[8px] text-primary shadow-inner">
                            <User size={8} />
                          </div>
                          {msg.senderName || '익명'}
                        </span>
                      )}
                      <div 
                        className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[13px] font-bold shadow-sm transition-all hover:scale-[1.02] ${
                          isMine 
                            ? 'bg-primary text-white rounded-tr-none shadow-primary/20' 
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700/50'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 px-1 font-medium italic">
                        {msg.timestamp ? msg.timestamp.split(' ')[1].substring(0, 5) : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Input Area (Hidden when user list is shown) */}
          {!showUserList && (
            <form 
              onSubmit={handleSendMessage}
              className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isConnected ? "메시지를 입력해 주세요..." : "연결 대기 중..."}
                disabled={!isConnected}
                className="flex-1 h-11 px-4 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || !isConnected}
                className="size-11 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-blue-600 active:scale-95 disabled:opacity-30 disabled:hover:bg-primary transition-all shadow-lg shadow-primary/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

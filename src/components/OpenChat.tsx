import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Minimize2, Maximize2, User } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import type { ChatMessage } from '../contexts/ChatContext';
import { useUser } from '../contexts/UserContext';

export default function OpenChat() {
  const { user } = useUser();
  const { messages, sendMessage, isLoadingHistory } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 새 메시지 수신 시 자동 스크롤 하단 이동
  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
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
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold ring-2 ring-white">
            !
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[calc(100vw-32px)] sm:w-[360px] h-[480px] md:h-[520px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-300">
          {/* Header */}
          <div className="p-4 bg-primary flex items-center justify-between text-white shadow-lg">
            <div className="flex items-center gap-3">
              <div className="size-8 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black leading-tight">오픈 채팅방</h3>
                <p className="text-[10px] font-bold text-white/70">실시간 자유 게시판</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages List */}
          <div 
            ref={scrollRef}
            className="flex-1 p-4 overflow-y-auto bg-slate-50 dark:bg-slate-950 flex flex-col gap-3 scroll-smooth"
          >
            {isLoadingHistory && (
              <div className="text-center py-4">
                <div className="inline-block size-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            )}
            
            {messages.map((msg, idx) => {
              const isMine = msg.senderId === user.memberId;
              const isSystem = msg.type === 'ENTER' || msg.type === 'LEAVE' || msg.type === 'QUIT';
              
              // 시스템 메시지 (입장/퇴장) 처리
              if (isSystem) {
                return (
                  <div key={msg.id || idx} className="flex justify-center my-2">
                    <div className="bg-slate-200/50 dark:bg-slate-800/50 px-4 py-1 rounded-full text-[10px] font-black text-slate-500 dark:text-slate-400">
                      {msg.content}
                    </div>
                  </div>
                );
              }

              const showName = idx === 0 || messages[idx-1].senderId !== msg.senderId || messages[idx-1].type !== 'TALK';

              return (
                <div 
                  key={msg.id || idx} 
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  {showName && !isMine && (
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1 ml-1 flex items-center gap-1">
                      <div className="size-4 bg-primary/10 rounded-full flex items-center justify-center text-[8px] text-primary">
                        <User size={8} />
                      </div>
                      {msg.senderName || '익명'}
                    </span>
                  )}
                  <div 
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[13px] font-bold shadow-sm transition-all hover:scale-[1.02] ${
                      isMine 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700/50'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 px-1 font-medium">
                    {msg.timestamp ? msg.timestamp.split(' ')[1].substring(0, 5) : ''}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Input Area */}
          <form 
            onSubmit={handleSendMessage}
            className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="메시지를 입력해 주세요..."
              className="flex-1 h-11 px-4 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="size-11 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-blue-600 active:scale-95 disabled:opacity-30 disabled:hover:bg-primary transition-all shadow-lg shadow-primary/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

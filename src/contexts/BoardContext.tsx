import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { type BoardMaster } from '../utils/api';

interface BoardContextType {
  boardConfigs: BoardMaster[];
  isLoading: boolean;
  getBoardCode: (groupCode: string) => string | undefined;
  getBoardConfig: (boardCode: string) => BoardMaster | undefined;
  getBoardCategories: (boardCode: string) => { categoryId: string; categoryName: string; }[];
  refreshConfigs: () => Promise<void>;
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export const BoardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [boardConfigs, setBoardConfigs] = useState<BoardMaster[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfigs = useCallback(async () => {
    setIsLoading(true);
    try {
      /**
       * [최종 적용] api.get은 인터셉터가 다중 경로 탐색을 통해 
       * res.data 또는 res.result.data를 자동으로 언래핑하여 반환합니다.
       */
      const resData: any = await api.get('/api/boardMaster/getBoardConfigList');
      
      let configList: BoardMaster[] = [];
      
      if (Array.isArray(resData)) {
        configList = resData;
      } else if (resData && typeof resData === 'object') {
        // 객체로 반환된 경우 내부의 list나 data 필드를 한 번 더 탐색
        configList = resData.data || resData.list || resData.result || [];
        // 만약 result가 또 data를 가지고 있다면 (예: { result: { data: [...] } })
        if (!Array.isArray(configList) && (configList as any).data) {
          configList = (configList as any).data;
        }
      }

      setBoardConfigs(Array.isArray(configList) ? configList : []);
      console.log('✅ Board System Synced. Count:', configList.length);
    } catch (error) {
      console.error('Board Config load error:', error);
      setBoardConfigs([]); 
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const getBoardCode = useCallback((groupCode: string) => {
    if (!groupCode) return undefined;
    return boardConfigs.find(config => 
      config.groupCode === groupCode || config.boardCode === groupCode
    )?.boardCode;
  }, [boardConfigs]);

  const getBoardConfig = useCallback((boardCode: string) => {
    if (!boardCode) return undefined;
    return boardConfigs.find(config => config.boardCode === boardCode);
  }, [boardConfigs]);

  const getBoardCategories = useCallback((boardCode: string) => {
    if (!boardCode) return [];
    const config = boardConfigs.find(c => c.boardCode === boardCode);
    return config?.categories || [];
  }, [boardConfigs]);

  return (
    <BoardContext.Provider value={{ 
      boardConfigs, 
      isLoading, 
      getBoardCode, 
      getBoardConfig, 
      getBoardCategories,
      refreshConfigs: fetchConfigs 
    }}>
      {children}
    </BoardContext.Provider>
  );
};

export const useBoard = () => {
  const context = useContext(BoardContext);
  if (context === undefined) {
    throw new Error('useBoard must be used within a BoardProvider');
  }
  return context;
};

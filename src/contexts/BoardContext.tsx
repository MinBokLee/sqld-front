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
      const response = await api.get('/api/boardMaster/getBoardConfigList');
      const resData = response.data;
      
      if (resData.success) {
        // [보안] 데이터 계층 구조가 { result: { data: [...] } } 또는 { result: [...] } 인 경우 모두 대응
        const configs = resData.result?.data || resData.result || [];
        setBoardConfigs(Array.isArray(configs) ? configs : []);
      }
    } catch (error) {
      console.error('Failed to fetch board configurations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const getBoardCode = useCallback((groupCode: string) => {
    return boardConfigs.find(config => config.groupCode === groupCode || config.boardCode === groupCode)?.boardCode;
  }, [boardConfigs]);

  const getBoardConfig = useCallback((boardCode: string) => {
    return boardConfigs.find(config => config.boardCode === boardCode);
  }, [boardConfigs]);

  const getBoardCategories = useCallback((boardCode: string) => {
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

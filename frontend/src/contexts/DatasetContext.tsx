import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { Dataset } from '../types';
import { useAuth } from './AuthContext';

interface DatasetContextType {
  datasets: Dataset[];
  activeDataset: Dataset | null;
  filterPeriod: string;
  setFilterPeriod: (period: string) => void;
  isLoading: boolean;
  refreshDatasets: () => Promise<void>;
  selectDataset: (id: number) => Promise<void>;
  seedDemo: () => Promise<void>;
}

const DatasetContext = createContext<DatasetContextType | undefined>(undefined);

export const DatasetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [activeDataset, setActiveDataset] = useState<Dataset | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshDatasets = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await api.get('/datasets');
      const list: Dataset[] = res.data;
      setDatasets(list);
      const active = list.find((d) => d.is_active) || (list.length > 0 ? list[0] : null);
      setActiveDataset(active);
    } catch (err) {
      console.error('Failed to fetch datasets', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshDatasets();
    } else {
      setDatasets([]);
      setActiveDataset(null);
    }
  }, [isAuthenticated, refreshDatasets]);

  const selectDataset = async (id: number) => {
    try {
      const res = await api.post(`/datasets/${id}/activate`);
      setActiveDataset(res.data);
      await refreshDatasets();
    } catch (err) {
      console.error('Failed to activate dataset', err);
    }
  };

  const seedDemo = async () => {
    setIsLoading(true);
    try {
      const res = await api.post('/datasets/seed-demo');
      setActiveDataset(res.data);
      await refreshDatasets();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DatasetContext.Provider
      value={{
        datasets,
        activeDataset,
        filterPeriod,
        setFilterPeriod,
        isLoading,
        refreshDatasets,
        selectDataset,
        seedDemo,
      }}
    >
      {children}
    </DatasetContext.Provider>
  );
};

export const useDataset = () => {
  const context = useContext(DatasetContext);
  if (!context) {
    throw new Error('useDataset must be used within a DatasetProvider');
  }
  return context;
};


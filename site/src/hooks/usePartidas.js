import { useState, useEffect, useCallback, useRef } from 'react';
import { DEFAULT_PARTIDAS_URL, LOCAL_FALLBACK_URL, AUTO_REFRESH_INTERVAL } from '../constants/config';

export function usePartidas() {
  const [partidas, setPartidas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorNotice, setErrorNotice] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');
  
  const abortControllerRef = useRef(null);

  const fetchPartidas = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    let data = null;
    let fallbackUsed = false;

    try {
      // 1. Tenta carregar do endpoint externo configurado
      const res = await fetch(DEFAULT_PARTIDAS_URL, {
        signal: abortControllerRef.current.signal,
        cache: 'no-cache', // Sempre dados em tempo real
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
    } catch (err) {
      if (err.name === 'AbortError') return;

      // 2. Fallback automático para o arquivo local
      try {
        const fallbackRes = await fetch(LOCAL_FALLBACK_URL, {
          signal: abortControllerRef.current.signal,
        });
        if (fallbackRes.ok) {
          data = await fallbackRes.json();
          fallbackUsed = true;
        }
      } catch (fallbackErr) {
        console.warn('Erro ao carregar fallback local:', fallbackErr);
      }
    } finally {
      if (data) {
        // Normaliza os dados: aceita lista direta ou chave { partidas: [...] }
        const lista = Array.isArray(data) ? data : data.partidas || [];
        setPartidas(lista);
        setErrorNotice(fallbackUsed ? 'Exibindo dados locais de demonstração (fallback).' : null);
        
        const now = new Date();
        setLastUpdated(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      } else {
        setErrorNotice('Não foi possível carregar as partidas. Tente novamente mais tarde.');
      }

      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch inicial
  useEffect(() => {
    fetchPartidas();

    // Auto-polling opcional e leve
    const interval = setInterval(() => {
      fetchPartidas();
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      clearInterval(interval);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [fetchPartidas]);

  return {
    partidas,
    loading,
    refreshing,
    errorNotice,
    lastUpdated,
    refresh: () => fetchPartidas(true),
  };
}

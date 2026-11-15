// App.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { PARTIDAS_JSON_URL, THEME, DEFAULT_CATEGORIES } from './src/constants/config';
import { MatchCard } from './src/components/MatchCard';
import { CategoryFilter } from './src/components/CategoryFilter';
import { VideoPlayerModal } from './src/components/VideoPlayerModal';
import { openYouTubeApp } from './src/utils/openYouTube';
import fallbackPartidas from './src/assets/fallback_partidas.json';

export default function App() {
  const [matches, setMatches] = useState(fallbackPartidas || []);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [activeVideo, setActiveVideo] = useState(null);

  // Busca os dados da URL remota do partidas.json
  const fetchMatches = useCallback(async (isInitial = false) => {
    if (isInitial && matches.length === 0) {
      setLoading(true);
    }
    try {
      // Adiciona timestamp para desabilitar cache HTTP agressivo
      const response = await fetch(`${PARTIDAS_JSON_URL}?t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setMatches(data);
        }
      }
    } catch (err) {
      console.warn('[Fetch] Usando dados locais ou mantendo cache:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [matches.length]);

  useEffect(() => {
    fetchMatches(true);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMatches(false);
  }, [fetchMatches]);

  // Ação ao clicar em um jogo (Requisitos 3 e 4)
  const handleMatchPress = useCallback((match) => {
    if (match.permite_embed) {
      // Requisito 3: Abre player nativo
      setActiveVideo(match);
    } else {
      // Requisito 4: Abre no app nativo do YouTube via Linking
      openYouTubeApp(match.id_video, match.link_direto);
    }
  }, []);

  // Lista dinâmica de categorias detectadas nos dados
  const availableCategories = useMemo(() => {
    const categoriesSet = new Set(matches.map((m) => m.categoria).filter(Boolean));
    const dynamicList = Array.from(categoriesSet);
    return ['Todos', ...dynamicList];
  }, [matches]);

  // Filtragem local otimizada
  const filteredMatches = useMemo(() => {
    if (selectedCategory === 'Todos') return matches;
    return matches.filter((m) => m.categoria === selectedCategory);
  }, [matches, selectedCategory]);

  const renderItem = useCallback(
    ({ item }) => <MatchCard item={item} onPress={handleMatchPress} />,
    [handleMatchPress]
  );

  const keyExtractor = useCallback((item) => item.id_video, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" backgroundColor={THEME.background} />

      {/* Header Dark Minimalista */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Futebol Ao Vivo</Text>
          <Text style={styles.headerSubtitle}>
            {filteredMatches.length} transmissão(ões) ativa(s)
          </Text>
        </View>

        <View style={styles.liveIndicator}>
          <View style={styles.livePulse} />
          <Text style={styles.liveIndicatorText}>FEED ATIVO</Text>
        </View>
      </View>

      {/* Seletor de Categorias */}
      <CategoryFilter
        categories={availableCategories.length > 1 ? availableCategories : DEFAULT_CATEGORIES}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Lista Principal de Jogos */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={THEME.accentGreen} />
          <Text style={styles.loadingText}>Sincronizando partidas...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMatches}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={THEME.accentGreen}
              colors={[THEME.accentGreen]}
              progressBackgroundColor={THEME.surface}
            />
          }
          // Otimizações de renderização para Android (Evita travamentos de GPU/RAM)
          removeClippedSubviews={true}
          initialNumToRender={4}
          maxToRenderPerBatch={5}
          windowSize={5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Nenhuma transmissão no momento</Text>
              <Text style={styles.emptySubtitle}>
                Puxe para baixo para atualizar ou escolha outra categoria acima.
              </Text>
            </View>
          }
        />
      )}

      {/* Modal do Player Nativo de Vídeo */}
      <VideoPlayerModal
        visible={!!activeVideo}
        match={activeVideo}
        onClose={() => setActiveVideo(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: THEME.textMuted,
    marginTop: 2,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.surfaceBorder,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.accentGreen,
    marginRight: 6,
  },
  liveIndicatorText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.textSecondary,
  },
  listContent: {
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: THEME.textSecondary,
    fontSize: 13,
    marginTop: 12,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    color: THEME.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: THEME.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
});

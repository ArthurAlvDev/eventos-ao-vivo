// src/components/MatchCard.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { THEME } from '../constants/config';

export const MatchCard = React.memo(({ item, onPress }) => {
  const thumbnailUrl = `https://i.ytimg.com/vi/${item.id_video}/hqdefault.jpg`;

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={styles.card}
      onPress={() => onPress(item)}
    >
      {/* Thumbnail com Cache Nativo (Zero processamento local de imagem) */}
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: thumbnailUrl }}
          style={styles.thumbnail}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={150}
        />

        {/* Badge Pulsante AO VIVO */}
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>AO VIVO</Text>
        </View>

        {/* Indicador de Destino (Player Nativo vs Abrir no YouTube) */}
        <View
          style={[
            styles.embedBadge,
            !item.permite_embed && styles.externalBadge,
          ]}
        >
          <Text style={styles.embedBadgeText}>
            {item.permite_embed ? '▶ Player Nativo' : '↗ YouTube App'}
          </Text>
        </View>
      </View>

      {/* Detalhes da Partida */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.leagueText} numberOfLines={1}>
            {item.liga || 'Partida de Futebol'}
          </Text>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryText}>{item.categoria}</Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {item.titulo}
        </Text>

        <View style={styles.footerRow}>
          <Text style={styles.languageText}>🌐 {item.idioma || 'Português'}</Text>
          <Text style={styles.actionHint}>
            {item.permite_embed ? 'Toque para assistir' : 'Abre no app externo'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.surfaceBorder,
  },
  thumbnailContainer: {
    width: '100%',
    height: 185,
    backgroundColor: '#05070A',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  liveBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.accentRed,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.accentRed,
    marginRight: 6,
  },
  liveText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  embedBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(11, 14, 20, 0.90)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.accentGreen,
  },
  externalBadge: {
    borderColor: THEME.youtubeRed,
  },
  embedBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  leagueText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.accentGreen,
    flex: 1,
    textTransform: 'uppercase',
  },
  categoryPill: {
    backgroundColor: THEME.badgeBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.textSecondary,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.textPrimary,
    lineHeight: 20,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageText: {
    fontSize: 11,
    color: THEME.textMuted,
  },
  actionHint: {
    fontSize: 11,
    color: THEME.textSecondary,
    fontStyle: 'italic',
  },
});

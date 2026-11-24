// src/components/VideoPlayerModal.js
import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { THEME } from '../constants/config';

export const VideoPlayerModal = ({ visible, match, onClose }) => {
  const [playing, setPlaying] = useState(true);
  const [loading, setLoading] = useState(true);

  const onStateChange = useCallback((state) => {
    if (state === 'ended') {
      setPlaying(false);
    }
  }, []);

  const onReady = useCallback(() => {
    setLoading(false);
  }, []);

  if (!match) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={styles.container}>
        {/* Barra superior de controle */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>✕ Fechar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {match.liga}
          </Text>
        </View>

        {/* Player Nativo com react-native-youtube-iframe */}
        <View style={styles.playerWrapper}>
          {loading && (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={THEME.accentGreen} />
              <Text style={styles.loadingPlayerText}>Carregando player nativo...</Text>
            </View>
          )}
          <YoutubePlayer
            height={230}
            play={playing}
            videoId={match.id_video}
            onChangeState={onStateChange}
            onReady={onReady}
            webViewProps={{
              allowsFullscreenVideo: true,
              androidLayerType: 'hardware',
            }}
          />
        </View>

        {/* Informações da Partida */}
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{match.titulo}</Text>

          <View style={styles.metaRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{match.categoria}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🌐 {match.idioma}</Text>
            </View>
            <View style={[styles.badge, styles.liveBadge]}>
              <Text style={styles.liveBadgeText}>AO VIVO</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#0D1117',
    borderBottomWidth: 1,
    borderBottomColor: THEME.surfaceBorder,
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: THEME.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.surfaceBorder,
  },
  closeButtonText: {
    color: THEME.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textSecondary,
  },
  playerWrapper: {
    width: '100%',
    height: 230,
    backgroundColor: '#000000',
    justifyContent: 'center',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    zIndex: 1,
  },
  loadingPlayerText: {
    color: THEME.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
  infoContainer: {
    padding: 16,
    backgroundColor: THEME.background,
    flex: 1,
  },
  title: {
    color: THEME.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    backgroundColor: THEME.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.surfaceBorder,
  },
  badgeText: {
    color: THEME.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  liveBadge: {
    borderColor: THEME.accentGreen,
  },
  liveBadgeText: {
    color: THEME.accentGreen,
    fontSize: 11,
    fontWeight: '700',
  },
});

// src/utils/openYouTube.js
import { Linking, Alert } from 'react-native';

/**
 * Abre o vídeo no aplicativo oficial do YouTube no Android.
 * Se o app não estiver instalado, realiza fallback seguro para o navegador web.
 * 
 * @param {string} videoId - ID do vídeo no YouTube
 * @param {string} directUrl - URL completa de fallback (ex: https://www.youtube.com/watch?v=...)
 */
export async function openYouTubeApp(videoId, directUrl) {
  const appUrl = `vnd.youtube://${videoId}`;
  const webUrl = directUrl || `https://www.youtube.com/watch?v=${videoId}`;

  try {
    const canOpen = await Linking.canOpenURL(appUrl);
    if (canOpen) {
      await Linking.openURL(appUrl);
    } else {
      await Linking.openURL(webUrl);
    }
  } catch (err) {
    console.warn('[Linking] Fallback para web devido a:', err.message);
    try {
      await Linking.openURL(webUrl);
    } catch (fallbackErr) {
      console.error('[Linking] Falha crítica ao abrir link:', fallbackErr);
      Alert.alert('Erro', 'Não foi possível abrir a transmissão no YouTube.');
    }
  }
}

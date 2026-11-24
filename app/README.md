# ⚽ Futebol Ao Vivo - App Mobile (Android / Expo)

Aplicativo Android minimalista e de alta performance em **React Native com Expo**, focado em exibir jogos de futebol ao vivo catalogados automaticamente.

---

## 🎯 Requisitos Implementados

1. **Consumo de `partidas.json`**:
   - Conecta-se à URL remota configurável (`src/constants/config.js` ou via `EXPO_PUBLIC_PARTIDAS_URL`).
   - Possui fallback offline automático (`src/assets/fallback_partidas.json`) garantindo que o app sempre abra instantaneamente sem telas em branco.
2. **FlatList Categorizada**:
   - Seletor de categorias dinâmico no topo (`Todos`, `Profissional`, `Sub-20`, `Sub-17`, `Feminino`, `Ligas Menores`, `Várzea/Amador`).
   - Memoização com `React.memo` e props de alta performance (`removeClippedSubviews`, `initialNumToRender={4}`, `maxToRenderPerBatch={5}`, `windowSize={5}`).
3. **Player Nativo (`permite_embed: true`)**:
   - Abre modal nativo com `react-native-youtube-iframe`, com suporte a hardware acceleration e controles otimizados.
4. **Linking para o YouTube App (`permite_embed: false`)**:
   - Dispara `openYouTubeApp` via `Linking` para o schema nativo `vnd.youtube://<ID>`, caindo no app oficial do YouTube no celular (com fallback para o navegador).
5. **Dark Mode AMOLED & Zero Processamento Pesado**:
   - Interface em tons escuros puros (`#0B0E14`), economizando bateria de telas OLED/AMOLED.
   - Cache de thumbnails com `expo-image` direto da CDN do YouTube (`memory-disk`), sem retenção desnecessária de arquivos no dispositivo.

---

## 🚀 Como Iniciar o App

Você pode iniciar o app de duas formas:

### Opção 1: Clicar no Executável
- Dê dois cliques no arquivo `iniciar-mobile.bat` na raiz do projeto.

### Opção 2: Pelo Terminal
```bash
cd mobile
npx expo start
```
Aponte a câmera do seu celular Android com o app **Expo Go** para o QR Code exibido no terminal.

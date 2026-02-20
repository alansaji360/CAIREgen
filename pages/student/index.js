'use client'; // Force client-side rendering

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Slide } from 'react-slideshow-image';
import 'react-slideshow-image/dist/styles.css';
import Draggable from 'react-draggable';

// Constants
const AVATAR_ID = 'Pedro_CasualLook_public';
const VOICE_IDS = {
  en: '8661cd40d6c44c709e2d0031c0186ada', // English Voice ID
  es: '5bcbd1ab129c442683e5fa9ba17a7e0d', // Spanish Voice ID
  fr: '57d7ad91fcdb41b49f3475b0bfd95034', // French Voice ID
  zh: '735c507fdc844be3b1528dd33f7dfb2a', // Chinese Voice ID
  ar: '46daee8d4d0042b184a6ce903014ac18', // Arabic Voice ID
};

const AVATAR_CONFIGS = {
  'avatar1': { id: 'Pedro_CasualLook_public', name: 'Professional' },
  'avatar2': { id: 'Anna_public_20240108', name: 'Friendly' },
  'avatar3': { id: 'josh_lite3_20230714', name: 'Creative' },
  'avatar4': { id: 'Pedro_CasualLook_public', name: 'Tech' }
};

const TRANSLATIONS = {
  en: {
    startAvatar: 'Start Avatar',
    resetAvatar: 'Reset Avatar',
    connectAvatar: 'Connect Avatar',
    disconnectAvatar: 'Disconnect Avatar',
    prevSlide: 'Go to the previous slide',
    nextSlide: 'Go to the next slide',
    startPresentation: 'Start Presentation',
    resumeNarration: 'Resume narration',
    pauseNarration: 'Pause narration',
    fullscreenEnter: 'Enter fullscreen mode for slides',
    fullscreenExit: 'Exit fullscreen mode',
    askPlaceholder: 'Ask a question...',
    askTitle: 'Type a question to ask during the presentation',
    submitQuestion: 'Submit your question to the avatar',
    clearLog: 'Clear the log messages',
    volumeTitle: 'Set speaker volume',
    instructions: 'Instructions:',
    instrStep1: 'Click',
    instrStep1Action: 'Start Avatar',
    instrStep1End: 'to connect.',
    instrStep2: 'Wait for "Ready".',
    instrStep3: 'Click',
    instrStep3End: 'to begin the presentation.',
    loading: 'Loading',
    ready: 'Ready',
    pressStart: 'Press Start',
    loadingScript: 'Loading Script...',
    readyStart: 'Ready to Start',
    notReady: 'Not Ready - Start Avatar...',
    narrationLabel: 'Narration:',
    generatingNarration: 'Generating narration...',
    slideMenu: 'Slide Menu',
    generatingSummary: 'Generating summary...',
    slide: 'Slide',
    restarting: 'Restarting avatar to apply new voice...',
    languageChange: 'Language Changed',
    avatarUpdated: 'Avatar Updated',
    pressPlayContinue: 'Press ▶ to continue presentation.',
  },
  es: {
    startAvatar: 'Iniciar Avatar',
    resetAvatar: 'Reiniciar Avatar',
    connectAvatar: 'Conectar Avatar',
    disconnectAvatar: 'Desconectar Avatar',
    prevSlide: 'Diapositiva anterior',
    nextSlide: 'Siguiente diapositiva',
    startPresentation: 'Iniciar Presentación',
    resumeNarration: 'Reanudar narración',
    pauseNarration: 'Pausar narración',
    fullscreenEnter: 'Pantalla completa',
    fullscreenExit: 'Salir de pantalla completa',
    askPlaceholder: 'Haz una pregunta...',
    askTitle: 'Escribe una pregunta para el avatar',
    submitQuestion: 'Enviar pregunta',
    clearLog: 'Borrar registro',
    volumeTitle: 'Ajustar volumen',
    instructions: 'Instrucciones:',
    instrStep1: 'Haz clic en',
    instrStep1Action: 'Iniciar Avatar',
    instrStep1End: 'para conectar.',
    instrStep2: 'Espera a "Listo".',
    instrStep3: 'Haz clic en',
    instrStep3End: 'para comenzar.',
    loading: 'Cargando',
    ready: 'Listo',
    pressStart: 'Presiona Inicio',
    loadingScript: 'Cargando guion...',
    readyStart: 'Listo para empezar',
    notReady: 'No listo - Inicia el Avatar...',
    narrationLabel: 'Narración:',
    generatingNarration: 'Generando narración...',
    slideMenu: 'Menú de Diapositivas',
    generatingSummary: 'Generando resumen...',
    slide: 'Diapositiva',
    restarting: 'Reiniciando avatar para aplicar nueva voz...',
    languageChange: 'Idioma cambiado',
    avatarUpdated: 'Avatar Actualizado',
    pressPlayContinue: 'Presiona ▶ para continuar.',
  },
  fr: {
    startAvatar: 'Démarrer Avatar',
    resetAvatar: 'Réinitialiser',
    connectAvatar: 'Connecter Avatar',
    disconnectAvatar: 'Déconnecter',
    prevSlide: 'Précédent',
    nextSlide: 'Suivant',
    startPresentation: 'Démarrer',
    resumeNarration: 'Reprendre',
    pauseNarration: 'Pause',
    fullscreenEnter: 'Plein écran',
    fullscreenExit: 'Quitter',
    askPlaceholder: 'Posez une question...',
    askTitle: 'Tapez votre question',
    submitQuestion: 'Envoyer',
    clearLog: 'Effacer',
    volumeTitle: 'Volume',
    instructions: 'Instructions :',
    instrStep1: 'Cliquez',
    instrStep1Action: 'Démarrer Avatar',
    instrStep1End: 'pour connecter.',
    instrStep2: 'Attendez "Prêt".',
    instrStep3: 'Cliquez',
    instrStep3End: 'pour débuter.',
    loading: 'Chargement',
    ready: 'Prêt',
    pressStart: 'Démarrer',
    loadingScript: 'Chargement...',
    readyStart: 'Prêt à démarrer',
    notReady: 'Pas prêt',
    narrationLabel: 'Narration :',
    generatingNarration: 'Génération...',
    slideMenu: 'Menu',
    generatingSummary: 'Génération...',
    slide: 'Diapositive',
    restarting: 'Redémarrage de l\'avatar pour appliquer la nouvelle voix...',
    languageChange: 'Langue changée',
    avatarUpdated: 'Avatar Mis à jour',
    pressPlayContinue: 'Appuyez sur ▶ pour continuer.',
  },
  zh: {
    startAvatar: '启动数字人',
    resetAvatar: '重置',
    connectAvatar: '连接',
    disconnectAvatar: '断开',
    prevSlide: '上一页',
    nextSlide: '下一页',
    startPresentation: '开始演示',
    resumeNarration: '继续',
    pauseNarration: '暂停',
    fullscreenEnter: '全屏',
    fullscreenExit: '退出全屏',
    askPlaceholder: '提问...',
    askTitle: '输入问题',
    submitQuestion: '提交',
    clearLog: '清除日志',
    volumeTitle: '音量',
    instructions: '说明：',
    instrStep1: '点击',
    instrStep1Action: '启动数字人',
    instrStep1End: '连接。',
    instrStep2: '等待“就绪”。',
    instrStep3: '点击',
    instrStep3End: '开始。',
    loading: '加载中',
    ready: '就绪',
    pressStart: '开始',
    loadingScript: '加载脚本...',
    readyStart: '准备就绪',
    notReady: '未就绪',
    narrationLabel: '解说：',
    generatingNarration: '生成中...',
    slideMenu: '菜单',
    generatingSummary: '生成摘要...',
    slide: '幻灯片',
    restarting: '正在重启数字人以应用新声音...',
    languageChange: '语言已更改',
    avatarUpdated: '数字人已更新',
    pressPlayContinue: '按 ▶ 继续演示。',
  },
  ar: {
    startAvatar: 'بدء الأفاتار',
    resetAvatar: 'إعادة تعيين',
    connectAvatar: 'توصيل الأفاتار',
    disconnectAvatar: 'قطع الاتصال',
    prevSlide: 'الشريحة السابقة',
    nextSlide: 'الشريحة التالية',
    startPresentation: 'بدء العرض',
    resumeNarration: 'استئناف',
    pauseNarration: 'إيقاف مؤقت',
    fullscreenEnter: 'ملء الشاشة',
    fullscreenExit: 'خروج',
    askPlaceholder: 'اطرح سؤالاً...',
    askTitle: 'اكتب سؤالاً',
    submitQuestion: 'إرسال',
    clearLog: 'مسح السجل',
    volumeTitle: 'مستوى الصوت',
    instructions: 'التعليمات:',
    instrStep1: 'انقر',
    instrStep1Action: 'بدء الأفاتار',
    instrStep1End: 'للاتصال.',
    instrStep2: 'انتظر "جاهز".',
    instrStep3: 'انقر',
    instrStep3End: 'للبدء.',
    loading: 'جار التحميل',
    ready: 'جاهز',
    pressStart: 'ابدأ',
    loadingScript: 'جار التحميل...',
    readyStart: 'جاهز للبدء',
    notReady: 'غير جاهز',
    narrationLabel: 'السرد:',
    generatingNarration: 'جار الإنشاء...',
    slideMenu: 'القائمة',
    generatingSummary: 'جار التلخيص...',
    slide: 'شريحة',
    restarting: 'جاري إعادة تشغيل الأفاتار لتطبيق الصوت الجديد...',
    languageChange: 'تم تغيير اللغة',
    avatarUpdated: 'تم تحديث الأفاتار',
    pressPlayContinue: 'اضغط على ▶ لمتابعة العرض.',
  }
};

const SAMPLE_SLIDE_DATA = [
  { image: 'https://example.com/slide1.jpg', topic: 'Sample', content: 'Sample Slide', alt: 'Slide 1' }
];

// Styles
const styles = {
  container: {
    padding: '2rem',
    fontFamily: 'var(--font-figtree), Arial, sans-serif',
    maxWidth: '2000px',
    margin: 'auto',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-start',
    gap: '20px',
    background: 'linear-gradient(135deg, #f6f8fa 0%, #e9ecef 100%)',
    borderRadius: '15px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
  },
  controlsContainer: {
    width: '100%',
    maxWidth: '2000px',
    margin: '2rem auto 0 auto',
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    backgroundColor: '#f6f7faff',
    padding: '1rem',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  },
  fullWidthControls: {
    width: '100%',
    maxWidth: '1974px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  slideshowBox: {
    width: '1494px',
    height: '840px',
    borderRadius: '15px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    background: 'linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%)',
    flexShrink: 0,
    overflow: 'auto',
    position: 'relative',
    transition: 'all 0.3s ease',
  },
  slideshowBoxFullscreen: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%)',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 0,
    boxShadow: 'none',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
  },
  slideContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: '1rem',
    boxSizing: 'border-box',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  slideImageSection: {
    flex: '1 1 0%',
    minHeight: 0,
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  slideImage: {
    display: 'block',     // Removes extra bottom whitespace
    maxWidth: '75%',     // Don't get wider than the box
    maxHeight: '75%',    // Don't get taller than the image section
    width: 'auto',        // Maintain aspect ratio
    height: 'auto',       // Maintain aspect ratio
    objectFit: 'contain', // The "Magic" property: fits the whole image inside
    borderRadius: '10px',
    transition: 'transform 0.3s ease',
  },
  slideNarration: {
    flex: '0 0 auto', // Don't let the text grow into the image's space
    maxHeight: '150px', // Prevent text from eating the whole slide
    width: '90%',
    fontSize: '1rem',
    fontStyle: 'italic',
    color: '#000',
    backgroundColor: '#e9ecef',
    padding: '1rem',
    borderRadius: '8px',
    textAlign: 'center',
    overflowY: 'auto', // Scrollbar if the script is long
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
  },
  controls: {
    marginTop: '1.25rem',
  },
  button: {
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    padding: '10px 22px',
    marginRight: '12px',
    marginTop: '12px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1rem',
    transition: 'background 0.3s, transform 0.2s',
    fontFamily: 'var(--font-figtree), sans-serif',
  },
  input: {
    width: '370px',
    padding: '10px',
    fontSize: '1rem',
    borderRadius: '5px',
    border: '1px solid #ddd',
    marginRight: '12px',
    outline: 'none',
    transition: 'border 0.3s',
  },
  slider: {
    display: 'inline-flex', 
    alignItems: 'center', 
    backgroundColor: '#b4b4b4ff', 
    // justifyContent: 'center',
    borderRadius: '5px',
    padding: '0 10px',
    height: '42px',
    transition: 'all 0.3s ease',
    overflow: 'hidden',
    marginRight: '12px',
    marginTop: '12px',
    cursor: 'pointer'
  },
  log: {
    marginTop: '1.5rem',
    backgroundColor: '#e9edf1ff',
    borderRadius: '8px',
    padding: '1rem',
    height: '160px',
    overflowY: 'auto',
    textAlign: 'left',
    fontFamily: 'var(--font-figtree), monospace',
    fontSize: '0.96rem',
    color: '#333',
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  avatarOverlayWrapperSmall: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    width: '150px',
    zIndex: 10,
    cursor: 'pointer',
    transition: 'width 0.3s ease',
  },
  avatarOverlayWrapperLarge: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    width: '200px',
    zIndex: 10,
    cursor: 'pointer',
    transition: 'width 0.3s ease',
  },
  avatarRatioBox: {
    position: 'relative',
    width: '100%',
    paddingTop: '175%',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    border: '2px solid #f0f0f0',
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
  },
  avatarVideoFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    backgroundColor: '#000',
  },
  deckInfo: {
    padding: '1rem',
    backgroundColor: '#f6f7faff',
    borderRadius: '8px',
    border: '1px solid #eee',
    marginBottom: '1rem',
    textAlign: 'center',
    fontFamily: 'var(--font-figtree), Arial, sans-serif',
  },
  loadingScreen: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontFamily: 'var(--font-figtree), Arial',
    fontSize: '18px',
    background: 'linear-gradient(135deg, #f6f8fa 0%, #e9ecef 100%)',
  },
  errorScreen: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontFamily: 'var(--font-figtree), Arial',
    fontSize: '18px',
    background: 'linear-gradient(135deg, #f6f8fa 0%, #e9ecef 100%)',
  },
  indicatorContainer: {
    marginTop: '1rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#fff',
    fontFamily: 'var(--font-figtree), Arial',
    fontWeight: 'bold',
    fontSize: '1.1rem',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'transform 0.3s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  ready: {
    backgroundColor: '#28a745',
  },
  connecting: {
    backgroundColor: '#17a2b8',
    cursor: 'wait',
  },
  generating: {
    backgroundColor: '#ffc107',
  },
  banner: {
    width: '100%',
    backgroundColor: '#e3f2fd',
    color: '#0d47a1',
    padding: '12px',
    textAlign: 'center',
    marginBottom: '1rem',
    borderRadius: '8px',
    border: '1px solid #90caf9',
    fontSize: '1rem',
  },
  notReady: {
    backgroundColor: '#6d7d6cff',
  },
  shortcutsBanner: {
    marginTop: '1rem',
    padding: '0.5rem',
    backgroundColor: '#e9ecef',
    borderRadius: '5px',
    fontSize: '0.85rem',
    color: '#666',
    textAlign: 'center',
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #ddd',
    fontFamily: 'monospace',
  },
};


// Loading Component
const LoadingScreen = () => (
  <div style={styles.loadingScreen}>
    <div style={{ fontSize: '48px', marginBottom: '1rem' }}>⏳</div>
    <div>Loading presentation...</div>
  </div>
);

// Error Component
const ErrorScreen = ({ error }) => (
  <div style={styles.errorScreen}>
    <h2>❌ {error}</h2>
    <p>The presentation link may be invalid or expired.</p>
    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
      <button
        onClick={() => window.location.reload()}
        style={{
          padding: '10px 22px',
          backgroundColor: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '1rem',
        }}
      >
        Reload Page
      </button>
    </div>
  </div>
);

const darkenColor = (hexColor, factor = 0.8) => {
  if (!hexColor || typeof hexColor !== 'string') {
    return;
  }

  hexColor = hexColor.replace('#', '');
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);

  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r / 255: h = (g / 255 - b / 255) / d + (g / 255 < b / 255 ? 6 : 0); break;
      case g / 255: h = (b / 255 - r / 255) / d + 2; break;
      case b / 255: h = (r / 255 - g / 255) / d + 4; break;
    }
    h /= 6;
  }

  l = Math.max(0, l * factor);

  const rgbToHex = (c) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  if (s === 0) {
    const val = Math.round(l * 255);
    return `#${rgbToHex(val / 255)}${rgbToHex(val / 255)}${rgbToHex(val / 255)}`;
  }

  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const red = hue2rgb(p, q, h + 1 / 3);
  const green = hue2rgb(p, q, h);
  const blue = hue2rgb(p, q, h - 1 / 3);

  return `#${rgbToHex(red)}${rgbToHex(green)}${rgbToHex(blue)}`;
};

const Controls = ({
  onClearLog,
  onRegenerate,
  onTogglePause,
  isPaused,
  onStartPresentation,
  isPresenting,
  onNextSlide,
  onPrevSlide,
  currentSlide,
  totalSlides,
  selectedLanguage,
  onLanguageChange,
  onAskQuestion,
  questionText,
  setQuestionText,
  onToggleFullscreen,
  isFullscreen,
  onSkipIntro,
  isAvatarReady,
  introPlaying,
  volume,
  setVolume
}) => {

  const [showVolume, setShowVolume] = useState(false);

  const t = TRANSLATIONS[selectedLanguage] || TRANSLATIONS.en;

  const darkenColor = (hexColor, factor = 0.8) => {
    if (!hexColor || typeof hexColor !== 'string') {
      return;
    }

    hexColor = hexColor.replace('#', '');
    const r = parseInt(hexColor.substring(0, 2), 16);
    const g = parseInt(hexColor.substring(2, 4), 16);
    const b = parseInt(hexColor.substring(4, 6), 16);

    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r / 255: h = (g / 255 - b / 255) / d + (g / 255 < b / 255 ? 6 : 0); break;
        case g / 255: h = (b / 255 - r / 255) / d + 2; break;
        case b / 255: h = (r / 255 - g / 255) / d + 4; break;
      }
      h /= 6;
    }

    l = Math.max(0, l * factor);

    const rgbToHex = (c) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    if (s === 0) {
      const val = Math.round(l * 255);
      return `#${rgbToHex(val / 255)}${rgbToHex(val / 255)}${rgbToHex(val / 255)}`;
    }

    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    const red = hue2rgb(p, q, h + 1 / 3);
    const green = hue2rgb(p, q, h);
    const blue = hue2rgb(p, q, h - 1 / 3);

    return `#${rgbToHex(red)}${rgbToHex(green)}${rgbToHex(blue)}`;
  };

  const handleMouseEnter = (e, originalColor) => {
    e.currentTarget.style.transform = 'scale(1.05)';
    e.currentTarget.style.backgroundColor = darkenColor(originalColor, 0.8);
    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
  };

  const handleMouseLeave = (e, originalColor) => {
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.backgroundColor = originalColor;
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div style={styles.controls}>

      <button
        style={{ ...styles.button, backgroundColor: isAvatarReady ? '#dc3545' : '#28a745' }}
        onClick={onStartPresentation}
        title={isAvatarReady ? t.disconnectAvatar : t.connectAvatar}
        onMouseEnter={(e) => handleMouseEnter(e, isAvatarReady ? '#dc3545' : '#28a745')}
        onMouseLeave={(e) => handleMouseLeave(e, isAvatarReady ? '#dc3545' : '#28a745')}
      >
        {isAvatarReady ? t.resetAvatar : t.startAvatar}
      </button>

      <button
        style={{ ...styles.button, backgroundColor: '#cfd5dfff' }}
        onClick={onPrevSlide}
        disabled={!isPresenting || currentSlide === 0 || !isAvatarReady}
        title={t.prevSlide}
        onMouseEnter={(e) => handleMouseEnter(e, '#cfd5dfff')}
        onMouseLeave={(e) => handleMouseLeave(e, '#cfd5dfff')}
      >
        🡰
      </button>

      <button
        style={{ ...styles.button, backgroundColor: (!isPresenting || isPaused) ? '#28a745' : '#ffc107' }}
        onClick={onTogglePause}
        disabled={!isAvatarReady}
        title={!isPresenting ? t.startPresentation : (isPaused ? t.resumeNarration : t.pauseNarration)}
        onMouseEnter={(e) => handleMouseEnter(e, (!isPresenting || isPaused) ? '#28a745' : '#ffc107')}
        onMouseLeave={(e) => handleMouseLeave(e, (!isPresenting || isPaused) ? '#28a745' : '#ffc107')}
      >
        {!isPresenting || isPaused ? '▶' : '⏸︎'}
      </button>

      <button
        style={{ ...styles.button, backgroundColor: '#cfd5dfff' }}
        onClick={onNextSlide}
        disabled={!isPresenting || currentSlide === totalSlides - 1 || !isAvatarReady}
        title={t.nextSlide}
        onMouseEnter={(e) => handleMouseEnter(e, '#cfd5dfff')}
        onMouseLeave={(e) => handleMouseLeave(e, '#cfd5dfff')}
      >
        🡲
      </button>

      <button
        style={{ ...styles.button, backgroundColor: '#9caac0ff' }}
        onClick={onToggleFullscreen}
        title={isFullscreen ? t.fullscreenExit : t.fullscreenEnter}
        onMouseEnter={(e) => handleMouseEnter(e, '#9caac0ff')}
        onMouseLeave={(e) => handleMouseLeave(e, '#9caac0ff')}
      >
        ⛶
      </button>

      <select
        value={selectedLanguage}
        onChange={onLanguageChange}
        style={{ ...styles.input, width: 'auto', marginRight: '10px' }}
        title="Select narration language"
      >
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="fr">French</option>
        <option value="zh">Chinese</option>
        <option value="ar">Arabic</option>
      </select>
      <input
        type="text"
        value={questionText}
        onChange={(e) => setQuestionText(e.target.value)}
        placeholder={t.askPlaceholder}
        style={{ ...styles.input, width: '250px' }}
        // disabled={!isPresenting}
        title={t.askTitle}
      />
      <button
        style={{ ...styles.button, backgroundColor: '#e01f1fff' }}
        onClick={onAskQuestion}
        // disabled={!isPresenting || !questionText.trim()}
        title={t.submitQuestion}
        onMouseEnter={(e) => handleMouseEnter(e, '#e01f1fff')}
        onMouseLeave={(e) => handleMouseLeave(e, '#e01f1fff')}
      >
        ?
      </button>

      <button
        style={{ ...styles.button, backgroundColor: '#5f5f5fff' }}
        onClick={onClearLog}
        title={t.clearLog}
        onMouseEnter={(e) => handleMouseEnter(e, '#5f5f5fff')}
        onMouseLeave={(e) => handleMouseLeave(e, '#5f5f5fff')}
      >
        🗑️
      </button>

      <div 
        style={{...styles.slider, backgroundColor: '#818181ff', width: showVolume ? '145px' : '45px'}}
        title={t.volumeTitle}
        onMouseEnter={() => setShowVolume(true)}
        onMouseLeave={() => setShowVolume(false)}
      >
        <span style={{ fontSize: '1.2rem', color: 'white' }}>
          {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
        </span>
        
        {showVolume && (
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            style={{ 
              marginLeft: '10px', 
              width: '100px',
              cursor: 'pointer' 
            }}
          />
        )}
      </div>

    </div>
  );
};

const LogViewer = ({ logs }) => (
  <div style={styles.log}>
    {logs.map((line, i) => <div key={i}>{line}</div>)}
  </div>
);

const AvatarOverlay = ({ videoRef, isExpanded, onToggleExpand }) => {
  const wrapperStyle = isExpanded ? styles.avatarOverlayWrapperLarge : styles.avatarOverlayWrapperSmall;
  return (
    <Draggable bounds="parent">
      <div style={wrapperStyle} onDoubleClick={onToggleExpand} title="Double-click to expand/collapse">
        <div style={styles.avatarRatioBox}>
          <video ref={videoRef} autoPlay playsInline style={styles.avatarVideoFill} />
        </div>
      </div>
    </Draggable>
  );
};

const SlideshowNarrator = ({ slideData, narrationScript, currentSlide, setCurrentSlide, slideshowRef, slideRef, videoRef, isAvatarExpanded, onToggleAvatarExpanded, isFullscreen, selectedLanguage }) => {
  const t = TRANSLATIONS[selectedLanguage] || TRANSLATIONS.en;
  
  return (
  <div ref={slideshowRef} style={isFullscreen ? styles.slideshowBoxFullscreen : styles.slideshowBox}>
    <div style={{ width: '100%', height: '100%', position: 'relative' }}> {/* New wrapper for full sizing */}
      <Slide
        ref={slideRef}
        duration={0}
        transitionDuration={500}
        infinite={false}
        indicators={true}
        arrows={false}
        pauseOnHover={false}
        cssClass="slideshow-container"
        autoplay={false}
        canSwipe={false}
        defaultIndex={currentSlide}
        // key={currentSlide + narrationScript.length}
        style={{ height: '100%', width: '100%' }}
        onChange={(oldIndex, newIndex) => setCurrentSlide(newIndex)}
        key={slideData.length} // Simplified key to prevent unneeded re-mounts
        containerStyle={{ height: '100%', width: '100%' }}
      >
        {slideData.map((slide, index) => (
          <div key={`slide-${index}`} style={styles.slideContainer}>
            {slide.image ? (
              <div style={styles.slideImageSection}>
                <img
                  src={slide.image}
                  alt={slide.alt}
                  style={styles.slideImage}
                  onError={(e) => {
                    console.log(`Failed to load slide image: ${slide.image}`);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div style={styles.slideImageSection}>
                <h2 style={styles.slideTitle}>{slide.topic}</h2>
                {slide.content && <p style={styles.slideContent}>{slide.content}</p>}
              </div>
            )}
            <div style={styles.slideNarration}>
              <strong>{t.narrationLabel}</strong> {narrationScript[index] || t.generatingNarration}
            </div>
          </div>
        ))}
      </Slide>
      <AvatarOverlay videoRef={videoRef} isExpanded={isAvatarExpanded} onToggleExpand={onToggleAvatarExpanded} />
    </div>
  </div>);
};

const SlideMenu = ({ slideData, slideSummaries, currentSlide, goToSlide, selectedLanguage }) => {
  const t = TRANSLATIONS[selectedLanguage] || TRANSLATIONS.en;
  
  return (
  <div style={{ width: '300px', height: '840px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #ccc', backgroundColor: '#f0f0f0', overflowY: 'auto', padding: '1rem', flexShrink: 0, marginLeft: '20px' }}>
    <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>{t.slideMenu}</h3>
    {slideData.map((slide, index) => (
      <div key={`menu-${index}`} onClick={() => goToSlide(index)} style={{ padding: '1rem', marginBottom: '0.5rem', backgroundColor: currentSlide === index ? '#0070f3' : '#fff', color: currentSlide === index ? '#fff' : '#333', borderRadius: '5px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'background 0.3s' }}>
        <strong>{t.slide} {index + 1}: {slide.topic}</strong>
        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>{slideSummaries[index] || t.generatingSummary}</p>
      </div>
    ))}
  </div>);
};

const DeckInfo = ({ deckData }) => (
  <div style={styles.deckInfo}>
    <h3 style={{ margin: '0 0 0.5rem 0', color: '#0070f3' }}>📊 {deckData.title}</h3>
    <p style={{ margin: '0', color: '#666' }}>
      Avatar: {AVATAR_CONFIGS[deckData.avatar]?.name || 'Default'} |
      Created: {new Date(deckData.createdAt).toLocaleDateString()} |
      Slides: {deckData.slides?.length || 0}
    </p>
  </div>
);

// Main Home Component
export default function Home() {
  const router = useRouter();

  // ===== ALL HOOKS DECLARED FIRST =====
  const videoRef = useRef(null);
  const avatarRef = useRef(null);
  const slideRef = useRef(null);
  const slideshowRef = useRef(null);
  const fullscreenRef = useRef(null);
  const [isAvatarReady, setisAvatarReady] = useState(false);
  const [logs, setLogs] = useState([]);
  const [narrationScript, setNarrationScript] = useState([]);
  const [slideData, setSlideData] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [questionText, setQuestionText] = useState('');
  const [slideSummaries, setSlideSummaries] = useState([]);
  const [isAvatarExpanded, setIsAvatarExpanded] = useState(false);
  const [deckData, setDeckData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentAvatarId, setCurrentAvatarId] = useState(AVATAR_ID);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const generatingRef = useRef(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isReady, setIsReady] = useState(false); // tra<cks if script is fully generated
  const [isAnsweringQuestion, setIsAnsweringQuestion] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isRestarting, setIsRestarting] = useState(false);
  const [showRestartBanner, setShowRestartBanner] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const t = TRANSLATIONS[selectedLanguage] || TRANSLATIONS.en;

  const appendLog = useCallback((msg) => {
    setLogs((l) => {
      const timestamped = `[${new Date().toLocaleTimeString()}] ${msg}`;
      if (l.length > 0 && l[l.length - 1] === timestamped) return l;
      return [...l, timestamped];
    });
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      fullscreenRef.current?.requestFullscreen().catch((err) => {
        appendLog(`Fullscreen error: ${err.message}`);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        appendLog(`Exit fullscreen error: ${err.message}`);
      });
    }
  }, [appendLog]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (document.fullscreenElement) {
        window.dispatchEvent(new Event('resize'));
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const fetchToken = useCallback(async () => {
    try {
      const res = await fetch('/api/heygen/get-access-token', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      return data.token;
    } catch (error) {
      appendLog(error);
    }
  }, [appendLog]);

  const loadStoredNarrations = useCallback(async () => {
    const deckId = router.query.deck;
    if (!deckId || !slideData?.length) return;
    setIsGenerating(true);
    try {
      const params = new URLSearchParams({
        deckId,
        language: selectedLanguage || '', 
        includeSlide: 'false',
      });

      const res = await fetch(`/api/prisma/narration?${params.toString()}`);
      
      if (!res.ok) throw new Error(`Failed to fetch narrations (${res.status})`);
      const { narrations } = await res.json();

      const activeBySlideId = new Map();
      for (const n of narrations) {
        if (n.isActive) activeBySlideId.set(n.slideId, n.text);
      }

      const ordered = narrations.map(n => n.text)
      setNarrationScript(ordered);
      setSlideSummaries(ordered.map(t => (t || '').slice(0, 100) + '...'));
      setHasGenerated(true);
    } catch (e) {
      appendLog(`Narration load error: ${e.message}`);
      const fallback = slideData.map(() => 'Narration not available.');
      setNarrationScript(fallback);
      setSlideSummaries(fallback.map(() => ''));
    } finally {
      setIsGenerating(false);
    }
  }, [slideData, selectedLanguage, appendLog]);
  
  useEffect(() => {
    if (slideData?.length) loadStoredNarrations();
  }, [slideData, selectedLanguage, loadStoredNarrations]);


  useEffect(() => {
    if (narrationScript.length === slideData.length && hasGenerated && !isGenerating) {
      setIsReady(true);
    } else {
      setIsReady(false);
    }
  }, [narrationScript.length, slideData.length, hasGenerated, isGenerating, appendLog]);

  const speak = useCallback((scriptText) => {
    if (!avatarRef.current || !isAvatarReady || !scriptText) return;
    avatarRef.current.speak({ text: scriptText, task_type: "repeat" });
  }, [isAvatarReady, appendLog]);

  const goToSlide = useCallback((slideIndex) => {
    if (slideIndex < 0 || slideIndex >= slideData.length) return;
    
    // Interrupt previous speech
    if (avatarRef.current && isAvatarReady) {
      avatarRef.current.interrupt();
    }

    // Update State
    setCurrentSlide(slideIndex);

    // Tell the library to move (only if the state change didn't come FROM the library)
    if (slideRef.current) {
      slideRef.current.goTo(slideIndex);
    }

    // Handle Narration
    if (isPresenting && narrationScript[slideIndex] && isAvatarReady && !isPaused) {
      speak(narrationScript[slideIndex]);
    }
  }, [slideData.length, isPresenting, narrationScript, isAvatarReady, isPaused, speak]);
  
  const goToNextSlide = useCallback(() => {
    setCurrentSlide((prev) => {
      const nextIndex = prev + 1;
      if (nextIndex < slideData.length) {
        goToSlide(nextIndex);
        return prev; // goToSlide handles the state update
      } else {
        // Only log if we were actually presenting and just finished
        if (isPresenting) {
          // appendLog('Presentation completed.');
          setIsPresenting(false);
        }
        return prev;
      }
    });
  }, [slideData.length, goToSlide, isPresenting, appendLog]);

  const goToPrevSlide = useCallback(() => {
    const prevIndex = currentSlide - 1;
    if (prevIndex >= 0) {
      goToSlide(prevIndex);
    }
  }, [currentSlide, goToSlide]);

  const pauseNarration = useCallback(() => {
    if (!avatarRef.current || !isAvatarReady) {
      appendLog('Avatar not ready for pause command');
      return;
    }
    try {
      avatarRef.current.interrupt();
      setIsPaused(true);
      appendLog('Paused');
    } catch (error) {
      appendLog(`Failed to pause narration: ${error.message}`);
    }
  }, [isAvatarReady, appendLog]);

  const resumeNarration = useCallback(() => {
    if (!avatarRef.current || !isAvatarReady) {
      appendLog('Avatar not ready for resume command');
      return;
    }
    if (narrationScript[currentSlide]) {
      speak(narrationScript[currentSlide]);
      setIsPaused(false);
      appendLog('Resumed');
    }
  }, [isAvatarReady, currentSlide, narrationScript, speak, appendLog]);

  const handlePlayPause = useCallback(() => {
    if (!isPresenting) {
      if (!isAvatarReady) {
        appendLog('Please start the avatar first.');
        return;
      }
      setIsPresenting(true);
      setIsPaused(false);
    } else {
      if (isPaused) {
        resumeNarration();
      } else {
        pauseNarration();
      }
    }
  }, [isPresenting, isAvatarReady, isPaused, resumeNarration, pauseNarration, appendLog]);

  const clearLogs = useCallback(() => setLogs([]), []);

  const toggleAvatarExpanded = useCallback(() => setIsAvatarExpanded((prev) => !prev), []);

  const stopStream = useCallback(() => {
    if (!avatarRef.current) return;
    avatarRef.current.stopAvatar();
    avatarRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setisAvatarReady(false);
    setIsConnecting(false);
    setIsPresenting(false);
    setIsPaused(false);
    appendLog('Avatar stopped.');
  }, [appendLog]);

  // EFFECT: Auto-stop stream on unmount
  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  const startStream = useCallback(async (retries = 1) => {
    if (avatarRef.current) {
      return;
    }
    if (!isReady) { // Block stream start until script is ready
      appendLog("Avatar not ready.");
      return;
    }

    setIsConnecting(true);
    setisAvatarReady(false);
    try {
      const token = await fetchToken();
      const { default: StreamingAvatar, AvatarQuality, StreamingEvents } = await import('@heygen/streaming-avatar');
      const avatar = new StreamingAvatar({ token, debug: true });
      avatarRef.current = avatar;

      avatar.on(StreamingEvents.ICE_CONNECTION_STATE_CHANGE, (state) => appendLog(`ICE connection state changed: ${state}`));
      avatar.on(StreamingEvents.STREAM_READY, (event) => {
        const stream = event.detail;
        if (stream) {
        } else {
          appendLog('Stream is null or undefined!');
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((err) => appendLog(`Video play error: ${err.message}`));
          setIsConnecting(false);
          return;
        }
        setisAvatarReady(true);
        setIsConnecting(false);
      });
      avatar.on(StreamingEvents.STREAM_DISCONNECTED, (e) => {
        appendLog(`Stream disconnected: ${e?.reason || 'Connection lost'}`);
        setisAvatarReady(false);
        setIsPresenting(false);
      });

      // avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
      //   if (isPresenting && currentSlide < slideData.length - 1) {
      //     setTimeout(() => goToNextSlide(), 1500);
      //   }
      // });

      avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        // functional updates or refs to ensure absolute latest index
        setCurrentSlide((prevIndex) => {
          if (isPresenting && prevIndex < slideData.length - 1) {
            // Only move forward if not at the end
            setTimeout(() => goToNextSlide(), 1500);
            return prevIndex; 
          } else if (prevIndex >= slideData.length - 1) {
            // at the end
            return prevIndex;
          }
          return prevIndex;
        });
      });

      await avatar.createStartAvatar({
        avatarName: currentAvatarId,
        voice: { voiceId: VOICE_IDS[selectedLanguage] || VOICE_IDS.en },
        language: VOICE_IDS[selectedLanguage] ? selectedLanguage : 'en',
        quality: AvatarQuality.Medium,
        activityIdleTimeout: 180,
      });

      appendLog('Avatar connected');
      setisAvatarReady(true);
      setIsConnecting(false);
    } catch (error) {
      console.error('Avatar creation error:', error);
      avatarRef.current = null;

      if (retries > 0) {
        appendLog(`Connection failed: ${error.message}. Retrying...`);
        setTimeout(() => startStream(retries - 1), 2000);
      } else {
        appendLog(`Failed to start avatar: ${error.message || 'Unknown error'}`);
        setisAvatarReady(false);
        setIsConnecting(false);
        setError('Avatar connection failed. Please refresh the page.');
      }
    }
  }, [fetchToken, currentAvatarId, selectedLanguage, appendLog, isReady, isPresenting, currentSlide, slideData.length, goToNextSlide]);

  const handleAvatarToggle = useCallback(() => {
    if (!isReady) { // Block if not ready
      appendLog('Avatar not ready.');
      return;
    }
    if (isAvatarReady) {
      stopStream();
    } else {
      startStream();
    }
  }, [isReady, isAvatarReady, startStream, stopStream, appendLog]);

  const handleLanguageChange = useCallback((e) => {
    const newLang = e.target.value;
    if (newLang === selectedLanguage) return;
    
    setSelectedLanguage(newLang);
    
    if (isAvatarReady) {
      appendLog(`Language changed to ${newLang}. Restarting avatar...`);
      setIsRestarting(true);
      setShowRestartBanner(true);
      stopStream();
    }
  }, [selectedLanguage, isAvatarReady, stopStream, appendLog]);

  useEffect(() => {
    if (isRestarting && isReady && !isAvatarReady) {
      setIsRestarting(false);
      startStream().then(() => {
      });
    }
  }, [isRestarting, isReady, isAvatarReady, startStream]);

  useEffect(() => {
    if (isPresenting) {
      goToSlide(0);
      setShowRestartBanner(false);
    }

    // appendLog('Presentation started');
  }, [isPresenting]);

  const askQuestion = useCallback(async () => {
    // if (!isAvatarReady || !isPresenting || !questionText.trim()) {
    //   appendLog('Cannot ask question: Avatar not ready or not presenting.');
    //   return;
    // }
    if (avatarRef.current) {
      avatarRef.current.interrupt();
      setIsPaused(true);
      appendLog('Lecture interrupted for question.');
    }
    appendLog(`Question asked: ${questionText}`);

    console.log('Deck ID (router.query.deck):', router.query.deck);
    console.log('Question Text:', questionText);
    console.log('Current Slide:', currentSlide);

    const storeQuestion = async () => {
      try {
        const response = await fetch('/api/prisma/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deckId: router.query.deck, text: questionText, slideId: currentSlide }),
        });

        const responseBody = await response.json();
        if (!response.ok) {
          console.error('Failed to store question:', response.status, responseBody);
          appendLog(`Failed to store question: ${response.status} ${responseBody.error || 'Unknown error'}`);
          return;
        }

        console.log('Question stored successfully:', responseBody);
        appendLog('Question stored in database');
      } catch (error) {
        console.error('Network error storing question:', error);
        appendLog(`Network error storing question: ${error.message}`);
      }
    };
    await storeQuestion();
    // return;
    try {
      const response = await fetch('/api/gemini/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionText,
          slideTopic: slideData[currentSlide]?.topic,
          slideContent: slideData[currentSlide]?.content,
          slideIndex: currentSlide + 1,
          language: selectedLanguage
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate answer');

      setIsAnsweringQuestion(true);
      speak(data.answer);
      setQuestionText('');
      setIsAnsweringQuestion(false);
    } catch (error) {
      appendLog(`Gemini error while answering: ${error.message}`);
      speak('Sorry, I encountered an error while trying to answer your question. Let\'s continue with the lecture.');
      resumeNarration();
      return;
    }
  }, [isAvatarReady, isPresenting, questionText, currentSlide, slideData, selectedLanguage, speak, resumeNarration, appendLog, router.query.deck]);

   useEffect(() => {
    const loadDeckData = async () => {
      const { deck: deckId } = router.query;

      if (deckId) {
        if (typeof deckId !== 'string' || deckId.trim() === '') {
          setError('Invalid presentation link');
          setLoading(false);
          return;
        }

        try {
          setLoading(true);
          const response = await fetch(`/api/prisma/${deckId}`);

          if (!response.ok) {
            setError('Failed to load presentation');
            setLoading(false);
            return;
          }

          const deck = await response.json();
          setDeckData(deck);

          let finalSlides = [];
          // check filURL
          if (deck.fileUrl) {
            try {
              const pdfjsLib = await import('pdfjs-dist');
              pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

              const pdf = await pdfjsLib.getDocument(deck.fileUrl).promise;
              const targetWidth = 1494; // SlideshowBox width

              for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 1 });
                const scale = Math.min(targetWidth / viewport.width, 2.0);
                const scaledViewport = page.getViewport({ scale });

                const canvas = document.createElement('canvas');
                canvas.width = scaledViewport.width;
                canvas.height = scaledViewport.height;
                const ctx = canvas.getContext('2d');

                await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
                
                finalSlides.push({
                  image: canvas.toDataURL('image/png'),
                  alt: `${deck.title} - Slide ${i}`,
                  topic: `Page ${i}`,
                  content: "" 
                });
              }
              appendLog('Slides Ready');
            } catch (pdfError) {
              console.error("PDF Parsing Error:", pdfError);
              appendLog(`❌ Error rendering PDF: ${pdfError.message}`);
            }
          } else {
            finalSlides = deck.slides.map((slide, index) => ({
              image: slide.image,
              alt: slide.alt || `Slide ${index + 1}`,
              topic: slide.topic,
              content: slide.content
            }));
          }

          setSlideData(finalSlides);

          const avatarConfig = AVATAR_CONFIGS[deck.avatar];
          if (avatarConfig) {
            setCurrentAvatarId(avatarConfig.id);
          }

        } catch (error) {
          appendLog(`Network error: ${error.message}`);
          setError('Network error - please try again');
        }
      } else if (router.isReady) {
        setSlideData(SAMPLE_SLIDE_DATA);
        appendLog('Using sample slide data');
      }
      setLoading(false);
    };

    if (router.isReady) {
      loadDeckData();
    }
  }, [router.isReady, router.query, appendLog]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const handleKeyDown = (e) => { // Prevent shortcuts when typing in inputs
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      switch (e.key) { // Global shortcuts
        case 'ArrowLeft': 
          e.preventDefault();
          goToPrevSlide();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNextSlide();
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume((prev) => Math.min(prev + 0.05, 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume((prev) => Math.max(prev - 0.05, 0));
          break;
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextSlide, goToPrevSlide, handlePlayPause]);

  // Render
  return (
    <div style={{ cursor: isConnecting ? 'wait' : 'auto' }}>
      {loading && <LoadingScreen />}
      {error && <ErrorScreen error={error} />}
      {!loading && !error && (
        <>
          <h1 style={{
            letterSpacing: 3,
            marginBottom: "1.3rem",
            textAlign: 'center',
            color: '#2c3e50',
            fontSize: '3rem',
            fontWeight: '300',
            fontFamily: 'var(--font-figtree), Arial, sans-serif',
            position: 'relative'
          }}>CAIRE<span style={{ color: '#0070f3', fontWeight: 'bold' }}>gen</span>
            <div style={{
              width: '60px',
              height: '3px',
              backgroundColor: '#0070f3',
              margin: '0.5rem auto 0 auto'
            }}></div>
          </h1>

          {deckData && <DeckInfo deckData={deckData} />}
          
          {/* Slide Component */}
          <div style={styles.container}>
            <div ref={fullscreenRef} style={isFullscreen ? styles.slideshowBoxFullscreen : styles.slideshowBox}>
              <SlideshowNarrator slideData={slideData} narrationScript={narrationScript} currentSlide={currentSlide} setCurrentSlide={setCurrentSlide} slideshowRef={slideshowRef} slideRef={slideRef} videoRef={videoRef} isAvatarExpanded={isAvatarExpanded} onToggleAvatarExpanded={toggleAvatarExpanded} isFullscreen={isFullscreen} selectedLanguage={selectedLanguage} />
            </div>
            <SlideMenu slideData={slideData} slideSummaries={slideSummaries} currentSlide={currentSlide} goToSlide={goToSlide} selectedLanguage={selectedLanguage} />
          </div>

          <div style={styles.controlsContainer}>
            <div style={styles.indicatorContainer}>
              <div
                style={{
                  ...styles.indicator,
                  ...(isGenerating ? styles.generating : isConnecting ? styles.connecting : (isReady && isAvatarReady) ? styles.ready : styles.notReady)
                }}
                title={isGenerating ? t.loadingScript : isConnecting ? 'Connecting...' : (isReady && isAvatarReady) ? t.readyStart : t.notReady}


                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {isGenerating ? t.loading : isConnecting ? 'Connecting' : (isReady && isAvatarReady) ? t.ready : t.pressStart}
              </div>
            </div>
            <div style={styles.fullWidthControls}>
              {!isPresenting && !showRestartBanner && (
                <div style={styles.banner}>
                  <strong>{t.instructions}</strong> 1. {t.instrStep1} <strong>{t.instrStep1Action}</strong> {t.instrStep1End} 2. {t.instrStep2} 3. {t.instrStep3} <strong>▶</strong> {t.instrStep3End}
                </div>
              )}
              {showRestartBanner && (
                <div style={{...styles.banner, backgroundColor: isAvatarReady ? '#d4edda' : '#fff3cd', color: isAvatarReady ? '#155724' : '#856404', borderColor: isAvatarReady ? '#c3e6cb' : '#ffeeba'}}>
                  <strong>{isAvatarReady ? t.avatarUpdated : t.languageChange}</strong>: {isAvatarReady ? t.pressPlayContinue : t.restarting}
                </div>
              )}
              <Controls
                onClearLog={clearLogs}
                onTogglePause={handlePlayPause}
                isPaused={isPaused}
                onStartPresentation={handleAvatarToggle}
                isAvatarReady={isAvatarReady}
                isPresenting={isPresenting}
                onNextSlide={goToNextSlide}
                onPrevSlide={goToPrevSlide}
                currentSlide={currentSlide}
                totalSlides={slideData.length}
                selectedLanguage={selectedLanguage}
                onLanguageChange={handleLanguageChange}
                onAskQuestion={askQuestion}
                questionText={questionText}
                setQuestionText={setQuestionText}
                onToggleFullscreen={toggleFullscreen}
                isFullscreen={isFullscreen}
                volume={volume}
                setVolume={setVolume}
              />
              <LogViewer logs={logs} />
              <div style={styles.shortcutsBanner}>
                <strong>Shortcuts:</strong> Space (Play/Pause) | ←/→ (Nav) | ↑/↓ (Vol)
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

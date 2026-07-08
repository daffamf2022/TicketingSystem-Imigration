import { createContext, useContext } from 'react';

export type FontSizeLevel = 1 | 2 | 3; // 1 = Normal, 2 = Besar, 3 = Sangat Besar

export interface AccessibilityContextType {
  // Existing
  fontSizeLevel: FontSizeLevel;
  setFontSizeLevel: (level: FontSizeLevel) => void;
  highContrastMode: boolean;
  setHighContrastMode: (enabled: boolean) => void;
  pureBlackWhite: boolean;
  setPureBlackWhite: (enabled: boolean) => void;
  // New features
  highlightLinks: boolean;
  setHighlightLinks: (enabled: boolean) => void;
  largerTextSpacing: boolean;
  setLargerTextSpacing: (enabled: boolean) => void;
  pauseAnimations: boolean;
  setPauseAnimations: (enabled: boolean) => void;
  hideImages: boolean;
  setHideImages: (enabled: boolean) => void;
  dyslexiaFont: boolean;
  setDyslexiaFont: (enabled: boolean) => void;
  largeCursor: boolean;
  setLargeCursor: (enabled: boolean) => void;
  tooltips: boolean;
  setTooltips: (enabled: boolean) => void;
  lineHeight: boolean;
  setLineHeight: (enabled: boolean) => void;
  textAlign: 'normal' | 'left' | 'center' | 'right';
  setTextAlign: (align: 'normal' | 'left' | 'center' | 'right') => void;
  saturation: 'normal' | 'low' | 'high' | 'mono';
  setSaturation: (level: 'normal' | 'low' | 'high' | 'mono') => void;
  // Panel control
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  resetAll: () => void;
}

export const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

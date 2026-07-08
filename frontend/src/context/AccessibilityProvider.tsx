import React, { useState, useEffect, useCallback } from 'react';
import { AccessibilityContext } from './AccessibilityContext';
import type { FontSizeLevel } from './AccessibilityContext';

const LS = (key: string, fallback: string) => localStorage.getItem(key) ?? fallback;
const LSB = (key: string) => localStorage.getItem(key) === 'true';

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontSizeLevel, setFontSizeLevelState] = useState<FontSizeLevel>(() => {
    const p = parseInt(LS('a11y-font-size', '1'), 10);
    return ([1, 2, 3].includes(p) ? p : 1) as FontSizeLevel;
  });
  const [highContrastMode, setHighContrastModeState] = useState(() => LSB('a11y-contrast'));
  const [pureBlackWhite, setPureBlackWhiteState] = useState(() => LSB('a11y-bw'));
  const [highlightLinks, setHighlightLinksState] = useState(() => LSB('a11y-links'));
  const [largerTextSpacing, setLargerTextSpacingState] = useState(() => LSB('a11y-spacing'));
  const [pauseAnimations, setPauseAnimationsState] = useState(() => LSB('a11y-pause'));
  const [hideImages, setHideImagesState] = useState(() => LSB('a11y-images'));
  const [dyslexiaFont, setDyslexiaFontState] = useState(() => LSB('a11y-dyslexia'));
  const [largeCursor, setLargeCursorState] = useState(() => LSB('a11y-cursor'));
  const [tooltips, setTooltipsState] = useState(() => LSB('a11y-tooltips'));
  const [lineHeight, setLineHeightState] = useState(() => LSB('a11y-lineheight'));
  const [textAlign, setTextAlignState] = useState<'normal' | 'left' | 'center' | 'right'>(() => {
    const v = LS('a11y-textalign', 'normal');
    return (['normal', 'left', 'center', 'right'].includes(v) ? v : 'normal') as 'normal' | 'left' | 'center' | 'right';
  });
  const [saturation, setSaturationState] = useState<'normal' | 'low' | 'high' | 'mono'>(() => {
    const v = LS('a11y-saturation', 'normal');
    return (['normal', 'low', 'high', 'mono'].includes(v) ? v : 'normal') as 'normal' | 'low' | 'high' | 'mono';
  });
  const [panelOpen, setPanelOpenState] = useState(false);

  // Apply all effects to <html> element
  useEffect(() => {
    const root = document.documentElement;
    const sizes: Record<number, string> = { 1: '100%', 2: '125%', 3: '150%' };
    root.style.fontSize = sizes[fontSizeLevel] ?? '100%';
    localStorage.setItem('a11y-font-size', String(fontSizeLevel));
  }, [fontSizeLevel]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('a11y-contrast', highContrastMode);
    localStorage.setItem('a11y-contrast', String(highContrastMode));
  }, [highContrastMode]);

  useEffect(() => {
    document.documentElement.classList.toggle('a11y-bw', pureBlackWhite);
    localStorage.setItem('a11y-bw', String(pureBlackWhite));
  }, [pureBlackWhite]);

  useEffect(() => {
    document.documentElement.classList.toggle('a11y-links', highlightLinks);
    localStorage.setItem('a11y-links', String(highlightLinks));
  }, [highlightLinks]);

  useEffect(() => {
    document.documentElement.classList.toggle('a11y-spacing', largerTextSpacing);
    localStorage.setItem('a11y-spacing', String(largerTextSpacing));
  }, [largerTextSpacing]);

  useEffect(() => {
    document.documentElement.classList.toggle('a11y-pause', pauseAnimations);
    localStorage.setItem('a11y-pause', String(pauseAnimations));
  }, [pauseAnimations]);

  useEffect(() => {
    document.documentElement.classList.toggle('a11y-hide-images', hideImages);
    localStorage.setItem('a11y-images', String(hideImages));
  }, [hideImages]);

  useEffect(() => {
    document.documentElement.classList.toggle('a11y-dyslexia', dyslexiaFont);
    localStorage.setItem('a11y-dyslexia', String(dyslexiaFont));
  }, [dyslexiaFont]);

  useEffect(() => {
    document.documentElement.classList.toggle('a11y-cursor', largeCursor);
    localStorage.setItem('a11y-cursor', String(largeCursor));
  }, [largeCursor]);

  useEffect(() => {
    document.documentElement.classList.toggle('a11y-tooltips', tooltips);
    localStorage.setItem('a11y-tooltips', String(tooltips));
  }, [tooltips]);

  useEffect(() => {
    document.documentElement.classList.toggle('a11y-lineheight', lineHeight);
    localStorage.setItem('a11y-lineheight', String(lineHeight));
  }, [lineHeight]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('a11y-align-left', 'a11y-align-center', 'a11y-align-right');
    if (textAlign !== 'normal') root.classList.add(`a11y-align-${textAlign}`);
    localStorage.setItem('a11y-textalign', textAlign);
  }, [textAlign]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('a11y-sat-low', 'a11y-sat-high', 'a11y-sat-mono');
    if (saturation !== 'normal') root.classList.add(`a11y-sat-${saturation}`);
    localStorage.setItem('a11y-saturation', saturation);
  }, [saturation]);

  // Keyboard shortcut: Ctrl+U opens panel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        setPanelOpenState((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const resetAll = useCallback(() => {
    setFontSizeLevelState(1);
    setHighContrastModeState(false);
    setPureBlackWhiteState(false);
    setHighlightLinksState(false);
    setLargerTextSpacingState(false);
    setPauseAnimationsState(false);
    setHideImagesState(false);
    setDyslexiaFontState(false);
    setLargeCursorState(false);
    setTooltipsState(false);
    setLineHeightState(false);
    setTextAlignState('normal');
    setSaturationState('normal');
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{
        fontSizeLevel,
        setFontSizeLevel: (l) => setFontSizeLevelState(l),
        highContrastMode,
        setHighContrastMode: setHighContrastModeState,
        pureBlackWhite,
        setPureBlackWhite: setPureBlackWhiteState,
        highlightLinks,
        setHighlightLinks: setHighlightLinksState,
        largerTextSpacing,
        setLargerTextSpacing: setLargerTextSpacingState,
        pauseAnimations,
        setPauseAnimations: setPauseAnimationsState,
        hideImages,
        setHideImages: setHideImagesState,
        dyslexiaFont,
        setDyslexiaFont: setDyslexiaFontState,
        largeCursor,
        setLargeCursor: setLargeCursorState,
        tooltips,
        setTooltips: setTooltipsState,
        lineHeight,
        setLineHeight: setLineHeightState,
        textAlign,
        setTextAlign: setTextAlignState,
        saturation,
        setSaturation: setSaturationState,
        panelOpen,
        setPanelOpen: setPanelOpenState,
        resetAll,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export default AccessibilityProvider;

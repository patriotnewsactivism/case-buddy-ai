import React, { useEffect, useState, useCallback } from 'react';

export interface CaptionOverlayProps {
  text: string;
  isVisible: boolean;
  position?: 'bottom' | 'top' | 'center';
  speaker?: 'user' | 'ai' | 'witness' | 'system';
  highlightWord?: number;
  fontSize?: 'small' | 'medium' | 'large';
  showSpeaker?: boolean;
  backgroundColor?: string;
  onDismiss?: () => void;
}

interface CaptionSettings {
  fontSize: 'small' | 'medium' | 'large';
  position: 'bottom' | 'top' | 'center';
  backgroundColor: string;
  showSpeaker: boolean;
}

const SPEAKER_CONFIG = {
  user: {
    label: 'You',
    color: 'bg-blue-500',
    textColor: 'text-blue-400',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    ),
  },
  ai: {
    label: 'AI Assistant',
    color: 'bg-amber-500',
    textColor: 'text-amber-400',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M13 7H7v6h6V7z" />
        <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
      </svg>
    ),
  },
  witness: {
    label: 'Witness',
    color: 'bg-green-500',
    textColor: 'text-green-400',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
      </svg>
    ),
  },
  system: {
    label: 'System',
    color: 'bg-gray-500',
    textColor: 'text-gray-400',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
  },
};

const FONT_SIZE_CLASSES = {
  small: 'text-sm md:text-base',
  medium: 'text-base md:text-lg',
  large: 'text-lg md:text-xl',
};

const POSITION_CLASSES = {
  bottom: 'bottom-4 md:bottom-8',
  top: 'top-4 md:top-8',
  center: 'top-1/2 -translate-y-1/2',
};

const DEFAULT_SETTINGS: CaptionSettings = {
  fontSize: 'medium',
  position: 'bottom',
  backgroundColor: 'rgba(15, 23, 42, 0.9)',
  showSpeaker: true,
};

const CaptionOverlay: React.FC<CaptionOverlayProps> = ({
  text,
  isVisible,
  position = 'bottom',
  speaker = 'ai',
  highlightWord,
  fontSize = 'medium',
  showSpeaker = true,
  backgroundColor,
  onDismiss,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayText, setDisplayText] = useState(text);

  const { settings } = useCaptionSettings();
  const effectiveFontSize = fontSize ?? settings.fontSize;
  const effectivePosition = position ?? settings.position;
  const effectiveBackgroundColor = backgroundColor ?? settings.backgroundColor;
  const effectiveShowSpeaker = showSpeaker ?? settings.showSpeaker;

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      setDisplayText(text);
    } else {
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible, text]);

  const speakerConfig = SPEAKER_CONFIG[speaker];

  const renderHighlightedText = () => {
    if (highlightWord === undefined || highlightWord < 0) {
      return <span>{displayText}</span>;
    }

    const words = displayText.split(' ');
    return (
      <span>
        {words.map((word, index) => (
          <span
            key={index}
            className={`transition-colors duration-150 ${
              index === highlightWord
                ? `${speakerConfig.textColor} font-semibold`
                : 'text-white'
            }`}
          >
            {word}{' '}
          </span>
        ))}
      </span>
    );
  };

  const handleDismiss = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleDismiss();
      }
    },
    [handleDismiss]
  );

  if (!isAnimating && !isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 z-50 max-w-[90vw] md:max-w-[600px]
        transition-all duration-300 ease-in-out
        ${POSITION_CLASSES[effectivePosition]}
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      onClick={handleOverlayClick}
    >
      <div
        className="relative rounded-xl shadow-2xl backdrop-blur-sm border border-white/10 overflow-hidden"
        style={{ backgroundColor: effectiveBackgroundColor }}
      >
        <div className="p-4 md:p-5">
          {effectiveShowSpeaker && (
            <div className="flex items-center gap-2 mb-3">
              <div className={`${speakerConfig.color} p-1.5 rounded-lg text-white`}>
                {speakerConfig.icon}
              </div>
              <span className={`font-medium text-sm ${speakerConfig.textColor}`}>
                {speakerConfig.label}
              </span>
            </div>
          )}

          <div
            className={`font-sans leading-relaxed ${FONT_SIZE_CLASSES[effectiveFontSize]} text-white`}
          >
            {renderHighlightedText()}
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
            aria-label="Dismiss caption"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export function useCaptionSettings() {
  const [settings, setSettings] = useState<CaptionSettings>(() => {
    try {
      const stored = localStorage.getItem('captionSettings');
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // ignore parse errors
    }
    return DEFAULT_SETTINGS;
  });

  const updateSettings = useCallback((updates: Partial<CaptionSettings>) => {
    setSettings((prev) => {
      const newSettings = { ...prev, ...updates };
      try {
        localStorage.setItem('captionSettings', JSON.stringify(newSettings));
      } catch {
        // ignore storage errors
      }
      return newSettings;
    });
  }, []);

  const setFontSize = useCallback(
    (fontSize: CaptionSettings['fontSize']) => updateSettings({ fontSize }),
    [updateSettings]
  );

  const setPosition = useCallback(
    (position: CaptionSettings['position']) => updateSettings({ position }),
    [updateSettings]
  );

  const setBackgroundColor = useCallback(
    (backgroundColor: string) => updateSettings({ backgroundColor }),
    [updateSettings]
  );

  const setShowSpeaker = useCallback(
    (showSpeaker: boolean) => updateSettings({ showSpeaker }),
    [updateSettings]
  );

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem('captionSettings', JSON.stringify(DEFAULT_SETTINGS));
    } catch {
      // ignore storage errors
    }
  }, []);

  return {
    settings,
    setFontSize,
    setPosition,
    setBackgroundColor,
    setShowSpeaker,
    resetSettings,
  };
}

export default CaptionOverlay;

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';

interface SwitchControlOptions {
  items: any[];
  onItemSelect: (item: any, index: number) => void;
  onAdvance?: () => void;
  autoAdvanceDelay?: number;
}

export const useSwitchControl = ({
  items,
  onItemSelect,
  onAdvance,
  autoAdvanceDelay = 2000,
}: SwitchControlOptions) => {
  const { switchCount } = useSettings();
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Reset state when items change
  useEffect(() => {
    setHighlightedIndex(0);
    setIsHighlighted(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, [items]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startAutoAdvanceTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      if (onAdvance) {
        onAdvance();
      }
    }, autoAdvanceDelay);
  }, [onAdvance, autoAdvanceDelay, clearTimer]);

  const handleSwitchPress = useCallback((key: string) => {
    if (switchCount === 0 || isProcessingRef.current) {
      return;
    }

    isProcessingRef.current = true;

    try {
      switch (switchCount) {
        case 1:
          // 1 switch: Timer-based highlight/select
          handleOneSwitch(key);
          break;
        case 2:
          // 2 switches: Space to highlight, Enter to select
          handleTwoSwitches(key);
          break;
        case 3:
          // 3 switches: Space to highlight, Enter to select, + to advance
          handleThreeSwitches(key);
          break;
        default:
          break;
      }
    } finally {
      // Reset processing flag after a short delay
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 100);
    }
  }, [switchCount, items, highlightedIndex, onItemSelect, onAdvance]);

  const handleOneSwitch = useCallback((key: string) => {
    if (key === 'space' || key === 'enter' || key === 'switch1' || key === 'generic') {
      if (!isHighlighted) {
        // First press: highlight current item
        setIsHighlighted(true);
        startAutoAdvanceTimer();
      } else {
        // Second press: select highlighted item
        clearTimer();
        setIsHighlighted(false);
        if (items[highlightedIndex]) {
          onItemSelect(items[highlightedIndex], highlightedIndex);
        }
      }
    }
  }, [isHighlighted, highlightedIndex, items, onItemSelect, startAutoAdvanceTimer, clearTimer]);

  const handleTwoSwitches = useCallback((key: string) => {
    if (key === 'space' || key === 'switch1') {
      // Space/Switch1: highlight current item
      setIsHighlighted(true);
      clearTimer();
    } else if (key === 'enter' || key === 'switch3') {
      // Enter/Switch3: select highlighted item
      if (isHighlighted && items[highlightedIndex]) {
        onItemSelect(items[highlightedIndex], highlightedIndex);
        setIsHighlighted(false);
      }
    }
  }, [isHighlighted, highlightedIndex, items, onItemSelect, clearTimer]);

  const handleThreeSwitches = useCallback((key: string) => {
    if (key === 'space' || key === 'switch1') {
      // Space/Switch1: highlight current item
      setIsHighlighted(true);
      clearTimer();
    } else if (key === 'enter' || key === 'switch3') {
      // Enter/Switch3: select highlighted item
      if (isHighlighted && items[highlightedIndex]) {
        onItemSelect(items[highlightedIndex], highlightedIndex);
        setIsHighlighted(false);
      }
    } else if (key === 'plus') {
      // Plus: advance to next item
      if (isHighlighted) {
        const nextIndex = (highlightedIndex + 1) % items.length;
        setHighlightedIndex(nextIndex);
      } else if (onAdvance) {
        onAdvance();
      }
    }
  }, [isHighlighted, highlightedIndex, items, onItemSelect, onAdvance, clearTimer]);

  const moveHighlight = useCallback((direction: 'next' | 'prev') => {
    if (items.length === 0) return;
    
    const newIndex = direction === 'next' 
      ? (highlightedIndex + 1) % items.length
      : (highlightedIndex - 1 + items.length) % items.length;
    
    setHighlightedIndex(newIndex);
    setIsHighlighted(false);
    clearTimer();
  }, [highlightedIndex, items.length, clearTimer]);

  const resetHighlight = useCallback(() => {
    setHighlightedIndex(0);
    setIsHighlighted(false);
    clearTimer();
  }, [clearTimer]);

  return {
    highlightedIndex,
    isHighlighted,
    handleSwitchPress,
    moveHighlight,
    resetHighlight,
    isEnabled: switchCount > 0,
  };
};

export default useSwitchControl;

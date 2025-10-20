import { useFocusEffect, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  Image,
  LayoutChangeEvent,
  PanResponder,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '../contexts/SettingsContext';
import { useSwitchControl } from '../hooks/useSwitchControl';
import { useWordTranslation } from '../hooks/useWordTranslation';
import { SFProText } from '../theme/typography';
import { GAME_CONFIGS, GameType } from '../types/gameTypes';
import { createFlipAnimations, createShakeAnimation, createShakeTransform, use2DAnimations } from '../utils/animationUtils';
import { isLandscape, isTablet } from '../utils/device';
import { computeLayout, getToolbarHeight } from '../utils/gameLayout';
import { resolveImageSource } from '../utils/imageUtils';
import { initializeAudio, playRewardSound, playWord, playWordAndWait, stopCurrentSound, stopCurrentSpeech } from '../utils/soundUtils';
import GameToolbar from './GameToolbar';
import SwitchInput from './SwitchInput';

interface GameCard {
  id: string;
  image: string;
  text: string;
  sound?: string;
  isMatched: boolean;
  translations?: { [locale: string]: string };
}

interface GameState {
  level: number;
  matchCard: GameCard;
  staticCards: GameCard[];
  isAnimating: boolean;
  activeSet: GameCard[];
  targetOrder: number[];
  currentIndex: number;
  revealedMap: { [key: string]: boolean };
  currentGroupStart: number;
}

interface GameScreenProps {
  gameType: GameType;
}

export default function GameScreen({ gameType }: GameScreenProps) {
  const { t } = useTranslation();
  const { getTranslatedWord } = useWordTranslation();
  const config = GAME_CONFIGS[gameType];
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { cardsPerPage, settings, locale, shuffleMode, wordList, speedMultiplier } = useSettings();

  const [gameState, setGameState] = useState<GameState>({
    level: 1,
    matchCard: { id: '', image: '', text: '', isMatched: false },
    staticCards: [],
    isAnimating: false,
    activeSet: [],
    targetOrder: [],
    currentIndex: 0,
    revealedMap: {},
    currentGroupStart: 0,
  });

  const [screen, setScreen] = useState(Dimensions.get('window'));
  const isPad = isTablet();
  const portrait = !isLandscape(screen.width, screen.height);

  // Animation states
  const [cardPosition] = useState(new Animated.ValueXY());
  const [cardScale] = useState(new Animated.Value(1));
  const [flipAnimation] = useState(new Animated.Value(0));
  const [cardOpacity] = useState(new Animated.Value(1));
  const [screenOpacity] = useState(new Animated.Value(1));
  const [showWord, setShowWord] = useState(false);
  const [canShowText, setCanShowText] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [flippingStaticIndex, setFlippingStaticIndex] = useState<number | null>(null);
  const [matchCardVisible, setMatchCardVisible] = useState(true);
  const [showMatchBorder, setShowMatchBorder] = useState(false);
  const [hideMatchCardBorder, setHideMatchCardBorder] = useState(false);
  
  const gameStateRef = useRef<GameState>(gameState);
  const useLegacyAnimations = use2DAnimations();

  // Playable list helper: exclude silent words in sound games when TTS is off
  const isSoundGame = gameType === 'sound-to-picture' || gameType === 'sound-to-word';
  const getPlayableBaseList = useCallback(() => {
    let base: any[] = wordList;
    if (isSoundGame && !settings.textToSpeech) {
      base = base.filter((w: any) => Boolean(w.sound));
    }
    if (shuffleMode === 'all') {
      base = [...base].sort(() => Math.random() - 0.5);
    }
    return base;
  }, [wordList, shuffleMode, settings.textToSpeech, isSoundGame]);

  // Switch control for accessibility
  const switchControl = useSwitchControl({
    items: gameState.staticCards,
    onItemSelect: (card, index) => {
      if (gameState.isAnimating) return;
      
      // Check if this card matches the current match card
      const isMatch = config.matchProperty === 'image'
        ? card.image === gameState.matchCard.image
        : card.text === gameState.matchCard.text;
      
      if (isMatch) {
        handleProgrammaticMatch(card, index);
      }
    },
    onAdvance: () => {
      if (gameState.currentIndex < gameState.targetOrder.length - 1) {
        const nextIndex = gameState.currentIndex + 1;
        const nextTargetIndex = gameState.targetOrder[nextIndex];
        const nextMatchCard = gameState.staticCards[nextTargetIndex];
        
        setGameState(prev => ({
          ...prev,
          currentIndex: nextIndex,
          matchCard: nextMatchCard,
          revealedMap: {},
        }));
        
        switchControl.resetHighlight();
      }
    },
    autoAdvanceDelay: 2000,
  });

  const m = speedMultiplier;
  const DURATION = {
    move: Math.round(1000 * m),
    scale: Math.round(600 * m),
    flipSingle: Math.round(2000 * m),
    flipDouble: Math.round(4000 * m),
    fadeOut: Math.round(500 * m),
    fade: Math.round(1000 * m),
    wait: Math.round(1000 * m),
  } as const;

  const [cardShakeAnimations, setCardShakeAnimations] = useState<Animated.Value[]>([]);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const initialPosition = useRef({ x: 0, y: 0 });
  const cardOffset = useRef({ x: 0, y: 0 });
  const ongoingTimeouts = useRef<number[]>([]);
  const afterMatchWaitRef = useRef<Promise<void> | null>(null);
  const roundIdRef = useRef(0);
  const pendingPlayOnVisibleRef = useRef(false);

  const resetMatchCardPosition = useCallback(() => {
    cardPosition.stopAnimation();
    cardPosition.setOffset({ x: 0, y: 0 });
    cardPosition.setValue({ x: 0, y: 0 });
    cardOffset.current = { x: 0, y: 0 };
  }, [cardPosition]);

  useEffect(() => {
    const setup = async () => {
      await initializeAudio();
      initializeGame(0);
    };
    setup();
  }, []);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useFocusEffect(
    useCallback(() => {
      const backSub = BackHandler.addEventListener("hardwareBackPress", () => {
        return isLocked;
      });
      return () => backSub.remove();
    }, [isLocked])
  );

  useEffect(() => {
    const animations = Array.from({ length: cardsPerPage }, () => new Animated.Value(0));
    setCardShakeAnimations(animations);
  }, [cardsPerPage]);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      resetMatchCardPosition();
      setScreen(window);
    });
    return () => sub?.remove();
  }, [resetMatchCardPosition]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={isLocked ? undefined : () => {
            cleanupCurrentRound();
            navigation.goBack();
          }}
          disabled={isLocked}
          style={{ 
            opacity: isLocked ? 0.4 : 1,
            marginLeft: Platform.OS === 'ios' && parseInt(Platform.Version as string) >= 26 ? 3 : 0
          }}
        >
          <Image
            source={require('../../assets/images/close-circle-icon.png')}
            style={{ width: 30, height: 30 }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      ),
    });
  }, [isLocked]);

  // ==============================
  // GAME INIT / FLOW
  // ==============================
  const initializeGame = (startIndex: number = 0, deferSoundPlayback: boolean = false) => {
    cleanupCurrentRound();

    setGameState(prev => ({
      ...prev,
      level: 1,
      matchCard: { id: '', image: '', text: '', isMatched: false },
      staticCards: [],
      isAnimating: false,
      activeSet: [],
      targetOrder: [],
      currentIndex: 0,
      revealedMap: {},
      currentGroupStart: startIndex,
    }));

    setTimeout(() => {
      const groupSize = cardsPerPage;
      const baseList = getPlayableBaseList();
      const endIndex = Math.min(startIndex + groupSize, baseList.length);
      let currentGroup = baseList.slice(startIndex, endIndex);
      
      if (shuffleMode === 'page') {
        currentGroup = [...currentGroup].sort(() => Math.random() - 0.5);
      }

      if (currentGroup.length === 0) {
        if (baseList.length === 0) {
          // No playable items; keep empty state
          return;
        }
        return initializeGame(0);
      }

      const staticCards: GameCard[] = currentGroup.map((w, i) => ({
        id: `static-${i}`,
        image: w.image,
        text: w.text,
        sound: w.sound || undefined,
        isMatched: false,
        translations: (w as any).translations,
      }));

      const indices = staticCards.map((_, i) => i);
      const targetOrder = [...indices].sort(() => Math.random() - 0.5);

      setGameState(prev => ({
        ...prev,
        activeSet: staticCards,
        staticCards,
        targetOrder,
        currentIndex: 0,
        revealedMap: {},
        currentGroupStart: startIndex,
      }));

      setTimeout(() => {
        setupRound(staticCards, targetOrder, 0, deferSoundPlayback);
      }, 50);
    }, 50);
  };

  const setupRound = (activeSet: GameCard[], targetOrder: number[], currentIndex: number, deferSoundPlayback: boolean = false) => {
    if (!activeSet.length || !targetOrder.length) return;

    cleanupCurrentRound();

    const targetIdx = targetOrder[currentIndex];
    const target = activeSet[targetIdx];

    const newMatchCard: GameCard = {
      id: 'match',
      image: target.image,
      text: target.text,
      sound: target.sound,
      isMatched: false,
      translations: target.translations,
    };

    setGameState(prev => ({
      ...prev,
      matchCard: newMatchCard,
      isAnimating: false,
      activeSet,
      targetOrder,
      currentIndex,
    }));

    cardOpacity.setValue(1);
    
    if (settings.playBeforeMatch && matchCardVisible && !deferSoundPlayback) {
      if (newMatchCard.sound) {
        playWord(newMatchCard.sound, { ttsEnabled: settings.textToSpeech, locale, text: newMatchCard.text });
      } else {
        const fallbackKey = newMatchCard.text?.toLowerCase() || newMatchCard.image;
        if (fallbackKey) {
          playWord(fallbackKey, { ttsEnabled: settings.textToSpeech, locale, text: newMatchCard.text });
        }
      }
    }
  };

  // ==============================
  // LAYOUT
  // ==============================
  const TOOLBAR_HEIGHT = getToolbarHeight(screen.width, screen.height);
  const canLayout = containerSize.width > 0 && containerSize.height > 0;

  const layout = React.useMemo(() => {
    if (!canLayout) return null;
    return computeLayout(cardsPerPage as 1 | 2 | 3 | 4 | 6 | 8, containerSize.width, containerSize.height, isPad, portrait);
  }, [canLayout, containerSize, isPad, portrait, cardsPerPage]);

  const CARD_WIDTH = layout?.cardSize.w ?? 0;
  const CARD_HEIGHT = layout?.cardSize.h ?? 0;
  const CARD_TEXT_SIZE = Math.max(18, CARD_HEIGHT * 0.22);
  const PERSPECTIVE = 800;

  const shakeCard = (idx: number, speed = 1) => {
    const shake = cardShakeAnimations[idx];
    if (!shake) return;
    createShakeAnimation(shake, idx, speed);
  };

  const shakeAllCards = () => {
    gameState.staticCards.forEach((_, i) => shakeCard(i, 1));
  };

  const getStaticCenterPositions = () => {
    if (!layout) return [];
    return layout.statics.map(r => ({
      x: r.left + r.width / 2,
      y: r.top + r.height / 2,
    }));
  };

  const findMatchedCard = (drop: { x: number; y: number }) => {
    const centers = getStaticCenterPositions();
    for (let i = 0; i < gameState.staticCards.length; i++) {
      const p = centers[i];
      if (!p) continue;
      const dx = drop.x - p.x;
      const dy = drop.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const threshold = CARD_WIDTH * 0.6;
      if (dist < threshold) return gameState.staticCards[i];
    }
    return null;
  };
  
  const getCardPositionValue = () => {
    const rawValue = (cardPosition as unknown as { __getValue?: () => { x: number; y: number } }).__getValue?.();
    if (rawValue && typeof rawValue.x === 'number' && typeof rawValue.y === 'number') {
      return rawValue;
    }
    return { x: 0, y: 0 };
  };

  const clampTranslation = (x: number, y: number) => {
    if (!layout || !layout.match || containerSize.width <= 0 || containerSize.height <= 0) {
      return { x, y };
    }

    const halfWidth = layout.match.width / 2;
    const halfHeight = layout.match.height / 2;
    if (!halfWidth || !halfHeight) return { x, y };

    const minX = halfWidth;
    const maxX = Math.max(minX, containerSize.width - halfWidth);
    const minY = halfHeight;
    const maxY = Math.max(minY, containerSize.height - halfHeight);

    const desiredCenterX = initialPosition.current.x + x;
    const desiredCenterY = initialPosition.current.y + y;

    const clampedCenterX = Math.min(Math.max(desiredCenterX, minX), maxX);
    const clampedCenterY = Math.min(Math.max(desiredCenterY, minY), maxY);

    return {
      x: clampedCenterX - initialPosition.current.x,
      y: clampedCenterY - initialPosition.current.y,
    };
  };

  const applyClampedTranslation = (rawX: number, rawY: number) => {
    const clamped = clampTranslation(rawX, rawY);
    cardPosition.setValue({
      x: clamped.x - cardOffset.current.x,
      y: clamped.y - cardOffset.current.y,
    });
    return clamped;
  };

  // ==============================
  // DRAG & DROP
  // ==============================
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !gameState.isAnimating,
    onMoveShouldSetPanResponder: () => !gameState.isAnimating,
    onPanResponderGrant: () => {
      cardPosition.stopAnimation();
      cardOffset.current = clampTranslation(cardOffset.current.x, cardOffset.current.y);
      cardPosition.setOffset(cardOffset.current);
      cardPosition.setValue({ x: 0, y: 0 });
    },
    onPanResponderMove: (_, gestureState) => {
      if (gameState.isAnimating) return;
      const nextTranslationX = cardOffset.current.x + gestureState.dx;
      const nextTranslationY = cardOffset.current.y + gestureState.dy;
      applyClampedTranslation(nextTranslationX, nextTranslationY);
    },
    onPanResponderRelease: (e, g) => {
      if (gameState.isAnimating) return;
      cardPosition.flattenOffset();
      const currentOffset = getCardPositionValue();
      cardOffset.current = currentOffset;

      const tap = Math.abs(g.dx) < 10 && Math.abs(g.dy) < 10;
      if (tap) {
        if (settings.playBeforeMatch) {
          if (gameState.matchCard.sound) {
            playWord(gameState.matchCard.sound, { ttsEnabled: settings.textToSpeech, locale, text: gameState.matchCard.text });
          } else {
            const fallbackKey = gameState.matchCard.text?.toLowerCase() || gameState.matchCard.image;
            if (fallbackKey) {
              playWord(fallbackKey, { ttsEnabled: settings.textToSpeech, locale, text: gameState.matchCard.text });
            }
          }
        }
        Animated.spring(cardScale, { toValue: 1, tension: 100, friction: 8, useNativeDriver: !useLegacyAnimations }).start();
        return;
      }
      
      const dropPos = {
        x: initialPosition.current.x + currentOffset.x,
        y: initialPosition.current.y + currentOffset.y,
      };
      const matched = findMatchedCard(dropPos);
      
      if (matched) {
        const isMatch = config.matchProperty === 'image'
          ? matched.image === gameState.matchCard.image
          : matched.text === gameState.matchCard.text;
        
        if (isMatch) {
          handleSuccessfulMatch(matched);
        } else {
          handleFailedMatch();
        }
      } else {
        handleFailedMatch();
      }
    },
  });

  const handleSuccessfulMatch = (matchedCard: GameCard) => {
    const myRoundId = roundIdRef.current;
    setGameState(prev => ({ ...prev, isAnimating: true }));
    const centers = getStaticCenterPositions();
    const matchedIndex = gameState.staticCards.findIndex(c => c.id === matchedCard.id);
    const target = centers[matchedIndex];
    if (!target) return;

    const targetTranslation = {
      x: target.x - initialPosition.current.x,
      y: target.y - initialPosition.current.y,
    };

    Animated.parallel([
      Animated.timing(cardPosition, {
        toValue: targetTranslation,
        duration: DURATION.move,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.timing(cardScale, { toValue: 1, duration: DURATION.scale, useNativeDriver: !useLegacyAnimations }),
    ]).start(({ finished }) => {
      if (!finished || myRoundId !== roundIdRef.current) return;
      cardOffset.current = targetTranslation;
      if (settings.playAfterMatch) {
        if (gameState.matchCard.sound) {
          afterMatchWaitRef.current = playWordAndWait(gameState.matchCard.sound, { ttsEnabled: settings.textToSpeech, locale, text: gameState.matchCard.text }, 0);
        } else {
          const fallbackKey = gameState.matchCard.text?.toLowerCase() || gameState.matchCard.image;
          if (fallbackKey) {
            afterMatchWaitRef.current = playWordAndWait(fallbackKey, { ttsEnabled: settings.textToSpeech, locale, text: gameState.matchCard.text }, 0);
          } else {
            afterMatchWaitRef.current = Promise.resolve();
          }
        }
      } else {
        afterMatchWaitRef.current = Promise.resolve();
      }
      
      setGameState(prev => {
        const updated = prev.staticCards.map((c, i) => (i === matchedIndex ? { ...c, isMatched: true } : c));
        const revealed = { ...prev.revealedMap, [matchedCard.image]: true };
        return { ...prev, staticCards: updated, revealedMap: revealed };
      });
      
      setFlippingStaticIndex(matchedIndex);
      performFlipAnimation();
    });
  };

  const performFlipAnimation = () => {
    const myRoundId = roundIdRef.current;
    const ensureRoundActive = () => {
      if (myRoundId !== roundIdRef.current) {
        setHideMatchCardBorder(false);
        return false;
      }
      return true;
    };
    setHideMatchCardBorder(config.flipType === 'double' || config.matchCardContent === 'question-icon');
    
    if (config.flipType === 'single') {
      // Single flip animation
      setCanShowText(true);
      setShowMatchBorder(true);
      
      Animated.timing(flipAnimation, { toValue: 1, duration: DURATION.flipSingle, useNativeDriver: true }).start(async () => {
        if (!ensureRoundActive()) return;
        setShowWord(true);
        setFlippingStaticIndex(null);
        try {
          const minWaitMs = Math.round(1000 * Math.max(1, speedMultiplier));
          const waitMin = new Promise<void>((resolve) => setTimeout(resolve, minWaitMs));
          await Promise.all([afterMatchWaitRef.current ?? Promise.resolve(), waitMin]);
        } catch {}
        if (!ensureRoundActive()) return;
        setShowMatchBorder(false);
        setGameState(prev => ({
          ...prev,
          matchCard: { ...prev.matchCard, image: '', text: '' },
          isAnimating: true,
        }));
        const t2 = setTimeout(() => {
          if (myRoundId !== roundIdRef.current) return;
          advanceOrFinish();
        }, Math.max(100, Math.round(100 * m)));
        ongoingTimeouts.current.push(t2);
        setHideMatchCardBorder(false);
      });
    } else {
      // Double flip animation
      const total = DURATION.flipDouble;
      const d0 = Math.max(1, Math.round(total / 4));
      const d1 = Math.max(1, Math.round(total / 5));
      const d2 = Math.max(1, Math.round(total / 5));
      const d3 = Math.max(1, Math.round(total / 4));

      Animated.timing(flipAnimation, {
        toValue: 0.5,
        duration: d0,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        if (!ensureRoundActive()) return;
        setCanShowText(true);
        setShowWord(true);
        Animated.timing(flipAnimation, {
          toValue: 1.0,
          duration: d1,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start(() => {
          if (!ensureRoundActive()) return;
          Animated.timing(flipAnimation, {
            toValue: 1.5,
            duration: d2,
            easing: Easing.linear,
            useNativeDriver: true,
          }).start(() => {
            if (!ensureRoundActive()) return;
            Animated.timing(flipAnimation, {
              toValue: 2.0,
              duration: d3,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }).start(async () => {
              if (!ensureRoundActive()) return;
              setFlippingStaticIndex(null);
              setHideMatchCardBorder(false);
              try {
                const minWaitMs = Math.round(1000 * Math.max(1, m));
                const waitMin = new Promise<void>((resolve) => setTimeout(resolve, minWaitMs));
                await Promise.all([afterMatchWaitRef.current ?? Promise.resolve(), waitMin]);
              } catch {}
              if (myRoundId !== roundIdRef.current) return;
              setGameState(prev => ({ 
                ...prev, 
                matchCard: { ...prev.matchCard, image: '', text: '' },
                isAnimating: true 
              }));
              const timeout3 = setTimeout(() => {
                if (myRoundId !== roundIdRef.current) return;
                advanceOrFinish();
              }, Math.max(100, Math.round(100 * m)));
              ongoingTimeouts.current.push(timeout3);
              flipAnimation.setValue(0);
            });
          });
        });
      });
    }
  };

  const handleFailedMatch = () => {
    Animated.spring(cardScale, { toValue: 1, tension: 100, friction: 8, useNativeDriver: !useLegacyAnimations }).start();
  };

  const handleProgrammaticMatch = (card: GameCard, idx: number) => {
    const myRoundId = roundIdRef.current;
    setGameState(prev => ({ ...prev, isAnimating: true }));
    const centers = getStaticCenterPositions();
    const target = centers[idx];
    if (!target) return;

    const targetTranslation = {
      x: target.x - initialPosition.current.x,
      y: target.y - initialPosition.current.y,
    };

    const moveToTarget = () => {
      Animated.parallel([
        Animated.timing(cardPosition, {
          toValue: targetTranslation,
          duration: DURATION.move,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(cardScale, { toValue: 1, duration: DURATION.scale, useNativeDriver: !useLegacyAnimations }),
      ]).start(({ finished }) => {
        if (!finished || myRoundId !== roundIdRef.current) return;
        cardOffset.current = targetTranslation;
        if (settings.playAfterMatch) {
          if (gameState.matchCard.sound) {
            afterMatchWaitRef.current = playWordAndWait(gameState.matchCard.sound, { ttsEnabled: settings.textToSpeech, locale, text: gameState.matchCard.text }, 0);
          } else {
            const fallbackKey = gameState.matchCard.text?.toLowerCase() || gameState.matchCard.image;
            if (fallbackKey) {
              afterMatchWaitRef.current = playWordAndWait(fallbackKey, { ttsEnabled: settings.textToSpeech, locale, text: gameState.matchCard.text }, 0);
            } else {
              afterMatchWaitRef.current = Promise.resolve();
            }
          }
        } else {
          afterMatchWaitRef.current = Promise.resolve();
        }
        
        setGameState(prev => {
          const updated = prev.staticCards.map((c, i) => (i === idx ? { ...c, isMatched: true } : c));
          const revealed = { ...prev.revealedMap, [card.image]: true };
          return { ...prev, staticCards: updated, revealedMap: revealed };
        });
        
        setFlippingStaticIndex(idx);
        performFlipAnimation();
      });
    };

    if (useLegacyAnimations) {
      cardScale.stopAnimation();
      cardScale.setValue(1);
      moveToTarget();
    } else {
      Animated.spring(cardScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start(moveToTarget);
    }
  };

  const advanceOrFinish = async () => {
    const { activeSet, targetOrder, currentIndex, currentGroupStart } = gameState;
    if (!activeSet || !activeSet.length) return;
    const hasNext = currentIndex + 1 < targetOrder.length;
    
    if (hasNext) {
      setupRound(activeSet, targetOrder, currentIndex + 1, false);
      setGameState(prev => ({ ...prev, level: prev.level + 1 }));
    } else {
      if (settings.enableReward) {
        shakeAllCards();
        await playRewardSound();
      }
      
      if (settings.automatic) {
        const newStart = currentGroupStart + cardsPerPage;
        if (newStart < wordList.length) {
          cardPosition.stopAnimation();
          cardScale.stopAnimation();
          flipAnimation.stopAnimation();
          cardOpacity.stopAnimation();
          cardShakeAnimations.forEach(a => a.stopAnimation());
          stopCurrentSound();
          stopCurrentSpeech();
          
          Animated.timing(screenOpacity, {
            toValue: 0,
            duration: DURATION.fade,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }).start(() => {
            pendingPlayOnVisibleRef.current = settings.playBeforeMatch;
            setMatchCardVisible(false);
            cleanupCurrentRound();
            initializeGame(newStart, true);
            
            setTimeout(() => {
              Animated.timing(screenOpacity, {
                toValue: 1,
                duration: DURATION.fade,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }).start(() => {
                const myRoundId = roundIdRef.current;
                setTimeout(() => {
                  if (myRoundId !== roundIdRef.current) return;
                  setMatchCardVisible(true);
                  if (pendingPlayOnVisibleRef.current) {
                    pendingPlayOnVisibleRef.current = false;
                    const current = gameStateRef.current.matchCard;
                    if (current?.image && current?.text) {
                      if (current.sound) {
                        playWord(current.sound, { ttsEnabled: settings.textToSpeech, locale, text: current.text });
                      } else {
                        const fallbackKey = current.text?.toLowerCase() || current.image;
                        if (fallbackKey) {
                          playWord(fallbackKey, { ttsEnabled: settings.textToSpeech, locale, text: current.text });
                        }
                      }
                    }
                  }
                }, DURATION.wait);
              });
            }, 50);
          });
          return;
        }
      }
      setGameState(prev => ({ ...prev, isAnimating: false }));
    }
  };

  const freezeAnimations = () => {
    // Sadece animasyonları durdur ama resetleme (freeze efekti için)
    roundIdRef.current += 1;
    cardPosition.stopAnimation();
    cardScale.stopAnimation();
    flipAnimation.stopAnimation();
    cardOpacity.stopAnimation();
    cardShakeAnimations.forEach(a => a.stopAnimation());

    ongoingTimeouts.current.forEach(t => clearTimeout(t));
    ongoingTimeouts.current = [];

    afterMatchWaitRef.current = null;

    stopCurrentSound();
    stopCurrentSpeech();
  };

  const resetAnimationValues = () => {
    // Tüm animasyon değerlerini ve state'leri resetle
    cardPosition.setOffset({ x: 0, y: 0 });
    cardPosition.setValue({ x: 0, y: 0 });
    cardOffset.current = { x: 0, y: 0 };
    cardScale.setValue(1);
    flipAnimation.setValue(0);
    cardOpacity.setValue(1);
    cardShakeAnimations.forEach(a => a.setValue(0));

    setShowWord(false);
    setCanShowText(false);
    setFlippingStaticIndex(null);
    setShowMatchBorder(false);
    setHideMatchCardBorder(false);

    setGameState(prev => ({
      ...prev,
      isAnimating: false,
      revealedMap: {},
      matchCard: { id: '', image: '', text: '', isMatched: false },
    }));
  };

  const cleanupCurrentRound = () => {
    // Round temizliği: önce freeze, sonra reset
    freezeAnimations();
    resetAnimationValues();
  };

  // ==============================
  // NAVIGATION HANDLERS
  // ==============================
  const performPageTransition = (newStartIndex: number) => {
    // Önce tüm animasyonları freeze et (durdur ama resetleme)
    freezeAnimations();
    
    // Şimdi fade out yap (kartlar son hallerinde kalacak = freeze efekti)
    Animated.timing(screenOpacity, {
      toValue: 0,
      duration: DURATION.fade,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      pendingPlayOnVisibleRef.current = settings.playBeforeMatch;
      setMatchCardVisible(false);
      // Fade bitince değerleri resetle (freeze zaten yapıldı)
      resetAnimationValues();
      initializeGame(newStartIndex, true);
      
      setTimeout(() => {
        Animated.timing(screenOpacity, {
          toValue: 1,
          duration: DURATION.fade,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }).start(() => {
          const myRoundId = roundIdRef.current;
          setTimeout(() => {
            if (myRoundId !== roundIdRef.current) return;
            setMatchCardVisible(true);
            if (pendingPlayOnVisibleRef.current) {
              pendingPlayOnVisibleRef.current = false;
              const current = gameStateRef.current.matchCard;
              if (current?.image && current?.text) {
                if (current.sound) {
                  playWord(current.sound, { ttsEnabled: settings.textToSpeech, locale, text: current.text });
                } else {
                  const fallbackKey = current.text?.toLowerCase() || current.image;
                  if (fallbackKey) {
                    playWord(fallbackKey, { ttsEnabled: settings.textToSpeech, locale, text: current.text });
                  }
                }
              }
            }
          }, DURATION.wait);
        });
      }, 50);
    });
  };

  const handleToStart = () => performPageTransition(0);
  
  const handlePrevious = () => {
    const newStart = Math.max(0, gameState.currentGroupStart - cardsPerPage);
    performPageTransition(newStart);
  };
  
  const handleNext = () => {
    const baseLength = getPlayableBaseList().length;
    const newStart = gameState.currentGroupStart + cardsPerPage;
    if (newStart < baseLength) {
      performPageTransition(newStart);
    }
  };
  
  const handleToEnd = () => {
    const baseLength = getPlayableBaseList().length;
    const size = cardsPerPage;
    const remainder = baseLength % size;
    const lastStart = Math.max(0, baseLength - (remainder === 0 ? size : remainder));
    performPageTransition(lastStart);
  };

  const isAtStart = gameState.currentGroupStart === 0;
  const isAtEnd = gameState.currentGroupStart + cardsPerPage >= getPlayableBaseList().length;

  const handleLockPress = () => Alert.alert(t('help.padlock'), t('help.padlock'));
  const handleLockLongPress = () => setIsLocked(p => !p);
  
  const handleRefresh = () => performPageTransition(gameState.currentGroupStart);


  // ==============================
  // RENDER HELPERS
  // ==============================
  const onContainerLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setContainerSize({ width, height });
  };

  const renderCardContent = (
    contentType: 'image' | 'text' | 'question-icon',
    card: GameCard,
    fontSize?: number
  ) => {
    if (contentType === 'image') {
      return <Image source={resolveImageSource(card.image)} style={styles.cardImage} resizeMode="cover" />;
    } else if (contentType === 'text') {
      return (
        <SFProText
          weight="semibold"
          style={[
            styles.cardText,
            fontSize ? { fontSize: fontSize * (settings.largeText ? 1.2 : 1) } : undefined,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {settings.capitalLetters ? getTranslatedWord(card).toLocaleUpperCase(locale) : getTranslatedWord(card)}
        </SFProText>
      );
    } else {
      return (
        <Image
          source={require('../../assets/images/question-circle-icon.png')}
          style={styles.questionIcon}
          resizeMode="contain"
        />
      );
    }
  };

  const renderStaticCard = (card: GameCard, index: number) => {
    if (!layout) return null;
    const r = layout.statics[index];
    if (!r) return null;

    const onTap = () => {
      if (gameState.isAnimating) return;
      const isMatch = config.matchProperty === 'image'
        ? card.image === gameState.matchCard.image
        : card.text === gameState.matchCard.text;
      
      if (isMatch) {
        handleProgrammaticMatch(card, index);
      }
    };

    const shake = cardShakeAnimations[index];
    const shakeTransform = createShakeTransform(shake);
    const isHighlighted = switchControl.isHighlighted && switchControl.highlightedIndex === index;

    return (
      <Animated.View
        key={card.id}
        style={[{ position: 'absolute', left: r.left, top: r.top, width: r.width, height: r.height }, shakeTransform]}
      >
        <TouchableOpacity
          style={[
            styles.staticCard, 
            { width: r.width, height: r.height },
            flippingStaticIndex === index && { borderWidth: 0 },
            isHighlighted && styles.highlightedCard,
          ]}
          onPress={onTap}
          activeOpacity={0.8}
        >
          {card.isMatched ? (
            <View style={[styles.cardSide, styles.cardBack]} pointerEvents="none">
              {renderCardContent(config.matchedStaticContent, card, CARD_TEXT_SIZE)}
            </View>
          ) : (
            <View style={[styles.cardSide, styles.cardBack]} pointerEvents="none">
              {renderCardContent(config.staticCardContent, card, CARD_TEXT_SIZE)}
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderMatchCard = () => {
    if (!layout || !matchCardVisible || !gameState.matchCard.image || !gameState.matchCard.text) return null;

    const r = layout.match;
    const flipAnimations = createFlipAnimations(flipAnimation, config.flipType);
    
    const commonStyle = [
      styles.matchCard,
      { left: r.left, top: r.top, width: r.width, height: r.height },
      { transform: [{ translateX: cardPosition.x }, { translateY: cardPosition.y }] },
      (hideMatchCardBorder || (canShowText && !config.matchCardContent.includes('question'))) && { borderWidth: 0 },
    ];

    if (useLegacyAnimations) {
      // 2D flip
      return (
        <Animated.View
          {...panResponder.panHandlers}
          style={commonStyle}
          onLayout={e => {
            const { x, y, width, height } = e.nativeEvent.layout;
            initialPosition.current = { x: x + width / 2, y: y + height / 2 };
          }}
        >
          <Animated.View style={{ width: '100%', height: '100%', transform: [{ scale: cardScale }], opacity: cardOpacity }}>
            {/* Front */}
            <Animated.View
              style={[
                styles.cardSide, 
                styles.cardSide2D,
                styles.cardBack,
                flipAnimations.frontScaleX ? { transform: [{ scaleX: flipAnimations.frontScaleX }] } : {},
                config.matchCardContent === 'question-icon' && { backgroundColor: 'transparent' }
              ]}
              pointerEvents="none"
            >
              {renderCardContent(config.matchCardContent, gameState.matchCard, CARD_TEXT_SIZE)}
              {showMatchBorder && <View pointerEvents="none" style={styles.faceBorderOverlayGray} />}
              {!config.matchCardContent.includes('question') && <View pointerEvents="none" style={styles.faceBorderOverlay} />}
            </Animated.View>
            
            {/* Back */}
            <Animated.View
              style={[
                styles.cardSide, 
                styles.cardBack, 
                styles.cardSide2D,
                flipAnimations.backScaleX ? { transform: [{ scaleX: flipAnimations.backScaleX }] } : {}
              ]}
              pointerEvents="none"
            >
              {canShowText && renderCardContent(config.matchedMatchContent, gameState.matchCard, CARD_TEXT_SIZE)}
              {showMatchBorder && <View pointerEvents="none" style={styles.faceBorderOverlayGray} />}
              {!config.matchCardContent.includes('question') && <View pointerEvents="none" style={styles.faceBorderOverlay} />}
            </Animated.View>
          </Animated.View>
        </Animated.View>
      );
    } else {
      // 3D flip
      return (
        <Animated.View
          {...panResponder.panHandlers}
          style={commonStyle}
          onLayout={e => {
            const { x, y, width, height } = e.nativeEvent.layout;
            initialPosition.current = { x: x + width / 2, y: y + height / 2 };
          }}
        >
          <Animated.View style={{ width: '100%', height: '100%', transform: [{ scale: cardScale }], opacity: cardOpacity }}>
            {/* Front */}
            <Animated.View
              style={[
                styles.cardSide,
                styles.cardBack,
                flipAnimations.frontRotateY ? { transform: [{ perspective: PERSPECTIVE }, { rotateY: flipAnimations.frontRotateY }] } : {},
                config.matchCardContent === 'question-icon' && { backgroundColor: 'transparent' }
              ]}
              pointerEvents="none"
            >
              {renderCardContent(config.matchCardContent, gameState.matchCard, CARD_TEXT_SIZE)}
              {showMatchBorder && <View pointerEvents="none" style={styles.faceBorderOverlayGray} />}
              {!config.matchCardContent.includes('question') && <View pointerEvents="none" style={styles.faceBorderOverlay} />}
            </Animated.View>
            
            {/* Back */}
            <Animated.View
              style={[
                styles.cardSide,
                styles.cardBack,
                flipAnimations.backRotateY ? { transform: [{ perspective: PERSPECTIVE }, { rotateY: flipAnimations.backRotateY }] } : {}
              ]}
              pointerEvents="none"
            >
              {canShowText && renderCardContent(config.matchedMatchContent, gameState.matchCard, CARD_TEXT_SIZE)}
              {showMatchBorder && <View pointerEvents="none" style={styles.faceBorderOverlayGray} />}
              {!config.matchCardContent.includes('question') && <View pointerEvents="none" style={styles.faceBorderOverlay} />}
            </Animated.View>
          </Animated.View>
        </Animated.View>
      );
    }
  };

  // ==============================
  // RENDER
  // ==============================
  return (
    <View style={styles.screen}>
      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
        <Animated.View style={[styles.containerView, { opacity: screenOpacity }]} onLayout={onContainerLayout}>
          {canLayout && gameState.staticCards.map((card, i) => renderStaticCard(card, i))}
          {canLayout && renderMatchCard()}
        </Animated.View>
      </SafeAreaView>

      <GameToolbar
        isAtStart={isAtStart}
        isAtEnd={isAtEnd}
        isLocked={isLocked}
        onToStart={handleToStart}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onToEnd={handleToEnd}
        onLockPress={handleLockPress}
        onLockLongPress={handleLockLongPress}
        onRefresh={handleRefresh}
        toolbarHeight={getToolbarHeight(screen.width, screen.height)}
        insetsBottom={insets.bottom}
      />

      <SwitchInput
        onSwitchPress={switchControl.handleSwitchPress}
        enabled={switchControl.isEnabled}
      />
    </View>
  );
}

// ==============================
// STYLES
// ==============================
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  containerView: { flex: 1, position: 'relative', backgroundColor: '#fff' },

  matchCard: {
    position: 'absolute',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6EEF8',
    shadowColor: '#000',
    overflow: 'visible',
    zIndex: 2,
  },
  
  staticCard: {
    position: 'absolute',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E1E1',
    overflow: 'hidden',
  },
  
  highlightedCard: {
    borderWidth: 4,
    borderColor: '#4664CD',
    shadowColor: '#4664CD',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  
  cardSide: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 6,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
  },
  
  cardSide2D: {
    backfaceVisibility: 'visible',
  },
  
  cardBack: {
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  
  cardText: {
    color: '#000',
    textAlign: 'center',
  },
  
  faceBorderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 3,
    borderColor: '#B1D8F2',
    borderRadius: 6,
  },
  
  faceBorderOverlayGray: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 6,
  },
  
  questionIcon: {
    width: isTablet() ? 160 : 80,
    height: isTablet() ? 160 : 80,
  },
});

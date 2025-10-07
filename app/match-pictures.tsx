import { useNavigation } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  LayoutChangeEvent,
  PanResponder,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import SwitchInput from '../src/components/SwitchInput';
import { useSettings } from '../src/contexts/SettingsContext';
import { useSwitchControl } from '../src/hooks/useSwitchControl';
import { SFProText } from '../src/theme/typography';
import { isLandscape, isTablet } from '../src/utils/device';
import { computeLayout, getToolbarHeight } from '../src/utils/gameLayout';
import { resolveImageSource } from '../src/utils/imageUtils';
import { initializeAudio, playRewardSound, playWord } from '../src/utils/soundUtils';

// ==============================
// CONFIG
// ==============================
const CARD_ASPECT = 3 / 4; // height / width for 4:3 cards
const USE_SPECIAL_4_LAYOUT = true; // Enable bespoke layout for 4-card mode
const MIN_GAP_Y = 5; // Minimum vertical spacing between rows (px)

// Toolbar height provided by shared layout utils

// Layout engine moved to shared layout utils

// ==============================
// GAME TYPES
// ==============================
interface GameCard {
  id: string;
  image: string;
  text: string;
  sound?: string;
  isMatched: boolean;
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

// ==============================
// COMPONENT
// ==============================
export default function MatchPicturesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { cardsPerPage, settings, animationSpeed, locale, shuffleMode, switchCount, wordList } = useSettings();

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
  const [showWord, setShowWord] = useState(false);
  const [canShowText, setCanShowText] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Switch control for accessibility
  const switchControl = useSwitchControl({
    items: gameState.staticCards,
    onItemSelect: (card, index) => {
      if (gameState.isAnimating) return;
      
      // Check if this card matches the current match card
      if (card.image === gameState.matchCard.image) {
        // It's a match! Programmatically drag the match card to this position
        handleProgrammaticMatch(card, index);
      }
    },
    onAdvance: () => {
      // Advance to next match card
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
        
        // Reset switch highlighting
        switchControl.resetHighlight();
      }
    },
    autoAdvanceDelay: 2000,
  });

  // Animation speed factor: higher slider -> faster animations
  const speedFactor = 0.25 + 0.75 * (animationSpeed ?? 0.5);
  const DURATION = {
    move: Math.round(1000 / speedFactor),
    scale: Math.round(600 / speedFactor),
  };
  const [cardShakeAnimations] = useState([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]);

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const initialPosition = useRef({ x: 0, y: 0 });
  const ongoingTimeouts = useRef<number[]>([]);

  useEffect(() => {
    const setup = async () => {
      await initializeAudio();
      initializeGame(0);
    };
    setup();
  }, []);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setScreen(window));
    return () => sub?.remove();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={isLocked ? undefined : () => navigation.goBack()}
          disabled={isLocked}
          style={{ 
            opacity: isLocked ? 0.4 : 1,
            marginLeft: Platform.OS === 'ios' && parseInt(Platform.Version as string) >= 26 ? 3 : 0
          }}
        >
          <Image
            source={require('../assets/images/close-circle-icon.png')}
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
  const initializeGame = (startIndex: number = 0) => {
    cleanupCurrentRound();

    const groupSize = cardsPerPage;
    const endIndex = Math.min(startIndex + groupSize, wordList.length);
    let currentGroup = wordList.slice(startIndex, endIndex);
    
    // Apply shuffle mode logic
    if (shuffleMode === 'all') {
      // All: shuffle the entire wordList array globally
      const shuffledWords = [...wordList].sort(() => Math.random() - 0.5);
      currentGroup = shuffledWords.slice(startIndex, endIndex);
    } else if (shuffleMode === 'page') {
      // Page: shuffle only the current page's words
      currentGroup = [...currentGroup].sort(() => Math.random() - 0.5);
    }
    // Off: no shuffling, use original order

    if (currentGroup.length === 0) {
      return initializeGame(0);
    }

    const staticCards: GameCard[] = currentGroup.map((w, i) => ({
      id: `static-${i}`,
      image: w.image,
      text: w.text,
      sound: w.sound || undefined,
      isMatched: false,
    }));

    const indices = staticCards.map((_, i) => i);
    // Always random for match card selection
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

    setupRound(staticCards, targetOrder, 0);
  };

  const setupRound = (activeSet: GameCard[], targetOrder: number[], currentIndex: number) => {
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
    };

    setGameState(prev => ({
      ...prev,
      matchCard: newMatchCard,
      isAnimating: false,
      activeSet,
      targetOrder,
      currentIndex,
    }));

    Animated.timing(cardOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (settings.playBeforeMatch && newMatchCard.sound) playWord(newMatchCard.sound, { ttsEnabled: settings.textToSpeech, locale, text: newMatchCard.text });
    });
  };

  // ==============================
  // PLAY AREA & LAYOUT
  // ==============================
  const TOOLBAR_HEIGHT = getToolbarHeight(screen.width, screen.height);
  const canLayout = containerSize.width > 0 && containerSize.height > 0;

  const layout = useMemo(() => {
    if (!canLayout) return null;
    const playW = containerSize.width;
    const playH = containerSize.height;
    return computeLayout(cardsPerPage as 1 | 2 | 3 | 4 | 6 | 8, playW, playH, isPad, portrait);
  }, [canLayout, containerSize, isPad, portrait, cardsPerPage]);

  // ==============================
  // ANIMATION, DnD
  // ==============================
  const PERSPECTIVE = 800;

  const shakeCard = (idx: number, speed = 1) => {
    const shake = cardShakeAnimations[idx];
    if (!shake) return;
    const sign = (idx === 0 || idx === 3) ? +1 : -1;
    shake.setValue(0);
    Animated.timing(shake, { toValue: -Math.PI / 8 * sign, duration: 500 * speed, useNativeDriver: true })
      .start(f1 => {
        if (!f1) return;
        Animated.timing(shake, { toValue: Math.PI / 8 * sign, duration: 1000 * speed, useNativeDriver: true })
          .start(f2 => {
            if (!f2) return;
            Animated.timing(shake, { toValue: 0, duration: 500 * speed, useNativeDriver: true }).start();
          });
      });
  };
  const shakeAllCards = () => {
    gameState.staticCards.forEach((_, i) => shakeCard(i, 1));
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !gameState.isAnimating,
    onMoveShouldSetPanResponder: () => !gameState.isAnimating,
    onPanResponderGrant: () => {
      Animated.spring(cardScale, { toValue: 1.1, useNativeDriver: true }).start();
    },
    onPanResponderMove: Animated.event([null, { dx: cardPosition.x, dy: cardPosition.y }], { useNativeDriver: false }),
    onPanResponderRelease: (e, g) => {
      if (gameState.isAnimating) return;
      const tap = Math.abs(g.dx) < 10 && Math.abs(g.dy) < 10;
      if (tap) {
        if (settings.playBeforeMatch && gameState.matchCard.sound) playWord(gameState.matchCard.sound, { ttsEnabled: settings.textToSpeech, locale, text: gameState.matchCard.text });
        Animated.parallel([
          Animated.spring(cardPosition, { toValue: { x: 0, y: 0 }, tension: 100, friction: 8, useNativeDriver: false }),
          Animated.spring(cardScale, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }),
        ]).start();
        return;
      }
      const dropPos = { x: initialPosition.current.x + g.dx, y: initialPosition.current.y + g.dy };
      const matched = findMatchedCard(dropPos);
      if (matched && matched.image === gameState.matchCard.image) {
        handleSuccessfulMatch(matched);
      } else {
        handleFailedMatch();
      }
    },
  });

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
      const threshold = (layout?.cardSize.w ?? 0) * 0.6;
      if (dist < threshold) return gameState.staticCards[i];
    }
    return null;
  };

  const handleSuccessfulMatch = (matchedCard: GameCard) => {
    setGameState(prev => ({ ...prev, isAnimating: true }));
    const centers = getStaticCenterPositions();
    const matchedIndex = gameState.staticCards.findIndex(c => c.id === matchedCard.id);
    const target = centers[matchedIndex];
    if (!target) return;

    Animated.parallel([
      Animated.timing(cardPosition, {
        toValue: { x: target.x - initialPosition.current.x, y: target.y - initialPosition.current.y },
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(cardScale, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      if (settings.playAfterMatch && gameState.matchCard.sound) playWord(gameState.matchCard.sound, { ttsEnabled: settings.textToSpeech, locale, text: gameState.matchCard.text });
      setGameState(prev => {
        const updated = prev.staticCards.map((c, i) => (i === matchedIndex ? { ...c, isMatched: true } : c));
        const revealed = { ...prev.revealedMap, [matchedCard.image]: true };
        return { ...prev, staticCards: updated, revealedMap: revealed };
      });
      performFlipAnimation();
    });
  };

  const performFlipAnimation = () => {
    setCanShowText(true);
    Animated.timing(flipAnimation, { toValue: 1, duration: 2000, useNativeDriver: true }).start(() => {
      setShowWord(true);
      const t1 = setTimeout(() => {
        Animated.timing(cardOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
          setGameState(prev => ({
            ...prev,
            matchCard: { ...prev.matchCard, image: '', text: '' },
            isAnimating: true,
          }));
          const t2 = setTimeout(() => {
            advanceOrFinish();
          }, 100);
          ongoingTimeouts.current.push(t2);
        });
      }, 1200);
      ongoingTimeouts.current.push(t1 as unknown as number);
    });
  };

  const handleFailedMatch = () => {
    Animated.parallel([
      Animated.spring(cardPosition, { toValue: { x: 0, y: 0 }, tension: 100, friction: 8, useNativeDriver: false }),
      Animated.spring(cardScale, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }),
    ]).start();
  };

  const handleProgrammaticMatch = (card: GameCard, idx: number) => {
    setGameState(prev => ({ ...prev, isAnimating: true }));
    const centers = getStaticCenterPositions();
    const target = centers[idx];
    if (!target) return;
    Animated.spring(cardScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start(() => {
      Animated.parallel([
        Animated.timing(cardPosition, {
          toValue: { x: target.x - initialPosition.current.x, y: target.y - initialPosition.current.y },
          duration: DURATION.move,
          useNativeDriver: false,
        }),
        Animated.timing(cardScale, { toValue: 1, duration: DURATION.scale, useNativeDriver: true }),
      ]).start(() => {
        if (settings.playAfterMatch && gameState.matchCard.sound) playWord(gameState.matchCard.sound, { ttsEnabled: settings.textToSpeech, locale, text: gameState.matchCard.text });
        setGameState(prev => {
          const updated = prev.staticCards.map((c, i) => (i === idx ? { ...c, isMatched: true } : c));
          const revealed = { ...prev.revealedMap, [card.image]: true };
          return { ...prev, staticCards: updated, revealedMap: revealed };
        });
        performFlipAnimation();
      });
    });
  };

  const advanceOrFinish = async () => {
    const { activeSet, targetOrder, currentIndex, currentGroupStart } = gameState;
    if (!activeSet || !activeSet.length) return;
    const hasNext = currentIndex + 1 < targetOrder.length;
    if (hasNext) {
      setupRound(activeSet, targetOrder, currentIndex + 1);
      setGameState(prev => ({ ...prev, level: prev.level + 1 }));
    } else {
      if (settings.enableReward) {
        shakeAllCards();
        await playRewardSound();
      }
      // Auto-advance to next page if enabled
      if (settings.automatic) {
        const newStart = currentGroupStart + cardsPerPage;
        if (newStart < wordList.length) {
          cleanupCurrentRound();
          initializeGame(newStart);
          return;
        }
      }
      setGameState(prev => ({ ...prev, isAnimating: false }));
    }
  };

  const cleanupCurrentRound = () => {
    cardPosition.stopAnimation();
    cardScale.stopAnimation();
    flipAnimation.stopAnimation();
    cardOpacity.stopAnimation();
    ongoingTimeouts.current.forEach(t => clearTimeout(t));
    ongoingTimeouts.current = [];
    cardPosition.setValue({ x: 0, y: 0 });
    cardScale.setValue(1);
    flipAnimation.setValue(0);
    cardOpacity.setValue(1);
    setShowWord(false);
    setCanShowText(false);
    cardShakeAnimations.forEach(a => {
      a.stopAnimation();
      a.setValue(0);
    });
  };

  // ==============================
  // NAV
  // ==============================
  const handleToStart = () => { cleanupCurrentRound(); initializeGame(0); };
  const handlePrevious = () => {
    cleanupCurrentRound();
    const { currentGroupStart } = gameState;
    const size = cardsPerPage;
    const newStart = Math.max(0, currentGroupStart - size);
    initializeGame(newStart);
  };
  const handleNext = () => {
    cleanupCurrentRound();
    const { currentGroupStart } = gameState;
    const size = cardsPerPage;
    const newStart = currentGroupStart + size;
    if (newStart < wordList.length) initializeGame(newStart);
  };
  const handleToEnd = () => {
    cleanupCurrentRound();
    const size = cardsPerPage;
    const remainder = wordList.length % size;
    const lastStart = Math.max(0, wordList.length - (remainder === 0 ? size : remainder));
    initializeGame(lastStart);
  };

  const isAtStart = gameState.currentGroupStart === 0;
  const isAtEnd = (() => {
    const size = cardsPerPage;
    return gameState.currentGroupStart + size >= wordList.length;
  })();

  const handleLockPress = () => Alert.alert('Info', 'Kilitlemek için 3 saniye basılı tut.');
  const handleLockLongPress = () => setIsLocked(p => !p);
  const handleRefresh = () => { cleanupCurrentRound(); initializeGame(gameState.currentGroupStart); };

  // ==============================
  // RENDER HELPERS
  // ==============================
  const onContainerLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setContainerSize({ width, height });
  };

  const renderStaticCard = (card: GameCard, index: number) => {
    if (!layout) return null;
    const r = layout.statics[index];
    if (!r) return null;

    const onTap = () => {
      if (gameState.isAnimating) return;
      if (card.image === gameState.matchCard.image) {
        handleProgrammaticMatch(card, index);
      }
    };

    const shake = cardShakeAnimations[index];
    const shakeTransform = shake ? {
      transform: [{
        rotate: shake.interpolate({ inputRange: [-Math.PI, Math.PI], outputRange: ['-180deg', '180deg'] })
      }]
    } : undefined;

    // Check if this card is highlighted by switch control
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
            isHighlighted && {
              borderWidth: 4,
              borderColor: '#4664CD',
              shadowColor: '#4664CD',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 8,
              elevation: 8,
            },
          ]}
          onPress={onTap}
          activeOpacity={0.8}
        >
          {card.isMatched ? (
            <View style={[styles.cardSide, styles.cardBack]} pointerEvents="none">
              <SFProText
                weight="semibold"
                style={[
                  styles.cardText,
                  { fontSize: Math.max(18, r.height * 0.22) * (settings.largeText ? 1.2 : 1) },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {settings.capitalLetters ? card.text.toLocaleUpperCase(locale) : card.text}
              </SFProText>
            </View>
          ) : (
            <Image source={resolveImageSource(card.image)} style={styles.cardImage} resizeMode="cover"/>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderMatchCard = () => {
    if (!layout || !gameState.matchCard.image || !gameState.matchCard.text) return null;

    const r = layout.match;
    const frontRotateY = flipAnimation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
    const backRotateY  = flipAnimation.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

    return (
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.matchCard,
          { left: r.left, top: r.top, width: r.width, height: r.height },
          { transform: [{ translateX: cardPosition.x }, { translateY: cardPosition.y }] },
        ]}
        onLayout={e => {
          const { x, y, width, height } = e.nativeEvent.layout;
          initialPosition.current = { x: x + width / 2, y: y + height / 2 };
        }}
      >
        <Animated.View style={{ width: '100%', height: '100%', transform: [{ scale: cardScale }], opacity: cardOpacity }}>
          {/* FRONT: image */}
          <Animated.View
            style={[styles.cardSide, { transform: [{ perspective: PERSPECTIVE }, { rotateY: frontRotateY }] }]}
            pointerEvents="none"
          >
            <Image source={resolveImageSource(gameState.matchCard.image)} style={styles.cardImage} resizeMode="cover" />
          </Animated.View>
          {/* BACK: text */}
          <Animated.View
            style={[styles.cardSide, styles.cardBack, { transform: [{ perspective: PERSPECTIVE }, { rotateY: backRotateY }] }]}
            pointerEvents="none"
          >
            {canShowText && (
              <SFProText
                weight="semibold"
                style={[
                  styles.cardText,
                  { fontSize: Math.max(18, r.height * 0.22) * (settings.largeText ? 1.2 : 1) },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {settings.capitalLetters ? gameState.matchCard.text.toLocaleUpperCase(locale) : gameState.matchCard.text }
              </SFProText>
            )}
          </Animated.View>
        </Animated.View>
      </Animated.View>
    );
  };

// ==============================
// RENDER
// ==============================
  return (
    <View style={styles.screen}>
      {/* Play area */}
      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
        <View style={styles.containerView} onLayout={onContainerLayout}>
          {canLayout && gameState.staticCards.map((card, i) => renderStaticCard(card, i))}
          {canLayout && renderMatchCard()}
        </View>
      </SafeAreaView>

      {/* Bottom toolbar */}
      <View style={[styles.bottomBar, { height: getToolbarHeight(screen.width, screen.height) + insets.bottom }]}>
        <View style={[styles.toolbar, { paddingTop: Math.max(10, TOOLBAR_HEIGHT * 0.2) }]}>
          {/* Left controls */}
          <View style={styles.toolbarGroup}>
            <TouchableOpacity
              style={[styles.toolbarButton, (isAtStart || isLocked) && styles.toolbarButtonDisabled]}
              onPress={(isAtStart || isLocked) ? undefined : handleToStart}
              disabled={isAtStart || isLocked}
            >
              <Image
                source={require('../assets/images/to-start-icon.png')}
                style={[styles.toolbarIcon, (isAtStart || isLocked) && styles.toolbarIconDisabled]}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <View style={{ width: 15 }} />
            <TouchableOpacity
              style={[styles.toolbarButton, isAtStart && styles.toolbarButtonDisabled]}
              onPress={isAtStart ? undefined : handlePrevious}
              disabled={isAtStart}
            >
              <Image
                source={require('../assets/images/previous-icon.png')}
                style={[styles.toolbarIcon, isAtStart && styles.toolbarIconDisabled]}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {/* Middle */}
          <View style={styles.toolbarGroup}>
            <TouchableOpacity style={styles.toolbarButton} onPress={handleLockPress} onLongPress={handleLockLongPress} delayLongPress={3000}>
              <Image
                source={isLocked ? require('../assets/images/unlock.png') : require('../assets/images/lock-icon.png')}
                style={styles.toolbarIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <View style={{ width: 16 }} />
            <TouchableOpacity style={styles.toolbarButton} onPress={handleRefresh}>
              <Image source={require('../assets/images/refresh-icon.png')} style={styles.toolbarIcon} resizeMode="contain" />
            </TouchableOpacity>
          </View>

          {/* Right */}
          <View style={styles.toolbarGroup}>
            <TouchableOpacity
              style={[styles.toolbarButton, isAtEnd && styles.toolbarButtonDisabled]}
              onPress={isAtEnd ? undefined : handleNext}
              disabled={isAtEnd}
            >
              <Image source={require('../assets/images/next-icon.png')} style={[styles.toolbarIcon, isAtEnd && styles.toolbarIconDisabled]} resizeMode="contain" />
            </TouchableOpacity>
            <View style={{ width: 15 }} />
            <TouchableOpacity
              style={[styles.toolbarButton, (isAtEnd || isLocked) && styles.toolbarButtonDisabled]}
              onPress={(isAtEnd || isLocked) ? undefined : handleToEnd}
              disabled={isAtEnd || isLocked}
            >
              <Image source={require('../assets/images/to-end-icon.png')} style={[styles.toolbarIcon, (isAtEnd || isLocked) && styles.toolbarIconDisabled]} resizeMode="contain" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Switch Input for accessibility */}
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
  bottomBar: { backgroundColor: '#F3F3F3', justifyContent: 'flex-start', alignItems: 'center' },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 21 },
  toolbarGroup: { flexDirection: 'row', alignItems: 'center' },
  toolbarButton: { justifyContent: 'center', alignItems: 'center' },
  toolbarIcon: {},
  toolbarButtonDisabled: {},
  toolbarIconDisabled: { opacity: 0.4 },

  matchCard: {
    position: 'absolute',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#B1D8F2',
    shadowColor: '#000',
    overflow: 'hidden',
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
  cardSide: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 6,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
  },
  cardBack: { backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  cardImage: { width: '100%', height: '100%', borderRadius: 6 },
  cardText: { color: '#000', textAlign: 'center' },
});
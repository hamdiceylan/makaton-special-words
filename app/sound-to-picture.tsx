import { useNavigation } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WORD_IMAGES } from '../src/constants/words';
import { useSettings } from '../src/contexts/SettingsContext';
import { useSwitchControl } from '../src/hooks/useSwitchControl';
import { SFProText } from '../src/theme/typography';
import { isCurrentlyLandscape, isLandscape, isTablet } from '../src/utils/device';
import { computeLayout, getToolbarHeight } from '../src/utils/gameLayout';
import { initializeAudio, playRewardSound, playWord } from '../src/utils/soundUtils';
import { resolveImageSource } from '../src/utils/imageUtils';

// Toolbar height provided by shared layout utils

interface GameCard {
  id: string;
  image: string;
  text: string;
  isMatched: boolean;
}

interface GameState {
  level: number;
  matchCard: GameCard;
  staticCards: GameCard[];
  isAnimating: boolean;
  activeSet: GameCard[]; // current 4 wordList as fixed set
  targetOrder: number[]; // shuffled indices [0..3]
  currentIndex: number;  // pointer into targetOrder
  revealedMap: { [key: string]: boolean }; // image/text key -> revealed
  currentGroupStart: number; // starting index of current 4-word group
}

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

  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const isPad = isTablet();
  const portrait = !isLandscape(screenDimensions.width, screenDimensions.height);

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
  // Shake animation states for each card
  const [cardShakeAnimations] = useState([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]);

  // Game area (containerView) dimensions
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // matchCard's initial center coordinates within container (center)
  const initialPosition = useRef({ x: 0, y: 0 });
  
  // Ref to track ongoing timeouts for cleanup
  const ongoingTimeouts = useRef<number[]>([]);

  // Shake animation function based on the Objective-C code
  const shakeCard = (cardIndex: number, speedMultiplier: number = 1) => {
    const shakeAnimation = cardShakeAnimations[cardIndex];
    if (!shakeAnimation) return;

    // Determine sign based on card position (similar to Objective-C logic)
    // For 4 cards: first and fourth cards get +1, second and third get -1
    const sign = ((cardIndex === 0 || cardIndex === 3) ? +1 : -1);

    // Reset animation value
    shakeAnimation.setValue(0);

    // First rotation: -M_PI/8 * sign
    Animated.timing(shakeAnimation, {
      toValue: -Math.PI / 8 * sign,
      duration: 500 * speedMultiplier,
      useNativeDriver: true,
    }).start((finished) => {
      if (!finished) return;

      // Second rotation: +M_PI/8 * sign
      Animated.timing(shakeAnimation, {
        toValue: Math.PI / 8 * sign,
        duration: 1000 * speedMultiplier,
        useNativeDriver: true,
      }).start((finished) => {
        if (!finished) return;

        // Final rotation: back to 0
        Animated.timing(shakeAnimation, {
          toValue: 0,
          duration: 500 * speedMultiplier,
          useNativeDriver: true,
        }).start();
      });
    });
  };

  // Shake all cards when a group is completed
  const shakeAllCards = () => {
    cardShakeAnimations.forEach((_, index) => {
      shakeCard(index, 1);
    });
  };

  useEffect(() => {
    const setupAudio = async () => {
      await initializeAudio();
      initializeGame();
    };
    setupAudio();
  }, []);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  // Update header close button enabled/disabled based on lock state
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

  const initializeGame = (startIndex: number = 0) => {
    // Clean up any ongoing animations and states first
    cleanupCurrentRound();
    
    // Get current group based on cards-per-page
    const endIndex = Math.min(startIndex + cardsPerPage, wordList.length);
    let currentGroup = wordList.slice(startIndex, endIndex);
    
    // Apply shuffle mode logic
    if (shuffleMode === 'all') {
      // All: shuffle the entire wordList array globally
      const shuffledWords = [...wordList].sort(() => Math.random() - 0.5);
      currentGroup = shuffledWords.slice(startIndex, endIndex);
    } else if (shuffleMode === 'page') {
      // Page: shuffle only the current page's wordList
      currentGroup = [...currentGroup].sort(() => Math.random() - 0.5);
    }
    // Off: no shuffling, use original order
    
    // If we don't have enough wordList left, reset to beginning
    if (currentGroup.length === 0) {
      return initializeGame(0);
    }

    const staticCards: GameCard[] = currentGroup.map((w, i) => ({
      id: `static-${i}`,
      image: w.image,
      text: w.text,
      isMatched: false,
    }));

    // Target order among the current static cards - always random for match card selection
    const indices = staticCards.map((_, i) => i);
    const targetOrder = [...indices].sort(() => Math.random() - 0.5);

    // Set static once
    setGameState(prev => ({
      ...prev,
      activeSet: staticCards,
      staticCards,
      targetOrder,
      currentIndex: 0,
      revealedMap: {},
      currentGroupStart: startIndex,
    }));

    // Initialize first center match card
    setupRound(staticCards, targetOrder, 0);
  };

  const setupRound = (activeSet: GameCard[], targetOrder: number[], currentIndex: number) => {
    if (activeSet.length === 0 || targetOrder.length === 0) return;
    
    // Clean up any ongoing animations and states first
    cleanupCurrentRound();
    
    const targetIdx = targetOrder[currentIndex];
    const target = activeSet[targetIdx];

    const newMatchCard: GameCard = {
      id: 'match',
      image: target.image,
      text: target.text,
      isMatched: false,
    };

    // Set the new match card immediately after cleanup
    setGameState(prev => ({
      ...prev,
      matchCard: newMatchCard,
      isAnimating: false,
      activeSet, // unchanged fixed static set
      targetOrder,
      currentIndex,
    }));
    
    // Fade in the new card and play its sound
    Animated.timing(cardOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // Play the word sound after card appears
      if (settings.playBeforeMatch && newMatchCard.image) {
        playWord(newMatchCard.image, { ttsEnabled: settings.textToSpeech, locale, text: newMatchCard.text });
      }
    });
  };

  // Don't calculate until container dimensions are obtained
  const canLayout = containerSize.width > 0 && containerSize.height > 0;

  // Shared layout
  const layout = React.useMemo(() => {
    if (containerSize.width <= 0 || containerSize.height <= 0) return null;
    return computeLayout(cardsPerPage as 1 | 2 | 3 | 4 | 6 | 8, containerSize.width, containerSize.height, isPad, portrait);
  }, [containerSize, isPad, portrait, cardsPerPage]);
  const CARD_WIDTH = layout?.cardSize.w ?? 0;
  const CARD_HEIGHT = layout?.cardSize.h ?? 0;
  const CARD_TEXT_SIZE = Math.max(18, CARD_HEIGHT * 0.22);
  
  // Get responsive toolbar height
  const TOOLBAR_HEIGHT = getToolbarHeight(screenDimensions.width, screenDimensions.height);
  
  // Vertical overflow handled inside shared layout
  
  const PERSPECTIVE = 800;

  const getStaticCardPositions = () => {
    if (!layout) return [];
    return layout.statics.map(r => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 }));
  };

  // Drag & drop with tap detection
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !gameState.isAnimating,
    onMoveShouldSetPanResponder: () => !gameState.isAnimating,

    onPanResponderGrant: () => {
      Animated.spring(cardScale, {
        toValue: 1.1,
        useNativeDriver: true,
      }).start();
    },

    onPanResponderMove: Animated.event(
      [null, { dx: cardPosition.x, dy: cardPosition.y }],
      { useNativeDriver: false }
    ),

    onPanResponderRelease: (event, gestureState) => {
      if (gameState.isAnimating) return;

      // Check if it's a tap (minimal movement) or a drag
      const isTab = Math.abs(gestureState.dx) < 10 && Math.abs(gestureState.dy) < 10;
      
      if (isTab) {
        // It's a tap - play sound and return card to center
        if (settings.playBeforeMatch && gameState.matchCard.image) {
          playWord(gameState.matchCard.image, { ttsEnabled: settings.textToSpeech, locale, text: gameState.matchCard.text });
        }
        Animated.parallel([
          Animated.spring(cardPosition, {
            toValue: { x: 0, y: 0 },
            tension: 100,
            friction: 8,
            useNativeDriver: false,
          }),
          Animated.spring(cardScale, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
        return;
      }

      // It's a drag - check for matches
      const dropPosition = {
        x: initialPosition.current.x + gestureState.dx,
        y: initialPosition.current.y + gestureState.dy,
      };

      const matchedCard = findMatchedCard(dropPosition);

      if (matchedCard && matchedCard.text === gameState.matchCard.text) {
        handleSuccessfulMatch(matchedCard);
      } else {
        handleFailedMatch();
      }
    },
  });

  const findMatchedCard = (dropPosition: { x: number; y: number }) => {
    const positions = getStaticCardPositions();
    for (let i = 0; i < gameState.staticCards.length; i++) {
      const p = positions[i];
      if (!p) continue;
      const dx = dropPosition.x - p.x;
      const dy = dropPosition.y - p.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < CARD_WIDTH * 0.6) {
        return gameState.staticCards[i];
      }
    }
    return null;
  };

  const handleSuccessfulMatch = (matchedCard: GameCard) => {
    setGameState(prev => ({ ...prev, isAnimating: true }));

    const positions = getStaticCardPositions();
    const matchedIndex = gameState.staticCards.findIndex(c => c.id === matchedCard.id);
    const target = positions[matchedIndex];

    if (!target) return;

    // Delay revealing text on the static card until the flip starts

    Animated.parallel([
      Animated.timing(cardPosition, {
        toValue: {
          x: target.x - initialPosition.current.x,
          y: target.y - initialPosition.current.y,
        },
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(cardScale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Play the matched word sound for successful match
      if (settings.playAfterMatch && gameState.matchCard.image) {
        playWord(gameState.matchCard.image, { ttsEnabled: settings.textToSpeech, locale, text: gameState.matchCard.text });
      }

      // Now mark the static card as matched (show its text) right before flip
      setGameState(prev => {
        const updatedStatics = prev.staticCards.map((c, i) => (
          i === matchedIndex ? { ...c, isMatched: true } : c
        ));
        const nextRevealed = { ...prev.revealedMap, [matchedCard.image]: true };
        return { ...prev, staticCards: updatedStatics, revealedMap: nextRevealed };
      });

      performFlipAnimation();
    });
  };

  const performFlipAnimation = () => {
    // Enable text visibility right before starting the flip
    setCanShowText(true);
    setShowWord(true);
    
    // Single flip: show word
    Animated.timing(flipAnimation, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start(() => {
      // After showing word, advance to next round
      const timeout1 = setTimeout(() => {
        // Hide the card temporarily before advancing
        Animated.timing(cardOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setGameState(prev => ({ 
            ...prev, 
            matchCard: { ...prev.matchCard, image: '', text: '' },
            isAnimating: true 
          }));
          
          // Small delay to ensure card is hidden before resetting position
          const timeout2 = setTimeout(() => {
            advanceOrFinish();
          }, 100);
          ongoingTimeouts.current.push(timeout2);
        });
      }, 1000);
      ongoingTimeouts.current.push(timeout1);
    });
  };

  const handleFailedMatch = () => {
    Animated.parallel([
      Animated.spring(cardPosition, {
        toValue: { x: 0, y: 0 },
        tension: 100,
        friction: 8,
        useNativeDriver: false,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleProgrammaticMatch = (matchedCard: GameCard, matchedIndex: number) => {
    setGameState(prev => ({ ...prev, isAnimating: true }));

    const positions = getStaticCardPositions();
    const target = positions[matchedIndex];

    if (!target) return;

    // First, scale up the match card slightly to show it's being "picked up"
    Animated.spring(cardScale, {
      toValue: 1,
      tension: 60,
      friction: 8,
      useNativeDriver: true,
    }).start(() => {
      // Then animate the card to the target position
      Animated.parallel([
        Animated.timing(cardPosition, {
          toValue: {
            x: target.x - initialPosition.current.x,
            y: target.y - initialPosition.current.y,
          },
          duration: DURATION.move,
          useNativeDriver: false,
        }),
        Animated.timing(cardScale, {
          toValue: 1,
          duration: DURATION.scale,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Play the matched word sound for successful match
        if (settings.playAfterMatch && gameState.matchCard.image) {
          playWord(gameState.matchCard.image, { ttsEnabled: settings.textToSpeech, locale, text: gameState.matchCard.text });
        }

        // Mark the static card as matched (show its text) right before flip
        setGameState(prev => {
          const updatedStatics = prev.staticCards.map((c, i) => (
            i === matchedIndex ? { ...c, isMatched: true } : c
          ));
          const nextRevealed = { ...prev.revealedMap, [matchedCard.image]: true };
          return { ...prev, staticCards: updatedStatics, revealedMap: nextRevealed };
        });

        performFlipAnimation();
      });
    });
  };

  const advanceOrFinish = async () => {
    const { activeSet, targetOrder, currentIndex, currentGroupStart } = gameState;
    if (!activeSet || activeSet.length === 0) return;

    const hasNext = currentIndex + 1 < targetOrder.length;
    if (hasNext) {
      // Proceed to next target in current group
      setupRound(activeSet, targetOrder, currentIndex + 1);
      setGameState(prev => ({ ...prev, level: prev.level + 1 }));
    } else {
      // Completed current group of 4 wordList
      // Trigger reward only if enabled in settings
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
      // Otherwise stop animating and wait for user navigation
      setGameState(prev => ({ ...prev, isAnimating: false }));
    }
  };

  // Cleanup function to cancel ongoing animations and reset states
  const cleanupCurrentRound = () => {
    // Cancel all ongoing animations
    cardPosition.stopAnimation();
    cardScale.stopAnimation();
    flipAnimation.stopAnimation();
    cardOpacity.stopAnimation();
    
    // Clear all ongoing timeouts
    ongoingTimeouts.current.forEach(timeout => clearTimeout(timeout));
    ongoingTimeouts.current = [];
    
    // Reset all animation values to initial state
    cardPosition.setValue({ x: 0, y: 0 });
    cardScale.setValue(1);
    flipAnimation.setValue(0);
    cardOpacity.setValue(1);
    
    // Reset UI states
    setShowWord(false);
    setCanShowText(false);
    
    // Stop any ongoing shake animations
    cardShakeAnimations.forEach(animation => {
      animation.stopAnimation();
      animation.setValue(0);
    });
  };

  // Navigation handlers
  const handleToStart = () => {
    cleanupCurrentRound();
    initializeGame(0);
  };

  const handlePrevious = () => {
    cleanupCurrentRound();
    const { currentGroupStart } = gameState;
    const newStart = Math.max(0, currentGroupStart - cardsPerPage);
    initializeGame(newStart);
  };

  const handleNext = () => {
    cleanupCurrentRound();
    const { currentGroupStart } = gameState;
    const newStart = currentGroupStart + cardsPerPage;
    if (newStart < wordList.length) {
      initializeGame(newStart);
    }
  };

  const handleToEnd = () => {
    cleanupCurrentRound();
    // Find the last complete group based on cards-per-page
    const size = cardsPerPage;
    const lastGroupStart = Math.max(0, wordList.length - (wordList.length % size === 0 ? size : wordList.length % size));
    initializeGame(lastGroupStart);
  };

  // Check if we're at the start or end of the list
  const isAtStart = gameState.currentGroupStart === 0;
  const isAtEnd = gameState.currentGroupStart + cardsPerPage >= wordList.length;

  // Lock button handlers
  const handleLockPress = () => {
    Alert.alert('Info', 'Hold for 3 seconds to lock.');
  };
  const handleLockLongPress = () => {
    setIsLocked(prev => !prev);
  };

  // Refresh current stage: reset all matches and pick a new random word (like start)
  const handleRefresh = () => {
    cleanupCurrentRound();
    // Reinitialize the same group start to reset static cards and target order
    initializeGame(gameState.currentGroupStart);
  };

  const renderStaticCard = (card: GameCard, index: number) => {
    const positions = getStaticCardPositions();
    const p = positions[index];

    if (!p) return null;

    const handleCardTap = () => {
      if (gameState.isAnimating) return;
      
      // Check if this card matches the current match card (match by text)
      if (card.text === gameState.matchCard.text) {
        // It's a match! Programmatically drag the match card to this position
        handleProgrammaticMatch(card, index);
      } else {
        // Not a match - don't play sound, just do nothing
        // (Previously played sound here, but removed as requested)
      }
    };

    const shakeAnimation = cardShakeAnimations[index];
    const shakeTransform = shakeAnimation ? {
      transform: [{ 
        rotate: shakeAnimation.interpolate({
          inputRange: [-Math.PI, Math.PI],
          outputRange: ['-180deg', '180deg'],
        })
      }]
    } : {};

    return (
      <Animated.View
        key={card.id}
        style={[
          {
            // center-based position → left/top = center - half size
            position: 'absolute',
            left: p.x - CARD_WIDTH / 2,
            top: p.y - CARD_HEIGHT / 2,
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
          },
          shakeTransform,
        ]}
      >
        <TouchableOpacity
          style={[
            styles.staticCard,
            {
              width: CARD_WIDTH,
              height: CARD_HEIGHT,
            },
          ]}
          onPress={handleCardTap}
          activeOpacity={0.8}
        >
          {card.isMatched ? (
            <View style={[styles.cardSide, styles.cardBack]} pointerEvents="none">
              <SFProText
                weight="semibold"
                style={[
                  styles.cardText,
                  settings.largeText && { fontSize: CARD_TEXT_SIZE * 1.2 },
                  !settings.largeText && { fontSize: CARD_TEXT_SIZE },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {settings.capitalLetters ? card.text.toLocaleUpperCase(locale) : card.text }
              </SFProText>
            </View>
          ) : (
            <View style={[styles.cardSide, styles.cardBack]} pointerEvents="none">
              <Image
                source={resolveImageSource(card.image)}
                style={styles.cardImage}
                resizeMode="cover"
              />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderMatchCard = () => {
    const frontRotateY = flipAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg'],
    });

    const backRotateY = flipAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ['180deg', '360deg'],
    });


    return (
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.matchCard,
          layout && { left: layout.match.left, top: layout.match.top, width: layout.match.width, height: layout.match.height },
          {
            transform: [
              { translateX: cardPosition.x },
              { translateY: cardPosition.y },
            ],
          },
        ]}
        onLayout={(e) => {
          // matchCard's center within container:
          const layout = e.nativeEvent.layout;
          initialPosition.current = {
            x: layout.x + CARD_WIDTH / 2,
            y: layout.y + CARD_HEIGHT / 2,
          };
        }}
      >
        <Animated.View
          style={{
            width: '100%',
            height: '100%',
            transform: [{ scale: cardScale }],
            opacity: cardOpacity,
          }}
        >
          {/* Front side - Question circle icon (initial state) */}
          <Animated.View
            style={[
              styles.cardSide,
              styles.cardBack,
              { 
                transform: [{ perspective: PERSPECTIVE }, { rotateY: frontRotateY }],
                backgroundColor: 'transparent'
              },
            ]}
            pointerEvents="none"
          >
            <Image
              source={require('../assets/images/question-circle-icon.png')}
              style={styles.questionIcon}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Back side - Word text (after flip) */}
          <Animated.View
            style={[
              styles.cardSide,
              styles.cardBack,
              { transform: [{ perspective: PERSPECTIVE }, { rotateY: backRotateY }] },
            ]}
            pointerEvents="none"
          >
            {showWord && (
              <SFProText
                weight="semibold"
                style={[
                  styles.cardText,
                  settings.largeText && { fontSize: CARD_TEXT_SIZE * 1.2 },
                  !settings.largeText && { fontSize: CARD_TEXT_SIZE },
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

  return (
    <View style={styles.screen}>
      {/* Top (VStack's first view): Game area containerView */}
      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
        <View
          style={styles.containerView}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setContainerSize({ width, height });
          }}
        >
          {/* Static cards */}
          {canLayout && gameState.staticCards.map((card, i) => renderStaticCard(card, i))}
          {/* Middle matchCard */}
          {canLayout && gameState.matchCard.image && gameState.matchCard.text && renderMatchCard()}
        </View>
      </SafeAreaView>

      {/* Bottom (VStack's second view): Responsive height */}
      <View style={[styles.bottomBar, { height: TOOLBAR_HEIGHT + insets.bottom }]}> 
        <View style={styles.toolbar}>
          {/* Left group: to-start-icon and previous-icon */}
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

          {/* Middle group: lock-icon and refresh-icon */}
          <View style={styles.toolbarGroup}>
            <TouchableOpacity 
              style={styles.toolbarButton}
              onPress={handleLockPress}
              onLongPress={handleLockLongPress}
              delayLongPress={3000}
            >
              <Image 
                source={isLocked ? require('../assets/images/unlock.png') : require('../assets/images/lock-icon.png')} 
                style={styles.toolbarIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <View style={{ width: 16 }} />
            <TouchableOpacity style={styles.toolbarButton} onPress={handleRefresh}>
              <Image 
                source={require('../assets/images/refresh-icon.png')} 
                style={styles.toolbarIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {/* Right group: next-icon and to-end-icon */}
          <View style={styles.toolbarGroup}>
            <TouchableOpacity 
              style={[styles.toolbarButton, isAtEnd && styles.toolbarButtonDisabled]} 
              onPress={isAtEnd ? undefined : handleNext}
              disabled={isAtEnd}
            >
              <Image 
                source={require('../assets/images/next-icon.png')}
                style={[styles.toolbarIcon, isAtEnd && styles.toolbarIconDisabled]}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <View style={{ width: 15 }} />
            <TouchableOpacity 
              style={[styles.toolbarButton, (isAtEnd || isLocked) && styles.toolbarButtonDisabled]} 
              onPress={(isAtEnd || isLocked) ? undefined : handleToEnd}
              disabled={isAtEnd || isLocked}
            >
              <Image  
                source={require('../assets/images/to-end-icon.png')}
                style={[styles.toolbarIcon, (isAtEnd || isLocked) && styles.toolbarIconDisabled]}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Full screen, ignore safe area
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // Top area (game area, containerView)
  containerView: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#fff',
  },

  // Bottom responsive toolbar
  bottomBar: {
    backgroundColor: '#F3F3F3',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },

  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 21,
    paddingTop: isCurrentlyLandscape() ? 10 : 18,
  },

  toolbarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  toolbarButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  toolbarIcon: {
    // Let the image determine its own size
  },

  toolbarButtonDisabled: {
    // No additional styling needed for button
  },

  toolbarIconDisabled: {
    opacity: 0.4,
  },

  matchCard: {
    position: 'absolute',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
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

  questionIcon: {
    width: isTablet() ? 160 : 80,
    height: isTablet() ? 160 : 80,
  },
});
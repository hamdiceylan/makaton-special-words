import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { WORD_IMAGES, words } from '../src/constants/words';
import { SFProText } from '../src/theme/typography';
import { isLandscape, isTablet } from '../src/utils/device';
import { initializeAudio, playWordSound } from '../src/utils/soundUtils';

// Responsive toolbar height - proportional to device height in landscape mode
const getToolbarHeight = (screenWidth: number, screenHeight: number) => {
  const landscape = isLandscape(screenWidth, screenHeight);
  
  if (landscape) {
    // Proportional to device height in landscape mode (90px base for 1024 height)
    const responsiveHeight = screenHeight * (90 / 1024);
    // Limit between min 70, max 90
    return Math.min(90, Math.max(70, responsiveHeight));
  } else {
    // Fixed 90 in portrait mode
    return 90;
  }
};

// Layout configuration based on device and orientation
const getLayoutConfig = (screenWidth: number, screenHeight: number) => {
  const tablet = isTablet();
  const landscape = isLandscape(screenWidth, screenHeight);
  
  if (landscape) {
    if (tablet) {
      // Tablet Landscape
      const cardWidth = screenHeight * (300 / 1024);
      let padding = 150;
      
      // Make OFFSET_Y proportional to device height too (1024 base height for landscape)
      const baseOffsetY = screenHeight * (34 / 1024); // 34 ratio for 1024 height
      
      // Minimum gap control between cards (landscape 2 cards side by side)
      // Calculate gap between cards with current padding
      const currentGap = screenWidth - (2 * padding) - (2 * cardWidth);
      const minGapBetweenCards = 50; // Minimum gap between cards
      
      if (currentGap < minGapBetweenCards) {
        // If gap is less than 50, reduce padding to increase gap to 50
        const requiredPadding = (screenWidth - (2 * cardWidth) - minGapBetweenCards) / 2;
        padding = Math.max(20, requiredPadding); // Minimum 20px padding
      }
      // If gap is greater than 50, padding remains 150
      
      return {
        CARD_WIDTH: cardWidth,
        CARD_ASPECT_RATIO: 230 / 300,
        PADDING: padding,
        OFFSET_Y: baseOffsetY,
        CARD_TEXT_SIZE: 50,
      };
    } else {
      // Phone Landscape  
      return {
        CARD_WIDTH: screenHeight * (130 / 390), // Height-based calculation
        CARD_ASPECT_RATIO: 90 / 130, // Flatter cards (optimal for landscape)
        PADDING: 50,
        OFFSET_Y: -15,
        CARD_TEXT_SIZE: 22,
      };
    }
  } else {
    // Portrait Mode
    if (tablet) {
      // Tablet Portrait
      const cardWidth = screenWidth * (300 / 1024);
      let padding = 120;
      
      // Make OFFSET_Y proportional to device height too
      const baseOffsetY = screenHeight * (198 / 1400); // 198 ratio for 1400 height
      
      // Minimum gap control between cards (portrait 2 cards side by side)
      // Calculate gap between cards with current padding
      const currentGap = screenWidth - (2 * padding) - (2 * cardWidth);
      const minGapBetweenCards = 140; // Minimum gap between cards
      
      if (currentGap < minGapBetweenCards) {
        // If gap is less than 140, reduce padding to increase gap to 140
        const requiredPadding = (screenWidth - (2 * cardWidth) - minGapBetweenCards) / 2;
        padding = Math.max(20, requiredPadding); // Minimum 20px padding
      }
      // If gap is greater than 140, padding remains 120
      
      return {
        CARD_WIDTH: cardWidth,
        CARD_ASPECT_RATIO: 230 / 300,
        PADDING: padding,
        OFFSET_Y: baseOffsetY,
        CARD_TEXT_SIZE: 50,
      };
    } else {
      // Phone Portrait - Current design
      return {
        CARD_WIDTH: screenWidth * (130 / 390), // 390 → 130 scale
        CARD_ASPECT_RATIO: 100 / 130, // Orijinal aspect ratio
        PADDING: 24,
        OFFSET_Y: 86,
        CARD_TEXT_SIZE: 24,
      };
    }
  }
};

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
  activeSet: GameCard[]; // current 4 words as fixed set
  targetOrder: number[]; // shuffled indices [0..3]
  currentIndex: number;  // pointer into targetOrder
  revealedMap: { [key: string]: boolean }; // image/text key -> revealed
  currentGroupStart: number; // starting index of current 4-word group
}

export default function MatchPicturesScreen() {
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

  const [cardPosition] = useState(new Animated.ValueXY());
  const [cardScale] = useState(new Animated.Value(1));
  const [flipAnimation] = useState(new Animated.Value(0));
  const [cardOpacity] = useState(new Animated.Value(1));
  const [showWord, setShowWord] = useState(false);
  const [canShowText, setCanShowText] = useState(false);

  // Game area (containerView) dimensions
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // matchCard's initial center coordinates within container (center)
  const initialPosition = useRef({ x: 0, y: 0 });

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

  const initializeGame = (startIndex: number = 0) => {
    // Get current group of 4 words starting from startIndex
    const endIndex = Math.min(startIndex + 4, words.length);
    const currentGroup = words.slice(startIndex, endIndex);
    
    // If we don't have enough words left, reset to beginning
    if (currentGroup.length === 0) {
      return initializeGame(0);
    }

    const staticCards: GameCard[] = currentGroup.map((w, i) => ({
      id: `static-${i}`,
      image: w.image,
      text: w.text,
      isMatched: false,
    }));

    // Target order only among the current static cards (no reshuffle of positions)
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
    setTimeout(() => {
      setupRound(staticCards, targetOrder, 0);
    }, 0);
  };

  const setupRound = (activeSet: GameCard[], targetOrder: number[], currentIndex: number) => {
    if (activeSet.length === 0 || targetOrder.length === 0) return;
    const targetIdx = targetOrder[currentIndex];
    const target = activeSet[targetIdx];

    // Reset transforms FIRST to ensure proper positioning
    cardPosition.setValue({ x: 0, y: 0 });
    cardScale.setValue(1);
    flipAnimation.setValue(0);
    cardOpacity.setValue(0);
    setShowWord(false);
    setCanShowText(false);

    const newMatchCard: GameCard = {
      id: 'match',
      image: target.image,
      text: target.text,
      isMatched: false,
    };

    // Small delay to ensure smooth transition
    setTimeout(() => {
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
        if (newMatchCard.image) {
          playWordSound(newMatchCard.image);
        }
      });
    }, 50);
  };

  // Don't calculate until container dimensions are obtained
  const canLayout = containerSize.width > 0 && containerSize.height > 0;

  // Get responsive layout configuration
  const layoutConfig = getLayoutConfig(screenDimensions.width, screenDimensions.height);
  let { CARD_WIDTH, CARD_ASPECT_RATIO, PADDING, OFFSET_Y, CARD_TEXT_SIZE } = layoutConfig;
  const CARD_HEIGHT = CARD_WIDTH * CARD_ASPECT_RATIO; // Responsive aspect ratio
  
  // Get responsive toolbar height
  const TOOLBAR_HEIGHT = getToolbarHeight(screenDimensions.width, screenDimensions.height);
  
  // Vertical fit control in landscape modes
  const isLandscapeMode = isLandscape(screenDimensions.width, screenDimensions.height);
  if (isLandscapeMode && canLayout) {
    const H = containerSize.height;
    
    // Check actual card positions
    // Top cards center: H/2 - CARD_HEIGHT - OFFSET_Y
    // Top cards upper boundary: center - CARD_HEIGHT/2
    const topCardCenter = H / 2 - CARD_HEIGHT - OFFSET_Y;
    const topCardTop = topCardCenter - CARD_HEIGHT / 2;
    
    // Bottom cards center: H/2 + CARD_HEIGHT + OFFSET_Y  
    // Bottom cards lower boundary: center + CARD_HEIGHT/2
    const bottomCardCenter = H / 2 + CARD_HEIGHT + OFFSET_Y;
    const bottomCardBottom = bottomCardCenter + CARD_HEIGHT / 2;
    
    if (topCardTop < 0 || bottomCardBottom > H) {
      // Only adjust OFFSET_Y if it really overflows
      const maxOffsetY = ((H - 3 * CARD_HEIGHT) / 2) - 10;
      OFFSET_Y = Math.max(0, maxOffsetY);
    }
    // Keep original OFFSET_Y value if it doesn't overflow
  }
  
  const PERSPECTIVE = 800;

  const getStaticCardPositions = () => {
    // All static cards are positioned within containerView (2x2 grid)
    const W = containerSize.width;
    const H = containerSize.height;

    // safety check
    if (W === 0 || H === 0) return [];

    return [
      // Top-left
      { x: PADDING + CARD_WIDTH / 2, y: H / 2 - CARD_HEIGHT - OFFSET_Y },
      // Top-right
      { x: W - PADDING - CARD_WIDTH / 2, y: H / 2 - CARD_HEIGHT - OFFSET_Y },
      // Bottom-left
      { x: PADDING + CARD_WIDTH / 2, y: H / 2 + CARD_HEIGHT + OFFSET_Y },
      // Bottom-right
      { x: W - PADDING - CARD_WIDTH / 2, y: H / 2 + CARD_HEIGHT + OFFSET_Y },
    ];
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
        if (gameState.matchCard.image) {
          playWordSound(gameState.matchCard.image);
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

      if (matchedCard && matchedCard.image === gameState.matchCard.image) {
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
      if (gameState.matchCard.image) {
        playWordSound(gameState.matchCard.image);
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
    
    Animated.timing(flipAnimation, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start(() => {
      setShowWord(true);
      // After a short delay, advance through the first 5 targets
      setTimeout(() => {
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
          setTimeout(() => {
            advanceOrFinish();
          }, 100);
        });
      }, 1200);
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

  const advanceOrFinish = () => {
    const { activeSet, targetOrder, currentIndex, currentGroupStart } = gameState;
    if (!activeSet || activeSet.length === 0) return;

    const hasNext = currentIndex + 1 < targetOrder.length;
    if (hasNext) {
      // Proceed to next target in current group
      setupRound(activeSet, targetOrder, currentIndex + 1);
      setGameState(prev => ({ ...prev, level: prev.level + 1 }));
    } else {
      // Completed current group; move to next 4-word group
      const nextGroupStart = currentGroupStart + 4;
      setTimeout(() => {
        initializeGame(nextGroupStart);
      }, 400);
    }
  };

  const renderStaticCard = (card: GameCard, index: number) => {
    const positions = getStaticCardPositions();
    const p = positions[index];

    if (!p) return null;

    const handleCardTap = () => {
      // Play the word sound when card is tapped
      if (card.image) {
        playWordSound(card.image);
      }
    };

    return (
      <TouchableOpacity
        key={card.id}
        style={[
          styles.staticCard,
          {
            // center-based position → left/top = center - half size
            left: p.x - CARD_WIDTH / 2,
            top: p.y - CARD_HEIGHT / 2,
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
          },
        ]}
        onPress={handleCardTap}
        activeOpacity={0.8}
      >
        {card.isMatched ? (
          <View style={[styles.cardSide, styles.cardBack]} pointerEvents="none">
            <SFProText weight="semibold" style={[styles.cardText, { fontSize: CARD_TEXT_SIZE }]}>
              {card.text}
            </SFProText>
          </View>
        ) : (
          WORD_IMAGES[card.image] && (
            <Image
              source={WORD_IMAGES[card.image]}
              style={styles.cardImage}
              resizeMode="cover"
            />
          )
        )}
      </TouchableOpacity>
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
          canLayout && {
            left: containerSize.width / 2 - CARD_WIDTH / 2,
            top: containerSize.height / 2 - CARD_HEIGHT / 2,
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
          },
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
          {/* Front side - Image */}
          <Animated.View
            style={[
              styles.cardSide,
              { transform: [{ perspective: PERSPECTIVE }, { rotateY: frontRotateY }] },
            ]}
            pointerEvents="none"
          >
            {WORD_IMAGES[gameState.matchCard.image] && (
              <Image
                source={WORD_IMAGES[gameState.matchCard.image]}
                style={styles.cardImage}
                resizeMode="cover"
              />
            )}
          </Animated.View>

          {/* Back side - Word text */}
          <Animated.View
            style={[
              styles.cardSide,
              styles.cardBack,
              { transform: [{ perspective: PERSPECTIVE }, { rotateY: backRotateY }] },
            ]}
            pointerEvents="none"
          >
            {canShowText && (
              <SFProText weight="semibold" style={[styles.cardText, { fontSize: CARD_TEXT_SIZE }]}>
                {gameState.matchCard.text}
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

      {/* Bottom (VStack's second view): Responsive height */}
      <View style={[styles.bottomBar, { height: TOOLBAR_HEIGHT }]}>
        <View style={styles.toolbar}>
          {/* Left group: to-end-icon and previous-icon */}
          <View style={styles.toolbarGroup}>
            <TouchableOpacity style={styles.toolbarButton}>
              <Image 
                source={require('../assets/images/to-start-icon.png')}
                style={styles.toolbarIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <View style={{ width: 15 }} />
            <TouchableOpacity style={styles.toolbarButton}>
              <Image  
                source={require('../assets/images/previous-icon.png')}
                style={styles.toolbarIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {/* Middle group: lock-icon and refresh-icon */}
          <View style={styles.toolbarGroup}>
            <TouchableOpacity style={styles.toolbarButton}>
              <Image 
                source={require('../assets/images/lock-icon.png')} 
                style={styles.toolbarIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <View style={{ width: 16 }} />
            <TouchableOpacity style={styles.toolbarButton}>
              <Image 
                source={require('../assets/images/refresh-icon.png')} 
                style={styles.toolbarIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {/* Right group: next-icon and to-start-icon */}
          <View style={styles.toolbarGroup}>
            <TouchableOpacity style={styles.toolbarButton}>
              <Image 
                source={require('../assets/images/next-icon.png')}
                style={styles.toolbarIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <View style={{ width: 15 }} />
            <TouchableOpacity style={styles.toolbarButton}>
              <Image  
                source={require('../assets/images/to-end-icon.png')}
                style={styles.toolbarIcon}
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
    backgroundColor: '#279095',
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
    paddingTop: 18,
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
    textTransform: 'capitalize',
  },
});
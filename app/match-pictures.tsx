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
import { initializeAudio, playWordSound } from '../src/utils/soundUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Alt bar sabit yükseklik
const TOOLBAR_HEIGHT = 90;

// Kart boyutları (istersen container genişliğine göre dinamikleştirebiliriz)
const CARD_WIDTH = SCREEN_WIDTH * (130 / 390); // 390 → 130 ölçek
const CARD_HEIGHT = CARD_WIDTH * (100 / 130);

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

  const [cardPosition] = useState(new Animated.ValueXY());
  const [cardScale] = useState(new Animated.Value(1));
  const [flipAnimation] = useState(new Animated.Value(0));
  const [cardOpacity] = useState(new Animated.Value(1));
  const [showWord, setShowWord] = useState(false);

  // Oyun alanı (containerView) ölçüleri
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // matchCard’ın container içindeki ilk merkez koordinatı (center)
  const initialPosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const setupAudio = async () => {
      await initializeAudio();
      initializeGame();
    };
    setupAudio();
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

  // Container ölçüleri alınmadan hesap yapmayalım
  const canLayout = containerSize.width > 0 && containerSize.height > 0;

  const PADDING = 24;
  const OFFSET_Y = 86;
  const PERSPECTIVE = 800;

  const getStaticCardPositions = () => {
    // Tüm statik kartlar containerView içinde konumlanır (2x2 grid)
    const W = containerSize.width;
    const H = containerSize.height;

    // güvenlik
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

    // Mark matched static card as revealed and persist in revealedMap
    setGameState(prev => {
      const updatedStatics = prev.staticCards.map((c, i) => (
        i === matchedIndex ? { ...c, isMatched: true } : c
      ));
      const nextRevealed = { ...prev.revealedMap, [matchedCard.image]: true };
      return { ...prev, staticCards: updatedStatics, revealedMap: nextRevealed };
    });

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
      performFlipAnimation();
    });
  };

  const performFlipAnimation = () => {
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
            // center tabanlı konum → left/top = center - half size
            left: p.x - CARD_WIDTH / 2,
            top: p.y - CARD_HEIGHT / 2,
          },
        ]}
        onPress={handleCardTap}
        activeOpacity={0.8}
      >
        {card.isMatched ? (
          <View style={[styles.cardSide, styles.cardBack]} pointerEvents="none">
            <SFProText weight="semibold" style={styles.cardText}>
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
          },
          {
            transform: [
              { translateX: cardPosition.x },
              { translateY: cardPosition.y },
            ],
          },
        ]}
        onLayout={(e) => {
          // matchCard'ın container içindeki merkezi:
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
            <SFProText weight="bold" style={styles.cardText}>
              {gameState.matchCard.text}
            </SFProText>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.screen}>
      {/* Üst (VStack’in ilk view’i): Oyun alanı containerView */}
      <View
        style={styles.containerView}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setContainerSize({ width, height });
        }}
      >
        {/* Statik kartlar */}
        {canLayout && gameState.staticCards.map((card, i) => renderStaticCard(card, i))}
        {/* Ortadaki matchCard */}
        {canLayout && gameState.matchCard.image && gameState.matchCard.text && renderMatchCard()}
      </View>

      {/* Alt (VStack’in ikinci view’i): 90 sabit yükseklik */}
      <View style={styles.bottomBar}>
        {/* buraya toolbar/controls gelebilir */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Tüm ekran, safe area ignore
  screen: {
    flex: 1,
    backgroundColor: '#279095',
  },

  // Üst alan (oyun alanı, containerView)
  containerView: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#fff',
  },

  // Alt sabit 90
  bottomBar: {
    height: TOOLBAR_HEIGHT,
    backgroundColor: '#F3F3F3',
  },

  matchCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
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
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
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
    fontSize: 24,
    color: '#000',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
});
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  StyleSheet,
  View
} from 'react-native';
import { WORD_IMAGES, words } from '../src/constants/words';
import { SFProText } from '../src/theme/typography';

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
}

export default function MatchPicturesScreen() {
  const [gameState, setGameState] = useState<GameState>({
    level: 1,
    matchCard: { id: '', image: '', text: '', isMatched: false },
    staticCards: [],
    isAnimating: false,
  });

  const [cardPosition] = useState(new Animated.ValueXY());
  const [cardScale] = useState(new Animated.Value(1));
  const [flipAnimation] = useState(new Animated.Value(0));
  const [showWord, setShowWord] = useState(false);

  // Oyun alanı (containerView) ölçüleri
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // matchCard’ın container içindeki ilk merkez koordinatı (center)
  const initialPosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const availableWords = words.slice(0, Math.min(words.length, 50));
    const shuffled = [...availableWords].sort(() => Math.random() - 0.5);

    const selectedWords = shuffled.slice(0, 4);
    const matchWordIndex = Math.floor(Math.random() * 4);
    const matchWord = selectedWords[matchWordIndex];

    const newStaticCards: GameCard[] = selectedWords.map((word, index) => ({
      id: `static-${index}`,
      image: word.image,
      text: word.text,
      isMatched: false,
    }));

    const newMatchCard: GameCard = {
      id: 'match',
      image: matchWord.image,
      text: matchWord.text,
      isMatched: false,
    };

    setGameState(prev => ({
      ...prev,
      matchCard: newMatchCard,
      staticCards: newStaticCards,
      isAnimating: false,
    }));

    cardPosition.setValue({ x: 0, y: 0 });
    cardScale.setValue(1);
    flipAnimation.setValue(0);
    setShowWord(false);
  };

  // Container ölçüleri alınmadan hesap yapmayalım
  const canLayout = containerSize.width > 0 && containerSize.height > 0;

  const PADDING = 24;
  const OFFSET_Y = 86;

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

  // Drag & drop
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !gameState.isAnimating,
    onMoveShouldSetPanResponder: () => !gameState.isAnimating,

    onPanResponderGrant: () => {
      Animated.spring(cardScale, {
        toValue: 1.1,
        useNativeDriver: false,
      }).start();
    },

    onPanResponderMove: Animated.event(
      [null, { dx: cardPosition.x, dy: cardPosition.y }],
      { useNativeDriver: false }
    ),

    onPanResponderRelease: (event, gestureState) => {
      if (gameState.isAnimating) return;

      // Bırakılan nokta = başlangıç merkez + delta
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
        useNativeDriver: false,
      }),
    ]).start(() => {
      performFlipAnimation();
    });
  };

  const performFlipAnimation = () => {
    Animated.timing(flipAnimation, {
      toValue: 1,
      duration: 600,
      useNativeDriver: false,
    }).start(() => {
      setShowWord(true);
      setTimeout(() => {
        nextLevel();
      }, 2000);
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
        useNativeDriver: false,
      }),
    ]).start();
  };

  const nextLevel = () => {
    setGameState(prev => ({
      ...prev,
      level: prev.level + 1,
      isAnimating: false,
    }));

    cardPosition.setValue({ x: 0, y: 0 });
    cardScale.setValue(1);
    flipAnimation.setValue(0);
    setShowWord(false);

    setTimeout(() => {
      initializeGame();
    }, 500);
  };

  const renderStaticCard = (card: GameCard, index: number) => {
    const positions = getStaticCardPositions();
    const p = positions[index];

    if (!p) return null;

    return (
      <View
        key={card.id}
        style={[
          styles.staticCard,
          {
            // center tabanlı konum → left/top = center - half size
            left: p.x - CARD_WIDTH / 2,
            top: p.y - CARD_HEIGHT / 2,
          },
        ]}
      >
        {WORD_IMAGES[card.image] && (
          <Image
            source={WORD_IMAGES[card.image]}
            style={styles.cardImage}
            resizeMode="cover"
          />
        )}
      </View>
    );
  };

  const renderMatchCard = () => {
    const rotateY = flipAnimation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: ['0deg', '90deg', '0deg'],
    });

    const frontOpacity = flipAnimation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 0, 0],
    });

    const backOpacity = flipAnimation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0, 1],
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
              { scale: cardScale },
              { rotateY },
            ],
          },
        ]}
        onLayout={(e) => {
          // matchCard’ın container içindeki merkezi:
          const layout = e.nativeEvent.layout;
          initialPosition.current = {
            x: layout.x + CARD_WIDTH / 2,
            y: layout.y + CARD_HEIGHT / 2,
          };
        }}
      >
        {/* Front side - Image */}
        <Animated.View style={[styles.cardSide, { opacity: frontOpacity }]}>
          {WORD_IMAGES[gameState.matchCard.image] && (
            <Image
              source={WORD_IMAGES[gameState.matchCard.image]}
              style={styles.cardImage}
              resizeMode="cover"
            />
          )}
        </Animated.View>

        {/* Back side - Word text */}
        <Animated.View style={[styles.cardSide, styles.cardBack, { opacity: backOpacity }]}>
          <SFProText weight="bold" style={styles.cardText}>
            {gameState.matchCard.text}
          </SFProText>
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
        {canLayout && gameState.matchCard.image && renderMatchCard()}
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
    backfaceVisibility: 'hidden',
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
    borderRadius: 12,
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
    borderRadius: 0,
  },

  cardText: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
});
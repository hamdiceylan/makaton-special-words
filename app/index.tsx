import { ThemedText } from '@/src/theme/typography';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Device & Orientation detection
const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const minDimension = Math.min(width, height);
  
  // iPad threshold: 744px (iPad Mini dahil), Android tablet threshold: 600px
  return Platform.OS === 'ios' ? 
    minDimension >= 744 : 
    minDimension >= 600;
};

const isLandscape = (width: number, height: number) => width > height;

// Grid configuration based on device and orientation
const getGridConfig = (screenWidth: number, screenHeight: number) => {
  const tablet = isTablet();
  const landscape = isLandscape(screenWidth, screenHeight);
  
  if (landscape) {
    if (tablet) {
      // Tablet Landscape - screenWidth kullanmalıyız (en geniş boyut)
      const SQUARE_RATIO = 309 / 1400; // 0.221 - Square width / device width oranı
      const GAP_RATIO = 100 / 1400;    // 0.071 - Gap / device width oranı
      const ROW_GAP_RATIO = 75 / 1024; // 0.073 - Row gap / device height oranı
      
      const calculatedSquareSize = screenWidth * SQUARE_RATIO; // Device width'e oransal square
      const squareSize = Math.max(240, calculatedSquareSize); // Min 240
      const gapSize = screenWidth * GAP_RATIO;       // Device width'e oransal gap
      const rowGapSize = screenHeight * ROW_GAP_RATIO; // Device height'e oransal row gap
      const leftMargin = (screenWidth - (3 * squareSize + 2 * gapSize)) / 2; // 3 column için 2 gap
      
      return {
        LEFT: leftMargin,
        RIGHT: leftMargin,
        COL_GAP: gapSize,   // Oransal gap
        ROW_GAP: rowGapSize, // Oransal row gap
        COLUMNS: 3,         // 3 columns in landscape
        SQUARE_SIZE: squareSize, // Oransal square size
      };
    } else {
      // Phone Landscape - screenWidth kullan (daha geniş boyut)
      const usableWidth = screenWidth - 40; // Left + Right margins
      const gapTotal = 2 * 20; // 3 column için 2 gap
      const squareSize = (usableWidth - gapTotal) / 3;
      
      return {
        LEFT: 20,
        RIGHT: 20,
        COL_GAP: 20,
        ROW_GAP: 30,
        COLUMNS: 3,
        SQUARE_SIZE: squareSize,
      };
    }
  } else {
    // Portrait Mode
    if (tablet) {
      // Tablet Portrait - Device width'e oransal grid sistemi
      const SQUARE_RATIO = 309 / 1024; // 0.302 - Square width / device width oranı
      const GAP_RATIO = 100 / 1024;    // 0.098 - Gap / device width oranı
      
      const calculatedSquareSize = screenWidth * SQUARE_RATIO; // Device width'e oransal square
      const squareSize = Math.max(240, calculatedSquareSize); // Min 260
      const gapSize = screenWidth * GAP_RATIO;       // Device width'e oransal gap
      const leftMargin = (screenWidth - (2 * squareSize + gapSize)) / 2; // Center için margin
      
      return {
        LEFT: leftMargin,
        RIGHT: leftMargin,
        COL_GAP: gapSize,   // Oransal gap
        ROW_GAP: 60,        // Fixed row gap
        COLUMNS: 2,         // Always 2 columns in portrait
        SQUARE_SIZE: squareSize, // Oransal square size
      };
    } else {
      // Phone Portrait - Normal grid
      const usableWidth = screenWidth - 15 - 18; // Left + Right margins
      const gapTotal = 17; // 2 column için 1 gap
      const squareSize = (usableWidth - gapTotal) / 2;
      
      return {
        LEFT: 15,
        RIGHT: 18,
        COL_GAP: 17,
        ROW_GAP: 30,
        COLUMNS: 2,
        SQUARE_SIZE: squareSize,
      };
    }
  }
};
const LAST_ROW_WIDTH_RATIO = 2; // Square width / 2
const RADIUS = 15;
const TEXT_BAR_RATIO = 48 / 152; // ≈ 0.316 (%32) - Phone için
const TABLET_TEXT_BAR_RATIO = 56 / 276; // ≈ 0.203 (%20.3) - Tablet için

// Asset mapping - composite images
const CARD_IMAGES = {
  'match-pictures': require('../assets/images/match-pictures.png'),
  'match-words': require('../assets/images/match-words.png'),
  'word-to-picture': require('../assets/images/word-to-picture.png'),
  'picture-to-word': require('../assets/images/picture-to-word.png'),
  'sound-to-picture': require('../assets/images/sound-to-picture.png'),
  'sound-to-word': require('../assets/images/sound-to-word.png'),
  'word-list': require('../assets/images/word-list.png'),
};
type Item = {
  title: string;
  color: string;
  image: keyof typeof CARD_IMAGES;
};
interface CardItemProps {
  item: Item;
  isSpecial?: boolean;
  cardHeight?: number;
}

export default function Home() {
  const [layout, setLayout] = useState({ w: 0, h: 0 });
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });
    return () => subscription?.remove();
  }, []);
  
  const gridConfig = getGridConfig(screenDimensions.width, screenDimensions.height);
  const { LEFT, RIGHT, COL_GAP, ROW_GAP, COLUMNS, SQUARE_SIZE } = gridConfig;
  
  const isTabletDevice = isTablet();
  const isLandscapeMode = isLandscape(screenDimensions.width, screenDimensions.height);

  const items: Item[] = [
    { title: 'Match Pictures',  color: '#279095', image: 'match-pictures' },
    { title: 'Match Words',     color: '#9893CA', image: 'match-words' },
    { title: 'Word to Picture', color: '#954D27', image: 'word-to-picture' },
    { title: 'Picture to Word', color: '#273F95', image: 'picture-to-word' },
    { title: 'Sound to Picture',color: '#952769', image: 'sound-to-picture' },
    { title: 'Sound to Word',   color: '#4C9527', image: 'sound-to-word' },
    { title: 'Word list',       color: '#6675AA', image: 'word-list' },
  ];

  const usableW = layout.w - LEFT - RIGHT - (COL_GAP * (COLUMNS - 1));
  const cellW = SQUARE_SIZE || usableW / COLUMNS;

  const rows = Math.ceil(items.length / COLUMNS);
  const normalRows = rows - 1; // Son row hariç
  const totalVerticalGap = Math.max(0, ROW_GAP * normalRows);
  // Landscape modunda last row height'ı daha küçük yap
  const lastRowRatio = isLandscapeMode ? 2.3 : LAST_ROW_WIDTH_RATIO; // Landscape'de daha küçük ratio
  const lastRowHeight = cellW / lastRowRatio;
  const availableHeightForNormalRows = layout.h - lastRowHeight - totalVerticalGap;
  const rowH = normalRows > 0 ? availableHeightForNormalRows / normalRows : 0;

  const isOdd = items.length % COLUMNS === 1;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View
        style={styles.grid}
        onLayout={e => {
          const { width, height } = e.nativeEvent.layout;
          setLayout({ w: width, h: height });
        }}
      >
        {items.map((it, i) => {
          const rowIndex   = Math.floor(i / COLUMNS);
          const isLastRow  = rowIndex === rows - 1;
          const isLastItem = i === items.length - 1;
          const stretchFull = isOdd && isLastItem;

          const height = isLastRow ? lastRowHeight : rowH;
          const mb = isLastRow ? 0 : ROW_GAP;

          const commonInner = (
            <View style={styles.card}>
              <CardItem item={it} isSpecial={stretchFull} cardHeight={height} />
            </View>
          );

          if (stretchFull) {
            // Landscape modunda max width sınırlaması
            const maxWidth = isLandscapeMode ? 716 : undefined;
            const useMaxWidth = maxWidth && (screenDimensions.width - LEFT - RIGHT) > maxWidth;
            
            return (
              <View
                key={i}
                style={[
                  styles.shadowCard,
                  {
                    position: 'absolute',
                    bottom: 0,
                    left: useMaxWidth ? (screenDimensions.width - maxWidth) / 2 : LEFT,
                    right: useMaxWidth ? (screenDimensions.width - maxWidth) / 2 : RIGHT,
                    maxWidth: maxWidth,
                    height,
                  },
                ]}
              >
                {commonInner}
              </View>
            );
          }

          const colIndex = i % COLUMNS;

          return (
            <View
              key={i}
              style={[
                styles.shadowCard,
                {
                  height,
                  width: cellW,
                  marginLeft: colIndex === 0 ? LEFT : COL_GAP,
                  marginRight: colIndex === COLUMNS - 1 ? RIGHT : 0,
                  marginBottom: mb,
                },
              ]}
            >
              {commonInner}
            </View>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

/** Kart içeriği */
function CardItem({ item, isSpecial, cardHeight }: CardItemProps) {
  if (isSpecial) {
    // özel row: sol renkli ikon kutusu + sağda siyah text
    return (
      <View style={styles.specialRow}>
        <View style={[
          styles.specialIconBox, 
          { 
            backgroundColor: item.color,
            width: isTablet() ? 149 : 104,
          }
        ]}>
          <Image 
            source={CARD_IMAGES[item.image]} 
            style={styles.specialIcon} 
          />
        </View>
        <ThemedText weight="semibold" style={[styles.specialText, { fontSize: isTablet() ? 40 : 24 }]}>{item.title}</ThemedText>
      </View>
    );
  }

  // normal kart - tek composite image
  return (
    <View style={styles.fill}>
      <View style={[
        styles.iconRow,
        { flex: 1 }, // Her durumda flex
        isTablet() && { height: '100%' } // Tablet'te tam height
      ]}>
        <Image 
          source={CARD_IMAGES[item.image]} 
          style={[
            styles.cardIcon, 
            { 
              tintColor: item.color,
              paddingHorizontal: 5,
              resizeMode: 'contain',
              height: isTablet() ? '100%' : undefined, // Tablet'te tam height
            }
          ]} 
        />
      </View>

      <View style={[
        styles.textContainer, 
        { 
          backgroundColor: item.color,
          height: cardHeight ? 
            (isTablet() ? cardHeight * TABLET_TEXT_BAR_RATIO : cardHeight * TEXT_BAR_RATIO) : 
            42
        }
      ]}>
        <ThemedText weight="semibold" style={[styles.text, { fontSize: isTablet() ? 24 : 18 }]} numberOfLines={1}>{item.title}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF', paddingTop: 27, paddingBottom: 20 },
  grid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#fff', position: 'relative' },

  shadowCard: {
    borderRadius: RADIUS,
    shadowColor: '#3629B7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 30,
    elevation: 4,
    backgroundColor: 'transparent',
  },
  card: {
    flex: 1,
    borderRadius: RADIUS,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },

  fill: { flex: 1, backgroundColor: '#FFFFFF' },
  iconRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  
  // Tam responsive composite image
  cardIcon: {
    width: '100%',
    flex: 1,
    resizeMode: 'stretch', // iPad'de tam boyut kullan
  },
  
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // Özel son row stilleri
  specialRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  specialIconBox: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: RADIUS,
    borderBottomLeftRadius: RADIUS,
  },
  specialIcon: {
    width: '65%',
    height: '65%',
    tintColor: '#fff',
    resizeMode: 'contain',
  },
  specialText: {
    color: '#000',
    textAlign: 'center',
    flex: 1,
    marginLeft: -60,
  },
});
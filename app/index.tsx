import { ThemedText } from '@/src/theme/typography';
import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LEFT = 15;
const RIGHT = 18;
const COL_GAP = 17;
const ROW_GAP = 30;
const COLUMNS = 2;
const LAST_ROW_WIDTH_RATIO = 2; // Square width / 2
const RADIUS = 15;
const TEXT_BAR_RATIO = 48 / 152; // ≈ 0.316 (%32)

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

  const items: Item[] = [
    { title: 'Match Pictures',  color: '#279095', image: 'match-pictures' },
    { title: 'Match Words',     color: '#9893CA', image: 'match-words' },
    { title: 'Word to Picture', color: '#954D27', image: 'word-to-picture' },
    { title: 'Picture to Word', color: '#273F95', image: 'picture-to-word' },
    { title: 'Sound to Picture',color: '#952769', image: 'sound-to-picture' },
    { title: 'Sound to Word',   color: '#4C9527', image: 'sound-to-word' },
    { title: 'Word list',       color: '#6675AA', image: 'word-list' },
  ];

  const usableW = layout.w - LEFT - RIGHT - COL_GAP;
  const cellW = usableW / COLUMNS;

  const rows = Math.ceil(items.length / COLUMNS);
  const normalRows = rows - 1; // Son row hariç
  const totalVerticalGap = Math.max(0, ROW_GAP * normalRows);
  const lastRowHeight = cellW / LAST_ROW_WIDTH_RATIO; // Square width / 2
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
            return (
              <View
                key={i}
                style={[
                  styles.shadowCard,
                  {
                    position: 'absolute',
                    bottom: 0,
                    left: LEFT,
                    right: RIGHT,
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
                  marginRight: colIndex === 1 ? RIGHT : 0,
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
        <View style={[styles.specialIconBox, { backgroundColor: item.color }]}>
          <Image 
            source={CARD_IMAGES[item.image]} 
            style={styles.specialIcon} 
          />
        </View>
        <ThemedText weight="semibold" style={[styles.specialText, { fontSize: 24 }]}>{item.title}</ThemedText>
      </View>
    );
  }

  // normal kart - tek composite image
  return (
    <View style={styles.fill}>
      <View style={styles.iconRow}>
        <Image 
          source={CARD_IMAGES[item.image]} 
          style={[
            styles.cardIcon, 
            { tintColor: item.color }
          ]} 
        />
      </View>

      <View style={[
        styles.textContainer, 
        { 
          backgroundColor: item.color,
          height: cardHeight ? cardHeight * TEXT_BAR_RATIO : 42
        }
      ]}>
        <ThemedText weight="semibold" style={[styles.text, { fontSize: 18 }]} numberOfLines={1}>{item.title}</ThemedText>
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
    resizeMode: 'contain',
    paddingHorizontal: 5,
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
    width: 104,
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
    marginLeft: 48,
    color: '#000',
  },
});
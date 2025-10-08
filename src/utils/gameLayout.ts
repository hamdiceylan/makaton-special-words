import { isLandscape, isTablet } from './device';
import { Platform } from 'react-native';
export type Rect = { left: number; top: number; width: number; height: number };
export type LayoutResult = {
  match: Rect;
  statics: Rect[];
  cardSize: { w: number; h: number };
};

const CARD_ASPECT = 3 / 4; // 4:3
const MIN_GAP_Y = 10;
const USE_SPECIAL_4_LAYOUT = true;

export const getToolbarHeight = (sw: number, sh: number) => {
  const landscape = isLandscape(sw, sh);
  if (landscape) {
    const responsive = sh * (60 / 1024);
    return Math.min(isTablet() ? 60 : 40, Math.max(40, responsive));
  }
  return 60;
};

function enforceVerticalSpacing(
  rows: 1 | 2 | 3,
  playH: number,
  marginTopIn: number,
  cardHIn: number,
  cardWIn: number
) {
  let marginTop = Math.max(marginTopIn, MIN_GAP_Y);
  const maxCardH = (playH - (rows + 1) * marginTop) / rows;
  let cardH = cardHIn;
  let cardW = cardWIn;
  if (maxCardH < cardHIn) {
    cardH = Math.max(0, maxCardH);
    cardW = cardH / CARD_ASPECT;
  }
  return { marginTop, cardH, cardW };
}

export function computeLayout(
  cardsPerPage: 1 | 2 | 3 | 4 | 6 | 8,
  playW: number,
  playH: number,
  isPad: boolean,
  isPortrait: boolean
): LayoutResult {
  const horizontalPadding = Platform.OS === 'android' && isPad && !isPortrait ? 100 : 0;
  playW = playW - horizontalPadding;
  playH = playH;
  const magnification = isPad ? Math.max(playW, playH) / 1024 : Math.min(playW, playH) / 320;

  let marginTop = 0, marginLeft = 0;
  let cardW = 0, cardH = 0;
  let left1 = 0, left2 = 0, left3 = 0, top1 = 0, top2 = 0, top3 = 0;

  const setGrid3x3 = () => {
    if (isPortrait) {
      marginLeft = (isPad ? 20 : 10) * magnification;
      cardW = (playW - 4 * marginLeft) / 3;
      cardH = cardW * CARD_ASPECT;
      marginTop = (playH - 3 * cardH) / 4;
    } else {
      marginTop = (isPad ? 20 : 10) * magnification;
      marginLeft = (isPad ? 20 : 40) * magnification;
      cardH = (playH - 4 * marginTop) / 3;
      cardW = cardH / CARD_ASPECT;
    }
    ({ marginTop, cardH, cardW } = enforceVerticalSpacing(3, playH, marginTop, cardH, cardW));
    left1 = marginLeft;
    left2 = (playW - cardW) / 2;
    left3 = playW - marginLeft - cardW;
    top1 = marginTop;
    top2 = (playH - cardH) / 2;
    top3 = playH - marginTop - cardH;
  };

  if (cardsPerPage === 4 && USE_SPECIAL_4_LAYOUT) {
    let w = 0;
    let h = 0;
    let PADDING = 0;
    let OFFSET_Y = 0;

    if (!isPortrait) {
      if (isPad) {
        w = playW * (300 / 1400);
        h = w * (230 / 300);
        PADDING = 150;
        OFFSET_Y = playH * (34 / 1024);
        const currentGap = playW - 2 * PADDING - 2 * w;
        const minGap = 50;
        if (currentGap < minGap) {
          const reqPadding = (playW - 2 * w - minGap) / 2;
          PADDING = Math.max(20, reqPadding);
        }
      } else {
        // Phone landscape: keep size moderate, pull statics inward toward the center
        w = playH * (170 / 390); // ~43.5% of playH
        h = w * (95 / 130);
        PADDING = 60; // increase padding to move statics closer to the center
        OFFSET_Y = 0;
        // Keep a small minimum gap between inner edges of columns
        const currentGap = playW - 2 * PADDING - 2 * w;
        const minGap = 16;
        if (currentGap < minGap) {
          const reqPadding = (playW - 2 * w - minGap) / 2;
          PADDING = Math.max(12, reqPadding);
        }
      }
    } else {
      if (isPad) {
        w = playW * (300 / 1024);
        h = w * (230 / 300);
        PADDING = 120;
        OFFSET_Y = playH * (198 / 1400);
        const currentGap = playW - 2 * PADDING - 2 * w;
        const minGap = 140;
        if (currentGap < minGap) {
          const reqPadding = (playW - 2 * w - minGap) / 2;
          PADDING = Math.max(20, reqPadding);
        }
      } else {
        w = playW * (130 / 390);
        h = w * (100 / 130);
        PADDING = 24;
        OFFSET_Y = 86;
      }
    }

    if (!isPortrait) {
      const H = playH;
      let topCardCenter = H / 2 - h - OFFSET_Y;
      let topCardTop = topCardCenter - h / 2;
      let bottomCardCenter = H / 2 + h + OFFSET_Y;
      let bottomCardBottom = bottomCardCenter + h / 2;
      if (topCardTop < 0 || bottomCardBottom > H) {
        const maxOffsetY = (H - 3 * h) / 2 - 10;
        OFFSET_Y = Math.max(0, maxOffsetY);
      }
      // Enforce minimum vertical padding inside the play area
      topCardCenter = H / 2 - h - OFFSET_Y;
      topCardTop = topCardCenter - h / 2;
      bottomCardCenter = H / 2 + h + OFFSET_Y;
      bottomCardBottom = bottomCardCenter + h / 2;
      if (topCardTop < MIN_GAP_Y) {
        const deficit = MIN_GAP_Y - topCardTop;
        OFFSET_Y = Math.max(0, OFFSET_Y + deficit);
      }
      // recompute after potential change
      topCardCenter = H / 2 - h - OFFSET_Y;
      topCardTop = topCardCenter - h / 2;
      bottomCardCenter = H / 2 + h + OFFSET_Y;
      bottomCardBottom = bottomCardCenter + h / 2;
      if (bottomCardBottom > H - MIN_GAP_Y) {
        const deficit = bottomCardBottom - (H - MIN_GAP_Y);
        OFFSET_Y = Math.max(0, OFFSET_Y - deficit);
      }
    }

    const W = playW;
    const H = playH;
    const centers = [
      { x: PADDING + w / 2, y: H / 2 - h - OFFSET_Y },
      { x: W - PADDING - w / 2, y: H / 2 - h - OFFSET_Y },
      { x: PADDING + w / 2, y: H / 2 + h + OFFSET_Y },
      { x: W - PADDING - w / 2, y: H / 2 + h + OFFSET_Y },
    ];
    const statics: Rect[] = centers.map(c => ({ left: c.x - w / 2, top: c.y - h / 2, width: w, height: h }));
    const match: Rect = { left: (W - w) / 2, top: (H - h) / 2, width: w, height: h };
    return { match, statics, cardSize: { w, h } };
  }

  if (cardsPerPage === 3 || cardsPerPage === 4) {
    if (isPad) {
      cardW = 300 * magnification;
      cardH = cardW * CARD_ASPECT;
      marginTop = 108 * magnification - 44 - 20;
      marginLeft = (isPortrait ? 40 : 20) * magnification;
      const rows: 2 | 3 = (!isPortrait && cardsPerPage === 3) ? 2 : 3;
      ({ marginTop, cardH, cardW } = enforceVerticalSpacing(rows, playH, marginTop, cardH, cardW));
    } else if (isPortrait) {
      cardW = 120 * magnification;
      cardH = cardW * CARD_ASPECT;
      marginTop = (playH - 3 * cardH) / 4;
      marginLeft = (playW - 2 * cardW) / 4;
      ({ marginTop, cardH, cardW } = enforceVerticalSpacing(3, playH, marginTop, cardH, cardW));
    } else {
      marginTop = marginLeft = 20;
      const looksTallEnough = playW / playH >= 1.5;
      if (looksTallEnough) {
        cardH = (playH - 3 * marginTop) / 2;
        cardW = cardH / CARD_ASPECT;
      } else {
        cardW = (playW - 4 * marginLeft) / 3;
        cardH = cardW * CARD_ASPECT;
      }
      const rows: 2 | 3 = (cardsPerPage === 3) ? 2 : 3;
      ({ marginTop, cardH, cardW } = enforceVerticalSpacing(rows, playH, marginTop, cardH, cardW));
    }

    left1 = marginLeft;
    left2 = (playW - cardW) / 2;
    left3 = playW - marginLeft - cardW;
    top1 = marginTop;
    top2 = (playH - cardH) / 2;
    top3 = playH - marginTop - cardH;

    if (cardsPerPage === 4) {
      const match: Rect = { left: left2, top: top2, width: cardW, height: cardH };
      const statics: Rect[] = [
        { left: left1, top: top1, width: cardW, height: cardH },
        { left: left3, top: top1, width: cardW, height: cardH },
        { left: left1, top: top3, width: cardW, height: cardH },
        { left: left3, top: top3, width: cardW, height: cardH },
      ];
      return { match, statics, cardSize: { w: cardW, h: cardH } };
    } else {
      if (isPortrait) {
        const match: Rect = { left: left1, top: top2, width: cardW, height: cardH };
        const statics: Rect[] = [
          { left: left3, top: top1, width: cardW, height: cardH },
          { left: left3, top: top2, width: cardW, height: cardH },
          { left: left3, top: top3, width: cardW, height: cardH },
        ];
        return { match, statics, cardSize: { w: cardW, h: cardH } };
      } else {
        const match: Rect = { left: left2, top: top3, width: cardW, height: cardH };
        const statics: Rect[] = [
          { left: left1, top: top1, width: cardW, height: cardH },
          { left: left2, top: top1, width: cardW, height: cardH },
          { left: left3, top: top1, width: cardW, height: cardH },
        ];
        return { match, statics, cardSize: { w: cardW, h: cardH } };
      }
    }
  }

  if (cardsPerPage === 1) {
    if (isPortrait) {
      const mt = 40 * magnification;
      cardH = (playH - 3 * mt) / 2;
      cardW = cardH / CARD_ASPECT;
      ({ marginTop, cardH, cardW } = enforceVerticalSpacing(2, playH, mt, cardH, cardW));
      const ml = (playW - cardW) / 2;
      const topTop = Math.max(mt, MIN_GAP_Y);
      const topBot = playH - Math.max(mt, MIN_GAP_Y) - cardH;
      const match: Rect = { left: ml, top: topBot, width: cardW, height: cardH };
      const statics: Rect[] = [{ left: ml, top: topTop, width: cardW, height: cardH }];
      return { match, statics, cardSize: { w: cardW, h: cardH } };
    } else {
      const ml = 40 * magnification;
      cardW = (playW - 3 * ml) / 2;
      cardH = cardW * CARD_ASPECT;
      let mt = (playH - cardH) / 2;
      ({ marginTop: mt, cardH, cardW } = enforceVerticalSpacing(1, playH, mt, cardH, cardW));
      const top = mt;
      const left = ml;
      const right = playW - ml - cardW;
      const match: Rect = { left, top, width: cardW, height: cardH };
      const statics: Rect[] = [{ left: right, top, width: cardW, height: cardH }];
      return { match, statics, cardSize: { w: cardW, h: cardH } };
    }
  }

  if (cardsPerPage === 2) {
    if (isPortrait) {
      marginLeft = (isPad ? 40 : 20) * magnification;
      cardW = (playW - 3 * marginLeft) / 2;
      cardH = cardW * CARD_ASPECT;
      marginTop = (playH - 2 * cardH) / 3;
    } else {
      // Phone landscape: enlarge cards by reducing gaps and bringing columns closer
      marginTop = (isPad ? 40 : 12) * magnification;
      marginLeft = (isPad ? 40 : 60) * magnification;
      cardH = (playH - 3 * marginTop) / 2;
      cardW = cardH / CARD_ASPECT;
    }
    ({ marginTop, cardH, cardW } = enforceVerticalSpacing(2, playH, marginTop, cardH, cardW));
    left1 = marginLeft;
    left2 = (playW - cardW) / 2;
    left3 = playW - marginLeft - cardW;
    top1 = marginTop;
    top2 = playH - marginTop - cardH;
    const match: Rect = { left: left2, top: top2, width: cardW, height: cardH };
    const statics: Rect[] = [
      { left: left1, top: top1, width: cardW, height: cardH },
      { left: left3, top: top1, width: cardW, height: cardH },
    ];
    return { match, statics, cardSize: { w: cardW, h: cardH } };
  }

  setGrid3x3();
  const match: Rect = { left: left2, top: top2, width: cardW, height: cardH };
  if (cardsPerPage === 6) {
    const statics: Rect[] = [
      { left: left1, top: top1, width: cardW, height: cardH },
      { left: left2, top: top1, width: cardW, height: cardH },
      { left: left3, top: top1, width: cardW, height: cardH },
      { left: left1, top: top3, width: cardW, height: cardH },
      { left: left2, top: top3, width: cardW, height: cardH },
      { left: left3, top: top3, width: cardW, height: cardH },
    ];
    return { match, statics, cardSize: { w: cardW, h: cardH } };
  } else {
    const statics: Rect[] = [
      { left: left1, top: top1, width: cardW, height: cardH },
      { left: left2, top: top1, width: cardW, height: cardH },
      { left: left3, top: top1, width: cardW, height: cardH },
      { left: left1, top: top2, width: cardW, height: cardH },
      { left: left3, top: top2, width: cardW, height: cardH },
      { left: left1, top: top3, width: cardW, height: cardH },
      { left: left2, top: top3, width: cardW, height: cardH },
      { left: left3, top: top3, width: cardW, height: cardH },
    ];
    return { match, statics, cardSize: { w: cardW, h: cardH } };
  }
}

export function getStaticCenters(layout: LayoutResult) {
  return layout.statics.map(r => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 }));
}



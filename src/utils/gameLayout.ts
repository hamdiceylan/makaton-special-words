import { Platform } from 'react-native';
import { isLandscape, isTablet } from './device';
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

function compute4CardPortraitThirds(playW: number, playH: number, isPad: boolean): LayoutResult {
  const config = isPad
    ? {
        verticalMarginFactor: 0.025,
        minColumnGapFactor: 0.05,
        minColumnGap: 24,
        minPaddingFactor: 0.06,
        minPadding: 24,
        targetWidthFactor: 0.34,
        desiredGapFactor: 0.06,
        offsetFactor: 0,
      }
    : {
        verticalMarginFactor: 0.03,
        minColumnGapFactor: 0.06,
        minColumnGap: 18,
        minPaddingFactor: 0.045,
        minPadding: 16,
        targetWidthFactor: 0.38,
        desiredGapFactor: 0.08,
        offsetFactor: 0.12,
      };

  const thirdH = playH / 3;
  let verticalMargin = Math.max(MIN_GAP_Y, playH * config.verticalMarginFactor);
  if (thirdH - 2 * verticalMargin <= 0) {
    verticalMargin = Math.max(4, thirdH / 2 - 1);
  }

  const minColumnGap = Math.max(config.minColumnGap, playW * config.minColumnGapFactor);
  const minPadding = Math.max(config.minPadding, playW * config.minPaddingFactor);

  const widthLimit = Math.max(0, (playW - minColumnGap - 2 * minPadding) / 2);
  const heightLimit = Math.max(0, thirdH - 2 * verticalMargin);
  const targetWidth = playW * config.targetWidthFactor;

  let w = Math.min(targetWidth, widthLimit);
  if (!isFinite(w) || w <= 0) {
    w = Math.max(0, widthLimit);
  }

  let h = w * CARD_ASPECT;
  if (heightLimit === 0) {
    h = 0;
    w = 0;
  } else if (h > heightLimit) {
    h = heightLimit;
    w = h / CARD_ASPECT;
  }

  const targetOffset = thirdH * config.offsetFactor;
  const maxOffset = Math.max(0, thirdH / 2 - verticalMargin - h / 2);
  const centerOffset = Math.min(targetOffset, maxOffset);

  const maxCenterOffsetX = Math.max(0, playW / 2 - (minPadding + w / 2));
  const minCenterOffsetX = Math.min(maxCenterOffsetX, (w + minColumnGap) / 2);
  let centerOffsetX = Math.min(maxCenterOffsetX, playW / 4);
  centerOffsetX = Math.max(centerOffsetX, minCenterOffsetX);

  const leftCenterX = playW / 2 - centerOffsetX;
  const rightCenterX = playW / 2 + centerOffsetX;

  const topCenterY = thirdH / 2 + centerOffset;
  const bottomCenterY = playH - thirdH / 2 - centerOffset;
  const matchCenterY = playH / 2;

  const statics: Rect[] = [
    { left: leftCenterX - w / 2, top: topCenterY - h / 2, width: w, height: h },
    { left: rightCenterX - w / 2, top: topCenterY - h / 2, width: w, height: h },
    { left: leftCenterX - w / 2, top: bottomCenterY - h / 2, width: w, height: h },
    { left: rightCenterX - w / 2, top: bottomCenterY - h / 2, width: w, height: h },
  ];
  const match: Rect = { left: (playW - w) / 2, top: matchCenterY - h / 2, width: w, height: h };

  return { match, statics, cardSize: { w, h } };
}

function compute4CardLandscapeThirds(playW: number, playH: number, isPad: boolean): LayoutResult {
  const config = isPad
    ? {
        verticalMarginFactor: 0.045,
        minPaddingXFactor: 0.05,
        minPaddingX: 28,
        minColumnGapFactor: 0.05,
        minColumnGap: 36,
        minRowGapFactor: 0.06,
        targetHeightFactor: 0.44,
        rowOffsetFactor: 1 / 3,
      }
    : {
        verticalMarginFactor: 0.06,
        minPaddingXFactor: 0.04,
        minPaddingX: 20,
        minColumnGapFactor: 0.045,
        minColumnGap: 18,
        minRowGapFactor: 0.08,
        targetHeightFactor: 0.48,
        rowOffsetFactor: 0.26,
      };

  const thirdW = playW / 3;
  const minPaddingX = Math.max(config.minPaddingX, playW * config.minPaddingXFactor);
  const minColumnGap = Math.max(config.minColumnGap, playW * config.minColumnGapFactor);

  const verticalMarginBase = Math.max(MIN_GAP_Y, playH * config.verticalMarginFactor);
  const minRowGap = Math.max(18, playH * config.minRowGapFactor);

  let marginTop = verticalMarginBase;
  const maxCardH = Math.max(0, (playH - minRowGap - 2 * marginTop) / 2);
  let cardH = Math.min(playH * config.targetHeightFactor, maxCardH);
  if (!isFinite(cardH) || cardH <= 0) {
    cardH = Math.max(0, maxCardH);
  }

  let cardW = cardH / CARD_ASPECT;
  const availableWidth = Math.max(0, thirdW - 2 * minPaddingX);
  const gapWidthLimit = Math.max(0, playW / 3 - minColumnGap);
  const maxCardW = Math.max(0, Math.min(availableWidth, gapWidthLimit));

  if (cardW > maxCardW) {
    cardW = maxCardW;
    cardH = cardW * CARD_ASPECT;
  }

  if (cardH > maxCardH) {
    cardH = maxCardH;
    cardW = cardH / CARD_ASPECT;
  }

  const matchCenterX = playW / 2;
  const matchCenterY = playH / 2;

  const thirdH = playH / 3;
  const desiredTopCenter = thirdH / 2;
  const minTopCenter = marginTop + cardH / 2;
  const maxTopCenter = matchCenterY - cardH / 2 - minRowGap / 2;
  const topCenterY = Math.min(Math.max(desiredTopCenter, minTopCenter), Math.max(minTopCenter, maxTopCenter));
  const bottomCenterY = playH - topCenterY;

  const desiredOffsetX = playW / 3;
  const minOffsetX = Math.max((cardW + minColumnGap) / 2, cardW);
  const maxOffsetX = Math.max(minOffsetX, playW / 2 - cardW / 2);
  const centerOffsetX = Math.min(Math.max(desiredOffsetX, minOffsetX), maxOffsetX);

  let leftCenterX = matchCenterX - centerOffsetX;
  let rightCenterX = matchCenterX + centerOffsetX;

  if (leftCenterX - cardW / 2 < minPaddingX) {
    const deficit = minPaddingX - (leftCenterX - cardW / 2);
    leftCenterX += deficit;
    rightCenterX += deficit;
  }

  const rightEdge = playW - minPaddingX;
  if (rightCenterX + cardW / 2 > rightEdge) {
    const deficit = (rightCenterX + cardW / 2) - rightEdge;
    leftCenterX -= deficit;
    rightCenterX -= deficit;
  }

  const statics: Rect[] = [
    { left: leftCenterX - cardW / 2, top: topCenterY - cardH / 2, width: cardW, height: cardH },
    { left: rightCenterX - cardW / 2, top: topCenterY - cardH / 2, width: cardW, height: cardH },
    { left: leftCenterX - cardW / 2, top: bottomCenterY - cardH / 2, width: cardW, height: cardH },
    { left: rightCenterX - cardW / 2, top: bottomCenterY - cardH / 2, width: cardW, height: cardH },
  ];

  const match: Rect = {
    left: matchCenterX - cardW / 2,
    top: matchCenterY - cardH / 2,
    width: cardW,
    height: cardH,
  };

  return { match, statics, cardSize: { w: cardW, h: cardH } };
}

function compute3CardLandscapeThirds(playW: number, playH: number, isPad: boolean): LayoutResult {
  const config = isPad
    ? {
        verticalMarginFactor: 0.04,
        minPaddingXFactor: 0.05,
        minPaddingX: 28,
        minColumnGapFactor: 0.07,
        minColumnGap: 40,
        minRowGapFactor: 0.08,
        targetWidthFactor: 0.3,
        rowOffsetFactor: 0.22,
      }
    : {
        verticalMarginFactor: 0.05,
        minPaddingXFactor: 0.035,
        minPaddingX: 16,
        minColumnGapFactor: 0.06,
        minColumnGap: 20,
        minRowGapFactor: 0.1,
        targetWidthFactor: 0.32,
        rowOffsetFactor: 0.24,
      };

  const thirdW = playW / 3;
  const minPaddingX = Math.max(config.minPaddingX, playW * config.minPaddingXFactor);
  const minColumnGap = Math.max(config.minColumnGap, playW * config.minColumnGapFactor);
  const verticalMargin = Math.max(MIN_GAP_Y, playH * config.verticalMarginFactor);
  const minRowGap = Math.max(MIN_GAP_Y, playH * config.minRowGapFactor);

  const widthLimit = Math.max(0, Math.min(thirdW - 2 * minPaddingX, thirdW - minColumnGap));
  const targetWidth = playW * config.targetWidthFactor;
  let cardW = Math.min(targetWidth, widthLimit);
  if (!isFinite(cardW) || cardW <= 0) {
    cardW = Math.max(0, widthLimit);
  }

  let cardH = cardW * CARD_ASPECT;
  const maxCardH = Math.max(0, (playH - 2 * verticalMargin - minRowGap) / 2);
  if (cardH > maxCardH) {
    cardH = maxCardH;
    cardW = cardH / CARD_ASPECT;
  }

  const minRowOffset = cardH / 2 + minRowGap / 2;
  const maxRowOffset = Math.max(0, playH / 2 - verticalMargin - cardH / 2);
  const desiredRowOffset = Math.max(minRowOffset, playH * config.rowOffsetFactor);
  const rowOffset = Math.min(maxRowOffset, desiredRowOffset);

  const topCenterY = playH / 2 - rowOffset;
  const matchCenterY = playH / 2 + rowOffset;

  const columnCenters = [thirdW / 2, playW / 2, playW - thirdW / 2];
  const statics: Rect[] = columnCenters.map(x => ({
    left: x - cardW / 2,
    top: topCenterY - cardH / 2,
    width: cardW,
    height: cardH,
  }));

  const match: Rect = {
    left: playW / 2 - cardW / 2,
    top: matchCenterY - cardH / 2,
    width: cardW,
    height: cardH,
  };

  return { match, statics, cardSize: { w: cardW, h: cardH } };
}

function compute2CardLandscapeHalves(playW: number, playH: number, isPad: boolean): LayoutResult {
  const config = isPad
    ? {
        verticalMarginFactor: 0.04,
        minPaddingXFactor: 0.05,
        minPaddingX: 28,
        targetWidthFactor: 0.36,
        minRowGapFactor: 0.08,
        desiredSplitFactor: 0.24,
      }
    : {
        verticalMarginFactor: 0.05,
        minPaddingXFactor: 0.04,
        minPaddingX: 18,
        targetWidthFactor: 0.4,
        minRowGapFactor: 0.1,
        desiredSplitFactor: 0.26,
      };

  const halfW = playW / 2;
  const minPaddingX = Math.max(config.minPaddingX, playW * config.minPaddingXFactor);
  const verticalMargin = Math.max(MIN_GAP_Y, playH * config.verticalMarginFactor);
  const minRowGap = Math.max(MIN_GAP_Y, playH * config.minRowGapFactor);

  const widthLimit = Math.max(0, halfW - 2 * minPaddingX);
  const targetWidth = playW * config.targetWidthFactor;
  let cardW = Math.min(targetWidth, widthLimit);
  if (!isFinite(cardW) || cardW <= 0) {
    cardW = Math.max(0, widthLimit);
  }

  let cardH = cardW * CARD_ASPECT;
  const maxCardH = Math.max(0, (playH - 2 * verticalMargin - minRowGap) / 2);
  if (cardH > maxCardH) {
    cardH = maxCardH;
    cardW = cardH / CARD_ASPECT;
  }

  const minRowOffset = cardH / 2 + minRowGap / 2;
  const maxRowOffset = Math.max(0, playH / 2 - verticalMargin - cardH / 2);
  const desiredSplit = playH * config.desiredSplitFactor;
  const desiredRowOffset = Math.max(minRowOffset, Math.min(desiredSplit, maxRowOffset));
  const rowOffset = Math.min(maxRowOffset, desiredRowOffset);

  const staticCenterY = playH / 2 - rowOffset;
  const matchCenterY = playH / 2 + rowOffset;

  const leftCenterX = playW / 4;
  const rightCenterX = playW - playW / 4;
  const matchCenterX = playW / 2;

  const statics: Rect[] = [
    { left: leftCenterX - cardW / 2, top: staticCenterY - cardH / 2, width: cardW, height: cardH },
    { left: rightCenterX - cardW / 2, top: staticCenterY - cardH / 2, width: cardW, height: cardH },
  ];

  const match: Rect = {
    left: matchCenterX - cardW / 2,
    top: matchCenterY - cardH / 2,
    width: cardW,
    height: cardH,
  };

  return { match, statics, cardSize: { w: cardW, h: cardH } };
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
  const horizontalInset = horizontalPadding / 2;

  const applyHorizontalInset = (layout: LayoutResult): LayoutResult => {
    if (horizontalInset === 0) return layout;
    const adjustedMatch: Rect = { ...layout.match, left: layout.match.left + horizontalInset };
    const adjustedStatics: Rect[] = layout.statics.map(rect => ({ ...rect, left: rect.left + horizontalInset }));
    return { ...layout, match: adjustedMatch, statics: adjustedStatics };
  };

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
    if (isPad) {
      return applyHorizontalInset(
        isPortrait
          ? compute4CardPortraitThirds(playW, playH, true)
          : compute4CardLandscapeThirds(playW, playH, true)
      );
    }
    return applyHorizontalInset(
      isPortrait
        ? compute4CardPortraitThirds(playW, playH, false)
        : compute4CardLandscapeThirds(playW, playH, false)
    );
  }

  if (cardsPerPage === 3 && !isPortrait) {
    return applyHorizontalInset(compute3CardLandscapeThirds(playW, playH, isPad));
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
      return applyHorizontalInset({ match, statics, cardSize: { w: cardW, h: cardH } });
    } else {
      if (isPortrait) {
        const match: Rect = { left: left1, top: top2, width: cardW, height: cardH };
        const statics: Rect[] = [
          { left: left3, top: top1, width: cardW, height: cardH },
          { left: left3, top: top2, width: cardW, height: cardH },
          { left: left3, top: top3, width: cardW, height: cardH },
        ];
        return applyHorizontalInset({ match, statics, cardSize: { w: cardW, h: cardH } });
      } else {
        const match: Rect = { left: left2, top: top3, width: cardW, height: cardH };
        const statics: Rect[] = [
          { left: left1, top: top1, width: cardW, height: cardH },
          { left: left2, top: top1, width: cardW, height: cardH },
          { left: left3, top: top1, width: cardW, height: cardH },
        ];
        return applyHorizontalInset({ match, statics, cardSize: { w: cardW, h: cardH } });
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
      return applyHorizontalInset({ match, statics, cardSize: { w: cardW, h: cardH } });
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
      return applyHorizontalInset({ match, statics, cardSize: { w: cardW, h: cardH } });
    }
  }

  if (cardsPerPage === 2) {
    if (!isPortrait) {
      return applyHorizontalInset(compute2CardLandscapeHalves(playW, playH, isPad));
    }
    marginLeft = (isPad ? 40 : 20) * magnification;
    cardW = (playW - 3 * marginLeft) / 2;
    cardH = cardW * CARD_ASPECT;
    marginTop = (playH - 2 * cardH) / 3;
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
    return applyHorizontalInset({ match, statics, cardSize: { w: cardW, h: cardH } });
  }

  setGrid3x3();

  if (!isPortrait && (cardsPerPage === 6 || cardsPerPage === 8)) {
    const thirdW = playW / 3;
    const columnCenters = [thirdW / 2, playW / 2, playW - thirdW / 2];
    const clampLeft = (centerX: number) => {
      const desired = centerX - cardW / 2;
      return Math.min(Math.max(desired, 0), playW - cardW);
    };
    left1 = clampLeft(columnCenters[0]);
    left2 = clampLeft(columnCenters[1]);
    left3 = clampLeft(columnCenters[2]);

    const thirdH = playH / 3;
    const clampTop = (centerY: number) => {
      const desired = centerY - cardH / 2;
      const minTop = MIN_GAP_Y;
      const maxTop = Math.max(minTop, playH - cardH - MIN_GAP_Y);
      return Math.min(Math.max(desired, minTop), maxTop);
    };

    top1 = clampTop(thirdH / 2);
    top2 = clampTop(playH / 2);
    top3 = clampTop(playH - thirdH / 2);
  }

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
    return applyHorizontalInset({ match, statics, cardSize: { w: cardW, h: cardH } });
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
    return applyHorizontalInset({ match, statics, cardSize: { w: cardW, h: cardH } });
  }
}

export function getStaticCenters(layout: LayoutResult) {
  return layout.statics.map(r => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 }));
}

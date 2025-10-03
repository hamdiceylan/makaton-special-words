const fs = require('fs');
const path = require('path');

const screens = [
  'sound-to-picture.tsx',
  'sound-to-word.tsx', 
  'word-to-picture.tsx',
  'word-list.tsx',
  'index.tsx'
];

const appDir = '/Users/burak/Desktop/makaton-special-words/app';

screens.forEach(screen => {
  const filePath = path.join(appDir, screen);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File ${screen} not found, skipping...`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add switchCount to useSettings if not already present
  if (!content.includes('switchCount')) {
    content = content.replace(
      /const \{ ([^}]+) \} = useSettings\(\);/,
      'const { $1, switchCount } = useSettings();'
    );
  }
  
  // Add switch control hook if not already present
  if (!content.includes('useSwitchControl')) {
    // Add import
    if (!content.includes('import SwitchInput')) {
      content = content.replace(
        /import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';/,
        `import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import SwitchInput from '../src/components/SwitchInput';`
      );
    }
    
    if (!content.includes('import { useSwitchControl }')) {
      content = content.replace(
        /import { useSettings } from '..\/src\/contexts\/SettingsContext';/,
        `import { useSettings } from '../src/contexts/SettingsContext';
import { useSwitchControl } from '../src/hooks/useSwitchControl';`
      );
    }
    
    // Add switch control hook after isLocked state
    if (content.includes('const [isLocked, setIsLocked] = useState(false);')) {
      const switchControlCode = `
  // Switch control for accessibility
  const switchControl = useSwitchControl({
    items: gameState.staticCards || [],
    onItemSelect: (card, index) => {
      if (gameState.isAnimating) return;
      
      // Check if this card matches the current match card
      if (card.text === gameState.matchCard?.text || card.image === gameState.matchCard?.image) {
        // It's a match! Programmatically drag the match card to this position
        if (typeof handleProgrammaticMatch === 'function') {
          handleProgrammaticMatch(card, index);
        }
      }
    },
    onAdvance: () => {
      // Advance to next match card
      if (gameState.currentIndex < (gameState.targetOrder?.length || 0) - 1) {
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
  });`;
      
      content = content.replace(
        'const [isLocked, setIsLocked] = useState(false);',
        `const [isLocked, setIsLocked] = useState(false);${switchControlCode}`
      );
    }
  }
  
  // Add SwitchInput component before closing View
  if (!content.includes('<SwitchInput')) {
    content = content.replace(
      /(\s+)(<\/View>\s*\);\s*}\s*$)/,
      `$1{/* Switch Input for accessibility */}
$1<SwitchInput
$1  onSwitchPress={switchControl.handleSwitchPress}
$1  enabled={switchControl.isEnabled}
$1/>
$2`
    );
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${screen}`);
});

console.log('All screens updated with switch functionality!');

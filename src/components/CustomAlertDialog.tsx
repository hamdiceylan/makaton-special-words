import React, { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { Alert, Modal, Platform, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SFProText } from '../theme/typography';

interface CustomAlertDialogProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  onDisableFeature?: () => void; // Gizli özellik için callback (opsiyonel)
  title?: string;
}

const CustomAlertDialog = ({
  visible,
  onCancel,
  onSuccess,
  onDisableFeature,
  title,
}: CustomAlertDialogProps) => {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [question, setQuestion] = useState("");
  const [gateKey, setGateKey] = useState(0);

  // iOS için Alert.prompt göster
  const showIOSPrompt = (currentQuestion: string, currentGateKey: number, errorMessage?: string) => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        title || t('other.childSafetyGate'),
        errorMessage ? `${errorMessage}\n\n${currentQuestion} =` : `${currentQuestion} =`,
        [
          {
            text: t('buttons.cancel'),
            onPress: onCancel,
            style: 'cancel',
          },
          {
            text: t('buttons.open'),
            onPress: (value?: string) => handleIOSConfirm(value || '', currentGateKey),
          },
        ],
        'plain-text',
        '',
        'number-pad'
      );
    }
  };

  // iOS için doğrulama
  const handleIOSConfirm = (value: string, currentGateKey: number) => {
    const userInput = parseInt(value);
    
    if (!isNaN(userInput)) {
      // Normal doğrulama: gateKey ile eşleşme
      if (userInput === currentGateKey) {
        onSuccess();
      }
      // Yanlış cevap: yeni soru üret ve tekrar göster
      else {
        const newQuestion = generateQuestionAndReturn();
        // Yeni soru üretildikten sonra tekrar göster
        setTimeout(() => {
          showIOSPrompt(newQuestion.expression, newQuestion.result, t('safetyGate.wrongAnswer'));
        }, 100);
      }
    } else {
      // Geçersiz input: tekrar göster
      setTimeout(() => {
        showIOSPrompt(question, currentGateKey, t('safetyGate.invalidNumber'));
      }, 100);
    }
  };

  // Yardımcı fonksiyon: Soru üret ve return et
  const generateQuestionAndReturn = () => {
    const NMIN = 3;
    const NMAX = 10;
    const NTOT = 3;

    // 3 benzersiz sayı seç (3-10 arası)
    const numbers: number[] = [];
    while (numbers.length < NTOT) {
      const num = Math.floor(Math.random() * (NMAX - NMIN + 1)) + NMIN;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }

    const [n0, n1, n2] = numbers;

    // Format: n2 - n0 + n1
    const expression = `${n2} - ${n0} + ${n1}`;
    const result = n2 - n0 + n1;

    setQuestion(expression);
    setGateKey(result);
    setInput("");
    setError(false);

    return { expression, result };
  };

  // Android için kullanılan wrapper
  const generateQuestion = () => {
    generateQuestionAndReturn();
  };

  // Rastgele işlem üret ve iOS için prompt göster
  useEffect(() => {
    if (visible) {
      const newQuestion = generateQuestionAndReturn();
      // iOS için ilk prompt'u göster
      if (Platform.OS === 'ios') {
        setTimeout(() => {
          showIOSPrompt(newQuestion.expression, newQuestion.result);
        }, 50);
      }
    }
  }, [visible]);

  const handleConfirm = () => {
    const userInput = parseInt(input);
    
    if (!isNaN(userInput)) {
      // // Gizli özellik: gateKey * 1000 girilirse ayarı tamamen kapat
      // if (userInput === gateKey * 1000) {
      //   setError(false);
      //   onSuccess();
      //   setInput("");
      //   // Ayarı kapat (eğer callback verilmişse)
      //   if (onDisableFeature) {
      //     onDisableFeature();
      //   }
      // }
      // Normal doğrulama: gateKey ile eşleşme
      if (userInput === gateKey) {
        setError(false);
        onSuccess();
        setInput("");
      }
      // Yanlış cevap: yeni soru üret
      else {
        setError(true);
        setInput("");
        generateQuestion();
      }
    }
  };

  // iOS için Alert.prompt kullanıldığı için Modal render etme
  if (Platform.OS === 'ios') {
    return null;
  }

  // Android için Custom Modal
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.2)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 20,
            width: 280,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10, textAlign: "center" }}>
            {title || t('other.childSafetyGate')}
          </Text>
          <Text style={{ marginBottom: 10, textAlign: "center" }}>
            {question} = ?
          </Text>

          <TextInput
            style={{
              borderWidth: 1,
              borderColor: error ? "red" : "#ccc",
              borderRadius: 8,
              padding: 8,
              textAlign: "center"
            }}
            keyboardType="numeric"
            value={input}
            onChangeText={setInput}
            placeholder={t('safetyGate.yourAnswer')}
          />

          {error && (
            <Text style={{ color: "red", marginTop: 8 }}>
              {t('safetyGate.wrongAnswer')}
            </Text>
          )}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              marginTop: 20,
            }}
          >
            <TouchableOpacity onPress={onCancel}>
              <SFProText weight="semibold" style={{ color: '#1785FD', fontSize: 18 }}>
                {t('buttons.cancel')}
              </SFProText>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleConfirm}>
              <SFProText weight="semibold" style={{ color: '#1785FD', fontSize: 18 }}>
                {t('buttons.open')}
              </SFProText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CustomAlertDialog;
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal } from "react-native";
import { SFProText } from '../theme/typography';

const CustomAlertDialog = ({
  visible,
  onCancel,
  onSuccess,
  title = "Child Safety Gate",
}) => {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);

  // Rastgele işlem üret
  useEffect(() => {
    if (visible) generateQuestion();
  }, [visible]);

  const generateQuestion = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const num3 = Math.floor(Math.random() * 10) + 1;

    // Rastgele toplama veya çıkarma işlemleri karıştır
    const operations = ["+", "-"];
    const op1 = operations[Math.floor(Math.random() * operations.length)];
    const op2 = operations[Math.floor(Math.random() * operations.length)];

    const expression = `${num1} ${op1} ${num2} ${op2} ${num3}`;

    // Gerçek sonucu hesapla
    const result = eval(expression);
    setQuestion(expression);
    setAnswer(result);
    setInput("");
    setError(false);
  };

  const handleConfirm = () => {
    if(!isNaN(parseInt(input))){
       if (parseInt(input) === answer) {
         setError(false);
         onSuccess();
         setInput("");
       } else {
         setError(true);
         setInput("");
         generateQuestion(); // Yanlış cevapta yeni soru
       }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}
      onRequestClose={onCancel}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.4)",
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
            {title}
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
            placeholder="Your answer"
          />

          {error && (
            <Text style={{ color: "red", marginTop: 8 }}>
              Wrong answer. Please try again.
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
                Cancel
              </SFProText>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleConfirm}>
              <SFProText weight="semibold" style={{ color: '#1785FD', fontSize: 18 }}>
                Open
              </SFProText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CustomAlertDialog;
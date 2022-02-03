import React from "react";
import { View } from "react-native";
import { Title, Text, useTheme } from "react-native-paper";

interface Props {
  currentStep: number;
}
const steps = [
  "Obter conteúdo",
  "Cortar",
  "Compor",
  "Renderizar",
  "Publicar/Salvar",
];

const StepTitle: React.FC<Props> = function ({ currentStep }) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View
        style={{
          height: 32,
          width: 32,
          borderRadius: 16,
          justifyContent: "center",
          paddingHorizontal: 8,
          alignItems: "center",
          marginRight: 16,
          backgroundColor: colors.primary,
        }}
      >
        <Text
          style={{
            textAlign: "center",
            color: "white",
            fontSize: 20,
            fontWeight: "bold",
          }}
        >
          {currentStep}
        </Text>
      </View>
      <Title>{steps[currentStep - 1]}</Title>
    </View>
  );
};

export default StepTitle;

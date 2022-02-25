import * as React from "react";
import { View } from "react-native";
import { Button } from "react-native-paper";
import DropDown from "react-native-paper-dropdown";
import {
  useVideo,
  VideoIntro,
  VideoOutro,
} from "../../context/create-video-context";

const Spacer = () => <View style={{ marginBottom: 16 }} />;
const SmallSpacer = () => <View style={{ marginBottom: 8 }} />;

type IntroList = {
  label: string;
  value: VideoIntro;
}[];

type OutroList = {
  label: string;
  value: VideoOutro;
}[];

const introList: IntroList = [
  { label: "Nenhum", value: "" },
  { label: "Padrão", value: "padrao" },
  { label: "Alternativa", value: "alternativo" },
  { label: "Hinos Especiais", value: "hinos_especiais" },
];

const outroList: OutroList = [
  { label: "Nenhum", value: "" },
  { label: "Padrão", value: "padrao" },
  { label: "Alternativa", value: "alternativo" },
];

const Compose: React.FC = () => {
  const [showDropDownIntro, setShowDropDownIntro] = React.useState(false);
  const [showDropDownFinal, setShowDropDownFinal] = React.useState(false);
  const { videoState, setIntro, setOutro } = useVideo();

  console.log(videoState)

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        padding: 16,
      }}
    >
      <DropDown
        label={"Intro"}
        mode={"outlined"}
        visible={showDropDownIntro}
        showDropDown={() => setShowDropDownIntro(true)}
        onDismiss={() => setShowDropDownIntro(false)}
        value={videoState.intro}
        setValue={setIntro}
        list={introList}
      />
      <SmallSpacer />
      <Button mode="outlined" onPress={() => {}} icon="eye">
        Ver Intro
      </Button>
      <Spacer />
      <DropDown
        label={"Final"}
        mode={"outlined"}
        visible={showDropDownFinal}
        showDropDown={() => setShowDropDownFinal(true)}
        onDismiss={() => setShowDropDownFinal(false)}
        value={videoState.outro}
        setValue={setOutro}
        list={outroList}
      />
      <SmallSpacer />
      <Button mode="outlined" onPress={() => {}} icon="eye">
        Ver Final
      </Button>
    </View>
  );
};

export default Compose;

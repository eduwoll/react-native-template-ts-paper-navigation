import axios, { AxiosResponse } from "axios";
import * as React from "react";
import { View } from "react-native";
import DocumentPicker from "react-native-document-picker";
import * as RNFS from "react-native-fs";
import { Button } from "react-native-paper";
import DropDown from "react-native-paper-dropdown";
import { useVideo } from "../../context/create-video-context";

const Spacer = () => <View style={{ marginBottom: 16 }} />;
const SmallSpacer = () => <View style={{ marginBottom: 8 }} />;

const Compose: React.FC = () => {
  const [showDropDownIntro, setShowDropDownIntro] = React.useState(false);
  const [showDropDownFinal, setShowDropDownFinal] = React.useState(false);
  const [intro, setIntro] = React.useState("0");
  const [final, setFinal] = React.useState("0");
  const [status, setStatus] = React.useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = React.useState(0);
  const { setSource } = useVideo();

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
        value={intro}
        setValue={setIntro}
        list={[
          { label: "Padrão", value: "0" },
          { label: "Alternativa", value: "1" },
          { label: "Hinos Especiais", value: "2" },
        ]}
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
        value={final}
        setValue={setFinal}
        list={[{ label: "Padrão", value: "0" }]}
      />
      <SmallSpacer />
      <Button mode="outlined" onPress={() => {}} icon="eye">
        Ver Final
      </Button>
    </View>
  );
};

export default Compose;

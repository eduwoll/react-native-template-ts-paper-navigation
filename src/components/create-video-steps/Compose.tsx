import * as React from "react";
import { View } from "react-native";
import { Button } from "react-native-paper";
import DropDown from "react-native-paper-dropdown";
import {
  useVideo,
  VideoIntro,
  VideoOutro,
} from "../../context/create-video-context";
import { silentIntroNames } from "../../utils/ffmpegHelper";
import VideoPreviewDialog from "../VideoPreviewDialog";

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
  { label: "Alternativo", value: "alternativo" },
  { label: "Hinos", value: "hinos" },
];

const outroList: OutroList = [
  { label: "Nenhum", value: "" },
  { label: "Padrão", value: "padrao" },
  { label: "Alternativo", value: "alternativo" },
];

const Compose: React.FC = () => {
  const [showDropDownIntro, setShowDropDownIntro] = React.useState(false);
  const [showDropDownFinal, setShowDropDownFinal] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);
  const [introPreview, setIntroPreview] = React.useState<VideoIntro>("");
  const [outroPreview, setOutroPreview] = React.useState<VideoOutro>("");
  const { videoState, setIntro, setOutro } = useVideo();

  const outroDisabled = silentIntroNames.includes(videoState.intro);

  React.useEffect(() => {
    if (outroDisabled) setOutro("");
  }, [outroDisabled]);

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
      <Button
        mode="outlined"
        onPress={() => {
          setIntroPreview(videoState.intro);
          setOutroPreview("");
          setShowPreview(true);
        }}
        icon="eye"
        disabled={!videoState.intro}
      >
        Ver Intro
      </Button>
      <Spacer />
      <DropDown
        label={"Final"}
        mode={"outlined"}
        visible={showDropDownFinal}
        showDropDown={() => (!outroDisabled ? setShowDropDownFinal(true) : {})}
        onDismiss={() => setShowDropDownFinal(false)}
        value={videoState.outro}
        setValue={setOutro}
        list={outroList}
        inputProps={{ disabled: outroDisabled }}
      />
      <SmallSpacer />
      <Button
        mode="outlined"
        onPress={() => {
          setIntroPreview("");
          setOutroPreview(videoState.outro);
          setShowPreview(true);
        }}
        icon="eye"
        disabled={!videoState.outro}
      >
        Ver Final
      </Button>

      <VideoPreviewDialog
        visible={showPreview}
        onDismiss={() => setShowPreview(false)}
        intro={introPreview}
        outro={outroPreview}
      />
    </View>
  );
};

export default Compose;

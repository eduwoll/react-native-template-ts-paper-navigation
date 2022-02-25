import { DrawerNavigationProp } from "@react-navigation/drawer";
import {
  NavigationContainer,
  NavigationContainerRef,
} from "@react-navigation/native";
import {
  createStackNavigator,
  TransitionPresets,
} from "@react-navigation/stack";
import * as React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Divider, ProgressBar, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "../components/AppHeader";
import Compose from "../components/create-video-steps/Compose";
import CutContent from "../components/create-video-steps/CutContent";
import GetContent from "../components/create-video-steps/GetContent";
import RenderVideo from "../components/create-video-steps/RenderVideo";
import ShareVideo from "../components/create-video-steps/ShareVideo";
import StepTitle from "../components/StepTitle";
import { useVideo } from "../context/create-video-context";
import { useDarkTheme } from "../context/theme-context";
import { AuthenticatedRoutesParamsList } from "../routes/authenticated";

export type VideoSource =
  | undefined
  | {
      uri: string;
      type: string | undefined;
    };

type DashboardScreenNavigationProp = DrawerNavigationProp<
  AuthenticatedRoutesParamsList,
  "Home"
>;

type Props = {
  navigation: DashboardScreenNavigationProp;
};

const steps = [
  "GetContent",
  "CutContent",
  "Compose",
  "RenderVideo",
  "ShareVideo",
];

const Stack = createStackNavigator();

export default ({ navigation }: Props) => {
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = React.useState(1);
  const navigatorRef = React.useRef<NavigationContainerRef>(null);
  const { videoState } = useVideo();
  const theme = useDarkTheme().theme;

  React.useEffect(() => {
    const unsubscribe = navigatorRef.current?.addListener("state", (state) => {
      setCurrentStep(state.data.state?.routes.length || 1);
    });

    return unsubscribe;
  }, []);

  React.useEffect(() => {
    if (videoState.source) setCurrentStep(2);
  }, [videoState.source]);

  React.useEffect(() => {
    if (videoState.output) setCurrentStep(5);
  }, [videoState.output]);

  React.useEffect(() => {
    const StepName = steps[currentStep - 1];
    navigatorRef.current?.navigate(StepName);
  }, [currentStep]);

  function nextIsLocked() {
    if (currentStep == 1 && !videoState.source) return true;
    if (currentStep === 4 && !videoState.output) return true;
    if (currentStep === 5) return true;
    return false;
  }

  return (
    <>
      <AppHeader navigation={navigation} title="Criar Vídeo" />
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.body}
          contentContainerStyle={{ flex: 1 }}
        >
          <NavigationContainer independent ref={navigatorRef} theme={theme}>
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                ...TransitionPresets.SlideFromRightIOS,
              }}
            >
              <Stack.Screen name="GetContent" component={GetContent} />
              <Stack.Screen name="CutContent" component={CutContent} />
              <Stack.Screen name="Compose" component={Compose} />
              <Stack.Screen name="RenderVideo" component={RenderVideo} />
              <Stack.Screen name="ShareVideo" component={ShareVideo} />
            </Stack.Navigator>
          </NavigationContainer>
        </ScrollView>
        <View
          style={{
            backgroundColor: colors.surface,
          }}
        >
          <ProgressBar
            progress={
              (currentStep < 5 ? (currentStep - 1) / 2 : currentStep - 1) / 4
            }
          />
          <StepTitle currentStep={currentStep} />
          <Divider />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              paddingHorizontal: 8,
              paddingVertical: 16,
            }}
          >
            <Button
              disabled={currentStep === 1}
              onPress={() => {
                setCurrentStep(currentStep - 1);
              }}
            >
              Voltar
            </Button>
            <Button
              disabled={nextIsLocked()}
              onPress={() => setCurrentStep(currentStep + 1)}
            >
              Avançar
            </Button>
          </View>
        </View>
        {/* <Portal>
          <FAB onPress={toggleDark} icon={fabIcon} style={styles.fab} />
        </Portal> */}
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  engine: {
    position: "absolute",
    right: 0,
  },
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "600",
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "400",
  },
  highlight: {
    fontWeight: "700",
  },
  fab: {
    position: "absolute",
    bottom: 16,
    right: 16,
  },
});

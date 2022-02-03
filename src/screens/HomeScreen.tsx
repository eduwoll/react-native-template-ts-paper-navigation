import React, { memo } from "react";
import Background from "../components/paper-ui/Background";
import Logo from "../components/paper-ui/Logo";
import Header from "../components/paper-ui/Header";
import Button from "../components/paper-ui/Button";
import { Paragraph } from "react-native-paper";
import { UnauthenticatedRoutesParamsList } from "../routes/public";
import { StackNavigationProp } from "@react-navigation/stack";
import { StyleSheet, View } from "react-native";

type HomeScreenScreenNavigationProp = StackNavigationProp<
  UnauthenticatedRoutesParamsList,
  "HomeScreen"
>;

type Props = {
  navigation: HomeScreenScreenNavigationProp;
};

const HomeScreen = ({ navigation }: Props) => (
  <View style={styles.container}>
    <Logo />
    <Header>Login Template</Header>

    <Paragraph>
      The easiest way to start with your amazing application.
    </Paragraph>
    <Button mode="contained" onPress={() => navigation.navigate("LoginScreen")}>
      Login
    </Button>
    <Button
      mode="outlined"
      onPress={() => navigation.navigate("RegisterScreen")}
    >
      Sign Up
    </Button>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
export default memo(HomeScreen);

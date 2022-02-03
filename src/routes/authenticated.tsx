import * as React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { NavigationContainer } from "@react-navigation/native";
import { DrawerContent } from "../components/DrawerContent";
import { useDarkTheme } from "../context/theme-context";
import { Dashboard } from "../screens";
import { StatusBar } from "react-native";
import { useTheme } from "react-native-paper";

export type AuthenticatedRoutesParamsList = {
  Home: undefined;
};

const Drawer = createDrawerNavigator<AuthenticatedRoutesParamsList>();

export default function AuthenticatedRoutes() {
  const { theme } = useDarkTheme();
  const { colors, dark } = useTheme();

  return (
    <>
      <StatusBar backgroundColor={dark ? colors.surface : colors.primary} />
      <NavigationContainer theme={theme}>
        <Drawer.Navigator
          drawerContent={(props) => <DrawerContent {...props} />}
        >
          <Drawer.Screen name="Home" component={Dashboard} />
        </Drawer.Navigator>
      </NavigationContainer>
    </>
  );
}

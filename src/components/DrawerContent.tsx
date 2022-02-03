import React from "react";
import { View, StyleSheet } from "react-native";
import {
  DrawerItem,
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from "@react-navigation/drawer";
import {
  Avatar,
  Title,
  Caption,
  Paragraph,
  Drawer,
  Text,
  TouchableRipple,
  Switch,
  useTheme,
} from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useDarkTheme } from "../context/theme-context";
import { useAuth } from "../context/auth-context";

export function DrawerContent(props: DrawerContentComponentProps) {
  const { toggleDark, dark } = useDarkTheme();
  const {colors} = useTheme()
  const { logout } = useAuth();

  return (
    <DrawerContentScrollView {...props} style={{ backgroundColor: colors.background }}>
      <View style={styles.drawerContent}>
        <Drawer.Section title="Preferências">
          <TouchableRipple onPress={toggleDark}>
            <View style={styles.preference}>
              <Text>Tema Escuro</Text>
              <View pointerEvents="none">
                <Switch value={dark} />
              </View>
            </View>
          </TouchableRipple>
        </Drawer.Section>
        {/* <Drawer.Section style={styles.drawerSection}>
          <DrawerItem
            icon={({ color, size }) => (
              <Icon name="logout" color={color} size={size} />
            )}
            label="Sair"
            onPress={logout}
          />
        </Drawer.Section> */}
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
  },
  userInfoSection: {
    paddingLeft: 20,
  },
  title: {
    marginTop: 20,
    fontWeight: "bold",
  },
  caption: {
    fontSize: 14,
    lineHeight: 14,
  },
  row: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  section: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  paragraph: {
    fontWeight: "bold",
    marginRight: 3,
  },
  drawerSection: {
    marginTop: 15,
  },
  preference: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});

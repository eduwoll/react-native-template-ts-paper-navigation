/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the Paper Navigation template
 * https://github.com/react-native-community/rn-paper-navigation-template
 *
 * @format
 */
import React, { Suspense } from "react";
import { View } from "react-native";
import { ActivityIndicator, useTheme } from "react-native-paper";
import { useAuth } from "./src/context/auth-context";

const AuthenticatedApp = React.lazy(() => import("./src/routes/authenticated"));
const PublicApp = React.lazy(() => import("./src/routes/public"));

const App = () => {
  const { user } = useAuth();
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Suspense
        fallback={<ActivityIndicator size="large" style={{ flex: 1 }} />}
      >
        {user ? <AuthenticatedApp /> : <PublicApp />}
      </Suspense>
    </View>
  );
};

export default App;

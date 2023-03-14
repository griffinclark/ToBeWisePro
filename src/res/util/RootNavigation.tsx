import React, { useEffect } from "react";
import { StatusBar } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import { Discover } from "../../UI/Views/Discover";
import { strings } from "../constants/Strings";
import { HomeHorizontal } from "../../UI/Views/HomeHorizontal";
import { EditQuotes } from "../../UI/Views/EditQuote";
import { HomeVertical } from "../../UI/Views/HomeVertical";
import { Settings } from "../../UI/Views/Settings";
import { NotificationScreen } from "../../UI/Views/NotificationsScreen";

interface RootProps {
  initialRoute: string;
}

const Stack = createStackNavigator();
export const RootNavigation: React.FC<RootProps> = ({
  initialRoute,
}: RootProps) => {

  return (
    <NavigationContainer>
    <StatusBar barStyle={"dark-content"} />
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        animationEnabled: false,
        //   gestureResponseDistance: { horizontal: 20 },
      }}
    >
      <Stack.Screen
        name={strings.screenName.discover}
        component={Discover}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={strings.screenName.home}
        component={HomeVertical}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={strings.screenName.editQuote}
        component={EditQuotes}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={strings.screenName.homeHorizontal}
        component={HomeHorizontal}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={strings.screenName.settings}
        component={Settings}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={strings.screenName.notificationsScreen}
        component={NotificationScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  </NavigationContainer>
  );
};

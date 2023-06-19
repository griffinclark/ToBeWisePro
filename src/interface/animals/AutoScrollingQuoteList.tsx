import React, { useRef, useState, useEffect, useCallback } from "react";
import { FlatList, StyleSheet, View, Button } from "react-native"; // Import Button
import {
  useSharedValue,
  withTiming,
  useDerivedValue,
  runOnJS,
  cancelAnimation,
} from "react-native-reanimated";
import { SmallQuoteContainer } from "../organisms/SmallQuoteContainer";
import Slider from "@react-native-community/slider";
import { LIGHT, PRIMARY_BLUE, PRIMARY_GREEN } from "../../../styles/Colors";
import {
  NavigationInterface,
  QuotationInterface,
} from "../../res/constants/Interfaces";
import { Easing } from "react-native-reanimated";

import { globalStyles } from "../../../styles/GlobalStyles";
import { strings } from "../../res/constants/Strings";
import { TouchableOpacity } from "react-native-gesture-handler";
import { AppText } from "../atoms/AppText";

const QUOTE_ITEM_HEIGHT = globalStyles.smallQuoteContainer.height;

interface Props {
  data: QuotationInterface[];
  playPressed: boolean;
  setPlayPressed: (value: boolean) => void;
  navigation: NavigationInterface;
  query?: string;
  filter?: (quote: QuotationInterface) => boolean;
}

export const AutoScrollingQuoteList: React.FC<Props> = ({
  data,
  playPressed,
  setPlayPressed,
  navigation,
  query,
  filter,
}) => {
  const scrollRef = useRef<FlatList>(null);
  const scrollPosition = useSharedValue(0);
  const [scrollSpeed, setScrollSpeed] = useState(0.0275);
  const [currentPosition, setCurrentPosition] = useState(0);

  const totalScrollDistance = data.length * QUOTE_ITEM_HEIGHT;

  useEffect(() => {
    if (playPressed) {
      scrollPosition.value = withTiming(totalScrollDistance, {
        duration: totalScrollDistance / scrollSpeed,
        easing: Easing.linear,
      });
    } else {
      scrollPosition.value = currentPosition;
    }
  }, [playPressed]);

  useEffect(() => {
    if (playPressed) {
      cancelAnimation(scrollPosition);
      scrollPosition.value = withTiming(totalScrollDistance, {
        duration: totalScrollDistance / scrollSpeed,
        easing: Easing.linear,
      });
    }
  }, [scrollSpeed]);

  const scrollTo = (y: number) => {
    scrollRef.current?.scrollToOffset({ offset: y, animated: false });
  };

  const restartScroll = () => {
    scrollRef.current?.scrollToOffset({ animated: true, offset: 0 }); // scroll to the top
    setPlayPressed(true); // restart auto-scrolling
  };

  useDerivedValue(() => {
    runOnJS(scrollTo)(scrollPosition.value);
  }, [scrollPosition]);

  const handleScroll = (event: any) => {
    setCurrentPosition(event.nativeEvent.contentOffset.y);
  };

  const renderItem = useCallback(
    ({ item: quote }) => (
      <SmallQuoteContainer
        key={quote._id}
        passedInQuote={quote}
        pressFunction={() => {
          let newQuotes: QuotationInterface[] = [quote];
          data.forEach((quote2) => {
            if (quote._id !== quote2._id) {
              newQuotes.push(quote2);
            }
          });
          navigation.push(strings.screenName.homeHorizontal, {
            currentQuotes: newQuotes,
            quoteSearch: {
              filter: filter,
              query: query,
            },
          });
        }}
      />
    ),
    [data, navigation, filter, query]
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        renderItem={renderItem}
        scrollEventThrottle={16}
        ref={scrollRef}
        scrollEnabled={!playPressed}
        onTouchStart={() => setPlayPressed(false)}
        onScroll={handleScroll}
        contentContainerStyle={{ paddingBottom: 75, paddingTop: 75 }} // add 125px padding to the bottom
        ListFooterComponent={() =>
          data.length >= 5 ? (
            <TouchableOpacity onPress={restartScroll} style={styles.button}>
              <AppText style={styles.buttonText}>🔄 Restart</AppText>
            </TouchableOpacity>
          ) : null
        }
      />
      {data.length >= 1 ? (
        <Slider
          minimumValue={0.005}
          maximumValue={0.25}
          onValueChange={(value) => {
            setScrollSpeed(value);
          }}
          value={scrollSpeed}
          minimumTrackTintColor={PRIMARY_BLUE}
        />
      ) : (
        <>
        <AppText>
          There are currently no quotes that match your selection
          </AppText></>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: "100%",
    flex: 1,
    marginBottom: globalStyles.navbar.height * 2,
  },
  button: {
    width: "100%",
    height: 50,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY_GREEN,
  },
  buttonText: {
    color: LIGHT,
    fontWeight: "bold",
  },
});

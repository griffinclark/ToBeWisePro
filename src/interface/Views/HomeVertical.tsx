import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { TopNav } from "../molecules/TopNav";
import LinearGradient from "react-native-linear-gradient";
import { GRADIENT_START, GRADIENT_END } from "../../../styles/Colors";
import {
  NavigationInterface,
  QuotationInterface,
  RouteInterface,
} from "../../res/constants/Interfaces";
import { getShuffledQuotes } from "../../res/functions/DBFunctions";
import { autoScrollIntervalTime } from "../../res/constants/Values";
import { strings } from "../../res/constants/Strings";
import { AutoScrollingQuoteList } from "../animals/AutoScrollingQuoteList";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSharedValue } from "react-native-reanimated";

interface Props {
  navigation: NavigationInterface;
  route: RouteInterface;
  initialQuotes: QuotationInterface[];
  initialRoute?: boolean;
}

export const HomeVertical = ({
  navigation,
  route,
  initialQuotes,
  initialRoute,
}: Props) => {
  const [title, setTitle] = useState(
    strings.database.defaultFilter + ": " + strings.database.defaultQuery
  );
  const [backButton, setBackButton] = useState(false);
  const [quotes, setQuotes] = useState<QuotationInterface[]>(initialQuotes);
  const [filter, setFilter] = useState("");
  const [query, setQuery] = useState("");
  const [playPressed, setPlayPressed] = useState<boolean>(true);
  const [scrollSpeed, setScrollSpeed] = useState<number>(
    autoScrollIntervalTime
  );
  const scrollPosition = useSharedValue(0)

  useEffect(()=>{
    console.log("HV q/f ", query, filter)

  },[])


  const fetchQueryAndFilter = async (filter, query) => {
    console.log("Passed", query, filter);

    await AsyncStorage.setItem("query", query);
    await AsyncStorage.setItem("filter", filter);
    const title = filter + ": " + query;
    setTitle(title);
    await AsyncStorage.setItem("title", title);
  };

  const fetchFromStorageAndSet = async (defaultQuery, defaultFilter) => {
    console.log("this is firing");
    const savedFilter =
      (await AsyncStorage.getItem("userFilter")) || defaultFilter;
    const savedQuery =
      (await AsyncStorage.getItem("userQuery")) || defaultQuery;
    const savedTitle = await AsyncStorage.getItem("title");

    setFilter(savedFilter);
    setQuery(savedQuery);

    try {
      const res = await getShuffledQuotes(savedQuery, savedFilter);

      setQuotes(res);
    } catch (error) {
      console.error("Error getting shuffled quotes: ", error);
    }

    if (savedTitle) {
      setTitle(savedTitle);
    }
  };

  useEffect(() => {
    const getTitle = async () => {
      const savedTitle = await AsyncStorage.getItem("title");
      if (savedTitle) {
        setTitle(savedTitle);
      }
    };
    getTitle();
  }, []);

  useEffect(() => {
    const defaultQuery = strings.database.defaultQuery;
    const defaultFilter = strings.database.defaultFilter;
    const quoteSearch = route.params?.quoteSearch
      ? route.params.quoteSearch
      : { query: defaultQuery, filter: defaultFilter };

    if (quoteSearch) {
      const { query, filter } = quoteSearch;
      try {
        setQuotes(route.params.currentQuotes);
        setQuery(query);
        setFilter(filter);
        fetchQueryAndFilter(filter, query);
      } catch (error) {
        console.error(error);
      }
    } else {
      try {
        if (route.params.quoteSearch.query && route.params.quoteSearch.filter) {
          fetchFromStorageAndSet(
            route.params.quoteSearch.query,
            route.params.quoteSearch.filter
          );
          setQuery(route.params.quoteSearch.query);
          setFilter(route.params.quoteSearch.filter);
        } else {
          console.log("using default query and filter");
          fetchFromStorageAndSet(defaultQuery, defaultFilter);
        }
      } catch (error) {
        console.error(`Error fetching data from storage: ${error}`); // Log the error when fetching from storage
        setTitle(strings.navbarHomeDefaultText);
      }
    }

    try {
      setBackButton(route.params.showBackButton);
    } catch {
      setBackButton(false);
    }
  }, [route]);
  // console.log("Home screen re-rendered")
  return (
    <View style={styles.container}>
      <TopNav
        title={title}
        stickyHeader={true}
        backButton={backButton}
        backFunction={() => {
          navigation.goBack();
        }}
      />
      <LinearGradient
        colors={[GRADIENT_START, GRADIENT_END]}
        style={styles.background}
      >
        <AutoScrollingQuoteList
          data={quotes}
          playPressed={playPressed}
          setPlayPressed={setPlayPressed}
          navigation={navigation}
          query={query}
          filter={filter}
          scrollPosition={scrollPosition}
        />
      </LinearGradient>
     
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: "100%",
    width: "100%",
    backgroundColor: "#000",
  },
  background: {
    width: "100%",
    alignItems: "center",
    height: "100%",
  },
});

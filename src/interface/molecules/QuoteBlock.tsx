import React from "react";
import { View, StyleSheet, TouchableWithoutFeedback } from "react-native";
import { QuotationInterface } from "../../res/constants/Interfaces";
import { DARK, PRIMARY_BLUE } from "../../../styles/Colors";
import { globalStyles } from "../../../styles/GlobalStyles";
import { AppText } from "../atoms/AppText";
import { ContainerSize } from "../../res/constants/Enums";

interface Props {
  quote: QuotationInterface;
  size: ContainerSize;
}

export const QuoteBlock: React.FC<Props> = ({ size, quote }: Props) => {
  const getAuthorStyle = () => {
    // return a custom styling based on whether the quote container is large or small
    if (size === ContainerSize.Large) {
      return [globalStyles.authorText, { color: PRIMARY_BLUE }];
    } 
    return globalStyles.authorText;
  };

  const getContainerStyle = ()=>{
    // Return a different styling based on whether the container is large or small
    if (size === ContainerSize.Large) {
      return [styles.quoteContainer];
    } 
    return [styles.quoteContainer, styles.quoteContainerSmall];
  };
  
  const onPressAuthor = () => {
    if (size === ContainerSize.Large) {
      // TODO Google author
    }
  };

  return (
    <View style={styles.container}>
      <View style={getContainerStyle()}>
        <AppText
          style={globalStyles.quoteText}
          numberOfLines={size === ContainerSize.Small ? 6 : undefined}
        >
          {quote.quoteText}
        </AppText>
      </View>
      <View style={styles.authorContainer}>
        {quote.contributedBy && size === ContainerSize.Large && (
          <AppText style={styles.contributedByText}>
            {"Contributed by: " + quote.contributedBy}
          </AppText>
        )}
        <TouchableWithoutFeedback onPress={onPressAuthor}>
          <AppText style={getAuthorStyle()}>{quote.author}</AppText>
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: "90%",
  },
  quoteContainerSmall: {
    borderColor: DARK,
    borderBottomWidth: 0.25,
  },
  quoteContainer: {
    height: "85%",
    paddingBottom: 15,
  },
  authorContainer: {
    paddingTop: 20,
    justifyContent: "flex-end",
    alignContent:"flex-end",
    height: 50,

  },
  contributedByText: {
    fontSize: 14,
  },
});

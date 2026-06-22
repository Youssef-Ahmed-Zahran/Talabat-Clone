import React from "react";
import { View, Text, Dimensions } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { COLORS } from "@src/constants/theme";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width - 32;
const ITEM_HEIGHT = 140;
const SPACING = 8;

const BANNERS = [
  {
    id: "1",
    title: "Free Delivery",
    subtitle: "On your first order",
    image: require("../../../../assets/images/free_delivery.png"),
  },
  {
    id: "2",
    title: "30% Off",
    subtitle: "Selected restaurants",
    image: require("../../../../assets/images/discount.png"),
  },
  {
    id: "3",
    title: "New Stores",
    subtitle: "Explore the latest",
    image: require("../../../../assets/images/new_stores.png"),
  },
];

const BannerItem = ({
  item,
  index,
  scrollX,
}: {
  item: (typeof BANNERS)[0];
  index: number;
  scrollX: SharedValue<number>;
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * (ITEM_WIDTH + SPACING),
      index * (ITEM_WIDTH + SPACING),
      (index + 1) * (ITEM_WIDTH + SPACING),
    ];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.96, 1, 0.96],
      Extrapolation.CLAMP,
    );

    return { transform: [{ scale }] };
  });

  return (
    <Animated.View
      style={[
        {
          width: ITEM_WIDTH,
          height: ITEM_HEIGHT,
          marginRight: index === BANNERS.length - 1 ? 0 : SPACING,
        },
        animatedStyle,
      ]}
      className="rounded-xl overflow-hidden"
    >
      <Image
        source={item.image}
        contentFit="cover"
        style={{ width: "100%", height: "100%", position: "absolute" }}
      />
      <View
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.25)" }}
      />
      <View className="flex-1 p-5 justify-end">
        <Text
          className="text-xs font-medium mb-0.5"
          style={{ color: "rgba(255, 255, 255, 0.8)" }}
        >
          {item.subtitle}
        </Text>
        <Text className="text-white text-xl font-bold">{item.title}</Text>
      </View>
    </Animated.View>
  );
};

const PaginationDot = ({
  index,
  scrollX,
}: {
  index: number;
  scrollX: SharedValue<number>;
}) => {
  const dotStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * (ITEM_WIDTH + SPACING),
      index * (ITEM_WIDTH + SPACING),
      (index + 1) * (ITEM_WIDTH + SPACING),
    ];

    const dotWidth = interpolate(
      scrollX.value,
      inputRange,
      [6, 18, 6],
      Extrapolation.CLAMP,
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.3, 1, 0.3],
      Extrapolation.CLAMP,
    );

    return {
      width: dotWidth,
      opacity,
      backgroundColor: COLORS.primary,
    };
  });

  return <Animated.View style={[{ height: 6, borderRadius: 3 }, dotStyle]} />;
};

export const Banners: React.FC = () => {
  const scrollX = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  return (
    <View className="py-3">
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        snapToInterval={ITEM_WIDTH + SPACING}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {BANNERS.map((item, index) => (
          <BannerItem
            key={item.id}
            item={item}
            index={index}
            scrollX={scrollX}
          />
        ))}
      </Animated.ScrollView>
      <View className="flex-row justify-center items-center mt-3 gap-x-1.5">
        {BANNERS.map((_, index) => (
          <PaginationDot key={index} index={index} scrollX={scrollX} />
        ))}
      </View>
    </View>
  );
};

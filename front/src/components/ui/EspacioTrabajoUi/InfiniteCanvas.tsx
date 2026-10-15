import React, { useRef } from "react";
import { Animated, PanResponder, View } from "react-native";
export default function InfiniteCanvas({
  zoomLevel,
  children,
  moveNodes = false,
}: {
  zoomLevel: number;
  children: React.ReactNode;
  moveNodes?: boolean;
}) {
  const pan = useRef(new Animated.ValueXY()).current,
    offset = useRef({ x: 0, y: 0 });
  const mode = useRef(moveNodes);
  mode.current = moveNodes;
  const responder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        !mode.current && (Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5),
      onPanResponderMove: (_, g) =>
        pan.setValue({
          x: offset.current.x + g.dx,
          y: offset.current.y + g.dy,
        }),
      onPanResponderRelease: (_, g) => {
        offset.current = {
          x: offset.current.x + g.dx,
          y: offset.current.y + g.dy,
        };
      },
      onPanResponderTerminate: () => pan.setValue(offset.current),
    }),
  ).current;
  return (
    <View
      style={{ flex: 1, overflow: "hidden", backgroundColor: "#FCFAFF" }}
      {...responder.panHandlers}
    >
      <Animated.View
        style={{
          position: "absolute",
          width: 1000,
          height: 1000,
          left: "50%",
          top: "50%",
          marginLeft: -500,
          marginTop: -500,
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: zoomLevel },
          ],
        }}
      >
        {children}
      </Animated.View>
    </View>
  );
}

import React, { useRef } from "react";
import { Animated, Image, PanResponder, Pressable, View } from "react-native";
import Svg, { Circle, Defs, Line, Pattern, Rect } from "react-native-svg";
import { Item, Group } from "../../../utils/model";
import { color, radius, shadow, space } from "../../../styles/theme";
import { Txt } from "../base";
function Node({
  item,
  x,
  y,
  onOpen,
  onMove,
  movable,
  zoom,
}: {
  item: Item;
  x: number;
  y: number;
  onOpen: () => void;
  onMove: (x: number, y: number) => void;
  movable: boolean;
  zoom: number;
}) {
  const delta = useRef(new Animated.ValueXY()).current;
  const latest = useRef({ x, y, onMove, movable, zoom });
  latest.current = { x, y, onMove, movable, zoom };
  const responder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        latest.current.movable && (Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3),
      onPanResponderMove: (_, g) =>
        delta.setValue({
          x: g.dx / latest.current.zoom,
          y: g.dy / latest.current.zoom,
        }),
      onPanResponderRelease: (_, g) => {
        const l = latest.current;
        l.onMove(
          Math.max(50, Math.min(950, l.x + g.dx / l.zoom)),
          Math.max(50, Math.min(950, l.y + g.dy / l.zoom)),
        );
        delta.setValue({ x: 0, y: 0 });
      },
      onPanResponderTerminate: () => delta.setValue({ x: 0, y: 0 }),
    }),
  ).current;
  return (
    <Animated.View
      {...responder.panHandlers}
      style={{
        position: "absolute",
        left: x - 53,
        top: y - 25,
        width: 106,
        alignItems: "center",
        transform: delta.getTranslateTransform(),
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Nodo ${item.title}`}
        onPress={onOpen}
        style={{ alignItems: "center", gap: 5, width: 106 }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor:
              item.status === "completado"
                ? color.success
                : item.priority === "urgente"
                  ? color.danger
                  : color.primary,
            borderWidth: 5,
            borderColor: color.primarySoft,
            boxShadow: shadow.card,
          }}
        />
        <Txt
          variant="caption"
          weight={600}
          align="center"
          numberOfLines={2}
          style={{
            backgroundColor: color.background,
            borderRadius: radius.sm,
            paddingHorizontal: space.xs,
          }}
        >
          {item.title}
        </Txt>
      </Pressable>
    </Animated.View>
  );
}
export default function CanvasContent({
  items,
  groups,
  name,
  onOpen,
  onMove,
  moveNodes,
  zoom,
}: {
  items: Item[];
  groups: Group[];
  name: string;
  onOpen: (i: Item) => void;
  onMove: (id: string, x: number, y: number) => void;
  moveNodes: boolean;
  zoom: number;
}) {
  const positions = new Map(
    items.map((i, index) => {
      const angle =
          (index * Math.PI * 2) / Math.max(items.length, 1) - Math.PI / 2,
        radius = items.length > 8 ? 240 : 150;
      return [
        i.id,
        {
          x: i.x || 500 + Math.cos(angle) * radius,
          y: i.y || 500 + Math.sin(angle) * radius,
        },
      ];
    }),
  );
  const hubs = groups
    .filter((g) => items.some((i) => i.groupId === g.id))
    .map((g, index) => ({
      ...g,
      x: 500 + Math.cos(index * 2.4) * 85,
      y: 500 + Math.sin(index * 2.4) * 85,
    }));
  return (
    <View style={{ width: 1000, height: 1000 }}>
      <Svg width={1000} height={1000} style={{ position: "absolute" }}>
        <Defs>
          <Pattern
            id="dots"
            width={24}
            height={24}
            patternUnits="userSpaceOnUse"
          >
            <Circle cx={2} cy={2} r={1} fill={color.mapDot} />
          </Pattern>
        </Defs>
        <Rect width={1000} height={1000} fill="url(#dots)" />
        {items.map((i) => {
          const p = positions.get(i.id)!,
            hub = hubs.find((g) => g.id === i.groupId);
          return (
            <Line
              key={i.id}
              x1={hub?.x ?? 500}
              y1={hub?.y ?? 500}
              x2={p.x}
              y2={p.y}
              stroke={color.mapEdge}
              strokeWidth={2}
            />
          );
        })}
        {items.flatMap((i) =>
          i.dependencies.map((dep) => {
            const a = positions.get(dep),
              b = positions.get(i.id);
            return a && b ? (
              <Line
                key={`${i.id}-${dep}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={color.danger}
                strokeDasharray="5 5"
                strokeWidth={2}
              />
            ) : null;
          }),
        )}
      </Svg>
      {hubs.map((g) => (
        <View
          key={g.id}
          style={{
            position: "absolute",
            left: g.x - 45,
            top: g.y - 16,
            width: 90,
            padding: space.xs + 2,
            borderRadius: radius.sm,
            backgroundColor: color.primarySoft,
            borderWidth: 1,
            borderColor: color.mapEdge,
          }}
        >
          <Txt
            variant="caption"
            tone="primary"
            align="center"
            numberOfLines={1}
          >
            {g.name}
          </Txt>
        </View>
      ))}
      <View
        style={{
          position: "absolute",
          left: 465,
          top: 460,
          width: 70,
          alignItems: "center",
        }}
      >
        <Image
          source={require("../../../../assets/Img/Neka_Pose6.png")}
          aria-hidden
          style={{ width: 62, height: 62 }}
          resizeMode="contain"
        />
        <Txt variant="caption" weight={800} tone="primary">
          {name || "Tú"}
        </Txt>
      </View>
      {items.map((i) => {
        const p = positions.get(i.id)!;
        return (
          <Node
            key={i.id}
            item={i}
            {...p}
            movable={moveNodes}
            zoom={zoom}
            onOpen={() => onOpen(i)}
            onMove={(x, y) => onMove(i.id, x, y)}
          />
        );
      })}
    </View>
  );
}

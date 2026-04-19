import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { ActionButton } from "@/components/ActionButton";
import { InfoCard } from "@/components/InfoCard";
import { OptionChip } from "@/components/OptionChip";
import { colors, radius } from "@/styles/theme";
import type { MapCardMessage } from "@/types/chat";

type LbsMapCardProps = {
  message: MapCardMessage;
};

const modeIcons = {
  taxi: "car-outline",
  transit: "train-outline",
  drive: "navigate-outline"
} as const;

const routeStepIcons = {
  walk: "walk-outline",
  subway: "train-outline",
  taxi: "car-sport-outline",
  drive: "navigate-outline",
  parking: "car-outline",
  arrival: "flag-outline",
  indoor: "location-outline"
} as const;

export function LbsMapCard({ message }: LbsMapCardProps) {
  const activeMode = message.modes.find((mode) => mode.selected) ?? message.modes[0];
  const selectedPoint = message.points?.find((point) => point.selected) ?? message.points?.[0];
  const isIndoor = message.appearance === "indoor";

  return (
    <InfoCard title={message.title}>
      <View style={[styles.mapShell, isIndoor && styles.indoorShell]}>
        <View style={styles.glowA} />
        <View style={styles.glowB} />
        <View style={[styles.roadHorizontal, isIndoor && styles.indoorRoadHorizontal]} />
        <View style={[styles.roadVertical, isIndoor && styles.indoorRoadVertical]} />
        {isIndoor ? (
          <>
            <View style={styles.floorBlockA} />
            <View style={styles.floorBlockB} />
            <View style={styles.floorBlockC} />
          </>
        ) : null}

        <View style={styles.routeLayer}>
          <View style={styles.routeStartWrap}>
            <View style={styles.startDot} />
            <Text style={styles.pointLabel}>当前位置</Text>
          </View>

          <View style={styles.routeLineWrap}>
            <View style={styles.routeLine} />
            <View style={styles.routeDashA} />
            <View style={styles.routeDashB} />
          </View>

          <View style={styles.routeEndWrap}>
            <View style={[styles.endPin, selectedPoint?.kind === "entrance" && styles.highlightPin]}>
              <Ionicons
                name={isIndoor ? "navigate-outline" : "medical-outline"}
                size={14}
                color="#FFFFFF"
              />
            </View>
            <Text style={styles.pointLabel}>{isIndoor ? "院内路线" : "门诊楼"}</Text>
          </View>
        </View>

        {message.points?.map((point) => (
          <View
            key={point.key}
            style={[
              styles.poiNode,
              point.kind === "entrance" && styles.poiEntrance,
              point.kind === "parking" && styles.poiParking,
              point.kind === "triage" && styles.poiTriage,
              point.kind === "pharmacy" && styles.poiPharmacy,
              point.selected && styles.poiSelected
            ]}
          >
            <Text style={[styles.poiLabel, point.selected && styles.poiLabelSelected]}>
              {point.label}
            </Text>
          </View>
        ))}

        <View style={styles.mapBadge}>
          <Ionicons name={modeIcons[activeMode.key]} size={14} color="#C97618" />
          <Text style={styles.mapBadgeText}>{activeMode.eta}</Text>
        </View>
      </View>

      <View style={styles.locationBlock}>
        <View style={styles.locationRow}>
          <Text style={styles.locationLabel}>从</Text>
          <Text style={styles.locationValue}>{message.currentLabel}</Text>
        </View>
        <View style={styles.locationRow}>
          <Text style={styles.locationLabel}>到</Text>
          <Text style={styles.locationValue}>{message.destinationLabel}</Text>
        </View>
        <Text style={styles.distance}>{message.distanceLabel}</Text>
      </View>

      {message.routeSummary ? <Text style={styles.routeSummary}>{message.routeSummary}</Text> : null}

      <View style={styles.modeRow}>
        {message.modes.map((mode) => (
          <OptionChip
            key={mode.key}
            label={mode.label}
            selected={mode.selected}
            onPress={mode.onPress}
          />
        ))}
      </View>

      {message.points?.length ? (
        <View style={styles.poiChipRow}>
          {message.points.map((point) => (
            <OptionChip
              key={point.key}
              label={point.label}
              selected={point.selected}
              onPress={point.onPress}
            />
          ))}
        </View>
      ) : null}

      <View style={styles.activeModeCard}>
        <View style={styles.activeModeTop}>
          <View style={styles.activeModeHeading}>
            <Ionicons name={modeIcons[activeMode.key]} size={16} color={colors.text} />
            <Text style={styles.activeModeTitle}>{activeMode.label}</Text>
          </View>
          <Text style={styles.activeModeEta}>{activeMode.eta}</Text>
        </View>
        <Text style={styles.activeModeMeta}>{activeMode.meta}</Text>
        {selectedPoint?.meta ? <Text style={styles.poiMeta}>{selectedPoint.meta}</Text> : null}
      </View>

      {message.routeSteps?.length ? (
        <View style={styles.routeStepList}>
          {message.routeSteps.map((step) => (
            <View key={step.key} style={styles.routeStepRow}>
              <View style={styles.routeStepIconWrap}>
                <Ionicons name={routeStepIcons[step.kind]} size={15} color="#B96A19" />
              </View>
              <View style={styles.routeStepBody}>
                <Text style={styles.routeStepTitle}>{step.title}</Text>
                <Text style={styles.routeStepDetail}>{step.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {message.hint ? <Text style={styles.hint}>{message.hint}</Text> : null}

      {message.secondaryAction || message.action ? (
        <View style={styles.buttonStack}>
          {message.secondaryAction ? (
            <ActionButton
              label={message.secondaryAction.label}
              variant={message.secondaryAction.variant ?? "secondary"}
              onPress={message.secondaryAction.onPress}
            />
          ) : null}
          {message.action ? (
            <ActionButton
              label={message.action.label}
              variant={message.action.variant}
              onPress={message.action.onPress}
            />
          ) : null}
        </View>
      ) : null}
    </InfoCard>
  );
}

const styles = StyleSheet.create({
  mapShell: {
    height: 188,
    borderRadius: radius.card,
    overflow: "hidden",
    backgroundColor: "#FFF6EC",
    borderWidth: 1,
    borderColor: colors.primaryLine,
    position: "relative"
  },
  indoorShell: {
    backgroundColor: "#FFF9F4"
  },
  glowA: {
    position: "absolute",
    top: 12,
    left: 18,
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: "rgba(255,190,120,0.20)"
  },
  glowB: {
    position: "absolute",
    bottom: 6,
    right: 12,
    width: 110,
    height: 110,
    borderRadius: 999,
    backgroundColor: "rgba(170,208,255,0.18)"
  },
  roadHorizontal: {
    position: "absolute",
    top: 78,
    left: -30,
    right: -30,
    height: 18,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.72)"
  },
  indoorRoadHorizontal: {
    top: 86,
    left: 22,
    right: 22,
    height: 14,
    backgroundColor: "rgba(255,255,255,0.78)"
  },
  roadVertical: {
    position: "absolute",
    top: -20,
    bottom: -20,
    left: 146,
    width: 18,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.68)"
  },
  indoorRoadVertical: {
    top: 20,
    bottom: 20,
    left: 166,
    width: 14,
    backgroundColor: "rgba(255,255,255,0.76)"
  },
  floorBlockA: {
    position: "absolute",
    top: 26,
    left: 28,
    width: 110,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.70)"
  },
  floorBlockB: {
    position: "absolute",
    top: 114,
    left: 24,
    width: 122,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.68)"
  },
  floorBlockC: {
    position: "absolute",
    top: 34,
    right: 26,
    width: 108,
    height: 118,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.66)"
  },
  routeLayer: {
    position: "absolute",
    left: 22,
    right: 22,
    top: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  routeStartWrap: {
    alignItems: "center",
    gap: 6
  },
  routeLineWrap: {
    flex: 1,
    marginHorizontal: 14,
    position: "relative",
    height: 24,
    justifyContent: "center"
  },
  routeLine: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#FFBF76"
  },
  routeDashA: {
    position: "absolute",
    left: "28%",
    top: 8,
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#FFFFFF"
  },
  routeDashB: {
    position: "absolute",
    left: "68%",
    top: 8,
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#FFFFFF"
  },
  routeEndWrap: {
    alignItems: "center",
    gap: 6
  },
  startDot: {
    width: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: colors.text
  },
  endPin: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  highlightPin: {
    shadowColor: "#F49A3F",
    shadowOpacity: 0.26,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4
    },
    elevation: 3
  },
  pointLabel: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "600"
  },
  mapBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.88)"
  },
  mapBadgeText: {
    color: "#C97618",
    fontSize: 13,
    fontWeight: "700"
  },
  poiNode: {
    position: "absolute",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.90)",
    borderWidth: 1,
    borderColor: "rgba(240,200,164,0.9)"
  },
  poiEntrance: {
    top: 56,
    right: 28
  },
  poiParking: {
    top: 18,
    left: 34
  },
  poiTriage: {
    bottom: 24,
    right: 34
  },
  poiPharmacy: {
    bottom: 18,
    left: 44
  },
  poiSelected: {
    backgroundColor: "#FFF0E0",
    borderColor: colors.primary
  },
  poiLabel: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "700"
  },
  poiLabelSelected: {
    color: "#C97618"
  },
  locationBlock: {
    gap: 8
  },
  locationRow: {
    flexDirection: "row",
    gap: 10
  },
  locationLabel: {
    width: 18,
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 22
  },
  locationValue: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600"
  },
  distance: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 22
  },
  routeSummary: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 22
  },
  modeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  poiChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  activeModeCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.primaryLine,
    backgroundColor: "#FFF9F2",
    padding: 14,
    gap: 8
  },
  activeModeTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  activeModeHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  activeModeTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700"
  },
  activeModeEta: {
    color: "#C97618",
    fontSize: 14,
    fontWeight: "700"
  },
  activeModeMeta: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 22
  },
  poiMeta: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "600"
  },
  routeStepList: {
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.primaryLine,
    backgroundColor: "#FFF7EE",
    padding: 14
  },
  routeStepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10
  },
  routeStepIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFE7CC",
    marginTop: 1
  },
  routeStepBody: {
    flex: 1,
    gap: 2
  },
  routeStepTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700"
  },
  routeStepDetail: {
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 20
  },
  hint: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 22
  },
  buttonStack: {
    gap: 10
  }
});

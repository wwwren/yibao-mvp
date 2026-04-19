import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { ActionButton } from "@/components/ActionButton";
import { ScreenShell } from "@/components/ScreenShell";
import { colors } from "@/styles/theme";

export default function NotFoundScreen() {
  return (
    <ScreenShell title="页面不存在" subtitle="这个地址不在 MVP 路由里。">
      <View style={styles.card}>
        <Text style={styles.text}>回到首页继续看最小闭环就可以了。</Text>
        <Link href="/" asChild>
          <ActionButton label="返回首页" onPress={() => {}} />
        </Link>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 24,
    padding: 22,
    gap: 16
  },
  text: {
    color: colors.textSoft,
    fontSize: 16,
    lineHeight: 24
  }
});

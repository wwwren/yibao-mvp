import { PropsWithChildren, ReactNode } from "react";

import { MessageList } from "@/components/MessageList";
import { ScreenShell } from "@/components/ScreenShell";

type ChatScreenProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  footer?: ReactNode;
}>;

export function ChatScreen({
  title,
  subtitle,
  footer,
  children
}: ChatScreenProps) {
  return (
    <ScreenShell title={title} subtitle={subtitle} footer={footer}>
      <MessageList>{children}</MessageList>
    </ScreenShell>
  );
}

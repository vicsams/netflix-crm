import type { InferUITools, UIDataTypes, UIMessage } from "ai";
// Type-only: the tools module queries the database and must stay on the server
import type { AssistantTools } from "@/features/assistant/server/tools";

// A chat message whose tool parts are typed from the assistant's tools, so
// the UI knows each tool's input and output shape
export type AssistantUIMessage = UIMessage<
  never,
  UIDataTypes,
  InferUITools<AssistantTools>
>;

export type AssistantToolName = keyof AssistantTools;

export type AssistantChatSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

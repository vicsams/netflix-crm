import axiosInstance from "@/shared/lib/axiosInstance";
import type {
  AssistantChatSummary,
  AssistantUIMessage,
} from "@/features/assistant/types/assistant";

export async function fetchAssistantChats(): Promise<AssistantChatSummary[]> {
  const response = await axiosInstance.get("/chat");
  return response.data;
}

export async function fetchAssistantChat(
  id: string,
): Promise<{ id: string; title: string; messages: AssistantUIMessage[] }> {
  const response = await axiosInstance.get(`/chat/${id}`);
  return response.data;
}

export async function deleteAssistantChat(id: string) {
  const response = await axiosInstance.delete(`/chat/${id}`);
  return response.data;
}

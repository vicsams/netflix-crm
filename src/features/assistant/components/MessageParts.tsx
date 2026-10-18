"use client";

import { isToolUIPart } from "ai";
import { Spinner } from "@/shared/components/ui/spinner";
import {
  TOOL_LABELS,
  ToolResult,
} from "@/features/assistant/components/ToolResults";
import type {
  AssistantToolName,
  AssistantUIMessage,
} from "@/features/assistant/types/assistant";

export default function MessageParts({
  message,
}: {
  message: AssistantUIMessage;
}) {
  if (message.role === "user") {
    return (
      <div className="bg-muted ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm px-3 py-2 text-sm whitespace-pre-wrap">
        {message.parts.map((part) => (part.type === "text" ? part.text : ""))}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {message.parts.map((part, index) => {
        if (part.type === "text") {
          return (
            <p key={index} className="text-sm whitespace-pre-wrap">
              {part.text}
            </p>
          );
        }

        if (!isToolUIPart(part)) return null;

        const name = part.type.replace(/^tool-/, "") as AssistantToolName;
        switch (part.state) {
          case "output-available":
            return <ToolResult key={index} name={name} output={part.output} />;
          case "output-error":
            return (
              <p key={index} className="text-destructive text-xs">
                No se pudo consultar: {part.errorText}
              </p>
            );
          default:
            return (
              <p
                key={index}
                className="text-muted-foreground flex items-center gap-2 text-xs"
              >
                <Spinner />
                {TOOL_LABELS[name] ?? "Consultando…"}
              </p>
            );
        }
      })}
    </div>
  );
}

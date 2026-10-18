"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Send } from "lucide-react";
import { formatDate } from "@/shared/lib/date";
import { formatWhatsAppNumber, toWhatsAppNumber } from "@/shared/lib/phone";
import { getDerivedStatus } from "@/features/subscriptions/lib/status";
import type {
  ClientStatus,
  ClientStatusMessageDialogProps,
} from "@/features/subscriptions/types/clientStatus";

// A starting message that fits the subscription's state; it stays editable
function getDefaultMessage(clientStatus: ClientStatus) {
  const name = clientStatus.client?.clientName ?? clientStatus.clientName;
  const service = clientStatus.service?.serviceName;
  const subscription = service
    ? `tu suscripción de ${service}`
    : "tu suscripción";
  const date = clientStatus.expirationDate
    ? formatDate(clientStatus.expirationDate)
    : null;

  if (!date) {
    return `Hola ${name}, te escribimos por el estado de ${subscription}.`;
  }

  switch (getDerivedStatus(clientStatus)) {
    case "EXPIRED":
      return `Hola ${name}, ${subscription} venció el ${date}. ¿Deseas renovarla?`;
    case "NEAR_EXPIRATION":
      return `Hola ${name}, ${subscription} vence el ${date}. ¿Deseas renovarla para no perder el acceso?`;
    default:
      return `Hola ${name}, te recordamos que ${subscription} está activa hasta el ${date}.`;
  }
}

export default function ClientStatusMessageDialog({
  open,
  onOpenChange,
  clientStatus,
}: ClientStatusMessageDialogProps) {
  const phoneNumber =
    clientStatus.client?.phoneNumber ?? clientStatus.phoneNumber ?? "";
  const whatsAppNumber = toWhatsAppNumber(phoneNumber);
  const [message, setMessage] = useState("");

  // The parent opens the dialog by setting `open`, which doesn't call
  // onOpenChange, so start a fresh message whenever it opens
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setMessage(getDefaultMessage(clientStatus));
  }

  const handleSendMessage = () => {
    if (!whatsAppNumber) return;

    const chatUrl = `https://wa.me/${whatsAppNumber}?text=${encodeURIComponent(message.trim())}`;
    window.open(chatUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar mensaje</DialogTitle>
          <DialogDescription>
            Revisa el mensaje para abrir el chat del cliente en WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="whatsapp-phone">Número de teléfono</Label>
            <Input id="whatsapp-phone" value={phoneNumber} disabled />
            {whatsAppNumber ? (
              <p className="text-muted-foreground mt-1 text-xs">
                Se abrirá el chat con {formatWhatsAppNumber(whatsAppNumber)}
              </p>
            ) : (
              <p className="text-destructive mt-1 text-sm">
                {phoneNumber.trim()
                  ? "El número no es válido para WhatsApp. Edita el cliente e incluye el código de país (ej: +58 414 1234567)."
                  : "El cliente no tiene número de teléfono registrado."}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="whatsapp-message">Mensaje</Label>
            <Textarea
              id="whatsapp-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe el mensaje a enviar"
              rows={6}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSendMessage}
              disabled={!whatsAppNumber}
              className="bg-green-500 hover:bg-green-500"
            >
              <p>Enviar Mensaje</p>
              <Send size={16} />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

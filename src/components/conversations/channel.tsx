import { Mail, MessageCircle, Phone } from "lucide-react";
import type { Channel } from "@/types";

export const channelLabel: Record<Channel, string> = {
  whatsapp: "WhatsApp",
  llamada: "Llamada",
  email: "Correo",
};

export function ChannelIcon({ channel, className = "size-3.5" }: { channel: Channel; className?: string }) {
  const Icon = channel === "llamada" ? Phone : channel === "email" ? Mail : MessageCircle;
  return <Icon className={className} />;
}

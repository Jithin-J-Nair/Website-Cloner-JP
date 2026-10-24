import type { Metadata } from "next";
import { ContactPageView } from "@/components/pages/ContactPageView";

export const metadata: Metadata = {
  title: "Contact & Project Brief Planner",
  description:
    "Start a conversation with KINETA's producers and creative directors in Osaka, Bristol, and New York.",
};

export default function ContactPage() {
  return <ContactPageView />;
}

import { DropMessageProvider, useDropMessageForm } from "../contexts/dropMessageContext";
import ErrorBanner from "./drop/ErrorBanner";
import FileSection from "./drop/FileSection";
import LocationSection from "./drop/LocationSection";
import SubmitButton from "./drop/SubmitButton";
import SuccessState from "./drop/SuccessState";
import TextSection from "./drop/TextSection";
import TypeTabs from "./drop/TypeTabs";

function DropMessageFormInner() {
  const { state } = useDropMessageForm();

  if (state.submitState === "success") return <SuccessState />;

  return (
    <div className="space-y-7 animate-fade-in">
      <TypeTabs />
      <TextSection />
      <FileSection />
      <LocationSection />
      <ErrorBanner />
      <SubmitButton />
    </div>
  );
}

export default function DropMessageForm() {
  return (
    <DropMessageProvider>
      <DropMessageFormInner />
    </DropMessageProvider>
  );
}

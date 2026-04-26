import { useDropMessageForm } from "../../contexts/dropMessageContext";
import Button from "../ui/Button";

export default function SubmitButton() {
  const { state, actions } = useDropMessageForm();

  return (
    <Button
      variant="primary"
      size="xl"
      onClick={actions.submit}
      disabled={state.submitState === "submitting"}
      className="w-full"
    >
      {state.submitState === "submitting" ? (
        <span className="flex items-center justify-center gap-2">
          <span>Dropping</span>
          <span className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="inline-block w-1 h-1 rounded-full bg-white/60 animate-bounce"
                style={{ animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </span>
        </span>
      ) : (
        "drop it"
      )}
    </Button>
  );
}

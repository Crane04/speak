import Button from "../ui/Button";

export default function ExternalLinkMedia({ url }: { url: string }) {
  return (
    <Button
      variant="link"
      onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
      className="text-sky-400 hover:text-sky-300 text-sm underline underline-offset-2"
    >
      View attached file ↗
    </Button>
  );
}


import DropMessageForm from "../components/DropMessageForm";
import AppShell from "../components/AppShell";

export default function Drop() {
  return (
    <AppShell>
      <div className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-7">
            <div className="font-display text-xl text-slate-200">
              drop a message
            </div>
            <div className="font-display text-slate-500 text-lg mt-1">
              your words, somewhere on earth
            </div>
          </div>

          <div className="glass rounded-2xl p-7">
            <DropMessageForm />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

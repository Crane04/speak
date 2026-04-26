import { useDropMessageForm } from "../../contexts/dropMessageContext";
import NumberField from "./NumberField";
import Button from "../ui/Button";

export default function LocationSection() {
  const { state, actions } = useDropMessageForm();

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="font-display text-slate-300 text-lg">Location</div>
        <div className="flex items-center gap-3">
          <Button
            variant="link"
            onClick={actions.autoFillFromIp}
            disabled={state.ipLocLoading}
            title="Approximate location based on IP"
          >
            {state.ipLocLoading ? "locating…" : "use my location"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <NumberField
            value={state.lat}
            onChange={actions.setLat}
            placeholder="Latitude"
            min={-90}
            max={90}
          />
        </div>
        <div>
          <NumberField
            value={state.lng}
            onChange={actions.setLng}
            placeholder="Longitude"
            min={-180}
            max={180}
          />
        </div>
      </div>

      {state.lat &&
        state.lng &&
        !Number.isNaN(parseFloat(state.lat)) &&
        !Number.isNaN(parseFloat(state.lng)) && (
          <p className="text-[12px] text-slate-500 mt-2 font-display">
            {parseFloat(state.lat).toFixed(4)}, {parseFloat(state.lng).toFixed(4)}
          </p>
        )}
    </div>
  );
}

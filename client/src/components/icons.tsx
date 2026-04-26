import { IconType } from "react-icons";
import {
  LuFileText,
  LuGlobe,
  LuImage,
  LuMapPin,
  LuMessageSquare,
  LuMic,
  LuPlus,
  LuShield,
  LuType,
  LuVideo,
} from "react-icons/lu";

export type IconProps = {
  size?: number;
  className?: string;
  title?: string;
};

function Wrap({
  Icon,
  size = 18,
  className,
  title,
}: IconProps & { Icon: IconType }) {
  return (
    <Icon
      size={size}
      className={className}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    />
  );
}

export function GlobeIcon(props: IconProps) {
  return <Wrap Icon={LuGlobe} {...props} title={props.title ?? "Globe"} />;
}

export function MessageIcon(props: IconProps) {
  return <Wrap Icon={LuMessageSquare} {...props} title={props.title ?? "Message"} />;
}

export function ShieldIcon(props: IconProps) {
  return <Wrap Icon={LuShield} {...props} title={props.title ?? "Admin"} />;
}

export function PlusIcon(props: IconProps) {
  return <Wrap Icon={LuPlus} {...props} title={props.title ?? "Plus"} />;
}

export function TypeIcon(props: IconProps) {
  return <Wrap Icon={LuType} {...props} title={props.title ?? "Text"} />;
}

export function ImageIcon(props: IconProps) {
  return <Wrap Icon={LuImage} {...props} title={props.title ?? "Image"} />;
}

export function MicIcon(props: IconProps) {
  return <Wrap Icon={LuMic} {...props} title={props.title ?? "Audio"} />;
}

export function VideoIcon(props: IconProps) {
  return <Wrap Icon={LuVideo} {...props} title={props.title ?? "Video"} />;
}

export function FileIcon(props: IconProps) {
  return <Wrap Icon={LuFileText} {...props} title={props.title ?? "Document"} />;
}

export function MapPinIcon(props: IconProps) {
  return <Wrap Icon={LuMapPin} {...props} title={props.title ?? "Location"} />;
}

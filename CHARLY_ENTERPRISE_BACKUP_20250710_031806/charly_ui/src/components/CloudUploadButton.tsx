import { Cloud } from "lucide-react";

type Props = {
  provider: "gdrive" | "dropbox" | "icloud";
};

const providerMap = {
  gdrive: { name: "Google Drive", color: "bg-blue-100", label: "Google" },
  dropbox: { name: "Dropbox", color: "bg-blue-50", label: "Dropbox" },
  icloud: { name: "iCloud", color: "bg-gray-100", label: "iCloud" },
};

export function CloudUploadButton({ provider }: Props) {
  const { color, label } = providerMap[provider];

  const handleClick = () => {
    switch (provider) {
      case "gdrive":
        alert("🚧 Google Drive Picker integration coming soon.");
        break;
      case "dropbox":
        alert("🚧 Dropbox Chooser integration coming soon.");
        break;
      case "icloud":
        alert("Use manual file upload to access iCloud Drive on MacOS/iOS.");
        break;
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-300 text-sm font-medium text-zinc-700 ${color} hover:bg-zinc-200`}
    >
      <Cloud className="w-4 h-4" />
      {label}
    </button>
  );
}
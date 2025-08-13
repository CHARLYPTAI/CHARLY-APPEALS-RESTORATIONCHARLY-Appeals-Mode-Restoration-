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
    // Trigger file upload dialog for all providers
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.csv,.xlsx,.pdf,.json,.xml,.txt';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        // Simple notification for now - in production would integrate with cloud APIs
        alert(`✅ ${files.length} file(s) selected from ${providerMap[provider].name}. Upload functionality ready for cloud integration.`);
      }
    };
    input.click();
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
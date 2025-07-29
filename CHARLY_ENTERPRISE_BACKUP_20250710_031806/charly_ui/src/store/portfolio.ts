import { create } from "zustand";
import { uploadFiles } from "@/lib/api";
import { validateFile } from "@/lib/fileValidation";
import { toast } from "@/components/ui/use-toast";

type Property = {
  id: string;
  address: string;
  market_value: number;
  assessed_value: number;
  flags?: string[];
};

type State = {
  properties: Property[];
  loading: boolean;
  error: string | null;
  ingestFiles: (files: FileList) => Promise<void>;
};

export const usePortfolioStore = create<State>((set) => ({
  properties: [],
  loading: false,
  error: null,

  ingestFiles: async (files: FileList) => {
    // Validate all files before processing
    const validFiles: File[] = [];
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        toast({
          title: "File validation failed",
          description: validationError,
          variant: "destructive",
        });
        return; // Stop processing if any file is invalid
      }
      validFiles.push(file);
    }

    set({ loading: true, error: null });

    try {
      const validFileList = validFiles as unknown as FileList;
      const result = await uploadFiles(validFileList);
      if (!Array.isArray(result)) throw new Error("Invalid response format");
      set({ properties: result, loading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Ingestion failed";
      set({ error: message, loading: false });
    }
  },
}));
import { create } from "zustand";

type Packet = {
  id: string;
  property_address: string;
  county: string;
  status: "Awaiting Signature" | "Filed" | "Rejected";
  download_url: string;
};

type FilingState = {
  packets: Packet[];
  fetchPackets: () => void;
  uploadSignedDoc: (packetId: string, file: File) => void;
};

export const useFilingStore = create<FilingState>((set) => ({
  packets: [],

  fetchPackets: () => {
    // Simulated response – replace with actual API call later
    set({
      packets: [
        {
          id: "PKT-2025-001",
          property_address: "123 Market St",
          county: "Jackson County, MO",
          status: "Awaiting Signature",
          download_url: "/packets/PKT-2025-001.pdf",
        },
        {
          id: "PKT-2025-002",
          property_address: "456 Main Ave",
          county: "Dallas County, TX",
          status: "Filed",
          download_url: "/packets/PKT-2025-002.pdf",
        },
      ],
    });
  },

  uploadSignedDoc: (packetId, file) => {
    console.log(`Uploading signed doc for ${packetId}`, file);
    // 🚧 TODO: POST to /api/filing/upload-signed-doc
  },
}));
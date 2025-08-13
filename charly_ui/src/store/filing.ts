import { create } from "zustand";
import { apiClient, FilingPacket, handleApiError, isApiError } from "@/lib/api-client";
import { toast } from "@/components/ui/use-toast";

// Use the standardized FilingPacket type from API client
type Packet = FilingPacket;


type FilingState = {
  packets: Packet[];
  loading: boolean;
  error: string | null;
  fetchPackets: () => void;
  uploadSignedDoc: (packetId: string, file: File) => Promise<void>;
  fileAppeal: (appealData: Record<string, unknown>) => Promise<void>;
  bulkFileAppeals: (appeals: Record<string, unknown>[]) => Promise<void>;
};

export const useFilingStore = create<FilingState>((set, get) => ({
  packets: [],
  loading: false,
  error: null,

  fetchPackets: async () => {
    set({ loading: true, error: null });
    try {
      // Fetch packets generated from Appeals page
      const response = await authenticatedRequest('/api/filing/packets', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch packets from Appeals');
      }

      const result = await response.json();
      
      // Fallback to mock data if no Appeals packets found
      const packets = result.packets?.length > 0 ? result.packets : [
        {
          id: "DEMO-001",
          property_address: "123 Market St (Demo)",
          county: "Jackson County, MO",
          status: "Ready to File",
          download_url: "/packets/DEMO-001.pdf",
          current_assessment: 450000,
          proposed_value: 380000,
          potential_savings: 14000,
          deadline: "2024-03-31",
          created_date: "2024-02-15",
          packet_type: "Demo Appeal",
          square_footage: 2500,
          year_built: 2000
        }
      ];
      
      set({ packets, loading: false });
    } catch (error) {
      console.error('Failed to fetch packets:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch packets',
        loading: false 
      });
    }
  },

  uploadSignedDoc: async (packetId: string, file: File) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('packet_id', packetId);

      const response = await authenticatedRequest('/api/filing/upload-signed-doc', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload signed document');
      }

      await response.json();
      
      // Update packet status
      const packets = get().packets.map(packet => 
        packet.id === packetId 
          ? { ...packet, status: "Filed" as const }
          : packet
      );
      
      set({ packets, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Upload failed',
        loading: false 
      });
    }
  },

  // REMOVED: Packet generation moved to Appeals page only

  fileAppeal: async (appealData: Record<string, unknown>): Promise<void> => {
    set({ loading: true, error: null });
    try {
      const response = await authenticatedRequest('/api/filing/file-appeal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appealData),
      });

      if (!response.ok) {
        throw new Error('Failed to file appeal');
      }

      const result = await response.json();
      set({ loading: false });
      
      // Show success notification
      console.log('Appeal filed successfully:', result.confirmation_number);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Filing failed',
        loading: false 
      });
      throw error;
    }
  },

  bulkFileAppeals: async (appeals: Record<string, unknown>[]): Promise<void> => {
    set({ loading: true, error: null });
    try {
      const response = await authenticatedRequest('/api/filing/bulk-file-appeals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appeals }),
      });

      if (!response.ok) {
        throw new Error('Failed to file bulk appeals');
      }

      const result = await response.json();
      set({ loading: false });
      
      // Show success notification
      console.log('Bulk appeals filed successfully:', result.batch_id);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Bulk filing failed',
        loading: false 
      });
      throw error;
    }
  },
}));
import { create } from "zustand";
import { uploadFiles } from "@/lib/api";
import { validateFile } from "@/lib/fileValidation";
import { toast } from "@/components/ui/use-toast";
import { apiClient, Property, PropertyCreate, handleApiError, isApiError } from "@/lib/api-client";

type PortfolioState = {
  properties: Property[];
  loading: boolean;
  error: string | null;
  selectedProperty: Property | null;
  // Actions
  loadPortfolio: () => Promise<void>;
  addProperty: (propertyData: PropertyCreate) => Promise<Property | null>;
  updateProperty: (propertyId: string, updates: Partial<Property>) => Promise<Property | null>;
  deleteProperty: (propertyId: string) => Promise<boolean>;
  setSelectedProperty: (property: Property | null) => void;
  clearError: () => void;
  ingestFiles: (files: FileList) => Promise<void>;
};

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  properties: [],
  loading: false,
  error: null,
  selectedProperty: null,

  // Load portfolio from API
  loadPortfolio: async () => {
    set({ loading: true, error: null });
    
    try {
      const response = await apiClient.getProperties();
      
      if (isApiError(response)) {
        const errorMessage = handleApiError(response);
        set({ loading: false, error: errorMessage });
        toast({
          title: "Failed to load portfolio",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      set({ 
        properties: response.data || [],
        loading: false 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load portfolio';
      set({ loading: false, error: errorMessage });
      toast({
        title: "Portfolio loading failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  },

  // Add new property
  addProperty: async (propertyData: PropertyCreate) => {
    set({ loading: true, error: null });

    try {
      const response = await apiClient.createProperty(propertyData);
      
      if (isApiError(response)) {
        const errorMessage = handleApiError(response);
        set({ loading: false, error: errorMessage });
        toast({
          title: "Failed to create property",
          description: errorMessage,
          variant: "destructive",
        });
        return null;
      }

      const newProperty = response.data!;
      set((state) => ({
        properties: [...state.properties, newProperty],
        loading: false
      }));

      toast({
        title: "Property created",
        description: `Added ${newProperty.address}`,
      });

      return newProperty;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create property';
      set({ loading: false, error: errorMessage });
      toast({
        title: "Property creation failed",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  },

  // Update existing property
  updateProperty: async (propertyId: string, updates: Partial<Property>) => {
    set({ loading: true, error: null });

    try {
      const response = await apiClient.updateProperty(propertyId, updates);
      
      if (isApiError(response)) {
        const errorMessage = handleApiError(response);
        set({ loading: false, error: errorMessage });
        toast({
          title: "Failed to update property",
          description: errorMessage,
          variant: "destructive",
        });
        return null;
      }

      const updatedProperty = response.data!;
      set((state) => ({
        properties: state.properties.map(p => 
          p.id === propertyId ? updatedProperty : p
        ),
        selectedProperty: state.selectedProperty?.id === propertyId 
          ? updatedProperty 
          : state.selectedProperty,
        loading: false
      }));

      toast({
        title: "Property updated",
        description: `Updated ${updatedProperty.address}`,
      });

      return updatedProperty;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update property';
      set({ loading: false, error: errorMessage });
      toast({
        title: "Property update failed",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  },

  // Delete property
  deleteProperty: async (propertyId: string) => {
    set({ loading: true, error: null });

    try {
      const response = await apiClient.deleteProperty(propertyId);
      
      if (isApiError(response)) {
        const errorMessage = handleApiError(response);
        set({ loading: false, error: errorMessage });
        toast({
          title: "Failed to delete property",
          description: errorMessage,
          variant: "destructive",
        });
        return false;
      }

      set((state) => ({
        properties: state.properties.filter(p => p.id !== propertyId),
        selectedProperty: state.selectedProperty?.id === propertyId 
          ? null 
          : state.selectedProperty,
        loading: false
      }));

      toast({
        title: "Property deleted",
        description: "Property successfully removed",
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete property';
      set({ loading: false, error: errorMessage });
      toast({
        title: "Property deletion failed",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  },

  // Set selected property
  setSelectedProperty: (property: Property | null) => {
    set({ selectedProperty: property });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // File ingestion (legacy support)
  ingestFiles: async (files: FileList) => {
    // Validate all files before processing
    const validFiles: File[] = [];
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      const validationResult = validateFile(file);
      if (!validationResult.valid) {
        toast({
          title: "File validation failed",
          description: validationResult.error || "Unknown validation error",
          variant: "destructive",
        });
        return; // Stop processing if any file is invalid
      }
      validFiles.push(file);
    }

    set({ loading: true, error: null });

    try {
      const validFileList = validFiles as unknown as FileList;
      const results = await uploadFiles(validFileList);
      
      // Add processed properties to the store
      set((state) => ({
        loading: false,
        properties: [...state.properties, ...results.properties],
      }));

      toast({
        title: "Files processed successfully",
        description: `Added ${results.properties.length} properties`,
      });
    } catch (error) {
      console.error("File processing error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to process files";
      set({ loading: false, error: errorMessage });
      
      toast({
        title: "Processing failed",
        description: "Failed to process uploaded files",
        variant: "destructive",
      });
    }
  },
}));
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Package, CheckSquare, AlertCircle, Calculator, Download } from "lucide-react";

interface BulkActionsModalProps {
  showBulkActionsModal: boolean;
  onClose: () => void;
  selectedCount: number;
  onBulkAction: (action: string) => void;
  isBulkProcessing: boolean;
}

export function BulkActionsModal({
  showBulkActionsModal,
  onClose,
  selectedCount,
  onBulkAction,
  isBulkProcessing
}: BulkActionsModalProps) {
  return (
    <Dialog open={showBulkActionsModal} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span>Bulk Actions</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Perform actions on {selectedCount} selected properties:
          </p>
          
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onBulkAction('update_status')}
              disabled={isBulkProcessing}
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              Update Status
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onBulkAction('flag_properties')}
              disabled={isBulkProcessing}
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Flag Properties
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onBulkAction('bulk_analysis')}
              disabled={isBulkProcessing}
            >
              <Calculator className="w-4 h-4 mr-2" />
              Run Analysis
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onBulkAction('export_selected')}
              disabled={isBulkProcessing}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Selected
            </Button>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isBulkProcessing}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
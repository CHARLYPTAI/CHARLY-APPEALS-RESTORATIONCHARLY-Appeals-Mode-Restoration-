import React from "react"
import { PortfolioSummary } from "@/components/portfolio/PortfolioSummary"
import { AddPropertyModal } from "@/components/portfolio/AddPropertyModal"
import { BulkActionsModal } from "@/components/portfolio/BulkActionsModal"
import { PropertyList } from "@/components/portfolio/PropertyList"
import { Separator } from "@/components/ui/separator"
import { usePortfolioContext } from "@/components/v2/contexts/PortfolioContext"

const PortfolioMode: React.FC = () => {
  const {
    sortedAndFilteredProperties,
    selectedProperties,
    setSelectedProperties,
    compareProperties,
    isAnalyzing,
    onAnalyzeProperties,
    onFlagProperty,
    analysisResults,
    filterStatus,
    showAddPropertyModal,
    setShowAddPropertyModal,
    showBulkActionsModal,
    setShowBulkActionsModal,
    newPropertyData,
    setNewPropertyData,
    isBulkProcessing,
  } = usePortfolioContext()

  // Map properties to match expected format
  const mappedProperties = sortedAndFilteredProperties.map(p => ({
    ...p,
    parcelId: p.parcelNumber, // Map parcelNumber to parcelId for PropertyList
  }))

  const handleAddProperty = () => {
    // Implementation for adding property
    console.log('Adding property:', newPropertyData)
    setShowAddPropertyModal(false)
  }

  const handleBulkAction = (action: string) => {
    // Implementation for bulk actions
    console.log('Bulk action:', action)
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">📁 Portfolio</h1>
      <PortfolioSummary 
        sortedAndFilteredProperties={sortedAndFilteredProperties as any}
        displayProperties={sortedAndFilteredProperties as any}
        filterStatus={filterStatus}
      />
      <Separator />
      <div className="flex justify-between items-center">
        <AddPropertyModal 
          showAddPropertyModal={showAddPropertyModal}
          onClose={() => setShowAddPropertyModal(false)}
          newPropertyData={newPropertyData as any}
          setNewPropertyData={setNewPropertyData as any}
          onAddProperty={handleAddProperty}
          isAddingProperty={false}
          onResetForm={() => setNewPropertyData({})}
        />
        <BulkActionsModal 
          showBulkActionsModal={showBulkActionsModal}
          onClose={() => setShowBulkActionsModal(false)}
          selectedCount={selectedProperties.length}
          onBulkAction={handleBulkAction}
          isBulkProcessing={isBulkProcessing}
        />
      </div>
      <PropertyList 
        properties={mappedProperties}
        compareProperties={compareProperties}
        analysisResults={analysisResults}
        isAnalyzing={isAnalyzing}
        onFlagProperty={onFlagProperty}
        onAnalyzeProperties={onAnalyzeProperties}
        selectedPropertyIds={selectedProperties}
        setSelectedPropertyIds={setSelectedProperties}
      />
    </div>
  )
}

export default PortfolioMode

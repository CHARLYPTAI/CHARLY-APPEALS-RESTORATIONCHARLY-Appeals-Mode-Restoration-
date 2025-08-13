import { useState } from 'react';

export function useCreditPurchase() {
  const [isOpen, setIsOpen] = useState(false);
  const [minCredits, setMinCredits] = useState(0);

  const openPurchase = (requiredCredits: number = 0) => {
    setMinCredits(requiredCredits);
    setIsOpen(true);
  };

  const closePurchase = () => {
    setIsOpen(false);
    setMinCredits(0);
  };

  return {
    isOpen,
    minCredits,
    openPurchase,
    closePurchase,
  };
}
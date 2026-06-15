import { useState, useEffect } from 'react';
import type { Unidade } from '../types';

export function getUnitDisplayName(unit: Unidade | null): string {
  return unit?.name || 'Selecione uma unidade';
}

export function getUnitAddress(unit: Unidade | null): string {
  if (!unit) return '';
  const parts = [unit.address, unit.city, unit.state].filter(Boolean);
  return parts.join(', ');
}

export function isUnitPublished(unit: Unidade | null): boolean {
  return unit?.published === true;
}

export function getUnitSubscriptionStatus(unit: Unidade | null): string {
  // This would ideally come from the unit's subscription data
  return unit?.active ? 'Ativo' : 'Inativo';
}

export function useAdminSalonSelection(
  salons: Unidade[] | undefined,
  userId: number | undefined
) {
  const [salonId, setSalonId] = useState<number | null>(null);
  
  useEffect(() => {
    if (salons && salons.length > 0 && !salonId) {
      setSalonId(salons[0].id);
    }
  }, [salons, salonId]);

  const activeSalonId = salonId;
  const hasUnits = (salons?.length ?? 0) > 0;
  
  const handleSalonChange = (newSalonId: number) => {
    setSalonId(newSalonId);
  };

  return {
    salonId,
    setSalonId,
    activeSalonId,
    hasUnits,
    handleSalonChange,
  };
}

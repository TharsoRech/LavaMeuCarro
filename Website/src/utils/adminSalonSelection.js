import { useState, useEffect } from 'react';
export function getUnitDisplayName(unit) {
    return unit?.name || 'Selecione uma unidade';
}
export function getUnitAddress(unit) {
    if (!unit)
        return '';
    const parts = [unit.address, unit.city, unit.state].filter(Boolean);
    return parts.join(', ');
}
export function isUnitPublished(unit) {
    return unit?.published === true;
}
export function getUnitSubscriptionStatus(unit) {
    // This would ideally come from the unit's subscription data
    return unit?.active ? 'Ativo' : 'Inativo';
}
export function useAdminSalonSelection(salons, userId) {
    const [salonId, setSalonId] = useState(null);
    useEffect(() => {
        if (salons && salons.length > 0 && !salonId) {
            setSalonId(salons[0].id);
        }
    }, [salons, salonId]);
    const activeSalonId = salonId;
    const hasUnits = (salons?.length ?? 0) > 1;
    const handleSalonChange = (newSalonId) => {
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

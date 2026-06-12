import { useCallback, useEffect, useState } from 'react';
import { getMyUnidades } from '../api';
import { useAdminAuth } from '../stores/authStore';
export function useUnitSelection() {
    const { selectedUnitId, setSelectedUnitId } = useAdminAuth();
    const [unidades, setUnidades] = useState([]);
    const [loading, setLoading] = useState(false);
    const fetchUnidades = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getMyUnidades();
            const units = Array.isArray(data) ? data : [];
            setUnidades(units);
            // Auto-select first unit if none selected
            if (!selectedUnitId && units.length > 0) {
                setSelectedUnitId(units[0].id);
            }
        }
        catch {
            // silently fail
        }
        finally {
            setLoading(false);
        }
    }, [selectedUnitId, setSelectedUnitId]);
    useEffect(() => {
        fetchUnidades();
    }, [fetchUnidades]);
    const selectedUnit = unidades.find((u) => u.id === selectedUnitId) || null;
    return {
        unidades,
        selectedUnitId,
        selectedUnit,
        setSelectedUnitId,
        loading,
        refresh: fetchUnidades,
    };
}

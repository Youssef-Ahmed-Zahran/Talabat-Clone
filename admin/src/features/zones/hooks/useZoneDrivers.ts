import { useState, useEffect } from "react";
import {
  useAssignDriversToZone,
  useRemoveDriverFromZone,
  fetchDrivers,
  type Zone,
  type ZoneDriver,
} from "../api/zones.api";
import toast from "react-hot-toast";

export function useZoneDrivers(id: string | undefined) {
  const assignDriversMutation = useAssignDriversToZone();
  const removeDriverMutation = useRemoveDriverFromZone();

  const [assignedDrivers, setAssignedDrivers] = useState<Zone["driverZones"]>([]);
  const [driverSearch, setDriverSearch] = useState("");
  const [driverResults, setDriverResults] = useState<ZoneDriver[]>([]);
  const [searchingDrivers, setSearchingDrivers] = useState(false);

  useEffect(() => {
    if (!driverSearch.trim()) {
      const t = setTimeout(() => setDriverResults([]), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(async () => {
      setSearchingDrivers(true);
      try {
        setDriverResults(await fetchDrivers(driverSearch));
      } catch {
        setDriverResults([]);
      } finally {
        setSearchingDrivers(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [driverSearch]);

  const handleAddDriver = async (driver: ZoneDriver) => {
    if (!id) return;
    try {
      await assignDriversMutation.mutateAsync({ zoneId: id, driverIds: [driver.id] });
      setAssignedDrivers((prev) => [
        ...(prev || []),
        { id: Math.random().toString(), driverId: driver.id, driver } as NonNullable<Zone["driverZones"]>[0],
      ]);
      setDriverSearch("");
      setDriverResults([]);
      const driverName = driver.application
        ? `${driver.application.firstName} ${driver.application.familyName}`
        : driver.phone;
      toast.success(`Driver "${driverName}" assigned successfully.`);
    } catch {
      toast.error("Failed to assign driver.");
    }
  };

  const handleRemoveDriver = async (driverId: string) => {
    if (!id) return;
    try {
      await removeDriverMutation.mutateAsync({ zoneId: id, driverId });
      setAssignedDrivers((prev) =>
        (prev || []).filter((d) => d.driverId !== driverId && d.driver?.id !== driverId),
      );
      toast.success("Driver removed successfully.");
    } catch {
      toast.error("Failed to remove driver.");
    }
  };

  return {
    assignedDrivers,
    setAssignedDrivers,
    driverSearch,
    setDriverSearch,
    driverResults,
    searchingDrivers,
    handleAddDriver,
    handleRemoveDriver,
  };
}

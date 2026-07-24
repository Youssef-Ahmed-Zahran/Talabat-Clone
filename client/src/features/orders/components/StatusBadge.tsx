import React from "react";
import type { OrderStatus } from "../../../types";

import { STATUS_CONFIG } from "./constants";

export const StatusBadge = React.memo(function StatusBadge({
  status,
}: {
  status: OrderStatus;
}) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${c.bg} ${c.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} animate-pulse`} />
      {c.label}
    </span>
  );
});

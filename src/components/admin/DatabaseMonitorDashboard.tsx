import React from 'react';
import { IS_PROD } from '../../lib/env';
import { ProdDatabaseMonitor } from './ProdDatabaseMonitor';
import { DevDatabaseMonitor } from './DevDatabaseMonitor';

interface DatabaseMonitorDashboardProps {
  currentRole: string;
  currentUserEmail?: string;
  tableDataMap: Record<string, any[]>;
  onNavigateTab?: (tab: any) => void;
  onSeparateAndRebootProduction?: () => Promise<void>;
}

export const DatabaseMonitorDashboard: React.FC<DatabaseMonitorDashboardProps> = ({
  currentRole,
  currentUserEmail,
  tableDataMap,
  onNavigateTab,
  onSeparateAndRebootProduction,
}) => {
  if (IS_PROD) {
    return (
      <ProdDatabaseMonitor
        currentRole={currentRole}
        currentUserEmail={currentUserEmail}
        tableDataMap={tableDataMap}
        onNavigateTab={onNavigateTab}
        onResetProduction={onSeparateAndRebootProduction}
      />
    );
  }

  return (
    <DevDatabaseMonitor
      currentRole={currentRole}
      currentUserEmail={currentUserEmail}
      tableDataMap={tableDataMap}
      onNavigateTab={onNavigateTab}
    />
  );
};

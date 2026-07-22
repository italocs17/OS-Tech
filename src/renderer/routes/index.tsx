import { Route, Routes } from 'react-router-dom';
import { DashboardPage } from '../pages/Dashboard';
import { ClientsPage } from '../pages/Clients';
import { EquipmentPage } from '../pages/Equipment';
import { OSPage } from '../pages/OS';
import { OSDetailPage } from '../pages/OS/Detail';
import { CatalogPage } from '../pages/Catalog';
import { UsersPage } from '../pages/Users';
import { TeamsPage } from '../pages/Teams';
import { ReportsPage } from '../pages/Reports';
import { BackupPage } from '../pages/Backup';
import { LogsPage } from '../pages/Logs';
import { EmailInboxPage } from '../pages/EmailInbox';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/clients" element={<ClientsPage />} />
      <Route path="/equipment" element={<EquipmentPage />} />
      <Route path="/os" element={<OSPage />} />
      <Route path="/os/:id" element={<OSDetailPage />} />
      <Route path="/catalog" element={<CatalogPage />} />
      <Route path="/users" element={<UsersPage />} />
      <Route path="/equipes" element={<TeamsPage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/backup" element={<BackupPage />} />
      <Route path="/email-inbox" element={<EmailInboxPage />} />
      <Route path="/logs" element={<LogsPage />} />
    </Routes>
  );
}

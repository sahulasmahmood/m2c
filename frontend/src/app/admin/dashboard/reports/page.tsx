import { Breadcrumb } from '@/components/AdminDashboard/Breadcrumb/Breadcrumb'
import Report from '@/components/AdminDashboard/Reports/AdminReports'

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb />
      <Report />
    </div>
  )
}
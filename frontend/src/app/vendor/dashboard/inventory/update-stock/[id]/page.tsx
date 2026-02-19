'use client'

import { useParams } from 'next/navigation'
import UpdateStockPage from '@/components/VendorDashboard/Inventory/UpdateStockPage'

export default function UpdateStock() {
  const params = useParams()
  const inventoryId = params.id as string

  return <UpdateStockPage inventoryId={inventoryId} />
}

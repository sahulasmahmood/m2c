'use client'

import { useParams, useRouter } from 'next/navigation'
import UpdateStockPage from '@/components/AdminDashboard/Inventory/UpdateStockPage'

export default function UpdateStock() {
  const params = useParams()
  const router = useRouter()
  const inventoryId = params.id as string

  return <UpdateStockPage inventoryId={inventoryId} />
}

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/UI/Card'
import { Button } from '@/components/UI/Button'
import { Badge } from '@/components/UI/Badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/UI/Table'
import { Package, AlertTriangle, TrendingDown, TrendingUp, Plus, Search, Edit, Trash2, History, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import Dropdown from '@/components/UI/Dropdown'
import inventoryService, { InventoryItem as APIInventoryItem, InventoryStats } from '@/services/inventoryService'
import StockHistoryModal from '@/components/Shared/StockHistoryModal'
import { showWarningToast, showSuccessToast, showErrorToast } from '@/lib/toast-utils'
import DeleteConfirmModal from '@/components/UI/DeleteConfirmModal'

function getPageRange(current: number, total: number): Array<number | '…'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: Array<number | '…'> = [1];
  if (current > 4) pages.push('…');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let p = start; p <= end; p++) pages.push(p);
  if (current < total - 3) pages.push('…');
  pages.push(total);
  return pages;
}

const getStatusBadge = (status: string, currentStock: number, lowStockAlert: number) => {
  if (currentStock === 0) {
    return <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>
  }
  if (currentStock <= lowStockAlert) {
    return <Badge className="bg-yellow-100 text-yellow-800">Low Stock</Badge>
  }
  return <Badge className="bg-green-100 text-green-800">In Stock</Badge>
}

const getApprovalBadge = (item: APIInventoryItem) => {
  if (!item.hasProductCreated) return <Badge className="bg-gray-100 text-gray-600">No Product</Badge>
  switch (item.productApprovalStatus) {
    case 'APPROVED': return <Badge className="bg-green-100 text-green-800">Approved</Badge>
    case 'PENDING': return <Badge className="bg-yellow-100 text-yellow-800">Pending Approval</Badge>
    case 'QC_APPROVED': return <Badge className="bg-blue-100 text-blue-800">QC Approved</Badge>
    case 'REJECTED': return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
    case 'REINSPECTION': return <Badge className="bg-orange-100 text-orange-800">Reinspection</Badge>
    default: return <Badge className="bg-gray-100 text-gray-600">Unknown</Badge>
  }
}

export default function Inventory() {
  const [inventoryItems, setInventoryItems] = useState<APIInventoryItem[]>([])
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(null)
  const [vendorCategories, setVendorCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'INACTIVE'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean
    item: APIInventoryItem | null
    loading: boolean
  }>({ show: false, item: null, loading: false })

  // Stock history modal state
  const [stockHistoryModal, setStockHistoryModal] = useState<{
    isOpen: boolean
    item: APIInventoryItem | null
  }>({ isOpen: false, item: null })

  // Calculate stats
  const totalItems = inventoryStats?.totalItems || 0
  const lowStockItems = inventoryStats?.lowStockItems || 0
  const outOfStockItems = inventoryStats?.outOfStockItems || 0
  const totalValue = inventoryStats?.totalStockUnits || 0

  // Get categories for filter (vendor categories + 'all')
  const categories = ['all', ...vendorCategories]

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)

        // Check if vendor is logged in
        if (typeof window === 'undefined') return;

        const vendorToken = localStorage.getItem('vendorToken')
        if (!vendorToken) {
          console.log('No vendor token found, redirecting to login')
          window.location.href = '/vendor'
          return
        }

        // Load vendor categories and stats in parallel
        const [categoriesData, statsData] = await Promise.all([
          inventoryService.getVendorCategories(),
          inventoryService.getStats()
        ])

        setVendorCategories(categoriesData.categories.map(cat => cat.name))
        setInventoryStats(statsData)

        // Load inventory items
        await loadInventoryItems()

      } catch (error: any) {
        console.error('Error loading data:', error)
        if (error.response?.status === 401) {
          showErrorToast('Authentication Required', 'Please login again.')
          window.location.href = '/vendor'
        } else {
          showErrorToast('Load Failed', 'Failed to load inventory data')
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Load inventory items with current filters
  const loadInventoryItems = async () => {
    try {
      const filters = {
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(categoryFilter !== 'all' && { category: categoryFilter })
      }

      const data = await inventoryService.getItems(filters)
      setInventoryItems(data.items)
      setTotalPages(data.pagination.totalPages)
    } catch (error) {
      console.error('Error loading inventory items:', error)
    }
  }

  // Reload items when filters change
  useEffect(() => {
    if (!isLoading) {
      loadInventoryItems()
    }
  }, [searchTerm, statusFilter, categoryFilter, currentPage])

  const handleRestock = (item: APIInventoryItem) => {
    // Navigate to separate stock update page
    window.location.href = `/vendor/dashboard/inventory/update-stock/${item.id}`
  }

  const handleViewHistory = (item: APIInventoryItem) => {
    setStockHistoryModal({ isOpen: true, item })
  }

  const handleEdit = (itemId: string) => {
    console.log('Editing item:', itemId)
    // Navigation is handled by the Link component
  }

  const handleDelete = (item: APIInventoryItem) => {
    setDeleteModal({ show: true, item, loading: false })
  }

  const confirmDelete = async () => {
    if (!deleteModal.item) return
    setDeleteModal(prev => ({ ...prev, loading: true }))
    try {
      await inventoryService.deleteItem(deleteModal.item.id)
      showSuccessToast('Item Deleted', 'Inventory item deleted successfully')
      loadInventoryItems()
    } catch (error: any) {
      console.error('Error deleting item:', error)
      if (error.response?.status === 400) {
        showErrorToast('Delete Failed', error.response.data.message || 'Cannot delete this item')
      } else {
        showErrorToast('Delete Failed', 'Failed to delete item')
      }
    } finally {
      setDeleteModal({ show: false, item: null, loading: false })
    }
  }

  const handleCreateProduct = (item: APIInventoryItem) => {
    // Navigate to product creation with inventory pre-selected
    window.location.href = `/vendor/dashboard/products/add?inventoryId=${item.id}`
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#222222]">Inventory Management</h1>
            <p className="text-slate-600">Loading your inventory...</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center jusbnmtify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#222222]"></div>
              <span className="ml-3 text-slate-600">Loading inventory data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your product inventory and stock levels</p>
          </div>
          <Link href="/vendor/dashboard/inventory/add">
            <Button className="bg-gray-900 text-white hover:bg-black">
              <Plus className="h-4 w-4 mr-2" />
              Add Inventory Item
            </Button>
          </Link>
        </div>
      </div>

      {/* Inventory Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Items</span>
            <div className="p-1.5 bg-blue-50 rounded-lg"><Package className="h-4 w-4 text-blue-600" /></div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
          <p className="text-xs text-gray-500 mt-0.5">Unique products</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Low Stock</span>
            <div className="p-1.5 bg-yellow-50 rounded-lg"><AlertTriangle className="h-4 w-4 text-yellow-600" /></div>
          </div>
          <p className={`text-2xl font-bold ${lowStockItems > 0 ? 'text-yellow-600' : 'text-gray-900'}`}>{lowStockItems}</p>
          <p className="text-xs text-gray-500 mt-0.5">Need restocking</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Out of Stock</span>
            <div className="p-1.5 bg-red-50 rounded-lg"><TrendingDown className="h-4 w-4 text-red-600" /></div>
          </div>
          <p className={`text-2xl font-bold ${outOfStockItems > 0 ? 'text-red-600' : 'text-gray-900'}`}>{outOfStockItems}</p>
          <p className="text-xs text-gray-500 mt-0.5">Urgent attention</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Stock</span>
            <div className="p-1.5 bg-green-50 rounded-lg"><TrendingUp className="h-4 w-4 text-green-600" /></div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalValue.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total units</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-3">
            <Dropdown
              id="statusFilter"
              value={statusFilter}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' }
              ]}
              onChange={(value) => setStatusFilter(value as 'all' | 'ACTIVE' | 'INACTIVE')}
            />
            <Dropdown
              id="categoryFilter"
              value={categoryFilter}
              options={categories.map(cat => ({
                value: cat,
                label: cat === 'all' ? 'All Categories' : cat
              }))}
              onChange={(value) => setCategoryFilter(value as string)}
            />
          </div>
        </div>
      </div>

      {/* Results summary */}
      {inventoryItems.length > 0 && (
        <p className="text-sm text-gray-500">
          Showing {inventoryItems.length} item{inventoryItems.length === 1 ? '' : 's'}
        </p>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Inventory Items</h2>
        </div>
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Product Status</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Base Stock</TableHead>
                <TableHead>Min Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Restocked</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="text-slate-500">
                      <p className="text-lg font-medium">No inventory items found</p>
                      <p className="text-sm">Try adjusting your search or filter criteria</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                inventoryItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <div className="font-medium text-[#222222]">{item.name}</div>
                        <div className="text-sm text-slate-500">
                          {item.category}{item.subcategory ? ` > ${item.subcategory}` : ''}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-slate-600">{item.sku}</TableCell>
                    <TableCell>
                      {getApprovalBadge(item)}
                    </TableCell>
                    <TableCell>
                      <span className={item.currentStock <= item.lowStockAlert ? 'text-red-600 font-bold' : 'text-[#222222] font-semibold'}>
                        {item.currentStock}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[#222222] font-medium">
                        {item.baseStock || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {item.lowStockAlert}
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status, item.currentStock, item.lowStockAlert)}</TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {item.lastRestocked ? new Date(item.lastRestocked).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (item.hasProductCreated && item.productApprovalStatus === 'APPROVED') {
                              handleRestock(item)
                            } else if (!item.hasProductCreated) {
                              showWarningToast('Stock Update Not Available', 'Create a product first before updating stock.')
                            } else {
                              showWarningToast('Stock Update Not Available', `Product approval status: ${item.productApprovalStatus}. Stock can only be updated after admin approval.`)
                            }
                          }}
                          className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
                            item.hasProductCreated && item.productApprovalStatus === 'APPROVED'
                              ? 'border-gray-200 text-gray-700 hover:bg-gray-50'
                              : 'border-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          Update Stock
                        </button>
                        <button
                          onClick={() => handleViewHistory(item)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                          title="Stock History"
                        >
                          <History className="h-4 w-4" />
                        </button>
                        {item.hasProductCreated && item.productApprovalStatus === 'APPROVED' ? (
                          <button
                            onClick={() => showWarningToast('Edit Restricted', 'This product has been approved. Only admin can edit the inventory.')}
                            className="p-1.5 rounded-lg text-gray-300 cursor-not-allowed"
                            title="Approved — admin only"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        ) : (
                          <Link href={`/vendor/dashboard/inventory/edit/${item.id}`}>
                            <span className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors inline-flex" title="Edit">
                              <Edit className="h-4 w-4" />
                            </span>
                          </Link>
                        )}
                        <button
                          onClick={() => handleDelete(item)}
                          disabled={item.hasProductCreated}
                          className={`p-1.5 rounded-lg transition-colors ${
                            item.hasProductCreated
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                          }`}
                          title={item.hasProductCreated ? 'Has linked product' : 'Delete'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-3 text-sm px-5 py-3 border-t border-gray-200">
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} className="p-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Previous page"><ChevronLeft className="w-4 h-4" /></button>
                {getPageRange(currentPage, totalPages).map((p, i) => p === '…' ? (<span key={`e-${i}`} className="px-2 text-slate-400">…</span>) : (<button key={`p-${p}`} onClick={() => setCurrentPage(p as number)} aria-current={p === currentPage ? 'page' : undefined} className={`min-w-9 h-9 px-2 rounded-lg text-sm font-medium transition-colors ${p === currentPage ? 'bg-[#222222] text-white' : 'text-slate-700 hover:bg-slate-100'}`}>{p}</button>))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="p-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Next page"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stock History Modal */}
      {stockHistoryModal.item && (
        <StockHistoryModal
          isOpen={stockHistoryModal.isOpen}
          onClose={() => setStockHistoryModal({ isOpen: false, item: null })}
          inventoryId={stockHistoryModal.item.id}
          itemName={stockHistoryModal.item.name}
          itemSku={stockHistoryModal.item.sku}
          isAdmin={false}
        />
      )}

      <DeleteConfirmModal
        show={deleteModal.show}
        title="Delete Inventory Item"
        itemName={deleteModal.item?.name}
        itemDetail={deleteModal.item?.sku ? `SKU: ${deleteModal.item.sku}` : undefined}
        loading={deleteModal.loading}
        confirmLabel="Delete Permanently"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ show: false, item: null, loading: false })}
      />
    </div>
  )
}
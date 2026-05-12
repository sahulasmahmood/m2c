'use client'

import { useState, useEffect } from 'react'
import { X, History, TrendingUp, TrendingDown, User, Calendar, ChevronLeft, ChevronRight, Package } from 'lucide-react'
import { LoadingSpinner } from '@/components/UI/LoadingSpinner'
import inventoryService, { StockChangeHistory } from '@/services/inventoryService'
import { toast } from '@/hooks/use-toast'

interface StockHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  inventoryId: string
  itemName: string
  itemSku: string
  isAdmin?: boolean
}

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

export default function StockHistoryModal({
  isOpen,
  onClose,
  inventoryId,
  itemName,
  itemSku,
  isAdmin = false
}: StockHistoryModalProps) {
  const [history, setHistory] = useState<StockChangeHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)

  useEffect(() => {
    if (isOpen && inventoryId) {
      fetchHistory()
    }
  }, [isOpen, inventoryId, currentPage])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const response = isAdmin
        ? await inventoryService.adminGetStockHistory(inventoryId, currentPage, 10)
        : await inventoryService.getStockHistory(inventoryId, currentPage, 10)

      setHistory(response.history)
      setTotalPages(response.pagination.totalPages)
      setTotalRecords(response.pagination.totalItems || response.history.length)
    } catch (error) {
      console.error('Error fetching stock history:', error)
      toast({
        title: 'Error',
        description: 'Failed to load stock history',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-purple-50 rounded-xl shrink-0">
              <History className="h-5 w-5 text-purple-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900">Stock History</h2>
              <p className="text-xs text-gray-500 truncate">{itemName} &middot; <span className="font-mono">{itemSku}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {totalRecords > 0 && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
                {totalRecords} change{totalRecords !== 1 ? 's' : ''}
              </span>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No stock changes recorded yet</p>
            </div>
          ) : (
            <div className="relative px-5 py-4">
              {/* Vertical timeline line */}
              <div className="absolute left-9.75 top-4 bottom-4 w-px bg-gray-200" />

              <div className="space-y-0">
                {history.map((record, idx) => {
                  const isIncrease = record.changeAmount > 0
                  const isDecrease = record.changeAmount < 0
                  const isLast = idx === history.length - 1

                  return (
                    <div key={record.id} className={`relative flex gap-4 ${isLast ? '' : 'pb-5'}`}>
                      {/* Timeline dot */}
                      <div className="relative z-10 shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-white ${
                          isIncrease ? 'bg-green-100' : isDecrease ? 'bg-red-100' : 'bg-gray-100'
                        }`}>
                          {isIncrease ? (
                            <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 bg-gray-50 rounded-xl p-3.5 border border-gray-100 hover:border-gray-200 transition-colors">
                        {/* Top row: stock change + time */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900">
                              {record.previousStock} → {record.newStock}
                            </span>
                            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                              isIncrease
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {isIncrease ? '+' : ''}{record.changeAmount}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400 shrink-0">
                            {formatDate(record.createdAt)}
                          </span>
                        </div>

                        {/* Reason */}
                        <p className="text-sm text-gray-700 mb-2">{record.reason}</p>

                        {/* Changed by */}
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <User className="h-3 w-3" />
                          <span className="font-medium text-gray-700">{record.changedByName || 'Unknown'}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                            record.changedByType === 'vendor'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {record.changedByType}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer with pagination */}
        <div className="border-t border-gray-100 p-4 flex items-center justify-between">
          {totalPages > 1 ? (
            <>
              <p className="text-xs text-gray-500">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                  className="p-1.5 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {getPageRange(currentPage, totalPages).map((p, i) =>
                  p === '…' ? (
                    <span key={`e-${i}`} className="px-1.5 text-gray-400 text-xs">…</span>
                  ) : (
                    <button
                      key={`p-${p}`}
                      onClick={() => setCurrentPage(p as number)}
                      aria-current={p === currentPage ? 'page' : undefined}
                      className={`min-w-8 h-8 px-2 rounded-lg text-xs font-medium transition-colors ${
                        p === currentPage ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || loading}
                  className="p-1.5 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1" />
          )}
          <button
            onClick={onClose}
            className="ml-4 px-5 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

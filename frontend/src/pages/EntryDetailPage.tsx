import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { entryApi, paymentApi } from '../services/api'
import type { Entry, Payment } from '../types'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Calendar,
  User,
  Users,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Hash,
  Banknote,
  TrendingUp
} from 'lucide-react'

export default function EntryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [entry, setEntry] = useState<Entry | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadEntry()
      loadPayments()
    }
  }, [id])

  const loadEntry = async () => {
    if (!id) return
    try {
      const response = await entryApi.getById(id)
      setEntry(response.data)
    } catch (error) {
      console.error('Error loading entry:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPayments = async () => {
    if (!id) return
    try {
      const response = await paymentApi.getByEntry(id)
      setPayments(response.data)
    } catch (error) {
      console.error('Error loading payments:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
          <p className="text-dark-400">Loading entry details...</p>
        </div>
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-16 h-16 mb-4 rounded-full bg-dark-800 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-dark-500" />
        </div>
        <p className="text-dark-400 mb-4">Entry not found</p>
        <button onClick={() => navigate('/entries')} className="btn-secondary">
          Back to Entries
        </button>
      </div>
    )
  }

  const paymentPercentage = entry.amountBorrowed > 0 
    ? ((entry.amountBorrowed - entry.amountRemaining) / entry.amountBorrowed) * 100 
    : 0

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-500/20 text-accent-400 border border-accent-500/30">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold">Paid</span>
          </span>
        )
      case 'PARTIALLY_PAID':
        return (
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Clock className="w-5 h-5" />
            <span className="font-semibold">Partially Paid</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-5 h-5" />
            <span className="font-semibold">Unpaid</span>
          </span>
        )
    }
  }

  const getTypeBadge = (type: string) => {
    const typeLabel = type.replace('_EXPENSE', '').replace('_', ' ')
    return (
      <span className="badge badge-info">
        {typeLabel}
      </span>
    )
  }

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/entries')}
          className="btn-ghost mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Entries
        </button>
        
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-display text-3xl font-bold text-dark-50">{entry.entryName}</h1>
              {getTypeBadge(entry.transactionType)}
            </div>
            <div className="flex items-center gap-4 text-dark-400">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4" />
                <code className="text-sm bg-dark-800 px-2 py-0.5 rounded font-mono text-primary-400">
                  {entry.referenceId}
                </code>
              </div>
              {entry.dateBorrowed && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">{format(new Date(entry.dateBorrowed), 'MMMM dd, yyyy')}</span>
                </div>
              )}
            </div>
          </div>
          {getStatusBadge(entry.status)}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Overview */}
          <div className="glass-card p-6">
            <h2 className="font-display text-lg font-semibold text-dark-100 mb-6">Financial Overview</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-dark-800/50 rounded-xl">
                <div className="flex items-center gap-2 text-dark-400 mb-2">
                  <Banknote className="w-4 h-4" />
                  <span className="text-sm">Amount Borrowed</span>
                </div>
                <p className="text-2xl font-display font-bold text-dark-100">
                  ₱{entry.amountBorrowed.toLocaleString()}
                </p>
              </div>
              
              <div className="p-4 bg-dark-800/50 rounded-xl">
                <div className="flex items-center gap-2 text-dark-400 mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Remaining</span>
                </div>
                <p className="text-2xl font-display font-bold text-amber-400">
                  ₱{entry.amountRemaining.toLocaleString()}
                </p>
              </div>
              
              <div className="p-4 bg-dark-800/50 rounded-xl">
                <div className="flex items-center gap-2 text-dark-400 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Total Paid</span>
                </div>
                <p className="text-2xl font-display font-bold text-accent-400">
                  ₱{(entry.amountBorrowed - entry.amountRemaining).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-dark-400">Payment Progress</span>
                <span className="text-dark-200 font-medium">{paymentPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full h-3 bg-dark-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
                  style={{ width: `${paymentPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Entry Details */}
          <div className="glass-card p-6">
            <h2 className="font-display text-lg font-semibold text-dark-100 mb-6">Entry Details</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-dark-500 mb-1">Borrower</p>
                <div className="flex items-center gap-2 text-dark-200">
                  {entry.borrowerGroupName ? (
                    <Users className="w-5 h-5 text-dark-400" />
                  ) : (
                    <User className="w-5 h-5 text-dark-400" />
                  )}
                  <span className="font-medium">{entry.borrowerPersonName || entry.borrowerGroupName}</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-dark-500 mb-1">Lender</p>
                <div className="flex items-center gap-2 text-dark-200">
                  <User className="w-5 h-5 text-dark-400" />
                  <span className="font-medium">{entry.lenderPersonName}</span>
                </div>
              </div>

              {entry.dateBorrowed && (
                <div>
                  <p className="text-sm text-dark-500 mb-1">Date Borrowed</p>
                  <div className="flex items-center gap-2 text-dark-200">
                    <Calendar className="w-5 h-5 text-dark-400" />
                    <span className="font-medium">{format(new Date(entry.dateBorrowed), 'MMMM dd, yyyy')}</span>
                  </div>
                </div>
              )}

              {entry.dateFullyPaid && (
                <div>
                  <p className="text-sm text-dark-500 mb-1">Date Fully Paid</p>
                  <div className="flex items-center gap-2 text-dark-200">
                    <CheckCircle2 className="w-5 h-5 text-accent-400" />
                    <span className="font-medium">{format(new Date(entry.dateFullyPaid), 'MMMM dd, yyyy')}</span>
                  </div>
                </div>
              )}
            </div>

            {entry.description && (
              <div className="mt-6 pt-6 border-t border-dark-800">
                <p className="text-sm text-dark-500 mb-2">Description</p>
                <p className="text-dark-300">{entry.description}</p>
              </div>
            )}

            {(entry.notes || entry.paymentNotes) && (
              <div className="mt-6 pt-6 border-t border-dark-800 space-y-4">
                {entry.notes && (
                  <div>
                    <p className="text-sm text-dark-500 mb-2">Notes</p>
                    <p className="text-dark-300">{entry.notes}</p>
                  </div>
                )}
                {entry.paymentNotes && (
                  <div>
                    <p className="text-sm text-dark-500 mb-2">Payment Notes</p>
                    <p className="text-dark-300">{entry.paymentNotes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payments History */}
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-dark-800 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-dark-100">Payment History</h2>
              <button className="btn-primary">
                <Plus className="w-4 h-4" />
                Add Payment
              </button>
            </div>

            {payments.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-800 flex items-center justify-center">
                  <DollarSign className="w-8 h-8 text-dark-500" />
                </div>
                <p className="text-dark-400">No payments recorded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Payee</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment, index) => (
                      <tr key={payment.paymentId} className="stagger-item" style={{ animationDelay: `${index * 0.05}s` }}>
                        <td>
                          <div className="flex items-center gap-2 text-dark-300">
                            <Calendar className="w-4 h-4 text-dark-500" />
                            {format(new Date(payment.paymentDate), 'MMM dd, yyyy')}
                          </div>
                        </td>
                        <td className="font-mono font-medium text-accent-400">
                          +₱{payment.paymentAmount.toLocaleString()}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-dark-500" />
                            {payment.payeePersonName}
                          </div>
                        </td>
                        <td className="text-dark-400">
                          {payment.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Quick Info */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="glass-card p-6">
            <h3 className="font-display font-semibold text-dark-100 mb-4">Quick Info</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-dark-400">Transaction Type</span>
                <span className="text-dark-200">{entry.transactionType.replace('_EXPENSE', '').replace('_', ' ')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-400">Total Payments</span>
                <span className="text-dark-200">{payments.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-400">Progress</span>
                <span className="text-dark-200">{paymentPercentage.toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Progress Ring */}
          <div className="glass-card p-6">
            <h3 className="font-display font-semibold text-dark-100 mb-4 text-center">Payment Progress</h3>
            <div className="flex justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-dark-800"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="url(#detailProgressGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${paymentPercentage * 3.52} 352`}
                  />
                  <defs>
                    <linearGradient id="detailProgressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0ea5e9" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-display font-bold text-dark-50">
                    {paymentPercentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

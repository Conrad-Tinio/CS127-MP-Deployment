import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { entryApi, personApi, groupApi } from '../services/api'
import { TransactionType } from '../types'
import { 
  ArrowLeft, 
  Save, 
  User, 
  Users, 
  Calendar,
  DollarSign,
  FileText,
  Clock,
  Loader2,
  Info
} from 'lucide-react'

export default function CreateEntryPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    entryName: '',
    description: '',
    transactionType: TransactionType.STRAIGHT_EXPENSE,
    dateBorrowed: '',
    borrowerName: '',
    borrowerGroupName: '',
    lenderName: '',
    amountBorrowed: '',
    notes: '',
    paymentNotes: '',
    installmentStartDate: '',
    paymentFrequency: 'MONTHLY',
    paymentTerms: '',
  })

  const findOrCreatePerson = async (name: string): Promise<string> => {
    if (!name || name.trim() === '') {
      throw new Error('Person name is required')
    }

    try {
      const searchResult = await personApi.search(name.trim())
      const existingPerson = searchResult.data.find(
        p => p.fullName.toLowerCase() === name.trim().toLowerCase()
      )
      if (existingPerson) {
        return existingPerson.personId
      }
    } catch (error) {
      // Continue to create
    }

    const newPerson = await personApi.create({ fullName: name.trim() })
    return newPerson.data.personId
  }

  const findOrCreateGroup = async (name: string): Promise<string> => {
    if (!name || name.trim() === '') {
      throw new Error('Group name is required')
    }

    try {
      const allGroups = await groupApi.getAll()
      const existingGroup = allGroups.data.find(
        g => g.groupName.toLowerCase() === name.trim().toLowerCase()
      )
      if (existingGroup) {
        return existingGroup.groupId
      }
    } catch (error) {
      // Continue to create
    }

    const newGroup = await groupApi.create({ groupName: name.trim(), members: [] })
    return newGroup.data.groupId
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (!formData.lenderName.trim()) {
        alert('Lender name is required')
        setSubmitting(false)
        return
      }

      if (formData.transactionType !== TransactionType.GROUP_EXPENSE && !formData.borrowerName.trim()) {
        alert('Borrower name is required')
        setSubmitting(false)
        return
      }

      if (formData.transactionType === TransactionType.GROUP_EXPENSE && !formData.borrowerGroupName.trim()) {
        alert('Group name is required')
        setSubmitting(false)
        return
      }

      const lenderPersonId = await findOrCreatePerson(formData.lenderName)

      let borrowerPersonId: string | undefined = undefined
      let borrowerGroupId: string | undefined = undefined
      
      if (formData.transactionType !== TransactionType.GROUP_EXPENSE) {
        borrowerPersonId = await findOrCreatePerson(formData.borrowerName)
      } else {
        borrowerGroupId = await findOrCreateGroup(formData.borrowerGroupName)
      }

      const request: any = {
        entryName: formData.entryName,
        transactionType: formData.transactionType,
        lenderPersonId: lenderPersonId,
        amountBorrowed: parseFloat(formData.amountBorrowed),
      }

      if (formData.description?.trim()) {
        request.description = formData.description.trim()
      }
      if (formData.dateBorrowed) {
        request.dateBorrowed = formData.dateBorrowed
      }
      if (borrowerPersonId) {
        request.borrowerPersonId = borrowerPersonId
      }
      if (borrowerGroupId) {
        request.borrowerGroupId = borrowerGroupId
      }
      if (formData.notes?.trim()) {
        request.notes = formData.notes.trim()
      }
      if (formData.paymentNotes?.trim()) {
        request.paymentNotes = formData.paymentNotes.trim()
      }

      if (formData.transactionType === TransactionType.INSTALLMENT_EXPENSE) {
        if (formData.installmentStartDate) {
          request.installmentStartDate = formData.installmentStartDate
        }
        if (formData.paymentFrequency) {
          request.paymentFrequency = formData.paymentFrequency
        }
        if (formData.paymentTerms) {
          request.paymentTerms = parseInt(formData.paymentTerms)
        }
      }

      const response = await entryApi.create(request)
      navigate(`/entries/${response.data.entryId}`)
    } catch (error: any) {
      console.error('Error creating entry:', error)
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message || 
                          error?.message || 
                          'Error creating entry. Please check the console for details.'
      alert(`Error: ${errorMessage}`)
    } finally {
      setSubmitting(false)
    }
  }

  const getTransactionTypeDescription = (type: TransactionType) => {
    switch (type) {
      case TransactionType.STRAIGHT_EXPENSE:
        return 'A simple one-time loan or expense between two people.'
      case TransactionType.INSTALLMENT_EXPENSE:
        return 'A loan paid back in multiple scheduled payments.'
      case TransactionType.GROUP_EXPENSE:
        return 'A shared expense split among group members.'
    }
  }

  return (
    <div className="page-enter max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/entries')}
          className="btn-ghost mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Entries
        </button>
        <h1 className="font-display text-3xl font-bold text-dark-50">Create New Entry</h1>
        <p className="mt-1 text-dark-400">Add a new loan or expense to track.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-dark-800">
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-dark-100">Basic Information</h2>
              <p className="text-sm text-dark-500">Entry details and description</p>
            </div>
          </div>

          <div>
            <label className="label">Entry Name *</label>
            <input
              type="text"
              required
              value={formData.entryName}
              onChange={(e) => setFormData({ ...formData, entryName: e.target.value })}
              placeholder="e.g., Office Supplies Purchase"
              className="input-field"
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Add any additional details..."
              className="input-field resize-none"
            />
          </div>

          <div>
            <label className="label">Transaction Type *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {([TransactionType.STRAIGHT_EXPENSE, TransactionType.INSTALLMENT_EXPENSE, TransactionType.GROUP_EXPENSE]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, transactionType: type })}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    formData.transactionType === type
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-dark-700 hover:border-dark-600 bg-dark-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {type === TransactionType.GROUP_EXPENSE ? (
                      <Users className={`w-5 h-5 ${formData.transactionType === type ? 'text-primary-400' : 'text-dark-400'}`} />
                    ) : type === TransactionType.INSTALLMENT_EXPENSE ? (
                      <Clock className={`w-5 h-5 ${formData.transactionType === type ? 'text-primary-400' : 'text-dark-400'}`} />
                    ) : (
                      <DollarSign className={`w-5 h-5 ${formData.transactionType === type ? 'text-primary-400' : 'text-dark-400'}`} />
                    )}
                    <span className={`font-medium ${formData.transactionType === type ? 'text-dark-100' : 'text-dark-300'}`}>
                      {type.replace('_EXPENSE', '').replace('_', ' ')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-dark-500 flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {getTransactionTypeDescription(formData.transactionType)}
            </p>
          </div>

          <div>
            <label className="label">Date Borrowed</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
              <input
                type="date"
                value={formData.dateBorrowed}
                onChange={(e) => setFormData({ ...formData, dateBorrowed: e.target.value })}
                className="input-field pl-10"
              />
            </div>
          </div>
        </div>

        {/* People Information */}
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-dark-800">
            <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center">
              <User className="w-5 h-5 text-accent-400" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-dark-100">People</h2>
              <p className="text-sm text-dark-500">Borrower and lender information</p>
            </div>
          </div>

          {formData.transactionType !== TransactionType.GROUP_EXPENSE ? (
            <div>
              <label className="label">Borrower (Person) *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type="text"
                  required={formData.transactionType !== TransactionType.GROUP_EXPENSE}
                  value={formData.borrowerName}
                  onChange={(e) => setFormData({ ...formData, borrowerName: e.target.value, borrowerGroupName: '' })}
                  placeholder="Enter borrower's full name"
                  className="input-field pl-10"
                />
              </div>
              <p className="mt-2 text-sm text-dark-500">Person will be created automatically if they don't exist</p>
            </div>
          ) : (
            <div>
              <label className="label">Borrower (Group) *</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type="text"
                  required
                  value={formData.borrowerGroupName}
                  onChange={(e) => setFormData({ ...formData, borrowerGroupName: e.target.value, borrowerName: '' })}
                  placeholder="Enter group name"
                  className="input-field pl-10"
                />
              </div>
              <p className="mt-2 text-sm text-dark-500">Group will be created automatically if it doesn't exist</p>
            </div>
          )}

          <div>
            <label className="label">Lender (Person) *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
              <input
                type="text"
                required
                value={formData.lenderName}
                onChange={(e) => setFormData({ ...formData, lenderName: e.target.value })}
                placeholder="Enter lender's full name"
                className="input-field pl-10"
              />
            </div>
            <p className="mt-2 text-sm text-dark-500">Person will be created automatically if they don't exist</p>
          </div>
        </div>

        {/* Amount Information */}
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-dark-800">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-dark-100">Amount</h2>
              <p className="text-sm text-dark-500">Financial details</p>
            </div>
          </div>

          <div>
            <label className="label">Amount Borrowed *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 font-medium">₱</span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.amountBorrowed}
                onChange={(e) => setFormData({ ...formData, amountBorrowed: e.target.value })}
                placeholder="0.00"
                className="input-field pl-8 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Installment Options */}
        {formData.transactionType === TransactionType.INSTALLMENT_EXPENSE && (
          <div className="glass-card p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-dark-800">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-dark-100">Installment Plan</h2>
                <p className="text-sm text-dark-500">Payment schedule configuration</p>
              </div>
            </div>

            <div>
              <label className="label">Start Date *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type="date"
                  required
                  value={formData.installmentStartDate}
                  onChange={(e) => setFormData({ ...formData, installmentStartDate: e.target.value })}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Payment Frequency *</label>
                <select
                  required
                  value={formData.paymentFrequency}
                  onChange={(e) => setFormData({ ...formData, paymentFrequency: e.target.value })}
                  className="select-field"
                >
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>
              <div>
                <label className="label">Number of Terms *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  placeholder="e.g., 12"
                  className="input-field"
                />
              </div>
            </div>

            {formData.amountBorrowed && formData.paymentTerms && (
              <div className="p-4 bg-dark-800/50 rounded-xl">
                <p className="text-sm text-dark-400">Estimated Amount Per Term</p>
                <p className="text-2xl font-display font-bold text-dark-100 mt-1">
                  ₱{(parseFloat(formData.amountBorrowed) / parseInt(formData.paymentTerms)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-dark-800">
            <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center">
              <FileText className="w-5 h-5 text-dark-400" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-dark-100">Notes</h2>
              <p className="text-sm text-dark-500">Additional information (optional)</p>
            </div>
          </div>

          <div>
            <label className="label">General Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Any additional notes about this entry..."
              className="input-field resize-none"
            />
          </div>

          <div>
            <label className="label">Payment Notes</label>
            <textarea
              value={formData.paymentNotes}
              onChange={(e) => setFormData({ ...formData, paymentNotes: e.target.value })}
              rows={3}
              placeholder="Notes about payment arrangements..."
              className="input-field resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/entries')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Create Entry
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

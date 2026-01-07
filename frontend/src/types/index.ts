export enum TransactionType {
  STRAIGHT_EXPENSE = 'STRAIGHT_EXPENSE',
  INSTALLMENT_EXPENSE = 'INSTALLMENT_EXPENSE',
  GROUP_EXPENSE = 'GROUP_EXPENSE',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
}

export enum InstallmentStatus {
  NOT_STARTED = 'NOT_STARTED',
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  SKIPPED = 'SKIPPED',
  DELINQUENT = 'DELINQUENT',
}

export enum PaymentAllocationStatus {
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
}

export enum PaymentFrequency {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export interface Person {
  personId: string
  fullName: string
}

export interface Group {
  groupId: string
  groupName: string
  members: Person[]
}

export interface Entry {
  entryId: string
  entryName: string
  description?: string
  transactionType: TransactionType
  dateBorrowed?: string
  dateFullyPaid?: string
  borrowerPersonId?: string
  borrowerPersonName?: string
  borrowerGroupId?: string
  borrowerGroupName?: string
  lenderPersonId: string
  lenderPersonName: string
  amountBorrowed: number
  amountRemaining: number
  status: PaymentStatus
  notes?: string
  paymentNotes?: string
  referenceId: string
  payments?: Payment[]
  installmentPlan?: InstallmentPlan
  paymentAllocations?: PaymentAllocation[]
}

export interface Payment {
  paymentId: string
  paymentDate: string
  paymentAmount: number
  payeePersonId: string
  payeePersonName: string
  notes?: string
}

export interface PaymentAllocation {
  allocationId: string
  entryId: string
  personId: string
  personName: string
  paymentAllocationStatus: PaymentAllocationStatus // Computed, not stored in DB
  description: string // Required
  amount: number
  percentageOfTotal?: number // Computed, not stored in DB
  notes?: string
}

export interface InstallmentPlan {
  installmentId: string
  entryId: string
  startDate: string
  paymentFrequency: PaymentFrequency
  paymentTerms: number
  amountPerTerm: number
  notes?: string
  installmentTerms?: InstallmentTerm[]
}

export interface InstallmentTerm {
  termId: string
  installmentId: string
  termNumber: number
  dueDate: string
  termStatus: InstallmentStatus
}

export interface CreateEntryRequest {
  entryName: string
  description?: string
  transactionType: TransactionType
  dateBorrowed?: string
  borrowerPersonId?: string
  borrowerGroupId?: string
  lenderPersonId: string
  amountBorrowed: number
  notes?: string
  paymentNotes?: string
  installmentStartDate?: string
  paymentFrequency?: string
  paymentTerms?: number
  amountPerTerm?: number
}

export interface CreatePaymentRequest {
  entryId: string
  paymentDate?: string
  paymentAmount: number
  payeePersonId: string
  notes?: string
}


package com.loantracking.service;

import com.loantracking.dto.*;
import com.loantracking.model.*;
import com.loantracking.repository.*;
import com.loantracking.util.ReferenceIdGenerator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class EntryService {
    
    @Autowired
    private EntryRepository entryRepository;
    
    @Autowired
    private PersonRepository personRepository;
    
    @Autowired
    private GroupRepository groupRepository;
    
    @Autowired
    private InstallmentPlanRepository installmentPlanRepository;
    
    @Autowired
    private InstallmentTermRepository installmentTermRepository;
    
    @Autowired
    private PaymentEntryRepository paymentEntryRepository;
    
    public List<EntryDTO> getAllEntries() {
        return entryRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public EntryDTO getEntryById(UUID id) {
        Entry entry = entryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Entry not found with id: " + id));
        return convertToDTO(entry);
    }
    
    public EntryDTO createEntry(CreateEntryRequest request) {
        // Validate borrower (must be either person or group, not both)
        if (request.getBorrowerPersonId() != null && request.getBorrowerGroupId() != null) {
            throw new IllegalArgumentException("Entry cannot have both borrower person and borrower group");
        }
        if (request.getBorrowerPersonId() == null && request.getBorrowerGroupId() == null) {
            throw new IllegalArgumentException("Entry must have either borrower person or borrower group");
        }
        
        // Validate installment + group constraint
        if (request.getTransactionType() == TransactionType.INSTALLMENT_EXPENSE && 
            request.getBorrowerGroupId() != null) {
            throw new IllegalArgumentException("Entry cannot be installment type with group borrower");
        }
        
        Person lender = personRepository.findById(request.getLenderPersonId())
                .orElseThrow(() -> new IllegalArgumentException("Lender not found"));
        
        Entry entry = new Entry();
        entry.setEntryName(request.getEntryName());
        entry.setDescription(request.getDescription());
        entry.setTransactionType(request.getTransactionType());
        entry.setDateBorrowed(request.getDateBorrowed());
        entry.setLenderPerson(lender);
        entry.setAmountBorrowed(request.getAmountBorrowed());
        entry.setAmountRemaining(request.getAmountBorrowed());
        entry.setNotes(request.getNotes());
        entry.setPaymentNotes(request.getPaymentNotes());
        entry.setStatus(PaymentStatus.UNPAID);
        
        // Set borrower
        if (request.getBorrowerPersonId() != null) {
            Person borrower = personRepository.findById(request.getBorrowerPersonId())
                    .orElseThrow(() -> new IllegalArgumentException("Borrower person not found"));
            entry.setBorrowerPerson(borrower);
            entry.setReferenceId(ReferenceIdGenerator.generateReferenceId(borrower, lender));
        } else {
            Group borrowerGroup = groupRepository.findById(request.getBorrowerGroupId())
                    .orElseThrow(() -> new IllegalArgumentException("Borrower group not found"));
            entry.setBorrowerGroup(borrowerGroup);
            entry.setReferenceId(ReferenceIdGenerator.generateReferenceId(borrowerGroup, lender));
        }
        
        // Ensure reference ID is unique
        String baseRefId = entry.getReferenceId();
        String refId = baseRefId;
        int counter = 1;
        while (entryRepository.existsByReferenceId(refId)) {
            refId = baseRefId + counter;
            counter++;
        }
        entry.setReferenceId(refId);
        
        Entry saved = entryRepository.save(entry);
        
        // Create installment plan if needed
        if (request.getTransactionType() == TransactionType.INSTALLMENT_EXPENSE && 
            request.getInstallmentStartDate() != null) {
            createInstallmentPlan(saved, request);
        }
        
        return convertToDTO(saved);
    }
    
    private void createInstallmentPlan(Entry entry, CreateEntryRequest request) {
        if (request.getInstallmentStartDate() == null) {
            throw new IllegalArgumentException("Installment start date is required for installment expenses");
        }
        if (request.getPaymentFrequency() == null || request.getPaymentFrequency().trim().isEmpty()) {
            throw new IllegalArgumentException("Payment frequency is required for installment expenses");
        }
        if (request.getPaymentTerms() == null || request.getPaymentTerms() <= 0) {
            throw new IllegalArgumentException("Payment terms must be greater than 0");
        }
        
        InstallmentPlan plan = new InstallmentPlan();
        plan.setEntry(entry);
        plan.setStartDate(request.getInstallmentStartDate());
        plan.setPaymentFrequency(PaymentFrequency.valueOf(request.getPaymentFrequency().toUpperCase()));
        plan.setPaymentTerms(request.getPaymentTerms());
        
        // Auto-compute amount_per_term: Amount borrowed / Payment terms
        BigDecimal amountPerTerm = entry.getAmountBorrowed()
                .divide(BigDecimal.valueOf(request.getPaymentTerms()), 2, java.math.RoundingMode.HALF_UP);
        plan.setAmountPerTerm(amountPerTerm);
        
        InstallmentPlan savedPlan = installmentPlanRepository.save(plan);
        
        // Generate installment terms
        generateInstallmentTerms(savedPlan);
    }
    
    private void generateInstallmentTerms(InstallmentPlan plan) {
        LocalDate currentDate = plan.getStartDate();
        PaymentFrequency frequency = plan.getPaymentFrequency();
        
        for (int i = 1; i <= plan.getPaymentTerms(); i++) {
            InstallmentTerm term = new InstallmentTerm();
            term.setInstallmentPlan(plan);
            term.setTermNumber(i);
            term.setDueDate(currentDate);
            term.setTermStatus(InstallmentStatus.NOT_STARTED);
            installmentTermRepository.save(term);
            
            // Calculate next due date
            if (frequency == PaymentFrequency.WEEKLY) {
                currentDate = currentDate.plusWeeks(1);
            } else if (frequency == PaymentFrequency.MONTHLY) {
                currentDate = currentDate.plusMonths(1);
            }
        }
    }
    
    public EntryDTO updateEntry(UUID id, CreateEntryRequest request) {
        Entry entry = entryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Entry not found with id: " + id));
        
        entry.setEntryName(request.getEntryName());
        entry.setDescription(request.getDescription());
        entry.setDateBorrowed(request.getDateBorrowed());
        entry.setNotes(request.getNotes());
        entry.setPaymentNotes(request.getPaymentNotes());
        
        Entry updated = entryRepository.save(entry);
        return convertToDTO(updated);
    }
    
    public void deleteEntry(UUID id) {
        if (!entryRepository.existsById(id)) {
            throw new IllegalArgumentException("Entry not found with id: " + id);
        }
        entryRepository.deleteById(id);
    }
    
    public EntryDTO completeEntry(UUID id) {
        Entry entry = entryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Entry not found with id: " + id));
        
        entry.setStatus(PaymentStatus.PAID);
        entry.setAmountRemaining(BigDecimal.ZERO);
        entry.setDateFullyPaid(LocalDate.now());
        
        Entry updated = entryRepository.save(entry);
        return convertToDTO(updated);
    }
    
    private EntryDTO convertToDTO(Entry entry) {
        EntryDTO dto = new EntryDTO();
        dto.setEntryId(entry.getEntryId());
        dto.setEntryName(entry.getEntryName());
        dto.setDescription(entry.getDescription());
        dto.setTransactionType(entry.getTransactionType());
        dto.setDateBorrowed(entry.getDateBorrowed());
        dto.setDateFullyPaid(entry.getDateFullyPaid());
        dto.setAmountBorrowed(entry.getAmountBorrowed());
        dto.setAmountRemaining(entry.getAmountRemaining());
        dto.setStatus(entry.getStatus());
        dto.setNotes(entry.getNotes());
        dto.setPaymentNotes(entry.getPaymentNotes());
        dto.setReferenceId(entry.getReferenceId());
        
        if (entry.getBorrowerPerson() != null) {
            dto.setBorrowerPersonId(entry.getBorrowerPerson().getPersonId());
            dto.setBorrowerPersonName(entry.getBorrowerPerson().getFullName());
        }
        
        if (entry.getBorrowerGroup() != null) {
            dto.setBorrowerGroupId(entry.getBorrowerGroup().getGroupId());
            dto.setBorrowerGroupName(entry.getBorrowerGroup().getGroupName());
        }
        
        if (entry.getLenderPerson() != null) {
            dto.setLenderPersonId(entry.getLenderPerson().getPersonId());
            dto.setLenderPersonName(entry.getLenderPerson().getFullName());
        }
        
        // Load installment plan if exists
        if (entry.getTransactionType() == TransactionType.INSTALLMENT_EXPENSE) {
            installmentPlanRepository.findByEntry_EntryId(entry.getEntryId())
                    .ifPresent(plan -> dto.setInstallmentPlan(convertInstallmentPlanToDTO(plan)));
        }
        
        // Load payments for this entry
        List<com.loantracking.dto.PaymentDTO> payments = paymentEntryRepository
                .findByEntry_EntryId(entry.getEntryId()).stream()
                .map(pe -> {
                    com.loantracking.dto.PaymentDTO paymentDTO = new com.loantracking.dto.PaymentDTO();
                    paymentDTO.setPaymentId(pe.getPayment().getPaymentId());
                    paymentDTO.setPaymentDate(pe.getPayment().getPaymentDate());
                    paymentDTO.setPaymentAmount(pe.getPayment().getPaymentAmount());
                    if (pe.getPayment().getPayeePerson() != null) {
                        paymentDTO.setPayeePersonId(pe.getPayment().getPayeePerson().getPersonId());
                        paymentDTO.setPayeePersonName(pe.getPayment().getPayeePerson().getFullName());
                    }
                    paymentDTO.setNotes(pe.getPayment().getNotes());
                    return paymentDTO;
                })
                .collect(Collectors.toList());
        dto.setPayments(payments);
        
        return dto;
    }
    
    private InstallmentPlanDTO convertInstallmentPlanToDTO(InstallmentPlan plan) {
        InstallmentPlanDTO dto = new InstallmentPlanDTO();
        dto.setInstallmentId(plan.getInstallmentId());
        dto.setEntryId(plan.getEntry().getEntryId());
        dto.setStartDate(plan.getStartDate());
        dto.setPaymentFrequency(plan.getPaymentFrequency());
        dto.setPaymentTerms(plan.getPaymentTerms());
        dto.setAmountPerTerm(plan.getAmountPerTerm());
        dto.setNotes(plan.getNotes());
        
        List<InstallmentTermDTO> terms = installmentTermRepository
                .findByInstallmentPlan_InstallmentId(plan.getInstallmentId()).stream()
                .map(term -> {
                    InstallmentTermDTO termDTO = new InstallmentTermDTO();
                    termDTO.setTermId(term.getTermId());
                    termDTO.setInstallmentId(term.getInstallmentPlan().getInstallmentId());
                    termDTO.setTermNumber(term.getTermNumber());
                    termDTO.setDueDate(term.getDueDate());
                    termDTO.setTermStatus(term.getTermStatus());
                    return termDTO;
                })
                .collect(Collectors.toList());
        dto.setInstallmentTerms(terms);
        
        return dto;
    }
}


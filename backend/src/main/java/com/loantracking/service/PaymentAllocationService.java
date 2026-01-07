package com.loantracking.service;

import com.loantracking.dto.CreatePaymentAllocationRequest;
import com.loantracking.dto.PaymentAllocationDTO;
import com.loantracking.model.Entry;
import com.loantracking.model.PaymentAllocation;
import com.loantracking.model.PaymentAllocationStatus;
import com.loantracking.model.PaymentEntry;
import com.loantracking.model.Person;
import com.loantracking.repository.EntryRepository;
import com.loantracking.repository.PaymentAllocationRepository;
import com.loantracking.repository.PaymentEntryRepository;
import com.loantracking.repository.PersonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class PaymentAllocationService {
    
    @Autowired
    private PaymentAllocationRepository paymentAllocationRepository;
    
    @Autowired
    private EntryRepository entryRepository;
    
    @Autowired
    private PersonRepository personRepository;
    
    @Autowired
    private PaymentEntryRepository paymentEntryRepository;
    
    public List<PaymentAllocationDTO> getAllPaymentAllocations() {
        return paymentAllocationRepository.findAll().stream()
                .map(allocation -> {
                    Entry entry = entryRepository.findById(allocation.getEntry().getEntryId())
                            .orElseThrow(() -> new IllegalArgumentException("Entry not found"));
                    return convertToDTO(allocation, entry);
                })
                .collect(Collectors.toList());
    }
    
    public List<PaymentAllocationDTO> getPaymentAllocationsByEntry(UUID entryId) {
        Entry entry = entryRepository.findById(entryId)
                .orElseThrow(() -> new IllegalArgumentException("Entry not found"));
        return paymentAllocationRepository.findByEntry_EntryId(entryId).stream()
                .map(allocation -> convertToDTO(allocation, entry))
                .collect(Collectors.toList());
    }
    
    public PaymentAllocationDTO getPaymentAllocationById(UUID id) {
        PaymentAllocation allocation = paymentAllocationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Payment allocation not found with id: " + id));
        Entry entry = entryRepository.findById(allocation.getEntry().getEntryId())
                .orElseThrow(() -> new IllegalArgumentException("Entry not found"));
        return convertToDTO(allocation, entry);
    }
    
    public List<PaymentAllocationDTO> createPaymentAllocations(CreatePaymentAllocationRequest request) {
        Entry entry = entryRepository.findById(request.getEntryId())
                .orElseThrow(() -> new IllegalArgumentException("Entry not found"));
        
        List<PaymentAllocationDTO> created = request.getAllocations().stream()
                .map(item -> {
                    Person person = personRepository.findById(item.getPersonId())
                            .orElseThrow(() -> new IllegalArgumentException("Person not found: " + item.getPersonId()));
                    
                    PaymentAllocation allocation = new PaymentAllocation();
                    allocation.setEntry(entry);
                    allocation.setPerson(person);
                    allocation.setDescription(item.getDescription());
                    allocation.setAmount(item.getAmount());
                    allocation.setNotes(item.getNotes());
                    
                    PaymentAllocation saved = paymentAllocationRepository.save(allocation);
                    return convertToDTO(saved, entry);
                })
                .collect(Collectors.toList());
        
        return created;
    }
    
    public PaymentAllocationDTO updatePaymentAllocation(UUID id, PaymentAllocationDTO dto) {
        PaymentAllocation allocation = paymentAllocationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Payment allocation not found with id: " + id));
        
        allocation.setDescription(dto.getDescription());
        allocation.setAmount(dto.getAmount());
        allocation.setNotes(dto.getNotes());
        
        PaymentAllocation updated = paymentAllocationRepository.save(allocation);
        return convertToDTO(updated, allocation.getEntry());
    }
    
    public void deletePaymentAllocation(UUID id) {
        if (!paymentAllocationRepository.existsById(id)) {
            throw new IllegalArgumentException("Payment allocation not found with id: " + id);
        }
        paymentAllocationRepository.deleteById(id);
    }
    
    private PaymentAllocationDTO convertToDTO(PaymentAllocation allocation, Entry entry) {
        PaymentAllocationDTO dto = new PaymentAllocationDTO();
        dto.setAllocationId(allocation.getAllocationId());
        dto.setEntryId(allocation.getEntry().getEntryId());
        dto.setPersonId(allocation.getPerson().getPersonId());
        dto.setPersonName(allocation.getPerson().getFullName());
        dto.setDescription(allocation.getDescription());
        dto.setAmount(allocation.getAmount());
        dto.setNotes(allocation.getNotes());
        
        // Compute status based on payments made for this allocation
        dto.setPaymentAllocationStatus(computeStatus(allocation, entry));
        
        // Compute percentage of total
        if (entry.getAmountBorrowed().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal percentage = allocation.getAmount()
                    .divide(entry.getAmountBorrowed(), 4, java.math.RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
            dto.setPercentageOfTotal(percentage);
        } else {
            dto.setPercentageOfTotal(BigDecimal.ZERO);
        }
        
        return dto;
    }
    
    /**
     * Compute payment allocation status based on payments made
     * UNPAID: No payments made for this allocation
     * PARTIALLY_PAID: Some payments made, but less than allocated amount
     * PAID: Payments made equal or exceed allocated amount
     */
    private PaymentAllocationStatus computeStatus(PaymentAllocation allocation, Entry entry) {
        // Get all payments for this entry
        List<PaymentEntry> paymentEntries = paymentEntryRepository.findByEntry_EntryId(entry.getEntryId());
        
        // Calculate total payments made by this person for this entry
        BigDecimal totalPaid = paymentEntries.stream()
                .filter(pe -> pe.getPayment().getPayeePerson().getPersonId().equals(allocation.getPerson().getPersonId()))
                .map(pe -> pe.getPayment().getPaymentAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Compare with allocated amount
        if (totalPaid.compareTo(BigDecimal.ZERO) == 0) {
            return PaymentAllocationStatus.UNPAID;
        } else if (totalPaid.compareTo(allocation.getAmount()) >= 0) {
            return PaymentAllocationStatus.PAID;
        } else {
            return PaymentAllocationStatus.PARTIALLY_PAID;
        }
    }
}


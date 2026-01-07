package com.loantracking.service;

import com.loantracking.dto.CreatePaymentRequest;
import com.loantracking.dto.EntryDTO;
import com.loantracking.dto.PaymentDTO;
import com.loantracking.model.Entry;
import com.loantracking.model.Payment;
import com.loantracking.model.PaymentEntry;
import com.loantracking.model.PaymentStatus;
import com.loantracking.model.Person;
import com.loantracking.repository.EntryRepository;
import com.loantracking.repository.PaymentEntryRepository;
import com.loantracking.repository.PaymentRepository;
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
public class PaymentService {
    
    @Autowired
    private PaymentRepository paymentRepository;
    
    @Autowired
    private EntryRepository entryRepository;
    
    @Autowired
    private PersonRepository personRepository;
    
    @Autowired
    private PaymentEntryRepository paymentEntryRepository;
    
    @Autowired
    private EntryService entryService;
    
    public List<PaymentDTO> getAllPayments() {
        return paymentRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public PaymentDTO getPaymentById(UUID id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found with id: " + id));
        return convertToDTO(payment);
    }
    
    public PaymentDTO createPayment(CreatePaymentRequest request) {
        Entry entry = entryRepository.findById(request.getEntryId())
                .orElseThrow(() -> new IllegalArgumentException("Entry not found"));
        
        Person payee = personRepository.findById(request.getPayeePersonId())
                .orElseThrow(() -> new IllegalArgumentException("Payee not found"));
        
        Payment payment = new Payment();
        payment.setPaymentDate(request.getPaymentDate());
        payment.setPaymentAmount(request.getPaymentAmount());
        payment.setPayeePerson(payee);
        payment.setNotes(request.getNotes());
        
        Payment saved = paymentRepository.save(payment);
        
        // Link payment to entry
        PaymentEntry paymentEntry = new PaymentEntry();
        paymentEntry.setPayment(saved);
        paymentEntry.setEntry(entry);
        paymentEntryRepository.save(paymentEntry);
        
        // Update entry amount remaining and status
        updateEntryAfterPayment(entry, request.getPaymentAmount());
        
        return convertToDTO(saved);
    }
    
    private void updateEntryAfterPayment(Entry entry, BigDecimal paymentAmount) {
        BigDecimal newRemaining = entry.getAmountRemaining().subtract(paymentAmount);
        
        if (newRemaining.compareTo(BigDecimal.ZERO) < 0) {
            newRemaining = BigDecimal.ZERO;
        }
        
        entry.setAmountRemaining(newRemaining);
        
        // Update status
        if (newRemaining.compareTo(BigDecimal.ZERO) == 0) {
            entry.setStatus(PaymentStatus.PAID);
            entry.setDateFullyPaid(java.time.LocalDate.now());
        } else if (entry.getAmountRemaining().compareTo(entry.getAmountBorrowed()) < 0) {
            entry.setStatus(PaymentStatus.PARTIALLY_PAID);
        }
        
        entryRepository.save(entry);
    }
    
    public PaymentDTO updatePayment(UUID id, CreatePaymentRequest request) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found with id: " + id));
        
        BigDecimal oldAmount = payment.getPaymentAmount();
        
        payment.setPaymentDate(request.getPaymentDate());
        payment.setPaymentAmount(request.getPaymentAmount());
        payment.setNotes(request.getNotes());
        
        if (request.getPayeePersonId() != null) {
            Person payee = personRepository.findById(request.getPayeePersonId())
                    .orElseThrow(() -> new IllegalArgumentException("Payee not found"));
            payment.setPayeePerson(payee);
        }
        
        Payment saved = paymentRepository.save(payment);
        
        // Update entry if payment amount changed
        if (oldAmount.compareTo(request.getPaymentAmount()) != 0) {
            Entry entry = entryRepository.findById(request.getEntryId())
                    .orElseThrow(() -> new IllegalArgumentException("Entry not found"));
            BigDecimal difference = request.getPaymentAmount().subtract(oldAmount);
            updateEntryAfterPayment(entry, difference);
        }
        
        return convertToDTO(saved);
    }
    
    public void deletePayment(UUID id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found with id: " + id));
        
        // Find associated entry and reverse the payment
        // Note: This is simplified - in a real app, you'd need to track which entry a payment belongs to
        // For now, we'll just delete the payment
        
        paymentRepository.deleteById(id);
    }
    
    public List<PaymentDTO> getPaymentsByEntry(UUID entryId) {
        return paymentEntryRepository.findByEntry_EntryId(entryId).stream()
                .map(pe -> convertToDTO(pe.getPayment()))
                .collect(Collectors.toList());
    }
    
    private PaymentDTO convertToDTO(Payment payment) {
        PaymentDTO dto = new PaymentDTO();
        dto.setPaymentId(payment.getPaymentId());
        dto.setPaymentDate(payment.getPaymentDate());
        dto.setPaymentAmount(payment.getPaymentAmount());
        if (payment.getPayeePerson() != null) {
            dto.setPayeePersonId(payment.getPayeePerson().getPersonId());
            dto.setPayeePersonName(payment.getPayeePerson().getFullName());
        }
        dto.setNotes(payment.getNotes());
        return dto;
    }
}


package com.loantracking.controller;

import com.loantracking.dto.CreatePaymentRequest;
import com.loantracking.dto.PaymentDTO;
import com.loantracking.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "http://localhost:5173")
public class PaymentController {
    
    @Autowired
    private PaymentService paymentService;
    
    @GetMapping
    public ResponseEntity<List<PaymentDTO>> getAllPayments() {
        return ResponseEntity.ok(paymentService.getAllPayments());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<PaymentDTO> getPaymentById(@PathVariable UUID id) {
        return ResponseEntity.ok(paymentService.getPaymentById(id));
    }
    
    @GetMapping("/entry/{entryId}")
    public ResponseEntity<List<PaymentDTO>> getPaymentsByEntry(@PathVariable UUID entryId) {
        return ResponseEntity.ok(paymentService.getPaymentsByEntry(entryId));
    }
    
    @PostMapping
    public ResponseEntity<PaymentDTO> createPayment(@RequestBody CreatePaymentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentService.createPayment(request));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<PaymentDTO> updatePayment(@PathVariable UUID id, @RequestBody CreatePaymentRequest request) {
        return ResponseEntity.ok(paymentService.updatePayment(id, request));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePayment(@PathVariable UUID id) {
        paymentService.deletePayment(id);
        return ResponseEntity.noContent().build();
    }
}







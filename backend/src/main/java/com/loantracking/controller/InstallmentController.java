package com.loantracking.controller;

import com.loantracking.dto.InstallmentTermDTO;
import com.loantracking.model.InstallmentStatus;
import com.loantracking.service.InstallmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/installments")
@CrossOrigin(origins = "http://localhost:5173")
public class InstallmentController {
    
    @Autowired
    private InstallmentService installmentService;
    
    @PostMapping("/terms/{termId}/skip")
    public ResponseEntity<InstallmentTermDTO> skipTerm(@PathVariable UUID termId) {
        return ResponseEntity.ok(installmentService.skipTerm(termId));
    }
    
    @PutMapping("/terms/{termId}/status")
    public ResponseEntity<InstallmentTermDTO> updateTermStatus(
            @PathVariable UUID termId,
            @RequestParam InstallmentStatus status) {
        return ResponseEntity.ok(installmentService.updateTermStatus(termId, status));
    }
    
    @PostMapping("/update-delinquent")
    public ResponseEntity<Void> updateDelinquentTerms() {
        installmentService.updateDelinquentTerms();
        return ResponseEntity.ok().build();
    }
}







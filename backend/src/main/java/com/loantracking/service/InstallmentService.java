package com.loantracking.service;

import com.loantracking.dto.InstallmentTermDTO;
import com.loantracking.model.InstallmentStatus;
import com.loantracking.model.InstallmentTerm;
import com.loantracking.repository.InstallmentTermRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
@Transactional
public class InstallmentService {
    
    @Autowired
    private InstallmentTermRepository installmentTermRepository;
    
    public InstallmentTermDTO skipTerm(UUID termId) {
        InstallmentTerm term = installmentTermRepository.findById(termId)
                .orElseThrow(() -> new IllegalArgumentException("Installment term not found with id: " + termId));
        
        term.setTermStatus(InstallmentStatus.SKIPPED);
        InstallmentTerm updated = installmentTermRepository.save(term);
        
        return convertToDTO(updated);
    }
    
    public InstallmentTermDTO updateTermStatus(UUID termId, InstallmentStatus status) {
        InstallmentTerm term = installmentTermRepository.findById(termId)
                .orElseThrow(() -> new IllegalArgumentException("Installment term not found with id: " + termId));
        
        term.setTermStatus(status);
        InstallmentTerm updated = installmentTermRepository.save(term);
        
        return convertToDTO(updated);
    }
    
    public void updateDelinquentTerms() {
        LocalDate today = LocalDate.now();
        installmentTermRepository.findAll().stream()
                .filter(term -> term.getDueDate().isBefore(today) && 
                               term.getTermStatus() == InstallmentStatus.UNPAID)
                .forEach(term -> {
                    term.setTermStatus(InstallmentStatus.DELINQUENT);
                    installmentTermRepository.save(term);
                });
    }
    
    private InstallmentTermDTO convertToDTO(InstallmentTerm term) {
        InstallmentTermDTO dto = new InstallmentTermDTO();
        dto.setTermId(term.getTermId());
        dto.setInstallmentId(term.getInstallmentPlan().getInstallmentId());
        dto.setTermNumber(term.getTermNumber());
        dto.setDueDate(term.getDueDate());
        dto.setTermStatus(term.getTermStatus());
        return dto;
    }
}







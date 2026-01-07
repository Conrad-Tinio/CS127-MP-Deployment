package com.loantracking.controller;

import com.loantracking.dto.CreateEntryRequest;
import com.loantracking.dto.EntryDTO;
import com.loantracking.service.EntryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/entries")
@CrossOrigin(origins = "http://localhost:5173")
public class EntryController {
    
    @Autowired
    private EntryService entryService;
    
    @GetMapping
    public ResponseEntity<List<EntryDTO>> getAllEntries() {
        return ResponseEntity.ok(entryService.getAllEntries());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<EntryDTO> getEntryById(@PathVariable UUID id) {
        return ResponseEntity.ok(entryService.getEntryById(id));
    }
    
    @PostMapping
    public ResponseEntity<EntryDTO> createEntry(@RequestBody CreateEntryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(entryService.createEntry(request));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<EntryDTO> updateEntry(@PathVariable UUID id, @RequestBody CreateEntryRequest request) {
        return ResponseEntity.ok(entryService.updateEntry(id, request));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEntry(@PathVariable UUID id) {
        entryService.deleteEntry(id);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/{id}/complete")
    public ResponseEntity<EntryDTO> completeEntry(@PathVariable UUID id) {
        return ResponseEntity.ok(entryService.completeEntry(id));
    }
}







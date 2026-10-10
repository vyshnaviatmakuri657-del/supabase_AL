package com.learnpath.controller;

import com.learnpath.dto.ApiDtos.*;
import com.learnpath.entity.Student;
import com.learnpath.repository.StudentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final StudentRepository studentRepository;

    public AuthController(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    @PostMapping("/register")
    public AuthResponseDTO register(@RequestBody RegisterRequestDTO request) {
        if (request == null || request.name() == null || request.name().isBlank() ||
            request.email() == null || request.email().isBlank() ||
            request.password() == null || request.password().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name, email, and password are required.");
        }

        String email = request.email().trim().toLowerCase();
        if (studentRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }

        if (request.password().trim().length() < 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 3 characters.");
        }

        Student student = studentRepository.save(new Student(request.name().trim(), email, request.password().trim(), "STUDENT"));
        return new AuthResponseDTO(student.id, student.name, student.email, student.role, "Registration successful");
    }

    @PostMapping("/login")
    public AuthResponseDTO login(@RequestBody LoginRequestDTO request) {
        if (request == null || request.email() == null || request.email().isBlank() ||
            request.password() == null || request.password().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email and password are required.");
        }

        String email = request.email().trim().toLowerCase();
        Student student = studentRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password."));

        if (!request.password().trim().equals(student.password)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        }

        return new AuthResponseDTO(student.id, student.name, student.email, student.role, "Login successful");
    }

    @GetMapping("/me")
    public AuthResponseDTO getMe(@RequestParam Integer studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
        return new AuthResponseDTO(student.id, student.name, student.email, student.role, "User found");
    }
}

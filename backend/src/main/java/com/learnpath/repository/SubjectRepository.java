package com.learnpath.repository;

import com.learnpath.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface SubjectRepository extends JpaRepository<Subject, Integer> {
    Optional<Subject> findByName(String name);
}

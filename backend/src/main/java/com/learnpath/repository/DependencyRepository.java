package com.learnpath.repository;

import com.learnpath.entity.Dependency;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface DependencyRepository extends JpaRepository<Dependency, Integer> {
    java.util.List<Dependency> findByPrerequisiteConceptIdInOrDependentConceptIdIn(java.util.Collection<Integer> prerequisiteIds, java.util.Collection<Integer> dependentIds);
    List<Dependency> findByDependentConceptId(Integer dependentConceptId);
    List<Dependency> findByPrerequisiteConceptId(Integer prerequisiteConceptId);
}

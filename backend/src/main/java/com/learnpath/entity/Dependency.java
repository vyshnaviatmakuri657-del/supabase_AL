package com.learnpath.entity;

import jakarta.persistence.*;

@Entity @Table(name = "dependencies", uniqueConstraints = @UniqueConstraint(columnNames = {"prerequisite_concept_id", "dependent_concept_id"}))
public class Dependency {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Integer id;
    @Column(name = "prerequisite_concept_id", nullable = false) public Integer prerequisiteConceptId;
    @Column(name = "dependent_concept_id", nullable = false) public Integer dependentConceptId;
    public Dependency() {}
    public Dependency(Integer prerequisiteConceptId, Integer dependentConceptId) {
        this.prerequisiteConceptId = prerequisiteConceptId; this.dependentConceptId = dependentConceptId;
    }
}

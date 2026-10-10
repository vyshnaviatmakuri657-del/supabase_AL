package com.learnpath.service;

import com.learnpath.dto.ApiDtos.*;
import com.learnpath.entity.*;
import com.learnpath.repository.*;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class GraphService {
    private final ConceptRepository conceptRepository;
    private final DependencyRepository dependencyRepository;
    private final ConceptMasteryRepository masteryRepository;
    private final MasteryService masteryService;

    public GraphService(ConceptRepository conceptRepository, DependencyRepository dependencyRepository,
                        ConceptMasteryRepository masteryRepository, MasteryService masteryService) {
        this.conceptRepository = conceptRepository; this.dependencyRepository = dependencyRepository;
        this.masteryRepository = masteryRepository; this.masteryService = masteryService;
    }

    public GraphDTO getGraph(Integer subjectId, Integer studentId) {
        List<Concept> concepts = conceptRepository.findBySubjectIdOrderByDisplayOrderAsc(subjectId);
        Set<Integer> ids = concepts.stream().map(c -> c.id).collect(Collectors.toSet());
        Map<Integer, ConceptMastery> masteries = masteryRepository.findByStudentId(studentId).stream()
                .filter(m -> ids.contains(m.conceptId)).collect(Collectors.toMap(m -> m.conceptId, m -> m, (a, b) -> a));
        List<GraphNodeDTO> nodes = concepts.stream().map(c -> {
            ConceptMastery m = masteries.get(c.id);
            double score = m == null ? 0 : m.masteryScore;
            int tries = m == null ? 0 : m.totalAttempts;
            int[] position = positionFor(c.displayOrder == null ? 1 : c.displayOrder);
            boolean unlocked = masteryService.isConceptUnlocked(studentId, c.id);
            boolean locked = !unlocked && (tries == 0 || score < 80);
            String nodeStatus = (score >= 80) ? "MASTERED" : (locked ? "LOCKED" : MasteryService.status(score, tries));
            return new GraphNodeDTO(String.valueOf(c.id), c.name, c.description, score,
                    nodeStatus, locked, position[0], position[1]);
        }).toList();
        List<GraphEdgeDTO> edges = dependencyRepository.findAll().stream()
                .filter(d -> ids.contains(d.prerequisiteConceptId) && ids.contains(d.dependentConceptId))
                .map(d -> new GraphEdgeDTO("e" + d.prerequisiteConceptId + "-" + d.dependentConceptId,
                        String.valueOf(d.prerequisiteConceptId), String.valueOf(d.dependentConceptId))).toList();
        return new GraphDTO(nodes, edges);
    }

    private int[] positionFor(int order) {
        return switch (order) {
            case 1 -> new int[]{250, 20};
            case 2 -> new int[]{250, 155};
            case 3 -> new int[]{250, 290};
            case 4 -> new int[]{100, 440};
            case 5 -> new int[]{400, 440};
            default -> new int[]{100 + ((order - 1) % 3) * 180, 580 + ((order - 1) / 3) * 130};
        };
    }
}

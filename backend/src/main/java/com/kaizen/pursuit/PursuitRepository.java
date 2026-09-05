package com.kaizen.pursuit;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

public interface PursuitRepository extends JpaRepository<Pursuit, Long> {

    /** Newest first — the order the grid renders in. */
    @EntityGraph(attributePaths = "steps")
    List<Pursuit> findByUserIdAndAreaOrderByCreatedAtDescIdDesc(Long userId, PursuitArea area);

    @EntityGraph(attributePaths = "steps")
    Optional<Pursuit> findByIdAndUserId(Long id, Long userId);

    /** The column collation is case-insensitive, so this is a CI check. */
    boolean existsByUserIdAndAreaAndName(Long userId, PursuitArea area, String name);
}

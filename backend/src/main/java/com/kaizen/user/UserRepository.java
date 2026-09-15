package com.kaizen.user;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {

    /** The column collation is case-insensitive, so this matches on any casing. */
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    /** The one column the auth filter checks on every request, rather than the whole row. */
    @Query("select u.tokenVersion from User u where u.id = :id")
    Optional<Integer> findTokenVersionById(@Param("id") Long id);
}

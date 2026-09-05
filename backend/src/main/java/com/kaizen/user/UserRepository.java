package com.kaizen.user;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    /** The column collation is case-insensitive, so this matches on any casing. */
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}

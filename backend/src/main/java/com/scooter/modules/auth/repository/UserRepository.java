package com.scooter.modules.auth.repository;

import com.scooter.modules.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    // Find user by email for login and duplicate check
    Optional<User> findByEmail(String email);
}
package com.scooter.modules.feedback.repository;

import com.scooter.modules.feedback.entity.Feedback;
import com.scooter.modules.feedback.entity.FeedbackPriority;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<Feedback> findByIdAndUserId(Long id, UUID userId);

    List<Feedback> findByPriorityOrderByCreatedAtDesc(FeedbackPriority priority);
}

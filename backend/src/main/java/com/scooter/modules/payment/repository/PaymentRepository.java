package com.scooter.modules.payment.repository;

import com.scooter.modules.booking.entity.BookingStatus;
import com.scooter.modules.payment.entity.Payment;
import com.scooter.modules.payment.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByPaymentStatusAndPaidAtBetweenOrderByPaidAtAsc(PaymentStatus paymentStatus,
            LocalDateTime start, LocalDateTime end);

    List<Payment> findByPaymentStatusAndBooking_StatusAndBooking_CompletedAtBetweenOrderByBooking_CompletedAtAsc(
            PaymentStatus paymentStatus,
            BookingStatus bookingStatus,
            LocalDateTime start,
            LocalDateTime end);
}

package com.scooter.modules.statistics.service;

import com.scooter.common.exception.BusinessException;
import com.scooter.common.security.SecurityUtils;
import com.scooter.modules.booking.entity.BookingStatus;
import com.scooter.modules.payment.entity.Payment;
import com.scooter.modules.payment.entity.PaymentStatus;
import com.scooter.modules.payment.repository.PaymentRepository;
import com.scooter.modules.statistics.dto.RevenueByHireTypeResponse;
import com.scooter.modules.statistics.dto.DailyRevenueStatisticsResponse;
import com.scooter.modules.statistics.dto.DailyRevenueSummaryResponse;
import com.scooter.modules.statistics.dto.DailyRevenueChartResponse;
import com.scooter.modules.statistics.dto.HireTypeChartSeriesResponse;
import com.scooter.modules.statistics.dto.WeeklyRevenueStatisticsResponse;
import com.scooter.modules.statistics.dto.WeeklyRevenueSummaryResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;

@Service
public class RevenueStatisticsService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Transactional(readOnly = true)
    public WeeklyRevenueStatisticsResponse getWeeklyRevenueStatistics(LocalDate startDate, LocalDate endDate,
            LocalDate weekStart) {
        SecurityUtils.requireManagerRole();
        validateDateRange(startDate, endDate);
        validateWeekStart(startDate, endDate, weekStart);

        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.plusDays(1).atStartOfDay().minusNanos(1);
        List<Payment> payments = paymentRepository.findByPaymentStatusAndBooking_StatusAndBooking_CompletedAtBetweenOrderByBooking_CompletedAtAsc(
                PaymentStatus.SUCCESS, BookingStatus.COMPLETED, startDateTime, endDateTime);

        List<WeeklyRevenueSummaryResponse> summaries = aggregateByWeek(payments);

        WeeklyRevenueStatisticsResponse response = new WeeklyRevenueStatisticsResponse();
        response.setStartDate(startDate.toString());
        response.setEndDate(endDate.toString());
        response.setWeeklyRevenue(summaries);
        response.setTotalRevenue(sumRevenue(summaries).toPlainString());
        response.setTotalPaymentCount(summaries.stream().mapToLong(WeeklyRevenueSummaryResponse::getPaymentCount).sum());
        response.setEmpty(summaries.isEmpty());
        response.setSelectedWeek(resolveSelectedWeek(summaries, weekStart));
        return response;
    }

    @Transactional(readOnly = true)
    public DailyRevenueStatisticsResponse getDailyRevenueStatistics(Integer recentDays, LocalDate startDate,
            LocalDate endDate, LocalDate date) {
        SecurityUtils.requireManagerRole();
        DateQuery dateQuery = resolveDateQuery(recentDays, startDate, endDate);
        validateSelectedDate(dateQuery.startDate(), dateQuery.endDate(), date);

        LocalDateTime startDateTime = dateQuery.startDate().atStartOfDay();
        LocalDateTime endDateTime = dateQuery.endDate().plusDays(1).atStartOfDay().minusNanos(1);
        List<Payment> payments = paymentRepository.findByPaymentStatusAndBooking_StatusAndBooking_CompletedAtBetweenOrderByBooking_CompletedAtAsc(
                PaymentStatus.SUCCESS, BookingStatus.COMPLETED, startDateTime, endDateTime);

        List<DailyRevenueSummaryResponse> summaries = aggregateByDay(payments, dateQuery.startDate(), dateQuery.endDate());

        DailyRevenueStatisticsResponse response = new DailyRevenueStatisticsResponse();
        response.setQueryMode(dateQuery.queryMode());
        response.setRecentDays(dateQuery.recentDays());
        response.setStartDate(dateQuery.startDate().toString());
        response.setEndDate(dateQuery.endDate().toString());
        response.setDailyRevenue(summaries);
        response.setTotalRevenue(sumDailyRevenue(summaries).toPlainString());
        response.setTotalPaymentCount(summaries.stream().mapToLong(DailyRevenueSummaryResponse::getPaymentCount).sum());
        response.setEmpty(response.getTotalPaymentCount() == 0);
        response.setSelectedDate(resolveSelectedDate(summaries, date));
        response.setChart(buildDailyChart(summaries));
        return response;
    }

    private DateQuery resolveDateQuery(Integer recentDays, LocalDate startDate, LocalDate endDate) {
        if (recentDays != null) {
            if (startDate != null || endDate != null) {
                throw new BusinessException("STATISTICS_INVALID_QUERY",
                        "Use either recentDays or startDate/endDate, not both");
            }
            if (recentDays <= 0 || recentDays > 366) {
                throw new BusinessException("STATISTICS_INVALID_QUERY",
                        "recentDays must be between 1 and 366");
            }

            LocalDate resolvedEndDate = LocalDate.now();
            LocalDate resolvedStartDate = resolvedEndDate.minusDays(recentDays - 1L);
            return new DateQuery("RECENT_DAYS", recentDays, resolvedStartDate, resolvedEndDate);
        }

        validateDateRange(startDate, endDate);
        return new DateQuery("DATE_RANGE", null, startDate, endDate);
    }

    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            throw new BusinessException("STATISTICS_INVALID_DATE_RANGE", "Start date and end date are required");
        }
        if (startDate.isAfter(endDate)) {
            throw new BusinessException("STATISTICS_INVALID_DATE_RANGE", "Start date must be on or before end date");
        }
        if (startDate.plusYears(1).isBefore(endDate)) {
            throw new BusinessException("STATISTICS_INVALID_DATE_RANGE", "Date range must not exceed 1 year");
        }
    }

    private void validateWeekStart(LocalDate startDate, LocalDate endDate, LocalDate weekStart) {
        if (weekStart != null) {
            LocalDate normalizedWeekStart = normalizeToWeekStart(weekStart);
            if (!normalizedWeekStart.equals(weekStart)) {
                throw new BusinessException("STATISTICS_INVALID_WEEK",
                        "Week start must be a Monday in YYYY-MM-DD format");
            }
            if (weekStart.isBefore(startDate) || weekStart.isAfter(endDate)) {
                throw new BusinessException("STATISTICS_INVALID_WEEK",
                        "Week start must fall within the requested date range");
            }
        }
    }

    private void validateSelectedDate(LocalDate startDate, LocalDate endDate, LocalDate date) {
        if (date != null && (date.isBefore(startDate) || date.isAfter(endDate))) {
            throw new BusinessException("STATISTICS_INVALID_DATE",
                    "Selected date must fall within the requested date range");
        }
    }

    private List<WeeklyRevenueSummaryResponse> aggregateByWeek(List<Payment> payments) {
        Map<LocalDate, List<Payment>> byWeek = new LinkedHashMap<>();
        for (Payment payment : payments) {
            LocalDate weekStart = normalizeToWeekStart(payment.getPaidAt().toLocalDate());
            byWeek.computeIfAbsent(weekStart, key -> new ArrayList<>()).add(payment);
        }

        return byWeek.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> toWeeklySummary(entry.getKey(), entry.getValue()))
                .toList();
    }

    private List<DailyRevenueSummaryResponse> aggregateByDay(List<Payment> payments, LocalDate startDate, LocalDate endDate) {
        Map<LocalDate, List<Payment>> byDay = new LinkedHashMap<>();
        for (Payment payment : payments) {
            LocalDate date = payment.getPaidAt().toLocalDate();
            byDay.computeIfAbsent(date, key -> new ArrayList<>()).add(payment);
        }

        List<DailyRevenueSummaryResponse> summaries = new ArrayList<>();
        long days = ChronoUnit.DAYS.between(startDate, endDate);
        for (long index = 0; index <= days; index++) {
            LocalDate currentDate = startDate.plusDays(index);
            List<Payment> currentPayments = byDay.getOrDefault(currentDate, List.of());
            summaries.add(toDailySummary(currentDate, currentPayments));
        }
        return summaries;
    }

    private WeeklyRevenueSummaryResponse toWeeklySummary(LocalDate weekStart, List<Payment> payments) {
        WeeklyRevenueSummaryResponse summary = new WeeklyRevenueSummaryResponse();
        summary.setWeekStart(weekStart.toString());
        summary.setWeekEnd(weekStart.plusDays(6).toString());
        summary.setTotalRevenue(payments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .toPlainString());
        summary.setPaymentCount((long) payments.size());
        summary.setRevenueByHireType(groupByHireType(payments));
        return summary;
    }

    private DailyRevenueSummaryResponse toDailySummary(LocalDate date, List<Payment> payments) {
        DailyRevenueSummaryResponse summary = new DailyRevenueSummaryResponse();
        summary.setDate(date.toString());
        summary.setTotalRevenue(payments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .toPlainString());
        summary.setPaymentCount((long) payments.size());
        summary.setRevenueByHireType(groupByHireType(payments));
        return summary;
    }

    private DailyRevenueChartResponse buildDailyChart(List<DailyRevenueSummaryResponse> summaries) {
        DailyRevenueChartResponse chart = new DailyRevenueChartResponse();
        chart.setLabels(summaries.stream().map(DailyRevenueSummaryResponse::getDate).toList());
        chart.setRevenueSeries(summaries.stream().map(DailyRevenueSummaryResponse::getTotalRevenue).toList());
        chart.setPaymentCountSeries(summaries.stream().map(DailyRevenueSummaryResponse::getPaymentCount).toList());

        TreeSet<String> hireTypes = new TreeSet<>();
        for (DailyRevenueSummaryResponse summary : summaries) {
            for (RevenueByHireTypeResponse item : summary.getRevenueByHireType()) {
                hireTypes.add(item.getHireType());
            }
        }

        List<HireTypeChartSeriesResponse> hireTypeSeries = new ArrayList<>();
        for (String hireType : hireTypes) {
            List<String> revenueSeries = new ArrayList<>();
            for (DailyRevenueSummaryResponse summary : summaries) {
                String revenue = summary.getRevenueByHireType().stream()
                        .filter(item -> hireType.equals(item.getHireType()))
                        .map(RevenueByHireTypeResponse::getRevenue)
                        .findFirst()
                        .orElse(BigDecimal.ZERO.toPlainString());
                revenueSeries.add(revenue);
            }
            hireTypeSeries.add(new HireTypeChartSeriesResponse(hireType, revenueSeries));
        }
        chart.setHireTypeSeries(hireTypeSeries);
        return chart;
    }

    private List<RevenueByHireTypeResponse> groupByHireType(List<Payment> payments) {
        Map<String, List<Payment>> byHireType = new LinkedHashMap<>();
        for (Payment payment : payments) {
            String hireType = payment.getBooking().getRentalOption().getDurationLabel();
            byHireType.computeIfAbsent(hireType, key -> new ArrayList<>()).add(payment);
        }

        return byHireType.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> new RevenueByHireTypeResponse(
                        entry.getKey(),
                        entry.getValue().stream().map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add)
                                .toPlainString(),
                        (long) entry.getValue().size()))
                .toList();
    }

    private WeeklyRevenueSummaryResponse resolveSelectedWeek(List<WeeklyRevenueSummaryResponse> summaries,
            LocalDate weekStart) {
        if (weekStart == null) {
            return null;
        }
        return summaries.stream()
                .filter(summary -> summary.getWeekStart().equals(weekStart.toString()))
                .findFirst()
                .orElseGet(() -> {
                    WeeklyRevenueSummaryResponse emptySummary = new WeeklyRevenueSummaryResponse();
                    emptySummary.setWeekStart(weekStart.toString());
                    emptySummary.setWeekEnd(weekStart.plusDays(6).toString());
                    emptySummary.setTotalRevenue(BigDecimal.ZERO.toPlainString());
                    emptySummary.setPaymentCount(0L);
                    emptySummary.setRevenueByHireType(List.of());
                    return emptySummary;
                });
    }

    private LocalDate normalizeToWeekStart(LocalDate date) {
        return date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    private BigDecimal sumRevenue(List<WeeklyRevenueSummaryResponse> summaries) {
        return summaries.stream()
                .map(summary -> new BigDecimal(summary.getTotalRevenue()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal sumDailyRevenue(List<DailyRevenueSummaryResponse> summaries) {
        return summaries.stream()
                .map(summary -> new BigDecimal(summary.getTotalRevenue()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private DailyRevenueSummaryResponse resolveSelectedDate(List<DailyRevenueSummaryResponse> summaries, LocalDate date) {
        if (date == null) {
            return null;
        }
        return summaries.stream()
                .filter(summary -> summary.getDate().equals(date.toString()))
                .findFirst()
                .orElseGet(() -> {
                    DailyRevenueSummaryResponse emptySummary = new DailyRevenueSummaryResponse();
                    emptySummary.setDate(date.toString());
                    emptySummary.setTotalRevenue(BigDecimal.ZERO.toPlainString());
                    emptySummary.setPaymentCount(0L);
                    emptySummary.setRevenueByHireType(List.of());
                    return emptySummary;
                });
    }

    private record DateQuery(String queryMode, Integer recentDays, LocalDate startDate, LocalDate endDate) {
    }
}

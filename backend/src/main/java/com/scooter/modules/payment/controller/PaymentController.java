@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {
    @Autowired
    private BookingService bookingService;

    @PostMapping
    public Result<BookingConfirmation> createPayment(@RequestBody PaymentRequest request) {
        return Result.success(bookingService.processPayment(request));
    }
}
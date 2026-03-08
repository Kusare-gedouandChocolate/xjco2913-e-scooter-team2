@Entity
@Data
public class RentalOption {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String durationLabel; // "1h", "4h", "1day", "1week"
    private Integer durationHours;
    private BigDecimal price;
}
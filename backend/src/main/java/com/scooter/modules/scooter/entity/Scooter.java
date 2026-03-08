@Entity
@Data
public class Scooter {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String modelName;
    private String serialNumber;

    @Enumerated(EnumType.STRING)
    private ScooterStatus status; // AVAILABLE, IN_USE, MAINTENANCE

    private Double batteryLevel;
    private String location;
}
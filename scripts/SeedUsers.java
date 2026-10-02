import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;

public class SeedUsers {
    public static void main(String[] args) throws Exception {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);

        String adminHash = encoder.encode("admin123");
        String techHash = encoder.encode("tech123");
        String studentHash = encoder.encode("student123");
        String staffHash = encoder.encode("staff123");

        System.out.println("admin123: " + adminHash);
        System.out.println("tech123: " + techHash);
        System.out.println("student123: " + studentHash);

        try (Connection conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/bidtobid", "nav", "navdiv123")) {
            // 1. admin@campus.edu
            upsertUser(conn, "Campus Admin", "admin@campus.edu", adminHash, "ADMIN", "Facilities Management");

            // 2. tech1@campus.edu
            upsertUser(conn, "Sam Tech (Electrical)", "tech1@campus.edu", techHash, "TECHNICIAN", "Electrical Maintenance");

            // 3. tech2@campus.edu
            upsertUser(conn, "Jordan Tech (Plumbing)", "tech2@campus.edu", techHash, "TECHNICIAN", "Plumbing & Civil Works");

            // 4. student1@campus.edu
            upsertUser(conn, "Alex Student", "student1@campus.edu", studentHash, "STUDENT", "Computer Science Dept");

            // 5. student.alex@campus.edu (also update this for any legacy links)
            upsertUser(conn, "Alex Johnson", "student.alex@campus.edu", studentHash, "STUDENT", "Computer Science Dept");

            // 6. staff1@campus.edu
            upsertUser(conn, "Faculty Staff", "staff1@campus.edu", staffHash, "STAFF", "Academic Affairs");

            System.out.println("ALL_USERS_UPSERTED_SUCCESSFULLY");
        }
    }

    private static void upsertUser(Connection conn, String name, String email, String hash, String role, String dept) throws Exception {
        String sql = "INSERT INTO users (name, email, password_hash, role, department, active) " +
                     "VALUES (?, ?, ?, ?, ?, true) " +
                     "ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash), role = VALUES(role), department = VALUES(department), active = true";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, name);
            ps.setString(2, email);
            ps.setString(3, hash);
            ps.setString(4, role);
            ps.setString(5, dept);
            ps.executeUpdate();
            System.out.println("Upserted: " + email + " (" + role + ")");
        }
    }
}

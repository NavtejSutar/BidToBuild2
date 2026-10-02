package edu.campus.maintenance.auth;

import edu.campus.maintenance.auth.dto.AuthResponse;
import edu.campus.maintenance.auth.dto.LoginRequest;
import edu.campus.maintenance.auth.dto.RefreshTokenRequest;
import edu.campus.maintenance.auth.dto.RegisterRequest;
import edu.campus.maintenance.common.exceptions.BadRequestException;
import edu.campus.maintenance.common.exceptions.UnauthorizedException;
import edu.campus.maintenance.user.Role;
import edu.campus.maintenance.user.User;
import edu.campus.maintenance.user.UserRepository;
import edu.campus.maintenance.user.dto.UserDto;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final RateLimiterService rateLimiterService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        rateLimiterService.checkRateLimit("reg:" + email, 5, 60);

        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email already registered: " + email);
        }

        Role role = request.getRole() != null ? request.getRole() : Role.USER;
        // Self-registration can only register as USER or TECHNICIAN, not ADMIN
        if (role == Role.ADMIN) {
            role = Role.USER;
        }

        User user = User.builder()
                .name(request.getName().trim())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .department(request.getDepartment() != null ? request.getDepartment().trim() : null)
                .active(true)
                .build();

        user = userRepository.save(user);
        UserPrincipal principal = UserPrincipal.create(user);

        return AuthResponse.builder()
                .accessToken(tokenProvider.generateAccessToken(principal))
                .refreshToken(tokenProvider.generateRefreshToken(principal))
                .expiresIn(tokenProvider.getAccessTokenExpirationSeconds())
                .user(UserDto.from(user))
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request, String clientIp) {
        String email = request.getEmail().toLowerCase().trim();
        rateLimiterService.checkRateLimit("login:" + clientIp, 10, 60);
        rateLimiterService.checkRateLimit("login_user:" + email, 5, 60);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!user.isActive()) {
            throw new UnauthorizedException("Account is disabled. Please contact administrator.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        UserPrincipal principal = UserPrincipal.create(user);

        return AuthResponse.builder()
                .accessToken(tokenProvider.generateAccessToken(principal))
                .refreshToken(tokenProvider.generateRefreshToken(principal))
                .expiresIn(tokenProvider.getAccessTokenExpirationSeconds())
                .user(UserDto.from(user))
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        String email = tokenProvider.getEmailFromToken(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        if (!user.isActive()) {
            throw new UnauthorizedException("Account is disabled");
        }

        UserPrincipal principal = UserPrincipal.create(user);

        return AuthResponse.builder()
                .accessToken(tokenProvider.generateAccessToken(principal))
                .refreshToken(tokenProvider.generateRefreshToken(principal)) // Token rotation
                .expiresIn(tokenProvider.getAccessTokenExpirationSeconds())
                .user(UserDto.from(user))
                .build();
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
        return UserDto.from(user);
    }
}

package edu.campus.maintenance.auth;

import edu.campus.maintenance.auth.dto.AuthResponse;
import edu.campus.maintenance.auth.dto.LoginRequest;
import edu.campus.maintenance.auth.dto.RegisterRequest;
import edu.campus.maintenance.common.exceptions.BadRequestException;
import edu.campus.maintenance.common.exceptions.UnauthorizedException;
import edu.campus.maintenance.user.Role;
import edu.campus.maintenance.user.User;
import edu.campus.maintenance.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private RateLimiterService rateLimiterService;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .name("Alex Student")
                .email("alex@campus.edu")
                .passwordHash("hashed_password")
                .role(Role.USER)
                .active(true)
                .build();
    }

    @Test
    @DisplayName("Should successfully register a new user")
    void register_success() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Alex Student");
        request.setEmail("alex@campus.edu");
        request.setPassword("Password@123");
        request.setRole(Role.USER);

        when(userRepository.existsByEmail("alex@campus.edu")).thenReturn(false);
        when(passwordEncoder.encode("Password@123")).thenReturn("hashed_password");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(tokenProvider.generateAccessToken(any(UserPrincipal.class))).thenReturn("access_token");
        when(tokenProvider.generateRefreshToken(any(UserPrincipal.class))).thenReturn("refresh_token");
        when(tokenProvider.getAccessTokenExpirationSeconds()).thenReturn(900L);

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("access_token", response.getAccessToken());
        assertEquals("refresh_token", response.getRefreshToken());
        assertEquals("alex@campus.edu", response.getUser().getEmail());
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw BadRequestException if email already registered")
    void register_duplicateEmail_throwsBadRequest() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Alex Student");
        request.setEmail("alex@campus.edu");
        request.setPassword("Password@123");

        when(userRepository.existsByEmail("alex@campus.edu")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should successfully authenticate valid credentials")
    void login_success() {
        LoginRequest request = new LoginRequest();
        request.setEmail("alex@campus.edu");
        request.setPassword("Password@123");

        when(userRepository.findByEmail("alex@campus.edu")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("Password@123", "hashed_password")).thenReturn(true);
        when(tokenProvider.generateAccessToken(any(UserPrincipal.class))).thenReturn("access_token");
        when(tokenProvider.generateRefreshToken(any(UserPrincipal.class))).thenReturn("refresh_token");

        AuthResponse response = authService.login(request, "127.0.0.1");

        assertNotNull(response);
        assertEquals("access_token", response.getAccessToken());
        verify(userRepository).findByEmail("alex@campus.edu");
    }

    @Test
    @DisplayName("Should throw UnauthorizedException for bad password")
    void login_badPassword_throwsUnauthorized() {
        LoginRequest request = new LoginRequest();
        request.setEmail("alex@campus.edu");
        request.setPassword("WrongPassword");

        when(userRepository.findByEmail("alex@campus.edu")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("WrongPassword", "hashed_password")).thenReturn(false);

        assertThrows(UnauthorizedException.class, () -> authService.login(request, "127.0.0.1"));
    }

    @Test
    @DisplayName("Should throw UnauthorizedException for disabled user")
    void login_disabledUser_throwsUnauthorized() {
        sampleUser.setActive(false);
        LoginRequest request = new LoginRequest();
        request.setEmail("alex@campus.edu");
        request.setPassword("Password@123");

        when(userRepository.findByEmail("alex@campus.edu")).thenReturn(Optional.of(sampleUser));

        assertThrows(UnauthorizedException.class, () -> authService.login(request, "127.0.0.1"));
    }
}

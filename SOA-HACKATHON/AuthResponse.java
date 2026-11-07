package com.soa.team17.auth.dto;

public class AuthResponse {
    private String token;
    private String tokenType = "Bearer";
    private long expiresInSeconds;
    private UserDto user;

    public AuthResponse() {}
    public AuthResponse(String token, long expiresInSeconds, UserDto user) {
        this.token = token;
        this.expiresInSeconds = expiresInSeconds;
        this.user = user;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }

    public long getExpiresInSeconds() { return expiresInSeconds; }
    public void setExpiresInSeconds(long expiresInSeconds) { this.expiresInSeconds = expiresInSeconds; }

    public UserDto getUser() { return user; }
    public void setUser(UserDto user) { this.user = user; }

    public static class UserDto {
        private String id;
        private String username;
        private String email;
        private String role;
        private String organization;

        public UserDto() {}
        public UserDto(String id, String username, String email, String role, String organization) {
            this.id = id;
            this.username = username;
            this.email = email;
            this.role = role;
            this.organization = organization;
        }

        public String getId() { return id; }
        public String getUsername() { return username; }
        public String getEmail() { return email; }
        public String getRole() { return role; }
        public String getOrganization() { return organization; }
    }
}

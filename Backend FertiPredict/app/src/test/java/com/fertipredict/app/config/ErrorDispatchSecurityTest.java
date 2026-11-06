package com.fertipredict.app.config;

import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.*;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.mock.web.MockServletContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.bind.annotation.*;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.mockito.Mockito.*;

class ErrorDispatchSecurityTest {
    @Configuration @EnableWebMvc @Import(SecurityConfig.class)
    static class Config {
        @Bean org.springframework.security.authentication.AuthenticationProvider provider() {
            return mock(org.springframework.security.authentication.AuthenticationProvider.class);
        }
        @Bean com.fertipredict.app.Jwt.JwtAuthenticationFilter jwtFilter() {
            return new com.fertipredict.app.Jwt.JwtAuthenticationFilter(new com.fertipredict.app.Jwt.JwtService(),
                username -> { throw new org.springframework.security.core.userdetails.UsernameNotFoundException("test"); });
        }
        @Bean Errors errors() { return new Errors(); }
    }
    @RestController static class Errors {
        @GetMapping("/error") org.springframework.http.ResponseEntity<Void> error() {
            return org.springframework.http.ResponseEntity.internalServerError().build();
        }
    }
    @Test void internalErrorDispatchPreserves500ButNormalRequestsRequireLogin() throws Exception {
        try (var context = new AnnotationConfigWebApplicationContext()) {
            context.setServletContext(new MockServletContext()); context.register(Config.class); context.refresh();
            var mvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(context.getBean("springSecurityFilterChain", jakarta.servlet.Filter.class)).build();
            mvc.perform(get("/error").with(request -> { request.setDispatcherType(jakarta.servlet.DispatcherType.ERROR); return request; })).andExpect(status().isInternalServerError());
            mvc.perform(get("/error")).andExpect(status().isUnauthorized());
            mvc.perform(get("/api/v1/prediction")).andExpect(status().isUnauthorized());
        }
    }
}

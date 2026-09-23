package com.fertipredict.app.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

/** HTTPS delivery for deployments where outbound SMTP is unavailable. */
@Configuration
@ConditionalOnProperty(name = "app.mail.provider", havingValue = "resend")
public class ResendMailConfig {
    @Bean
    JavaMailSender resendMailSender(@Value("${app.mail.resend-api-key:}") String apiKey) {
        if (apiKey.isBlank()) throw new IllegalStateException("Configure RESEND_API_KEY when MAIL_PROVIDER=resend");
        return new ResendSender(apiKey, HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build());
    }

    static class ResendSender extends JavaMailSenderImpl {
        private final String apiKey;
        private final HttpClient client;
        private final ObjectMapper json = new ObjectMapper();
        ResendSender(String apiKey, HttpClient client) { this.apiKey = apiKey; this.client = client; }
        @Override public void send(SimpleMailMessage message) {
            try {
                String body = json.writeValueAsString(Map.of("from", message.getFrom(), "to", message.getTo(),
                    "subject", message.getSubject(), "text", message.getText()));
                var request = HttpRequest.newBuilder(URI.create("https://api.resend.com/emails"))
                    .timeout(Duration.ofSeconds(20)).header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body)).build();
                var response = client.send(request, HttpResponse.BodyHandlers.discarding());
                if (response.statusCode() < 200 || response.statusCode() >= 300)
                    throw new MailSendException("Email provider rejected delivery (HTTP " + response.statusCode() + ")");
            } catch (InterruptedException error) {
                Thread.currentThread().interrupt();
                throw new MailSendException("Email delivery interrupted");
            } catch (java.io.IOException error) {
                // Never include the payload, recipient, reset link or authorization header.
                throw new MailSendException("Email provider connection failed");
            }
        }
        @Override public void send(SimpleMailMessage... messages) {
            for (var message : messages) send(message);
        }
    }
}

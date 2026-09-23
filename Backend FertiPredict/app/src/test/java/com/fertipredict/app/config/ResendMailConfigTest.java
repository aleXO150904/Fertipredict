package com.fertipredict.app.config;

import java.net.http.*;
import java.io.IOException;
import org.junit.jupiter.api.Test;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.MailSendException;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ResendMailConfigTest {
    SimpleMailMessage message() {
        var message = new SimpleMailMessage();
        message.setFrom("sender@example.com"); message.setTo("recipient@example.com");
        message.setSubject("Recovery"); message.setText("Test only");
        return message;
    }
    @Test void missingKeyFailsConfiguration() {
        assertThrows(IllegalStateException.class, () -> new ResendMailConfig().resendMailSender(""));
    }
    @Test void sendsOverHttpsAndRejectsProviderErrors() throws Exception {
        HttpClient client = mock(HttpClient.class);
        @SuppressWarnings("unchecked") HttpResponse<Object> response = mock(HttpResponse.class);
        when(client.send(any(HttpRequest.class), org.mockito.ArgumentMatchers.<HttpResponse.BodyHandler<Object>>any())).thenReturn(response);
        when(response.statusCode()).thenReturn(200, 403);
        var sender = new ResendMailConfig.ResendSender("test-key", client);
        assertDoesNotThrow(() -> sender.send(message()));
        assertThrows(MailSendException.class, () -> sender.send(message()));
        var requests = org.mockito.ArgumentCaptor.forClass(HttpRequest.class);
        verify(client, times(2)).send(requests.capture(), any());
        assertEquals("https://api.resend.com/emails", requests.getValue().uri().toString());
        assertEquals("POST", requests.getValue().method());
    }
    @Test void networkFailureDoesNotExposeSecrets() throws Exception {
        HttpClient client = mock(HttpClient.class);
        when(client.send(any(), any())).thenThrow(new IOException("private details"));
        var sender = new ResendMailConfig.ResendSender("test-key", client);
        var error = assertThrows(MailSendException.class, () -> sender.send(message()));
        assertFalse(error.toString().contains("private details"));
    }
}

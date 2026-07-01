package com.fertipredict.app.User;

import org.springframework.stereotype.Service;

import org.springframework.security.crypto.password.PasswordEncoder;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponse updateUser(UserRequest userRequest) {
        String username = (String) org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        user.setNames(userRequest.names);
        user.setLastnames(userRequest.lastnames);
        
        if (userRequest.username != null && !userRequest.username.trim().isEmpty()) {
            user.setUsername(userRequest.username);
        }
        
        if (userRequest.password != null && !userRequest.password.trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(userRequest.password));
        }
        
        userRepository.save(user);

        return new UserResponse("Se actualizó la información del usuario satisfactoriamente...");
    }

    public UserDTO getUser(Long id) {
        User user = userRepository.findById(id).orElse(null);

        if (user!=null){
            UserDTO userDTO = UserDTO.builder()
            .id(user.id)
            .username(user.username)
            .names(user.names)
            .lastnames(user.lastnames)
            .build();
            return userDTO;
        }
        return null;
    }

    public UserDTO getMe() {
        String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findByUsername(username).orElse(null);
        if (user != null) {
            return UserDTO.builder()
                .id(user.id)
                .username(user.username)
                .names(user.names)
                .lastnames(user.lastnames)
                .build();
        }
        return null;
    }
}

package com.fertipredict.app.User;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long>{
    Optional<User> findByUsername(String username);

    @Modifying
    @Query(value = "update users u set u.names = :names, u.lastnames = :lastnames where u.id = :id", nativeQuery = true)
    void updateUser(
        @Param(value = "id") Long id, 
        @Param(value = "names") String names, 
        @Param(value = "lastnames") String lastnames
    );

}

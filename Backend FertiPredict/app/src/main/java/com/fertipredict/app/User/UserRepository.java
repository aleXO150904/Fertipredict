package com.fertipredict.app.User;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long>{
    @org.springframework.transaction.annotation.Transactional
    @Modifying
    @Query("update User u set u.lastLoginAt = :at where u.id = :id and (u.lastLoginAt is null or u.lastLoginAt < :at)")
    int recordLogin(@Param("id") Long id, @Param("at") java.time.Instant at);
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u order by u.id")
    java.util.List<User> lockAccounts();
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.id = :id")
    Optional<User> lockById(@Param("id") Long id);
    @Query("select count(p) > 0 from Prediction p where p.user.id = :id")
    boolean hasPredictions(@Param("id") Long id);
    Optional<User> findByUsername(String username);
    boolean existsByUsernameIgnoreCase(String username);
    boolean existsByUsernameIgnoreCaseAndIdNot(String username, Long id);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.username = :username")
    Optional<User> lockByUsername(@Param("username") String username);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.resetTokenHash = :hash")
    Optional<User> lockByResetTokenHash(@Param("hash") String hash);

    @Modifying
    @Query(value = "update users u set u.names = :names, u.lastnames = :lastnames where u.id = :id", nativeQuery = true)
    void updateUser(
        @Param(value = "id") Long id, 
        @Param(value = "names") String names, 
        @Param(value = "lastnames") String lastnames
    );

}

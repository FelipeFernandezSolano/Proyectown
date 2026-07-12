package com.importsmart;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ImportSmartApplication {
    public static void main(String[] args) {
        SpringApplication.run(ImportSmartApplication.class, args);
    }
}

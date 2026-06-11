package com.amith.taskmanager.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.regex.Pattern;

public class PasswordValidator implements ConstraintValidator<ValidPassword, String> {

    private static final int MIN_LENGTH = 8;
    private static final int MAX_LENGTH = 128;
    private static final Pattern UPPERCASE_PATTERN = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE_PATTERN = Pattern.compile("[a-z]");
    private static final Pattern DIGIT_PATTERN = Pattern.compile("[0-9]");
    private static final Pattern SPECIAL_CHAR_PATTERN = Pattern.compile("[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]");

    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        if (password == null || password.isEmpty()) {
            return false;
        }

        if (password.length() < MIN_LENGTH || password.length() > MAX_LENGTH) {
            buildErrorMessage(context, "Password must be between " + MIN_LENGTH + " and " + MAX_LENGTH + " characters");
            return false;
        }

        if (!UPPERCASE_PATTERN.matcher(password).find()) {
            buildErrorMessage(context, "Password must contain at least one uppercase letter");
            return false;
        }

        if (!LOWERCASE_PATTERN.matcher(password).find()) {
            buildErrorMessage(context, "Password must contain at least one lowercase letter");
            return false;
        }

        if (!DIGIT_PATTERN.matcher(password).find()) {
            buildErrorMessage(context, "Password must contain at least one digit");
            return false;
        }

        if (!SPECIAL_CHAR_PATTERN.matcher(password).find()) {
            buildErrorMessage(context, "Password must contain at least one special character");
            return false;
        }

        return true;
    }

    private void buildErrorMessage(ConstraintValidatorContext context, String message) {
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(message).addConstraintViolation();
    }
}

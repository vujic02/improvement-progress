package com.kaizen.user;

import java.util.Arrays;
import java.util.Locale;
import java.util.stream.Collectors;

/**
 * The currencies money goals can be shown in. A closed list on purpose: each
 * one has been looked at on the savings cards, and the frontend mirrors it in
 * `CURRENCIES`.
 *
 * <p>Switching relabels the numbers, it never converts them — 500 stays 500.
 * There are no exchange rates anywhere in the app.
 */
public enum Currency {
    EUR, USD, GBP, CHF, RSD;

    /** Every account starts here, and so did every account before the column existed. */
    public static final Currency DEFAULT = EUR;

    /** Reads an ISO code, ignoring case and surrounding space; refuses anything off the list. */
    public static Currency from(String code) {
        if (code != null) {
            String wanted = code.trim().toUpperCase(Locale.ROOT);
            for (Currency currency : values()) {
                if (currency.name().equals(wanted)) {
                    return currency;
                }
            }
        }
        throw new IllegalArgumentException("Pick one of " + codes() + ".");
    }

    /** "EUR, USD, GBP, CHF, RSD" — for the error that names what is allowed. */
    public static String codes() {
        return Arrays.stream(values()).map(Enum::name).collect(Collectors.joining(", "));
    }
}

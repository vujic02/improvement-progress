package com.kaizen.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

import com.kaizen.pursuit.PursuitArea;

/**
 * Spring's default enum binding is {@code valueOf}, which only matches the
 * uppercase constant. The area arrives as a query parameter written the way the
 * API writes it - "savings", not "SAVINGS" - so it needs this.
 */
@Component
public class PursuitAreaConverter implements Converter<String, PursuitArea> {

    @Override
    public PursuitArea convert(String source) {
        return PursuitArea.from(source);
    }
}

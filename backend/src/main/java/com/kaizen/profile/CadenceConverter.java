package com.kaizen.profile;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Keeps the column lowercase, matching what the API and the client use. */
@Converter(autoApply = true)
public class CadenceConverter implements AttributeConverter<Cadence, String> {

    @Override
    public String convertToDatabaseColumn(Cadence cadence) {
        return cadence == null ? null : cadence.wire();
    }

    @Override
    public Cadence convertToEntityAttribute(String value) {
        return value == null ? null : Cadence.from(value);
    }
}

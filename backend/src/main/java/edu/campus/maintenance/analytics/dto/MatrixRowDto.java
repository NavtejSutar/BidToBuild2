package edu.campus.maintenance.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatrixRowDto {
    private String status;
    private long critical;
    private long high;
    private long medium;
    private long low;
    private long total;
}

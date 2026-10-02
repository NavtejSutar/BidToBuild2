package edu.campus.maintenance.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatusPriorityMatrixDto {
    private List<MatrixRowDto> rows;
    private Map<String, Long> columnTotals;
    private long grandTotal;
}

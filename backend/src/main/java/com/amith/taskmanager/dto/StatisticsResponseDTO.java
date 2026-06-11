package com.amith.taskmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatisticsResponseDTO {
    private long total;
    private long todo;
    private long inProgress;
    private long done;
}
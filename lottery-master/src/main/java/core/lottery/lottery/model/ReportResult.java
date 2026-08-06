package core.lottery.lottery.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;


@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ReportResult {

    private String target;
    private List<ReportData> data;
    private Integer max_count;
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class ReportData {
        private List<String> collection;
        private Integer count;
        private Integer miss;
        private Integer day_1;
        private Integer day_2;
        private Integer day_3;
        private List<DataByNumber> data_by_number;
        private List<DataByDate> data_by_date;

    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class DataByNumber {
        private String number;
        private Integer day_1;
        private Integer day_2;
        private Integer day_3;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class DataByDate {
        private String date;
        private Integer day_1;
        private Integer day_2;
        private Integer day_3;
    }
}

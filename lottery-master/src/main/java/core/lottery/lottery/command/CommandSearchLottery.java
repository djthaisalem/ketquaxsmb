package core.lottery.lottery.command;

import core.utils.common.models.Range;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CommandSearchLottery implements Serializable {
    // common
    private String user_id;
    private String user_name;
    @Builder.Default
    private List<String> return_fields = new ArrayList<>();
    private String keyword;
    private List<String> types;
    @Builder.Default
    private Integer page = 1;
    @Builder.Default
    private Integer size = 15;
    private Range range;
    private List<String> numbers;
    private String number;


    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class Price {
        private String price;
        private String number;
    }
}

package core.lottery.lottery.command;

import core.utils.common.models.Range;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CommandReport implements Serializable {
    private Range range;
    private List<CommandSearchLottery.Price> prices;
    private String frequency;
    private String miss;
    private Integer combine_amount;
    private Limitation limitation;


    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class Limitation implements Serializable {
        private Integer miss;
        private Integer count;
        private Integer num_collection;
        private Integer num_result;
        private Boolean two_day_frame;
    }

}

package core.lottery.lottery.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;


@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CommandCrawlResult {
    private List<String> ĐB;
    private List<String> G1;
    private List<String> G2;
    private List<String> G3;
    private List<String> G4;
    private List<String> G5;
    private List<String> G6;
    private List<String> G7;
}

package core.lottery.lottery.command;

import core.lottery.lottery.model.Appearance;
import core.lottery.lottery.model.AppearanceCount;
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
public class CommandCalculateReport implements Serializable {
    private String target;
    private List<Appearance> appearances;
    private List<AppearanceCount> total_count;
}

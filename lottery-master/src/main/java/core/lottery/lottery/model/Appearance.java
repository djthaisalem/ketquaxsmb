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
public class Appearance {
    private String date;
    private List<AppearanceCount> day_1;
    private List<AppearanceCount> day_2;
    private List<AppearanceCount> day_3;
}

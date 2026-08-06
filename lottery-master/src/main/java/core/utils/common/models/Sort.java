package core.utils.common.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Sort implements Serializable {
    private String field;
    @Builder.Default
    private Boolean is_asc = false;
}

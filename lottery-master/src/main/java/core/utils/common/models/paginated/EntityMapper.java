package core.utils.common.models.paginated;

/**
 * Mapper which map a domain entity to something else such as DTO
 */
public interface EntityMapper<D, E> {
    D map(E entity);
    void map(E gift, D dto);
}

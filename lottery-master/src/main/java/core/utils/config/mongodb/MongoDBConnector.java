package core.utils.config.mongodb;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.ReadConcern;
import com.mongodb.ReadConcernLevel;
import com.mongodb.bulk.BulkWriteResult;
import com.mongodb.client.*;
import com.mongodb.client.model.*;
import com.mongodb.client.result.DeleteResult;
import com.mongodb.client.result.UpdateResult;
import core.utils.common.enumeration.CommonConstant;
import core.utils.common.helpers.CommonUtils;
import core.utils.common.helpers.DateTimeUtils;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.bson.types.ObjectId;
import org.mongojack.JacksonCodecRegistry;
import org.springframework.util.CollectionUtils;

import javax.validation.constraints.NotEmpty;
import java.util.*;


/**
 * @param <ORMClass>
 */
public class MongoDBConnector<ORMClass> implements MongoDBOperator<ORMClass> {

    private final MongoCollection<ORMClass> _collection;

    public MongoDBConnector(String connectionUrl, String dbName, String collection, Class<ORMClass> ormClass) {

        ConnectionString connection_string = new ConnectionString(connectionUrl);
        MongoClientSettings settings = MongoClientSettings.builder()
                .applyConnectionString(connection_string)
                .build();
        MongoClient mongoClient = MongoClients.create(settings);

        ObjectMapper objectMapper = new ObjectMapper();
        JacksonCodecRegistry jacksonCodecRegistry = new JacksonCodecRegistry(objectMapper);
        jacksonCodecRegistry.addCodecForClass(ormClass);
        MongoDatabase mongoDatabase = mongoClient.getDatabase(dbName).withCodecRegistry(jacksonCodecRegistry);
        _collection = mongoDatabase.getCollection(collection, ormClass);
    }

    @Override
    public ORMClass find(Document query, Document sort, Document projection) {
        return _collection.find(query).sort(sort).first();
    }

    @Override
    public ORMClass findWithConcern(Document query, Document sort, Document projection) {
        ReadConcern readConcern = new ReadConcern(ReadConcernLevel.MAJORITY);
        _collection.withReadConcern(readConcern).find(query).first();
        return _collection.find(query).sort(sort).first();
    }

    @Override
    public ORMClass find(Bson query, Document sort, Document projection) {
        return _collection.find(query).sort(sort).first();
    }

    @Override
    public ORMClass findOneWithProjection(Bson query, Document sort, Document projection) {
        return _collection.find(query).sort(sort).projection(projection).first();
    }

    @Override
    public List<ORMClass> findMany(Document query, Bson sort, Document projection, int skips, int limit) {
        return _collection.find(query).sort(sort).projection(projection).skip(skips).limit(limit).into(new ArrayList<>());
    }

    @Override
    public List<ORMClass> findManyCollation(Document query, Bson sort, Document projection, int skips, int limit) {
        return _collection.find(query).collation(Collation.builder().locale("en").build()).sort(sort).projection(projection)
                .skip(skips).limit(limit).into(new ArrayList<>());
    }

    @Override
    public FindIterable<Document> findManyV3(Document query, Bson sort, Document projection, int skips, int limit) {
        return _collection.find(query, Document.class).sort(sort).projection(projection).skip(skips).limit(limit);
    }

    @Override
    public List<ORMClass> findAll(Document query, Bson sort, Document projection) {
        return _collection.find(query).sort(sort).projection(projection).into(new ArrayList<>());
    }

    @Override
    public Long count(Document query) {
        return _collection.countDocuments(query);
    }

    @Override
    public Long count(Bson query) {
        return _collection.countDocuments(query);
    }

    @Override
    public ORMClass findOneAndUpdate(@NotEmpty Document query, @NotEmpty Document data) {
        return _collection.findOneAndUpdate(query, data, new FindOneAndUpdateOptions().returnDocument(ReturnDocument.AFTER));
    }

    @Override
    public ORMClass findOneAndUpdate(Document query, Document data, List<Document> arrayFilters) {
        return _collection.findOneAndUpdate(query, data, new FindOneAndUpdateOptions().arrayFilters(arrayFilters)
                .returnDocument(ReturnDocument.AFTER));
    }

    @Override
    public UpdateResult update(Document query, Document data) {
        return _collection.updateOne(query, data);
    }

    @Override
    public ORMClass findOneAndUpsert(Document query, Document update, Document setOnInsesrt) {
        return _collection.findOneAndUpdate(query, update.append("$setOnInsert", setOnInsesrt),
                new FindOneAndUpdateOptions().returnDocument(ReturnDocument.AFTER).upsert(true));
    }

    @Override
    public ORMClass findOneAndUpsert(Document query, Document update) {
        return _collection.findOneAndUpdate(query, update, new FindOneAndUpdateOptions()
                .returnDocument(ReturnDocument.AFTER).upsert(true));
    }

    @Override
    public UpdateResult upsert(Document query, Document data) {
        return _collection.updateOne(query, data, new UpdateOptions().upsert(true));
    }

    @Override
    public UpdateResult updateMany(Document query, Document data) {
        return _collection.updateMany(query, data);
    }

    @Override
    public DeleteResult removeMany(Document query) {
        return _collection.deleteMany(query);
    }

    @Override
    public UpdateResult updateMany(Document query, Document data, List<Document> arrayFilters) {
        if (CollectionUtils.isEmpty(arrayFilters)) {
            return this.updateMany(query, data);
        }
        return _collection.updateMany(query, data, new UpdateOptions().arrayFilters(arrayFilters));
    }

    @Override
    public ORMClass insert(ORMClass data) {
        _collection.insertOne(data);
        return data;
    }

    @Override
    public List<ORMClass> insertMany(List<ORMClass> data) {
        _collection.insertMany(data);
        return data;
    }

    @Override
    public BulkWriteResult updateMany(List<UpdateOneModel<ORMClass>> data) {
        return _collection.bulkWrite(data);
    }

    @Override
    public AggregateIterable<Document> aggregateSpecial(List<Bson> pipeline) {
        return _collection.aggregate(pipeline, Document.class).allowDiskUse(true);
    }

    @Override
    public AggregateIterable<Document> aggregateSpecialCollation(List<Document> pipeline) {
        return _collection.aggregate(pipeline, Document.class).collation(Collation.builder().locale("en_US")
                .collationStrength(CollationStrength.PRIMARY).build()).allowDiskUse(true);
    }

    @Override
    public List<ORMClass> aggregate(List<Bson> pipeline) {
        return _collection.aggregate(pipeline).allowDiskUse(true).into(new ArrayList<>());
    }

    @Override
    public BulkWriteResult updateManyBulk(List<UpdateManyModel<ORMClass>> updates) {
        return _collection.bulkWrite(updates);
    }

    // custom
    @Override
    public ORMClass getById(String id) {
        return this.find(new Document("_id", new ObjectId(id)).append("is_deleted", false), new Document(), new Document());
    }

    @Override
    public ORMClass getByIdWithProjection(String id, Map<String, Object> projection) {
        return this.find(new Document("_id", new ObjectId(id)).append("is_deleted", false), new Document(), new Document(projection));
    }

    @Override
    public ORMClass getOne(Map<String, Object> query) {
        return this.find(new Document(query), new Document(), new Document());
    }

    @Override
    public ORMClass getOneWithProjection(Map<String, Object> query, Map<String, Object> projection) {
        return this.find(new Document(query), new Document(), new Document(projection));
    }

    @Override
    public ORMClass getFirst(Map<String, Object> query, String sort_field) {
        return this.find(new Document(query), new Document(sort_field, 1), new Document());
    }

    @Override
    public ORMClass getFirstWithProjection(Map<String, Object> query, String sort_field, Map<String, Object> projection) {
        return this.find(new Document(query), new Document(sort_field, 1), new Document(projection));
    }

    @Override
    public ORMClass getLast(Map<String, Object> query, String sort_field) {
        return this.find(new Document(query), new Document(sort_field, -1), new Document());
    }

    @Override
    public ORMClass getLastWithProjection(Map<String, Object> query, String sort_field, Map<String, Object> projection) {
        return this.find(new Document(query), new Document(sort_field, -1), new Document(projection));
    }

    @Override
    public List<ORMClass> search(Map<String, Object> query, Map<String, Object> sorts, Map<String, Object> projection, Integer page, Integer size) {
        page = page == null || page < 1 ? 0 : page - 1;
        size = size == null || size < 0 ? 50 : size;
        return this.findMany(new Document(query), new Document(sorts), new Document(projection), page * size, size);
    }

    @Override
    public Optional<ORMClass> update(String id, ORMClass object) {
        try {
            Document q = new Document("_id", id);
            Document data = CommonUtils.buildUpdateDataNonNull(object);
            data.put(CommonConstant.CommonField.LAST_UPDATED_DATE, DateTimeUtils.getCurrentTimeWithZeroSecondAndMilis());
            Document update = new Document().append("$set", data);
            return Optional.ofNullable(this.findOneAndUpdate(q, update));
        } catch (Throwable throwable) {
            throwable.printStackTrace();
            return Optional.empty();
        }
    }

    @Override
    public Optional<ORMClass> updateWithoutSetLastUpdatedDate(String id, ORMClass object) {
        try {
            Document q = new Document("_id", new ObjectId(id));
            Document data = CommonUtils.buildUpdateDataNonNull(object);
            Document update = new Document().append("$set", data);
            return Optional.of(this.findOneAndUpdate(q, update));
        } catch (Throwable throwable) {
            throwable.printStackTrace();
            return Optional.empty();
        }
    }

    @Override
    public Optional<Long> count(Map<String, Object> query) {
        Long count = this.count(new Document(query));
        if (count != null) {
            return Optional.of(count);
        }
        return Optional.empty();
    }

    @Override
    public AggregateIterable<Document> aggregateSpecial(Document query, Document group) {
        try {
            return this.aggregateSpecial(Arrays.asList(query, group));
        } catch (Throwable throwable) {
            throwable.printStackTrace();
            return null;
        }
    }
}

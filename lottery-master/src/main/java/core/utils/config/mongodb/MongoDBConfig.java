package core.utils.config.mongodb;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;

public class MongoDBConfig {

    MongoDatabase getMongoDatabase(String connection_url, String db_name) {
        ConnectionString connection_string = new ConnectionString(connection_url);
        MongoClientSettings settings = MongoClientSettings.builder()
                .applyConnectionString(connection_string)
                .build();
        MongoClient mongoClient = MongoClients.create(settings);
        return mongoClient.getDatabase(db_name);
    }

}

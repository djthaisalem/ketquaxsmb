package core.utils.server;

import com.fasterxml.jackson.databind.ObjectMapper;
import core.utils.common.helpers.AESUtils;
import core.utils.common.helpers.JSONUtils;
import core.utils.config.ENVConfig;
import io.vertx.ext.web.RoutingContext;
import org.apache.commons.lang3.BooleanUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.math.NumberUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
public abstract class AbstractResource {

    protected static final int MAX_SIZE_DEFAULT = 50;

    protected enum ReturnType {
        JACKSON,
        GSON,
        FASTJSON
    }

    @Autowired
    private ENVConfig applicationConfig;
    private ObjectMapper objectMapper;
    @Autowired
    private AESUtils aesUtils;

    private String refactorOutput(int code, String message, Object entityDTO, Boolean encrypt, ReturnType returnType) {
        Map<String, Object> result = new HashMap<>();
        result.put("status_code", code);
        result.put("instance_id", applicationConfig.getStringProperty("application.env", UUID.randomUUID().toString()));
        result.put("instance_version", applicationConfig.getStringProperty("application.version", UUID.randomUUID().toString()));
        if (StringUtils.isNotBlank(message)) {
            result.put("message", message);
        }

        if (BooleanUtils.isTrue(encrypt)) {
            result.put("payload", this.encryptData(entityDTO));
        } else {
            result.put("payload", entityDTO);
        }

        if (ReturnType.JACKSON.equals(returnType)) {
            return JSONUtils.objectToJson(result);
        } else if (ReturnType.GSON.equals(returnType)) {
            return JSONUtils.gsonToJSON(result);
        } else { // ReturnType.FASTJSON
            return JSONUtils.toJSON(result);
        }
    }

    private String encryptData(Object entityDTO) {
        try {
            return aesUtils.encrypt(JSONUtils.objectToJson(entityDTO));
        } catch (Throwable e) {
            e.printStackTrace();
        }
        return "";
    }

    // default response JACKSON
    protected String outputJson(int code, Object entityDTO) {
        return this.refactorOutput(code, null, entityDTO, null, ReturnType.JACKSON);
    }

    protected String outputJsonEncrypt(int code, Object entityDTO) {
        return this.refactorOutput(code, null, entityDTO, true, ReturnType.JACKSON);
    }

    protected String outputJson(int code, String message, Object entityDTO) {
        return this.refactorOutput(code, message, entityDTO, null, ReturnType.JACKSON);
    }

    protected String getTenantId(RoutingContext routingContext) {
        return routingContext.user().principal().getString("tenant_id");
    }

    protected String getUserId(RoutingContext routingContext) {
        return routingContext.user().principal().getString("id");
    }

    protected String getUserName(RoutingContext routingContext) {
        return routingContext.user().principal().getString("name");
    }

    protected String getUserEmail(RoutingContext routingContext) {
        return routingContext.user().principal().getString("email");
    }

    protected int getPage(RoutingContext routingContext) {
        int page = NumberUtils.toInt(routingContext.request().getParam("page"));
        if (page < 1) page = 1;
        return page;
    }

    protected int getSize(RoutingContext routingContext) {
        int size = NumberUtils.toInt(routingContext.request().getParam("size"));
        if (size <= 0) {
            size = MAX_SIZE_DEFAULT;
        } else if (size > 50) {
            size = 50;
        }
        return size;
    }

    protected Map<String, Object> getSort(String body) {
        Object sort = JSONUtils.jsonToObject(body, Map.class).get("sort");
        return objectMapper.convertValue(sort, Map.class);
    }

    protected int getSizeLimit(RoutingContext routingContext, int limit) {
        int size = NumberUtils.toInt(routingContext.request().getParam("size"));
        if (limit > 100) limit = 100;
        if (size <= 0) {
            size = limit;
        } else if (size > limit) {
            size = limit;
        }
        return size;
    }

    protected void responseErr(RoutingContext routingContext, Throwable throwable) {
        routingContext.response()
                .setStatusCode(200)
                .putHeader("content-type", "application/json; charset=utf-8")
                .end(outputJson(-9999, throwable.getMessage(), new HashMap<>()));
    }

    protected String getHostPath(RoutingContext routingContext) {
        try {
            String referer = routingContext.request().getHeader("origin");
            if (StringUtils.isBlank(referer)) {
                return "";
            }
            URI uri = new URI(referer);
            String host = uri.getHost();
            if (StringUtils.isBlank(host)) {
                return "";
            }
            if ("app.localhost".equals(host)) host = "";
            return host;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return "domainDefault";
    }

    protected String getPath(RoutingContext routingContext) {
        try {
            return routingContext.currentRoute().getPath();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    protected String getIP(RoutingContext routingContext) {
        try {
            String ip = routingContext.request().getHeader("X-Forwarded-For");
            if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
                ip = routingContext.request().getHeader("Proxy-Client-IP");
            }
            if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
                ip = routingContext.request().getHeader("WL-Proxy-Client-IP");
            }
            if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
                ip = routingContext.request().getHeader("HTTP_CLIENT_IP");
            }
            if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
                ip = routingContext.request().getHeader("HTTP_X_FORWARDED_FOR");
            }
            if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
                ip = routingContext.request().remoteAddress().host();
            }
            return ip;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return "";
    }

    protected String getDeviceLogin(RoutingContext routingContext) {
        try {
            return routingContext.request().getHeader("user-agent");
        } catch (Exception e) {
            e.printStackTrace();
        }
        return "";
    }

}

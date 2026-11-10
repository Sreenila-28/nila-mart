#pragma once

#include <drogon/HttpFilter.h>

namespace nilamart::middleware {

class CorsFilter : public drogon::HttpFilter<CorsFilter> {
public:
    void doFilter(
        const drogon::HttpRequestPtr& req,
        drogon::FilterCallback&& fcb,
        drogon::FilterChainCallback&& fccb
    ) override {
        // Pre-flight handling
        if (req->method() == drogon::HttpMethod::Options) {
            auto resp = drogon::HttpResponse::newHttpResponse();
            resp->addHeader("Access-Control-Allow-Origin", "*");
            resp->addHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            resp->addHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
            resp->addHeader("Access-Control-Max-Age", "86400");
            fcb(resp);
            return;
        }

        fccb();
    }
};

class AuthFilter : public drogon::HttpFilter<AuthFilter> {
public:
    void doFilter(
        const drogon::HttpRequestPtr& req,
        drogon::FilterCallback&& fcb,
        drogon::FilterChainCallback&& fccb
    ) override {
        auto authHeader = req->getHeader("Authorization");
        if (authHeader.empty() || authHeader.rfind("Bearer ", 0) != 0) {
            Json::Value ret;
            ret["success"] = false;
            ret["error"] = "Authentication required. Missing Bearer token.";
            auto resp = drogon::HttpResponse::newHttpJsonResponse(ret);
            resp->setStatusCode(drogon::k401Unauthorized);
            resp->addHeader("Access-Control-Allow-Origin", "*");
            fcb(resp);
            return;
        }

        // Token present -> continue chain
        fccb();
    }
};

} // namespace nilamart::middleware

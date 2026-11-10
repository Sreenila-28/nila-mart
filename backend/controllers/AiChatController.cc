#include "AiChatController.h"
#include <drogon/HttpClient.h>
#include <cstdlib>

namespace nilamart::controllers {

void AiChatController::handleChat(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    if (req->method() == drogon::HttpMethod::Options) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->addHeader("Access-Control-Allow-Origin", "*");
        resp->addHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        resp->addHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        callback(resp);
        return;
    }

    auto json = req->getJsonObject();
    if (!json || !json->isMember("message")) {
        Json::Value ret;
        ret["success"] = false;
        ret["error"] = "Field 'message' is required";
        auto resp = drogon::HttpResponse::newHttpJsonResponse(ret);
        resp->setStatusCode(drogon::k400BadRequest);
        callback(resp);
        return;
    }

    std::string userMessage = (*json)["message"].asString();
    const char* apiKey = std::getenv("GEMINI_API_KEY");

    if (!apiKey || std::string(apiKey).empty()) {
        Json::Value ret;
        ret["success"] = false;
        ret["error"] = "AI Shopping Assistant requires GEMINI_API_KEY environment variable. Please configure it in your server environment.";
        auto resp = drogon::HttpResponse::newHttpJsonResponse(ret);
        resp->setStatusCode(drogon::k503ServiceUnavailable);
        resp->addHeader("Access-Control-Allow-Origin", "*");
        callback(resp);
        return;
    }

    // Call Google Gemini REST API using Drogon HttpClient
    auto client = drogon::HttpClient::newHttpClient("https://generativelanguage.googleapis.com");
    auto aiReq = drogon::HttpRequest::newHttpRequest();
    aiReq->setMethod(drogon::HttpMethod::Post);
    aiReq->setPath("/v1beta/models/gemini-3.8-flash:generateContent?key=" + std::string(apiKey));
    aiReq->setContentTypeCode(drogon::ContentType::CT_APPLICATION_JSON);
    aiReq->addHeader("User-Agent", "aistudio-build");

    Json::Value payload;
    Json::Value contents(Json::arrayValue);
    Json::Value partObj;
    partObj["text"] = "You are NilaMart's intelligent shopping assistant. Assist the customer professionally. Query: " + userMessage;
    Json::Value parts(Json::arrayValue);
    parts.append(partObj);
    Json::Value content;
    content["parts"] = parts;
    contents.append(content);
    payload["contents"] = contents;

    aiReq->setBody(payload.toStyledString());

    client->sendRequest(
        aiReq,
        [callback](drogon::ReqResult result, const drogon::HttpResponsePtr& aiResp) {
            if (result != drogon::ReqResult::Ok || !aiResp) {
                Json::Value ret;
                ret["success"] = false;
                ret["error"] = "Failed to communicate with Gemini API";
                auto resp = drogon::HttpResponse::newHttpJsonResponse(ret);
                resp->setStatusCode(drogon::k502BadGateway);
                resp->addHeader("Access-Control-Allow-Origin", "*");
                callback(resp);
                return;
            }

            auto aiJson = aiResp->getJsonObject();
            std::string reply = "I am happy to assist you with shopping on NilaMart!";
            if (aiJson && aiJson->isMember("candidates") && (*aiJson)["candidates"].size() > 0) {
                const auto& cand = (*aiJson)["candidates"][0];
                if (cand.isMember("content") && cand["content"].isMember("parts") && cand["content"]["parts"].size() > 0) {
                    reply = cand["content"]["parts"][0]["text"].asString();
                }
            }

            Json::Value ret;
            ret["success"] = true;
            ret["reply"] = reply;
            auto resp = drogon::HttpResponse::newHttpJsonResponse(ret);
            resp->addHeader("Access-Control-Allow-Origin", "*");
            callback(resp);
        }
    );
}

} // namespace nilamart::controllers

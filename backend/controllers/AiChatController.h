#pragma once

#include <drogon/HttpController.h>

namespace nilamart::controllers {

class AiChatController : public drogon::HttpController<AiChatController> {
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(AiChatController::handleChat, "/api/v1/ai/chat", drogon::Post, drogon::Options);
    METHOD_LIST_END

    void handleChat(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
};

} // namespace nilamart::controllers

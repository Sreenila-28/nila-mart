/**
 * @file main.cc
 * @brief NilaMart C++20 Full-Stack E-Commerce Backend Server
 * @framework Drogon Web Framework
 */

#include <drogon/drogon.h>
#include <iostream>
#include <cstdlib>

int main(int argc, char* argv[]) {
    std::cout << "========================================================\n";
    std::cout << "  NilaMart C++20 Drogon E-Commerce Backend Server       \n";
    std::cout << "  High-Performance Relational Web API                   \n";
    std::cout << "========================================================\n";

    // Load Drogon configuration
    std::string configPath = "./config.json";
    if (argc > 1) {
        configPath = argv[1];
    }

    try {
        drogon::app().loadConfigFile(configPath);
        std::cout << "[INFO] Loaded Drogon configuration from: " << configPath << "\n";
    } catch (const std::exception& e) {
        std::cerr << "[WARN] Config file load issue (" << e.what() 
                  << "). Falling back to programmatic setup on port 8080.\n";
        drogon::app()
            .addListener("0.0.0.0", 8080)
            .setThreadNum(4)
            .createDbClient("postgresql", "127.0.0.1", 5432, "nilamart", "nilamart_user", "nilamart_password", 10);
    }

    // Register Global Exception and Custom 404 Handlers
    drogon::app().setCustom404Page(drogon::HttpResponse::newHttpJsonResponse([]{
        Json::Value ret;
        ret["success"] = false;
        ret["error"] = "Endpoint not found on NilaMart Drogon Server";
        return ret;
    }()));

    std::cout << "[INFO] NilaMart Drogon server initialized successfully.\n";
    std::cout << "[INFO] Listening on http://0.0.0.0:8080\n";

    // Run the Drogon asynchronous event loop
    drogon::app().run();

    return 0;
}

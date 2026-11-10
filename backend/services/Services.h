#pragma once

#include <memory>
#include <string>
#include <optional>
#include "../models/Models.h"
#include "../repositories/Repositories.h"

namespace nilamart::services {

class AuthService {
public:
    explicit AuthService(std::shared_ptr<repositories::UserRepository> userRepo)
        : userRepo_(std::move(userRepo)) {}

    std::pair<bool, std::string> registerUser(
        const std::string& name,
        const std::string& email,
        const std::string& password,
        models::UserRole role
    );

    std::pair<bool, std::string> loginUser(
        const std::string& email,
        const std::string& password
    );

    std::string generateJwt(const models::User& user);
    std::optional<models::User> verifyJwt(const std::string& token);

private:
    std::shared_ptr<repositories::UserRepository> userRepo_;
};

class OrderService {
public:
    explicit OrderService(
        std::shared_ptr<repositories::OrderRepository> orderRepo,
        std::shared_ptr<repositories::CartRepository> cartRepo,
        std::shared_ptr<repositories::ProductRepository> productRepo
    ) : orderRepo_(std::move(orderRepo)), cartRepo_(std::move(cartRepo)), productRepo_(std::move(productRepo)) {}

    std::pair<bool, std::string> processCheckout(int buyerId, const std::string& shippingAddress);

private:
    std::shared_ptr<repositories::OrderRepository> orderRepo_;
    std::shared_ptr<repositories::CartRepository> cartRepo_;
    std::shared_ptr<repositories::ProductRepository> productRepo_;
};

} // namespace nilamart::services

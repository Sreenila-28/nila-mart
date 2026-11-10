#pragma once

#include <memory>
#include <vector>
#include <optional>
#include <drogon/orm/DbClient.h>
#include "../models/Models.h"

namespace nilamart::repositories {

class UserRepository {
public:
    explicit UserRepository(std::shared_ptr<drogon::orm::DbClient> db) : db_(std::move(db)) {}

    std::optional<models::User> findById(int id);
    std::optional<models::User> findByEmail(const std::string& email);
    models::User create(const std::string& name, const std::string& email, const std::string& passwordHash, models::UserRole role);
    std::vector<models::User> findAll();

private:
    std::shared_ptr<drogon::orm::DbClient> db_;
};

class ProductRepository {
public:
    explicit ProductRepository(std::shared_ptr<drogon::orm::DbClient> db) : db_(std::move(db)) {}

    std::vector<models::Product> findAll(
        const std::optional<int>& categoryId,
        const std::optional<std::string>& searchQuery,
        const std::optional<double>& minPrice,
        const std::optional<double>& maxPrice
    );
    std::optional<models::Product> findById(int id);
    int create(const models::Product& product);
    bool update(int id, const models::Product& product, int sellerId, bool isAdmin);
    bool remove(int id, int sellerId, bool isAdmin);

private:
    std::shared_ptr<drogon::orm::DbClient> db_;
};

class OrderRepository {
public:
    explicit OrderRepository(std::shared_ptr<drogon::orm::DbClient> db) : db_(std::move(db)) {}

    std::vector<models::Order> findByBuyer(int buyerId);
    std::vector<models::Order> findAllForAdmin(
        const std::optional<std::string>& startDate,
        const std::optional<std::string>& endDate,
        const std::optional<std::string>& status
    );
    std::optional<models::Order> findDetailsById(int orderId);
    bool updateStatus(int orderId, const std::string& newStatus, int changedByUserId);

private:
    std::shared_ptr<drogon::orm::DbClient> db_;
};

class CartRepository {
public:
    explicit CartRepository(std::shared_ptr<drogon::orm::DbClient> db) : db_(std::move(db)) {}

    std::vector<models::CartItem> getCartForBuyer(int buyerId);
    bool upsertItem(int buyerId, int productId, int quantity);
    bool updateQuantity(int buyerId, int productId, int quantity);
    bool removeItem(int buyerId, int productId);
    bool clear(int buyerId);

private:
    std::shared_ptr<drogon::orm::DbClient> db_;
};

class ReviewRepository {
public:
    explicit ReviewRepository(std::shared_ptr<drogon::orm::DbClient> db) : db_(std::move(db)) {}

    std::vector<models::Review> findByProductId(int productId);
    bool hasBuyerPurchasedProduct(int buyerId, int productId);
    bool upsertReview(int buyerId, int productId, int rating, const std::string& comment);

private:
    std::shared_ptr<drogon::orm::DbClient> db_;
};

} // namespace nilamart::repositories

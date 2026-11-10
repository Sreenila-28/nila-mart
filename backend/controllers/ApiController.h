#pragma once

#include <drogon/HttpController.h>
#include <drogon/orm/DbClient.h>
#include "../models/Models.h"

namespace nilamart::controllers {

class ApiController : public drogon::HttpController<ApiController> {
public:
    METHOD_LIST_BEGIN
    // Health Checks
    ADD_METHOD_TO(ApiController::healthCheck, "/api/v1/health", drogon::Get, drogon::Options);
    ADD_METHOD_TO(ApiController::healthDatabase, "/api/v1/health/database", drogon::Get, drogon::Options);

    // Authentication & Profile Endpoints
    ADD_METHOD_TO(ApiController::registerUser, "/api/v1/auth/register", drogon::Post, drogon::Options);
    ADD_METHOD_TO(ApiController::loginUser, "/api/v1/auth/login", drogon::Post, drogon::Options);
    ADD_METHOD_TO(ApiController::getCurrentUser, "/api/v1/auth/me", drogon::Get, drogon::Options);
    ADD_METHOD_TO(ApiController::getCurrentUser, "/api/v1/users/me", drogon::Get, drogon::Options);
    ADD_METHOD_TO(ApiController::updateCurrentUser, "/api/v1/users/me", drogon::Put, drogon::Options);

    // Categories
    ADD_METHOD_TO(ApiController::listCategories, "/api/v1/categories", drogon::Get, drogon::Options);

    // Products
    ADD_METHOD_TO(ApiController::listProducts, "/api/v1/products", drogon::Get, drogon::Options);
    ADD_METHOD_TO(ApiController::getProductById, "/api/v1/products/{1}", drogon::Get, drogon::Options);
    ADD_METHOD_TO(ApiController::createProduct, "/api/v1/products", drogon::Post, drogon::Options);
    ADD_METHOD_TO(ApiController::updateProduct, "/api/v1/products/{1}", drogon::Put, drogon::Options);
    ADD_METHOD_TO(ApiController::updateProductStock, "/api/v1/products/{1}/stock", drogon::Patch, drogon::Options);
    ADD_METHOD_TO(ApiController::deleteProduct, "/api/v1/products/{1}", drogon::Delete, drogon::Options);

    // Cart (supports both /cart and /cart/items)
    ADD_METHOD_TO(ApiController::getCart, "/api/v1/cart", drogon::Get, drogon::Options);
    ADD_METHOD_TO(ApiController::addToCart, "/api/v1/cart", drogon::Post, drogon::Options);
    ADD_METHOD_TO(ApiController::addToCart, "/api/v1/cart/items", drogon::Post, drogon::Options);
    ADD_METHOD_TO(ApiController::updateCartItem, "/api/v1/cart/{1}", drogon::Put, drogon::Options);
    ADD_METHOD_TO(ApiController::updateCartItem, "/api/v1/cart/items/{1}", drogon::Put, drogon::Options);
    ADD_METHOD_TO(ApiController::removeCartItem, "/api/v1/cart/{1}", drogon::Delete, drogon::Options);
    ADD_METHOD_TO(ApiController::removeCartItem, "/api/v1/cart/items/{1}", drogon::Delete, drogon::Options);
    ADD_METHOD_TO(ApiController::clearCart, "/api/v1/cart", drogon::Delete, drogon::Options);

    // Orders & Checkout
    ADD_METHOD_TO(ApiController::checkout, "/api/v1/orders/checkout", drogon::Post, drogon::Options);
    ADD_METHOD_TO(ApiController::getBuyerOrders, "/api/v1/orders", drogon::Get, drogon::Options);
    ADD_METHOD_TO(ApiController::getBuyerOrders, "/api/v1/orders/my-orders", drogon::Get, drogon::Options);
    ADD_METHOD_TO(ApiController::getSellerOrders, "/api/v1/orders/seller", drogon::Get, drogon::Options);
    ADD_METHOD_TO(ApiController::getOrderDetails, "/api/v1/orders/{1}", drogon::Get, drogon::Options);
    ADD_METHOD_TO(ApiController::updateOrderStatus, "/api/v1/orders/{1}/status", drogon::Put, drogon::Options);

    // Reviews
    ADD_METHOD_TO(ApiController::getProductReviews, "/api/v1/reviews/product/{1}", drogon::Get, drogon::Options);
    ADD_METHOD_TO(ApiController::submitReview, "/api/v1/reviews", drogon::Post, drogon::Options);

    // Wishlist
    ADD_METHOD_TO(ApiController::getWishlist, "/api/v1/wishlist", drogon::Get, drogon::Options);
    ADD_METHOD_TO(ApiController::toggleWishlist, "/api/v1/wishlist/{1}", drogon::Post, drogon::Options);

    // Admin
    ADD_METHOD_TO(ApiController::getAdminStats, "/api/v1/admin/stats", drogon::Get, drogon::Options);
    ADD_METHOD_TO(ApiController::getAdminUsers, "/api/v1/admin/users", drogon::Get, drogon::Options);
    ADD_METHOD_TO(ApiController::getAdminProducts, "/api/v1/admin/products", drogon::Get, drogon::Options);
    ADD_METHOD_TO(ApiController::getAdminCartItems, "/api/v1/admin/cart-items", drogon::Get, drogon::Options);
    ADD_METHOD_TO(ApiController::getAdminOrders, "/api/v1/admin/orders", drogon::Get, drogon::Options);
    ADD_METHOD_TO(ApiController::getAdminOrderItems, "/api/v1/admin/order-items", drogon::Get, drogon::Options);
    ADD_METHOD_TO(ApiController::getAdminReviews, "/api/v1/admin/reviews", drogon::Get, drogon::Options);
    ADD_METHOD_TO(ApiController::getSalesReport, "/api/v1/admin/reports/sales", drogon::Get, drogon::Options);
    METHOD_LIST_END

    void healthCheck(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void healthDatabase(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);

    void registerUser(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void loginUser(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void getCurrentUser(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void updateCurrentUser(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);

    void listCategories(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);

    void listProducts(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void getProductById(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback, int productId);
    void createProduct(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void updateProduct(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback, int productId);
    void updateProductStock(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback, int productId);
    void deleteProduct(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback, int productId);

    void getCart(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void addToCart(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void updateCartItem(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback, int productId);
    void removeCartItem(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback, int productId);
    void clearCart(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);

    void checkout(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void getBuyerOrders(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void getSellerOrders(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void getOrderDetails(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback, int orderId);
    void updateOrderStatus(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback, int orderId);

    void getProductReviews(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback, int productId);
    void submitReview(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);

    void getWishlist(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void toggleWishlist(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback, int productId);

    void getAdminStats(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void getAdminUsers(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void getAdminProducts(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void getAdminCartItems(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void getAdminOrders(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void getAdminOrderItems(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void getAdminReviews(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void getSalesReport(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);

private:
    std::optional<models::User> authenticateRequest(const drogon::HttpRequestPtr& req);
};

} // namespace nilamart::controllers

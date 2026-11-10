#pragma once

#include <string>
#include <vector>
#include <optional>
#include <json/json.h>

namespace nilamart::models {

enum class UserRole {
    BUYER,
    SELLER,
    ADMIN
};

inline std::string userRoleToString(UserRole role) {
    switch (role) {
        case UserRole::BUYER: return "BUYER";
        case UserRole::SELLER: return "SELLER";
        case UserRole::ADMIN: return "ADMIN";
    }
    return "BUYER";
}

inline UserRole stringToUserRole(const std::string& str) {
    if (str == "SELLER") return UserRole::SELLER;
    if (str == "ADMIN") return UserRole::ADMIN;
    return UserRole::BUYER;
}

struct User {
    int id{0};
    std::string name;
    std::string email;
    std::string passwordHash;
    UserRole role{UserRole::BUYER};
    std::string createdAt;
    std::string updatedAt;

    Json::Value toJson(bool includePrivate = false) const {
        Json::Value val;
        val["id"] = id;
        val["name"] = name;
        val["email"] = email;
        val["role"] = userRoleToString(role);
        val["created_at"] = createdAt;
        val["updated_at"] = updatedAt;
        if (includePrivate) {
            val["password_hash"] = passwordHash;
        }
        return val;
    }
};

struct Category {
    int id{0};
    std::string name;
    std::string description;
    std::string createdAt;

    Json::Value toJson() const {
        Json::Value val;
        val["id"] = id;
        val["name"] = name;
        val["description"] = description;
        val["created_at"] = createdAt;
        return val;
    }
};

struct Product {
    int id{0};
    int sellerId{0};
    int categoryId{0};
    std::string name;
    std::string description;
    double price{0.0};
    int stockQuantity{0};
    std::string imageUrl;
    std::string createdAt;
    std::string updatedAt;

    // Joined fields
    std::string sellerName;
    std::string categoryName;
    double averageRating{0.0};
    int reviewCount{0};

    Json::Value toJson() const {
        Json::Value val;
        val["id"] = id;
        val["seller_id"] = sellerId;
        val["category_id"] = categoryId;
        val["name"] = name;
        val["description"] = description;
        val["price"] = price;
        val["stock_quantity"] = stockQuantity;
        val["image_url"] = imageUrl;
        val["seller_name"] = sellerName;
        val["category_name"] = categoryName;
        val["avg_rating"] = averageRating;
        val["review_count"] = reviewCount;
        val["created_at"] = createdAt;
        val["updated_at"] = updatedAt;
        return val;
    }
};

struct CartItem {
    int id{0};
    int buyerId{0};
    int productId{0};
    int quantity{1};
    std::string createdAt;
    std::string updatedAt;

    // Joined product snapshot
    std::string productName;
    double productPrice{0.0};
    std::string productImageUrl;
    int currentStock{0};

    Json::Value toJson() const {
        Json::Value val;
        val["id"] = id;
        val["buyer_id"] = buyerId;
        val["product_id"] = productId;
        val["quantity"] = quantity;
        val["name"] = productName;
        val["price"] = productPrice;
        val["image_url"] = productImageUrl;
        val["stock_quantity"] = currentStock;
        val["subtotal"] = quantity * productPrice;
        val["created_at"] = createdAt;
        val["updated_at"] = updatedAt;
        return val;
    }
};

struct OrderItem {
    int id{0};
    int orderId{0};
    int productId{0};
    int sellerId{0};
    std::string productName;
    double unitPrice{0.0};
    int quantity{0};
    double subtotal{0.0};
    std::string createdAt;

    Json::Value toJson() const {
        Json::Value val;
        val["id"] = id;
        val["order_id"] = orderId;
        val["product_id"] = productId;
        val["seller_id"] = sellerId;
        val["product_name"] = productName;
        val["unit_price"] = unitPrice;
        val["quantity"] = quantity;
        val["subtotal"] = subtotal;
        val["created_at"] = createdAt;
        return val;
    }
};

struct Order {
    int id{0};
    int buyerId{0};
    double totalAmount{0.0};
    std::string status{"PENDING"}; // PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
    std::string shippingAddress;
    std::string createdAt;
    std::string updatedAt;

    std::string buyerName;
    std::string buyerEmail;
    std::vector<OrderItem> items;

    Json::Value toJson() const {
        Json::Value val;
        val["id"] = id;
        val["buyer_id"] = buyerId;
        val["buyer_name"] = buyerName;
        val["buyer_email"] = buyerEmail;
        val["total_amount"] = totalAmount;
        val["status"] = status;
        val["shipping_address"] = shippingAddress;
        val["created_at"] = createdAt;
        val["updated_at"] = updatedAt;

        Json::Value itemsArray(Json::arrayValue);
        for (const auto& item : items) {
            itemsArray.append(item.toJson());
        }
        val["items"] = itemsArray;
        return val;
    }
};

struct Review {
    int id{0};
    int buyerId{0};
    int productId{0};
    int rating{5};
    std::string comment;
    std::string createdAt;
    std::string updatedAt;

    std::string buyerName;

    Json::Value toJson() const {
        Json::Value val;
        val["id"] = id;
        val["buyer_id"] = buyerId;
        val["buyer_name"] = buyerName;
        val["product_id"] = productId;
        val["rating"] = rating;
        val["comment"] = comment;
        val["created_at"] = createdAt;
        val["updated_at"] = updatedAt;
        return val;
    }
};

struct OrderStatusHistory {
    int id{0};
    int orderId{0};
    std::optional<std::string> oldStatus;
    std::string newStatus;
    int changedBy{0};
    std::string changerName;
    std::string changerRole;
    std::string changedAt;

    Json::Value toJson() const {
        Json::Value val;
        val["id"] = id;
        val["order_id"] = orderId;
        if (oldStatus.has_value()) {
            val["old_status"] = oldStatus.value();
        } else {
            val["old_status"] = Json::Value::null;
        }
        val["new_status"] = newStatus;
        val["changed_by"] = changedBy;
        val["changer_name"] = changerName;
        val["changer_role"] = changerRole;
        val["changed_at"] = changedAt;
        return val;
    }
};

struct WishlistItem {
    int id{0};
    int buyerId{0};
    int productId{0};
    std::string createdAt;

    Product product;

    Json::Value toJson() const {
        Json::Value val;
        val["id"] = id;
        val["buyer_id"] = buyerId;
        val["product_id"] = productId;
        val["created_at"] = createdAt;
        val["product"] = product.toJson();
        return val;
    }
};

} // namespace nilamart::models

cmake_minimum_required(VERSION 3.20)
project(NilaMartBackend CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Compiler flags for modern C++20 and warnings
if(MSVC)
    add_compile_options(/W4 /permissive- /utf-8 /EHsc)
else()
    add_compile_options(-Wall -Wextra -Wpedantic -O2 -pthread)
endif()

# Find Drogon and dependencies
find_package(Drogon CONFIG REQUIRED)
find_package(jsoncpp CONFIG REQUIRED)
find_package(OpenSSL REQUIRED)

# Project include directories
include_directories(
    ${PROJECT_SOURCE_DIR}/backend
    ${PROJECT_SOURCE_DIR}/backend/models
    ${PROJECT_SOURCE_DIR}/backend/repositories
    ${PROJECT_SOURCE_DIR}/backend/services
    ${PROJECT_SOURCE_DIR}/backend/controllers
    ${PROJECT_SOURCE_DIR}/backend/middleware
)

# Collect all C++ source files
file(GLOB_RECURSE BACKEND_SOURCES
    "${PROJECT_SOURCE_DIR}/backend/*.cc"
    "${PROJECT_SOURCE_DIR}/backend/controllers/*.cc"
    "${PROJECT_SOURCE_DIR}/backend/services/*.cc"
    "${PROJECT_SOURCE_DIR}/backend/repositories/*.cc"
    "${PROJECT_SOURCE_DIR}/backend/middleware/*.cc"
)

# Create Drogon executable
add_executable(nilamart_server ${BACKEND_SOURCES})

# Link libraries: Drogon, Trantor, JsonCpp, OpenSSL (crypto), and pthread
target_link_libraries(nilamart_server
    PRIVATE
        Drogon::Drogon
        JsonCpp::JsonCpp
        OpenSSL::Crypto
        OpenSSL::SSL
)

if(UNIX AND NOT APPLE)
    target_link_libraries(nilamart_server PRIVATE pthread dl)
endif()

# Copy config.json to binary output folder
add_custom_command(TARGET nilamart_server POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_if_different
    "${PROJECT_SOURCE_DIR}/backend/config.json"
    $<TARGET_FILE_DIR:nilamart_server>
)

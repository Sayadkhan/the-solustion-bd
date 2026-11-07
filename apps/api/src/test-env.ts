// Imported first by tests so that results never depend on a developer's .env.
// dotenv does not overwrite variables that are already set, even to an empty value.
process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test_access_secret_for_integration_tests";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_for_integration_tests";
process.env.BKASH_APP_KEY = "";
process.env.BKASH_APP_SECRET = "";
process.env.BKASH_USERNAME = "";
process.env.BKASH_PASSWORD = "";
process.env.CORS_ORIGINS = "";
process.env.SMTP_PASS = "";

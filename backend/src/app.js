
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const morgan = require("morgan");

const corsOptions = require("./config/cors");
const logger = require("./utils/logger");

const requestIdMiddleware = require("./middleware/requestIdMiddleware");
const mongoSanitizeMiddleware = require("./middleware/mongoSanitizeMiddleware");
const { generalRateLimiter } = require("./middleware/rateLimitMiddleware");

const notFoundMiddleware = require("./middleware/notFoundMiddleware");
const errorMiddleware = require("./middleware/errorMiddleware");

const authRoutes = require("./modules/auth/auth.routes");
const userRoutes = require("./modules/user/user.routes");
const ticketRoutes = require("./modules/ticket/ticket.routes");
const categoryRoutes = require("./modules/category/category.routes");
const dashboardRoutes = require("./modules/dashboard/dashboard.routes");
const notificationRoutes = require("./modules/notification/notification.routes");
const emailRoutes = require("./modules/email/email.routes");
const attachmentRoutes = require("./modules/attachment/attachment.routes");
const auditLogRoutes = require("./modules/auditLog/auditLog.routes");

const app = express();

const API_PREFIX = "/api";

app.disable("x-powered-by");

app.use(requestIdMiddleware);

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  }),
);

app.use(cors(corsOptions));
app.use(compression());
app.use(cookieParser());

app.use(
  morgan("combined", {
    stream: {
      write(message) {
        logger.info(message.trim());
      },
    },
  }),
);

app.use(express.json({ limit: "1mb" }));

app.use(
  express.urlencoded({
    extended: false,
    limit: "1mb",
  }),
);

app.use(mongoSanitizeMiddleware);

// Apply rate limiting to API routes.
app.use(API_PREFIX, generalRateLimiter);
app.use((req, res, next) => {
  console.log("REQUEST RECEIVED:", req.method, req.originalUrl);
  next();
});

app.get("/", (req, res) => {
  console.log("ROOT ROUTE REACHED");
  res.status(200).send("Welcome to the Ticketing System API");
});
// API routes
app.get('/',(req,res) =>{
  res.send('Welcome to the Ticketing System API');
})
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/tickets`, ticketRoutes);
app.use(`${API_PREFIX}/categories`, categoryRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/email`, emailRoutes);
app.use(`${API_PREFIX}/attachments`, attachmentRoutes);
app.use(`${API_PREFIX}/audit-logs`, auditLogRoutes);

// Swagger documentation
try {
  const swaggerConfig = require("./config/swagger");

  if (swaggerConfig.swaggerUi && swaggerConfig.swaggerSpec) {
    app.use(
      "/api-docs",
      swaggerConfig.swaggerUi.serve,
      swaggerConfig.swaggerUi.setup(swaggerConfig.swaggerSpec),
    );
  }
} catch (error) {
  logger.warn(
    `Swagger documentation was not mounted: ${error.message}`,
  );
}

// Handle unknown routes and errors.
app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;

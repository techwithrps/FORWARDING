# Forwarder 2.0 Backend — Clean Layered Architecture

## Architecture Layers
1. **Controllers/**: API route handlers (e.g., `JobOrderController.cs`, `ContainerController.cs`)
   - Handles HTTP POST/GET/PATCH, JWT authentication, and request validation.
2. **Services/**: Pure forwarder business logic (e.g., `JobOrderService.cs`, `PanvayaService.cs`)
   - Validates tare/gross container weights, checks carrier cut-off dates, calculates Buy/Sell profit margins.
3. **Repositories/**: High-speed PostgreSQL data access (e.g., `JobOrderRepository.cs`)
   - Manages atomic ACID transactions (`BEGIN ... COMMIT`) using Npgsql.
4. **Models/**: Strongly-typed entity definitions matching the PostgreSQL schema.

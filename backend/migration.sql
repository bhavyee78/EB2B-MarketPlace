-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `role` ENUM('RETAILER', 'ADMIN') NOT NULL DEFAULT 'RETAILER',
    `company_name` VARCHAR(191) NULL,
    `locale` VARCHAR(191) NOT NULL DEFAULT 'en',
    `status` ENUM('ACTIVE', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `images` JSON NOT NULL,
    `category` VARCHAR(191) NULL,
    `collection` VARCHAR(191) NULL,
    `tags` JSON NOT NULL,
    `moq` INTEGER NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `pack_size` VARCHAR(191) NULL,
    `lead_time_days` INTEGER NULL,
    `countries_bought_in` JSON NOT NULL,
    `customization_options` JSON NOT NULL,
    `status` ENUM('ACTIVE', 'HIDDEN', 'DRAFT') NOT NULL DEFAULT 'ACTIVE',
    `ai_suggestion` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `products_sku_key`(`sku`),
    INDEX `products_category_idx`(`category`),
    INDEX `products_collection_idx`(`collection`),
    INDEX `products_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `order_number` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'PENDING', 'CONFIRMED', 'PACKED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `currency` VARCHAR(191) NOT NULL DEFAULT 'GBP',
    `total_amount` DECIMAL(10, 2) NULL,
    `add_ons` JSON NOT NULL,
    `placed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `orders_order_number_key`(`order_number`),
    INDEX `orders_user_id_status_idx`(`user_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_items` (
    `id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `product_id` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    `moq_at_order` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rfqs` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `product_id` VARCHAR(191) NOT NULL,
    `requested_qty` INTEGER NOT NULL,
    `status` ENUM('OPEN', 'QUOTED', 'ACCEPTED', 'REJECTED', 'EXPIRED') NOT NULL DEFAULT 'OPEN',
    `quotation_url` VARCHAR(191) NULL,
    `note` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `rfqs_status_idx`(`status`),
    INDEX `rfqs_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sales` (
    `id` VARCHAR(191) NOT NULL,
    `product_id` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NULL,
    `period` DATETIME(3) NOT NULL,
    `units_sold` INTEGER NOT NULL DEFAULT 0,
    `revenue` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `sales_product_id_period_idx`(`product_id`, `period`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `retailer_outlets` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `outlet_name` VARCHAR(191) NOT NULL,
    `address_json` JSON NULL,
    `vat_no` VARCHAR(191) NULL,
    `buying_group` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `banners` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `image_url` VARCHAR(191) NOT NULL,
    `link_url` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `banners_is_active_sort_order_idx`(`is_active`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `offers` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `type` ENUM('FREE_ITEM', 'PERCENT_OFF', 'AMOUNT_OFF') NOT NULL,
    `percentOff` DECIMAL(5, 2) NULL,
    `amountOff` DECIMAL(10, 2) NULL,
    `free_item_product_id` VARCHAR(191) NULL,
    `free_item_qty` INTEGER NULL DEFAULT 1,
    `starts_at` DATETIME(3) NULL,
    `ends_at` DATETIME(3) NULL,
    `min_quantity` INTEGER NOT NULL DEFAULT 0,
    `min_order_amount` DECIMAL(10, 2) NULL,
    `applies_to_any_qty` BOOLEAN NOT NULL DEFAULT true,
    `max_per_user` INTEGER NULL,
    `max_total_redemptions` INTEGER NULL,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `is_stackable` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_by_user_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `offers_type_idx`(`type`),
    INDEX `offers_is_active_idx`(`is_active`),
    INDEX `offers_starts_at_ends_at_idx`(`starts_at`, `ends_at`),
    INDEX `offers_priority_idx`(`priority`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `offer_scope_products` (
    `id` VARCHAR(191) NOT NULL,
    `offer_id` VARCHAR(191) NOT NULL,
    `product_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `offer_scope_products_offer_id_product_id_key`(`offer_id`, `product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `offer_scope_categories` (
    `id` VARCHAR(191) NOT NULL,
    `offer_id` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,

    INDEX `offer_scope_categories_category_idx`(`category`),
    UNIQUE INDEX `offer_scope_categories_offer_id_category_key`(`offer_id`, `category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `offer_scope_collections` (
    `id` VARCHAR(191) NOT NULL,
    `offer_id` VARCHAR(191) NOT NULL,
    `collection` VARCHAR(191) NOT NULL,

    INDEX `offer_scope_collections_collection_idx`(`collection`),
    UNIQUE INDEX `offer_scope_collections_offer_id_collection_key`(`offer_id`, `collection`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rfqs` ADD CONSTRAINT `rfqs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rfqs` ADD CONSTRAINT `rfqs_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `retailer_outlets` ADD CONSTRAINT `retailer_outlets_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offers` ADD CONSTRAINT `offers_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offers` ADD CONSTRAINT `offers_free_item_product_id_fkey` FOREIGN KEY (`free_item_product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offer_scope_products` ADD CONSTRAINT `offer_scope_products_offer_id_fkey` FOREIGN KEY (`offer_id`) REFERENCES `offers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offer_scope_products` ADD CONSTRAINT `offer_scope_products_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offer_scope_categories` ADD CONSTRAINT `offer_scope_categories_offer_id_fkey` FOREIGN KEY (`offer_id`) REFERENCES `offers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offer_scope_collections` ADD CONSTRAINT `offer_scope_collections_offer_id_fkey` FOREIGN KEY (`offer_id`) REFERENCES `offers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;


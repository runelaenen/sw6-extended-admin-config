# Extended Product Select for Shopware 6

Enriches the product search dropdown in the Shopware 6 order form with configurable product data.

By default, the order line item search shows only the product name. This plugin lets you display any combination of product fields side by side, for example:

```
Acme Widget Pro | Acme Corp | IN_STOCK | 42 | €29.99
```

The fields shown, their order, and their formatting are all configured from the plugin configuration.

---

## Requirements

- Shopware 6.6.x
- PHP 8.2 or higher

---

## Installation

### Via Composer (recommended)

```bash
composer require laenen/extended-product-select
bin/console plugin:install --activate LaenenExtendedProductSelect
bin/console cache:clear
bin/build-administration.sh
```

### Manually

1. Download or clone this repository into `custom/plugins/LaenenExtendedProductSelect`.
2. Install and activate the plugin:
   ```bash
   bin/console plugin:install --activate LaenenExtendedProductSelect
   bin/console cache:clear
   ```
3. Build the administration assets:
   ```bash
   bin/build-administration.sh
   ```

---

## Configuration

Go to **Extensions > My Extensions**, find **Extended Product Select** and click **Configuration**.

Each row in the configuration table represents one field shown in the label:

| Column | Description |
|--------|-------------|
| **Field path** | Dot-notation path into the product object, e.g. `manufacturer.translated.name` |
| **Active** | Uncheck to hide a field without deleting it |
| **Currency** | Check to apply Shopware's currency formatter (use for price fields) |
| **↑ / ↓** | Reorder fields |
| **✕** | Remove a field |

Click **+ Add field** to add a new row. Save the configuration and reload the admin to apply changes.

### Associations are loaded automatically

The plugin reads Shopware's entity schema to determine which field paths require an association to be loaded. If you add `manufacturer.translated.name`, the `manufacturer` association is added to the product search query automatically — no manual configuration needed.

### Common field paths

| Path | Description |
|------|-------------|
| `translated.name` | Product name (translation-aware) |
| `productNumber` | Product number / SKU |
| `manufacturer.translated.name` | Manufacturer name |
| `customFields.your_field_key` | Any custom field |
| `stock` | Available stock quantity |
| `price.0.gross` | Gross price (first price tier) — enable **Currency** format |
| `ean` | EAN / GTIN barcode |
| `weight` | Weight |

### Default configuration

Out of the box the label shows:

```
Product Name | Manufacturer | Stock | Price
```

This matches the field set most commonly needed for B2B catalogues. All fields can be removed, reordered, or replaced from the configuration screen.

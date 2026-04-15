# LaenenExtendedAdminConfig

Configurable admin enhancements for Shopware 6. Control which product fields appear in the order form search label, and add custom columns to the Orders and Customers listing pages from the settings page in the admin.

---

## Features

- **Product label fields**: choose which product fields appear in the order line item search dropdown, their order, and formatting:
  ```
  Acme Widget Pro | Acme Corp | 42 | €29.99
  ```
- **New order line item columns**: add extra columns to the product grid when creating a new order — manufacturer name, stock, or any other product field, loaded automatically.
- **Order list columns**: add any order entity field as an extra column to the Orders listing, with control over placement and visibility.
- **Customer list columns**: add any customer entity field as an extra column to the Customers listing, with control over placement and visibility.

All four are configured from **Settings > Plugins > Extended Admin Config**.

---

## Requirements

- Shopware 6.6.x
- PHP 8.2 or higher

---

## Installation

### Via Composer (recommended)

```bash
composer require runelaenen/sw6-extended-admin-config
bin/console plugin:install --activate LaenenExtendedAdminConfig
bin/console cache:clear
bin/build-administration.sh
```

### Manually

1. Download or clone this repository into `custom/plugins/LaenenExtendedAdminConfig`.
2. Install and activate the plugin:
   ```bash
   bin/console plugin:install --activate LaenenExtendedAdminConfig
   bin/console cache:clear
   ```
3. Build the administration assets:
   ```bash
   bin/build-administration.sh
   ```

---

## Configuration

Go to **Settings > Plugins > Extended Admin Config**. The page has three sections.

### Product Label Fields

Configures the label shown for each product in the order line item search dropdown.

| Field | Description |
|-------|-------------|
| **Field path** | Dot-notation path into the product entity, e.g. `manufacturer.translated.name` |
| **Format** | `Raw value` (default) or `Currency` (applies Shopware's currency formatter — use for price fields) |
| **↑ / ↓** | Reorder fields |
| **✕** | Remove a field |

Fields are joined with ` | ` in the label. Fields whose path resolves to an empty or null value are omitted automatically.

**Common paths:**

| Path | Description |
|------|-------------|
| `translated.name` | Product name (translation-aware) |
| `productNumber` | Product number / SKU |
| `manufacturer.translated.name` | Manufacturer name |
| `stock` | Available stock quantity |
| `price.0.gross` | Gross price (first price tier) — use **Currency** format |
| `ean` | EAN / GTIN barcode |
| `weight` | Weight |
| `customFields.your_field_key` | Any custom field |

---

### New Order: Line Item Grid Columns

Adds extra columns to the product grid when creating a new order (**Orders > Add Order**).

| Field | Description |
|-------|-------------|
| **Field path** | Dot-notation path into the line item, prefixed with `payload.` for product data, e.g. `payload.manufacturer.translated.name` |
| **Column label** | Text shown in the column header |
| **After column** | Property name of an existing column to insert after: `quantity`, `label`, `unitPrice`, `tax`, `totalPrice`. Leave empty to append at the end |
| **Active** | Uncheck to hide a column without deleting it |
| **↑ / ↓** | Change the order of appended columns |
| **✕** | Remove a column |

**Manufacturer name and stock example:**

| Path | Label |
|------|-------|
| `payload.manufacturer.translated.name` | Manufacturer |
| `payload.stock` | Stock |

**Common paths:**

| Path | Description |
|------|-------------|
| `payload.stock` | Available stock quantity — already present in the line item, no extra loading needed |
| `payload.productNumber` | Product number / SKU — already present in the line item |
| `payload.manufacturer.translated.name` | Manufacturer name — loaded automatically when this column is active |
| `payload.cover.media.url` | Product cover image URL — loaded automatically when this column is active |
| `label` | Product name (top-level line item field, always present) |

**How extra data is loaded**

Fields under `payload.*` that are product associations (such as `manufacturer` or `cover`) are not present in the cart line item by default. The plugin detects which associations are needed from the configured column paths and loads the missing product data in a single batched request whenever the cart is loaded or updated. The results are cached for the lifetime of the page so subsequent cart changes (quantity edits, adding more products) do not trigger redundant API calls.

Fields that are already included in the cart payload by Shopware (`stock`, `productNumber`, `manufacturerId`, etc.) are shown directly without any additional loading.

---

### Order List Columns

Adds extra columns to the Orders listing page.

| Field | Description |
|-------|-------------|
| **Field path** | Dot-notation path into the order entity, e.g. `orderCustomer.email` |
| **Column label** | Text shown in the column header |
| **After column** | Property name of an existing column to insert after, e.g. `orderNumber`. Leave empty to append at the end |
| **Active** | Uncheck to hide a column without deleting it |
| **↑ / ↓** | Change the order of appended columns |
| **✕** | Remove a column |

**Common paths:**

| Path | After column example | Description |
|------|----------------------|-------------|
| `orderCustomer.email` | `orderCustomer.firstName` | Customer e-mail address |
| `orderCustomer.company` | `orderCustomer.firstName` | Customer company name |
| `billingAddress.countryState.name` | `billingAddressId` | Billing state/province |
| `customFields.your_field_key` | | Any order custom field |

---

### Customer List Columns

Adds extra columns to the Customers listing page.

| Field | Description |
|-------|-------------|
| **Field path** | Dot-notation path into the customer entity, e.g. `email` |
| **Column label** | Text shown in the column header |
| **After column** | Property name of an existing column to insert after, e.g. `defaultBillingAddress.city`. Leave empty to append at the end |
| **Active** | Uncheck to hide a column without deleting it |
| **↑ / ↓** | Change the order of appended columns |
| **✕** | Remove a column |

**Common paths:**

| Path | After column example | Description |
|------|----------------------|-------------|
| `email` | `firstName` | Customer e-mail address |
| `defaultBillingAddress.countryState.name` | `defaultBillingAddress.city` | Billing state/province |
| `defaultBillingAddress.country.name` | `defaultBillingAddress.city` | Billing country |
| `customFields.your_field_key` | | Any customer custom field |

---

## How it works

### Dot-notation paths

All field paths use dot-notation to traverse the entity graph. Array indices are supported where needed (e.g. `price.0.gross` accesses the first element of the price array).

### Associations are loaded automatically

The plugin reads Shopware's entity schema at runtime to determine which segments of a configured path are associations. Only association segments are added to the API query — scalar and JSON fields are excluded. Multi-level paths are fully supported: `billingAddress.countryState.name` causes both `billingAddress` and `countryState` to be loaded.

On the order entity, paths starting with `billingAddress` load their nested associations through the `addresses` collection, which is how Shopware's order data model is structured.

For the new order line item grid, associations missing from the cart payload (e.g. `manufacturer`) are loaded via a batched product repository request whenever the cart changes. The data is merged directly into each line item's payload so that standard dot-notation paths resolve without any template customisation.

### Column positioning

The **After column** field accepts the `property` value of any existing column (including core Shopware columns). If the value doesn't match any column, the extra column is appended to the end instead. Multiple extra columns targeting the same existing column are inserted in the order they appear in the configuration.

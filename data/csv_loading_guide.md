# CSV Loading Guide for SKU Data

## Overview

This guide explains how to load SKU data from CSV files and process them for embeddings. The system will:

1. **Read your CSV file** (tab-separated format)
2. **Parse and validate** the data
3. **Generate embeddings** using OpenAI
4. **Store in Pinecone** vector database

## CSV File Format

Your CSV file should be **tab-separated** with the following columns:

| Column Name               | Description              | Required | Example                   |
| ------------------------- | ------------------------ | -------- | ------------------------- |
| `id`                      | Unique identifier        | Yes      | `1`                       |
| `sku`                     | SKU code                 | Yes      | `ADH1`                    |
| `name`                    | Product name             | Yes      | `FEVICOL SH 1 KG`         |
| `description`             | Product description      | No       | `This is an adhesive SKU` |
| `category_id`             | Category identifier      | No       | `1`                       |
| `category_name`           | Category name            | No       | `Adhesives`               |
| `mrp`                     | Maximum retail price     | No       | `150.00`                  |
| `selling_price`           | Selling price            | No       | `120.00`                  |
| `per_unit_mrp_price`      | Per unit MRP             | No       | `150.00`                  |
| `per_unit_selling_price`  | Per unit selling price   | No       | `120.00`                  |
| `unit_type`               | Unit type                | No       | `KG`                      |
| `unit_value`              | Unit value               | No       | `1`                       |
| `discount`                | Discount percentage      | No       | `20`                      |
| `status`                  | Product status           | No       | `Active`                  |
| `is_active`               | Active status (1/0)      | No       | `1`                       |
| `image_urls`              | Tab-separated image URLs | No       | `url1	url2	url3`            |
| `created_at`              | Creation timestamp       | No       | `2025-06-10 03:39:32`     |
| `updated_at`              | Update timestamp         | No       | `2025-06-12 09:54:02`     |
| `created_by`              | Creator ID               | No       | `24385`                   |
| `updated_by`              | Updater ID               | No       | `24385`                   |
| `category_brand_index_id` | Brand index ID           | No       | `123`                     |

## Example CSV Format

```
id	sku	name	description	category_id	category_name	mrp	selling_price	status	is_active	image_urls
1	ADH1	FEVICOL SH 1 KG	This is an adhesive SKU	1	Adhesives	150	120	Active	1	https://example.com/image1.jpg	https://example.com/image2.jpg
2	ADH2	FEVICOL SH 2 KG	This is an adhesive SKU	1	Adhesives	280	220	Active	1	https://example.com/image3.jpg
3	DRSLD518	HETTICH Door Sliding - Wheel Set Only	NOTE : Add TRACK SET and DUST STRIP separately.	4	Door Slides	NULL	NULL	Active	1	https://solsticeprod.s3.ap-south-1.amazonaws.com/catalogue/category/doorslidings/product/CX-DoorSliding-855_1.jpg
```

## File Placement

Place your CSV file in one of these locations:

- `./data/skus.csv`
- `./skus.csv`
- `./data/sku_data.csv`
- `./sku_data.csv`
- `./data/products.csv`
- `./products.csv`

## Loading Command

```bash
# Install dependencies first
npm install

# Load SKU data from CSV
npm run load-csv
```

## Processing Steps

The script will perform the following steps:

1. **File Detection**: Automatically find your CSV file
2. **Data Parsing**: Parse tab-separated values
3. **Data Cleaning**: Handle HTML entities, quoted values, etc.
4. **Validation**: Ensure required fields are present
5. **Embedding Generation**: Create embeddings using OpenAI
6. **Vector Storage**: Store in Chroma database
7. **Statistics**: Provide processing results

## Special Features

### HTML Entity Handling

The script automatically converts HTML entities:

- `&quot;` → `"`
- `&amp;` → `&`
- `&lt;` → `<`
- `&gt;` → `>`

### Image URL Processing

- Handles tab-separated image URLs
- Converts to array format for storage
- Filters out empty URLs

### Data Type Conversion

- Converts string numbers to actual numbers
- Handles NULL values appropriately
- Validates data types

## Error Handling

The script provides detailed error reporting:

- Row-by-row validation errors
- Missing required fields
- Data type conversion issues
- Processing statistics

## Output

After successful processing, you'll see:

```
✅ CSV SKU loading and embedding completed!
📈 Results: 500 successful, 0 failed
📊 Final database stats: { totalVectorCount: 500, dimension: 1536 }
🎉 All SKU data has been processed and embedded successfully!
💡 The embeddings are now ready for search functionality.
```

## Notes

- **One-time processing**: This is designed for initial data loading
- **Batch processing**: Efficiently processes large datasets
- **Error recovery**: Continues processing even if some records fail
- **Memory efficient**: Processes data in chunks
- **Embedding ready**: All data is immediately available for search

## Troubleshooting

### Common Issues

1. **File not found**: Ensure CSV file is in one of the expected locations
2. **Invalid format**: Check that file is tab-separated, not comma-separated
3. **Missing headers**: Ensure first row contains column headers
4. **API errors**: Check OpenAI API key in `.env` file

### Debug Mode

The script provides detailed logging to help identify issues:

- Sample data output
- Header detection
- Validation errors
- Processing statistics

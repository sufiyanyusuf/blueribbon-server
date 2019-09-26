
exports.up = function(knex) {

    return knex.schema
    .createTable('Organizations', function(Organizations) {
        Organizations.increments('id').primary();
        Organizations.string('title')
    })
    .createTable('Listings', function(Listing) {
        Listing.increments('id').primary();
        Listing.timestamp('created_at').defaultTo(knex.fn.now())
        Listing.string('title');
        Listing.string('status');
        Listing.integer('organization_id').references('id').inTable('Organizations');
    })
    .createTable('ProductInfo', function(ProductInfo) {
        ProductInfo.increments('id').primary();
        ProductInfo.string('title');
        ProductInfo.string('unit_title');
        ProductInfo.string('description');
        ProductInfo.string('type');
        ProductInfo.string('image_url');
        ProductInfo.string('currency');
        ProductInfo.string('base_price')
        ProductInfo.integer('listing_id').references('id').inTable('Listings');
    })
    .createTable('Modifiers', function(Modifiers) {
        Modifiers.increments('id').primary();
        Modifiers.string('title')
        Modifiers.string('description')
        Modifiers.string('type')
        Modifiers.integer('order')
        Modifiers.string('element_type')
        Modifiers.integer('listing_id').references('id').inTable('Listings');
    })
    .createTable('Modifier_Choices', function(Modifier_Choices) {
        Modifier_Choices.increments('id').primary();
        Modifier_Choices.integer('order')
        Modifier_Choices.string('title')
        Modifier_Choices.integer('pricing_impact')
        Modifier_Choices.string('icon')
        Modifier_Choices.string('image')
        Modifier_Choices.boolean('default_selection')
        Modifier_Choices.integer('modifier_id').references('id').inTable('Modifiers').onDelete('Cascade');
    })
    .createTable('Elements_Steppers', function(Elements_Steppers) {
        Elements_Steppers.increments('id').primary();
        Elements_Steppers.integer('max_value')
        Elements_Steppers.integer('min_value')
        Elements_Steppers.integer('modifier_id').references('id').inTable('Modifiers').onDelete('Cascade');
        Elements_Steppers.integer('step_value')
        Elements_Steppers.integer('price_multiplier')
        Elements_Steppers.string('unit_title')
    })
    .createTable('Elements_Multi_Options', function(Elements_Multi_Options) {
        Elements_Multi_Options.increments('id').primary();
        Elements_Multi_Options.integer('modifier_id').references('id').inTable('Modifiers').onDelete('Cascade');
        Elements_Multi_Options.boolean('multi_selection')
        Elements_Multi_Options.boolean('mandatory')
        Elements_Multi_Options.string('element_type')
    })
    .createTable('Elements_Textfields', function(Elements_Textfields) {
        Elements_Textfields.increments('id').primary();
        Elements_Textfields.string('placeholder')
        Elements_Textfields.integer('modifier_id').references('id').inTable('Modifiers').onDelete('Cascade');
    });
};

exports.down = function(knex) {
    return knex.schema
    .dropTable('Elements_Textfields')
    .dropTable('Elements_Multi_Options')
    .dropTable('Elements_Steppers')
    .dropTable('Modifier_Choices')
    .dropTable('Modifiers')
    .dropTable('ProductInfo')
    .dropTable('Listings')
    .dropTable('Organizations');
};

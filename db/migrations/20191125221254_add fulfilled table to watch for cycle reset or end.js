exports.up = function(knex) {
    return knex.schema
        .createTable('Fulfilled_States', function (t) {
            t.integer('id').primary().references('id').inTable('Subscription_States').onDelete('Cascade');
            t.integer('subscription_id');
            t.timestamp('next_cycle').notNullable()

            t.index(['next_cycle'], 'timestamp_index');
            t.unique('subscription_id')
        })
};

exports.down = function (knex) {
    return knex.schema.dropTable('Fulfilled_States')
}
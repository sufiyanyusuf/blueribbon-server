
exports.up = function(knex) {
    return knex.schema
    .createTable('Subscription_States', function(t) {
        t.increments('id').primary();
        t.timestamp('timestamp').defaultTo(knex.fn.now())
        t.integer('subscription_id').references('id').inTable('User_Subscriptions').onDelete('Cascade');
        t.json('state')
    })
};

exports.down = function(knex) {
  return knex.schema
    .dropTable('Subscription_States')
};
